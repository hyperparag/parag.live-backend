const { Deposit } = require("../models");
const { validateReferralCode } = require("../utils/referral");

exports.addDepositService = async ({ body, authUserId, authEmail }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Deposit added successfully",
  };

  try {
    const amount = parseFloat(body.amount);
    const trxid = String(body.trxid || "").trim();
    if (!trxid || !Number.isFinite(amount) || amount <= 0) {
      response.code = 422;
      response.status = "failed";
      response.message = "Enter the transaction ID and a valid amount.";
      return response;
    }

    // The same transaction cannot be submitted twice.
    const duplicate = await Deposit.exists({ trxid, isDelete: false });
    if (duplicate) {
      response.code = 409;
      response.status = "failed";
      response.message = "This transaction ID has already been submitted.";
      return response;
    }

    // An invalid referral code is reported now, not after the money has moved.
    const referral = await validateReferralCode({
      code: body.referralCode,
      buyerId: authUserId,
    });
    if (!referral.valid) {
      response.code = 422;
      response.status = "failed";
      response.message = referral.reason;
      return response;
    }

    // Only the fields a user may set. The user id comes from the token.
    const newProduct = new Deposit({
      userName: body.userName,
      provider: body.provider,
      // Admins search deposits by email, so never store one without it.
      email: body.email || authEmail,
      amount: String(amount),
      trxid,
      userId: authUserId,
      referralCode: referral.code || undefined,
    });
    await newProduct.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getDepositService = async ({ email, page, size }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Deposit added successfully",
    total: 0,
    startIndex: 0,
    deposits: [],
  };
  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = size ? parseInt(size) : 10;
    const skipCount = (pageNumber - 1) * limit;

    let query = { isDelete: false };
    if (email !== "undefined" || email !== undefined || email) {
      let regex = new RegExp(email, "i");
      query = {
        ...query,
        $or: [{ email: regex }],
      };
    }

    const deposits = await Deposit.find(query)
      .sort({ _id: -1 })
      .skip(skipCount)
      .limit(limit);

    response.startIndex = skipCount + 1;
    response.total = await Deposit.countDocuments(query);
    response.deposits = deposits;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
exports.getDepositService2 = async ({ email, page, size, id }) => {

  console.log(id);

  const response = {
    code: 201,
    status: "success",
    message: "Deposit added successfully",
    total: 0,
    startIndex: 0,
    deposits: [],
  };
  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = size ? parseInt(size) : 10;
    const skipCount = (pageNumber - 1) * limit;

    let query = { isDelete: false };
    if (email !== "undefined" || email !== undefined || email) {
      let regex = new RegExp(email, "i");
      query = {
        ...query,
        $or: [{ email: regex }],
      };
    }

    const deposits = await Deposit.find({ userId: id, isDelete: false })
      .sort({ _id: -1 })
      .skip(skipCount)
      .limit(limit);

    response.startIndex = skipCount + 1;
    response.total = await Deposit.countDocuments({ userId: id, isDelete: false });
    response.deposits = deposits;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateStatusService = async ({ status, id }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Deposit Update successfully",
    deposit: [],
  };
  try {
    const filter = { _id: id };
    const update = { status: status };
    const depo = await Deposit.findOneAndUpdate(filter, update, {
      new: true,
    });
    response.deposit = depo;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/**
 * Remove a deposit from the admin list. It is hidden, not destroyed, so a
 * fake or mistaken submission can be cleared without losing the audit trail.
 * A deposit that has already been credited cannot be deleted.
 */
exports.deleteDepositService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Deposit deleted successfully",
  };
  try {
    const deposit = await Deposit.findOne({ _id: id, isDelete: false });
    if (!deposit) {
      response.code = 404;
      response.status = "failed";
      response.message = "No deposit found";
      return response;
    }
    if (deposit.status === "completed") {
      response.code = 409;
      response.status = "failed";
      response.message = "A credited deposit cannot be deleted.";
      return response;
    }
    deposit.isDelete = true;
    await deposit.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/** Delete several deposits at once (the admin's selected rows). */
exports.deleteManyDepositsService = async ({ ids }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Deposits deleted successfully",
    deleted: 0,
  };
  try {
    const list = (Array.isArray(ids) ? ids : []).slice(0, 200);
    const result = await Deposit.updateMany(
      { _id: { $in: list }, isDelete: false, status: { $ne: "completed" } },
      { $set: { isDelete: true } }
    );
    response.deleted = result.modifiedCount ?? result.nModified ?? 0;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
