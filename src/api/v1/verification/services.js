const { Verification } = require("../models");
const { resolveFileId, deleteOne } = require("../utils/imagekitStore");

exports.addVerificationServices = async ({ userId, images, imageFileIds }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Verification request submitted successfully",
  };

  try {
    const newVerification = new Verification({
      userId,
      images,
      imageFileIds: Array.isArray(imageFileIds) ? imageFileIds : [],
      status: "pending",
    });
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

    // An empty list is a successful, empty result, not a 404. Returning 404
    // forced the admin table to special-case it and show an error state.
    response.data = {
      requests,
      totalRequests,
    };

    if (requests.length === 0) {
      response.message = "No verification requests found";
    }

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

/**
 * Permanently remove a verification request and the ID photos attached to it.
 *
 * Rejected requests used to pile up in the database forever with no way to clear
 * them, which wastes storage and keeps sensitive ID images around longer than
 * necessary. The submitted images are deleted from ImageKit first; requests
 * created before fileIds were stored fall back to a filename lookup.
 */
exports.deleteVerificationServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Verification request deleted permanently",
    data: {},
  };

  try {
    const verification = await Verification.findOne({ _id: id }).exec();
    if (!verification) {
      response.code = 404;
      response.status = "failed";
      response.message = "No verification data found";
      return response;
    }

    const urls = Array.isArray(verification.images) ? verification.images : [];
    const fileIds = Array.isArray(verification.imageFileIds)
      ? verification.imageFileIds
      : [];

    let removed = 0;
    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      if (!url || url === "empty" || url === "undefined") continue;
      const fileId = fileIds[i] || (await resolveFileId(url));
      if (await deleteOne(fileId)) removed += 1;
    }

    await Verification.deleteOne({ _id: verification._id });

    response.data = { id, imagesRemoved: removed };
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/** Bulk permanent delete, used by the admin table checkbox selection. */
exports.deleteManyVerificationServices = async ({ ids }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Verification requests deleted permanently",
    data: {},
  };

  if (!Array.isArray(ids) || ids.length === 0) {
    response.code = 422;
    response.status = "failed";
    response.message = "No verification requests selected";
    return response;
  }

  try {
    const docs = await Verification.find({ _id: { $in: ids } })
      .select("images imageFileIds")
      .lean()
      .exec();

    let removed = 0;
    for (const doc of docs) {
      const urls = Array.isArray(doc.images) ? doc.images : [];
      const fileIds = Array.isArray(doc.imageFileIds) ? doc.imageFileIds : [];
      for (let i = 0; i < urls.length; i += 1) {
        const url = urls[i];
        if (!url || url === "empty" || url === "undefined") continue;
        const fileId = fileIds[i] || (await resolveFileId(url));
        if (await deleteOne(fileId)) removed += 1;
      }
    }

    const result = await Verification.deleteMany({ _id: { $in: ids } });

    response.data = {
      deletedCount: result.deletedCount,
      imagesRemoved: removed,
    };
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
