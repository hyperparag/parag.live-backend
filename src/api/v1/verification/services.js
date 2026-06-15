const { Verification } = require("../models");

exports.addVerificationServices = async ({ userId, images }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Verification request submitted successfully",
  };

  try {
    const newVerification = new Verification({ userId, images, status: "pending" });
    await newVerification.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getVerificationServices = async ({ page }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch verification list successfully",
    data: {},
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 10;
    const totalRequests = await Verification.countDocuments({});

    const requests = await Verification.aggregate([
      { $sort: { status: 1, _id: -1 } },
      { $skip: (pageNumber - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);

    if (requests.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No verification data found";
      return response;
    }

    response.data = {
      requests,
      totalRequests,
    };

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

exports.getUserVerificationServices = async ({ userId }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch verification status successfully",
    data: {},
  };

  try {
    const verification = await Verification.findOne({ userId }).sort({ _id: -1 }).exec();

    response.data.verification = verification || null;

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateVerificationServices = async ({ id, status, note }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Verification updated successfully",
    data: {},
  };

  try {
    const verification = await Verification.findOne({
      _id: id,
    }).exec();
    if (!verification) {
      response.code = 422;
      response.status = "failed";
      response.message = "No verification data found";
      return response;
    }

    verification.status = status ? status : verification.status;
    verification.note = note ? note : verification.note;
    verification.reviewedAt = new Date();

    await verification.save();

    response.data.verification = verification;

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
