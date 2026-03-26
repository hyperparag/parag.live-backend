const { Deposit } = require("../models");

exports.addDepositService = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Deposit added successfully",
  };

  try {
    const newProduct = new Deposit(body);
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

    const deposits = await Deposit.find({ userId: id })
      .sort({ _id: -1 })
      .skip(skipCount)
      .limit(limit);

    response.startIndex = skipCount + 1;
    response.total = await Deposit.find({ userId: id }).countDocuments({});
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
