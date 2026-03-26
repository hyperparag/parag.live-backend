const { Reports } = require("../models");

exports.addReportServices = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Report added successfully",
  };

  try {
    const newReport = new Reports(body);
    await newReport.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getReportsServices = async ({page}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Report list successfully",
    data: {},
  };

  try {

    

    const pageNumber = page ? parseInt(page) : 1;
    const limit = 10;
    const totalPost = await Reports.countDocuments({});

    const reports = await Reports.aggregate([
	  { $sort: { isRead: 1, _id: -1 } },
    { $skip: (pageNumber - 1) * limit },
    { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "reportedUser",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "postId",
          foreignField: "_id",
          as: "reportedPost",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reporterId",
          foreignField: "_id",
          as: "reporter",
        },
      },
    ]);

    if (reports.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No Product data found";
      return response;
    }

    response.data = {
      reports,
      totalPost
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

// update Reports
exports.updateReportServices = async ({
  id,
  isRead,

}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Report  updated successfully",
    data: {},
  };

  try {
    const reports = await Reports.findOne({
      _id: id,
    }).exec();
    if (!reports) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    reports.isRead = isRead ? isRead : reports.isRead;


    await reports.save();

    response.data.reports = reports;

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteReportServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Product successfully",
  };

  try {
    const reports = await Reports.findOne({
      _id: id,
      isDelete: false,
    });
    if (!reports) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    await reports.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
