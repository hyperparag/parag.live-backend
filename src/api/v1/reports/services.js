const mongoose = require("mongoose");
const { Reports } = require("../models");

const isObjectId = (value) =>
  Boolean(value) && mongoose.Types.ObjectId.isValid(String(value));

exports.addReportServices = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Report added successfully",
  };

  try {
    // The ad detail page used to send only the second character of the post id,
    // so the ObjectId cast threw and every report was swallowed as a 500. Tell
    // the caller what is wrong instead of losing the report silently.
    if (!isObjectId(body.postId)) {
      response.code = 422;
      response.status = "failed";
      response.message = "A valid post is required to file a report";
      return response;
    }
    if (!isObjectId(body.posterId)) {
      response.code = 422;
      response.status = "failed";
      response.message = "A valid ad owner is required to file a report";
      return response;
    }
    if (!body.subject || !String(body.subject).trim()) {
      response.code = 422;
      response.status = "failed";
      response.message = "Please give the report a subject";
      return response;
    }

    const newReport = new Reports({
      subject: String(body.subject).trim(),
      reportDesc: body.reportDesc ? String(body.reportDesc).trim() : "",
      postId: body.postId,
      posterId: body.posterId,
      // Optional: an anonymous report is still worth receiving.
      reporterId: isObjectId(body.reporterId) ? body.reporterId : undefined,
      isRead: false,
    });
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

    // An empty list is a successful, empty result. Returning 404 here made the
    // admin table treat "no reports yet" as a failure.
    if (reports.length === 0) {
      response.message = "No reports found";
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
