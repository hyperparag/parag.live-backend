const { Ads } = require("../models");
const { resolveFileId, deleteOne } = require("../utils/imagekitStore");

const VISIBLE = { isDelete: false, isActive: { $ne: false } };

exports.addAds = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Side ad added successfully",
    data: {},
  };

  try {
    const newAd = new Ads({
      title: body.title,
      category: body.category,
      image: body.image,
      imageFileId: body.imageFileId,
      link: body.link,
      isActive: body.isActive !== false,
    });
    await newAd.save();
    response.data.ads = newAd;
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
 * All side ads, newest first. This used to use the Mongoose 5 callback form of
 * .exec(), which is deprecated in 6 and removed in 7, and it never responded at
 * all when the collection was empty, because the `if (ads)` branch simply fell
 * through without sending anything.
 */
exports.getAds = async (req, res) => {
  try {
    const ads = await Ads.find({ isDelete: false })
      .select("-__v -isDelete")
      .sort({ _id: -1 })
      .lean()
      .exec();

    return res.status(200).json({ ads: ads ?? [] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ads: [], error: "Error. Try again" });
  }
};

/**
 * Side ads for one category.
 *
 * With ?fallback=1 an empty result falls back to the most recent ads instead of
 * returning nothing. Categories stored on side ads come from a five-item list
 * that rarely matches a page category string exactly, which is the main reason
 * side ads looked switched off everywhere.
 */
exports.getAdsbyCategory = async (req, res) => {
  const category = req.query.category;
  const wantsFallback =
    req.query.fallback === "1" || req.query.fallback === "true";
  const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 5));

  try {
    let ads = [];

    if (category) {
      ads = await Ads.find({ ...VISIBLE, category })
        .sort({ _id: -1 })
        .limit(limit)
        .lean()
        .exec();
    }

    if (ads.length === 0 && (wantsFallback || !category)) {
      ads = await Ads.find(VISIBLE)
        .sort({ _id: -1 })
        .limit(limit)
        .lean()
        .exec();
    }

    return res.status(200).json({ ads });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ads: [], error: "Error. Try again" });
  }
};

exports.updateAds = async ({
  id,
  image,
  imageFileId,
  title,
  link,
  category,
  isActive,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Side ad updated successfully",
    data: {},
  };

  try {
    const ads = await Ads.findOne({ _id: id }).exec();

    // This used to check `if (!link)` and bail with 422, so changing only the
    // title or only the image was impossible. The real precondition is that the
    // ad exists, which was never checked at all, so a bad id threw instead.
    if (!ads) {
      response.code = 404;
      response.status = "failed";
      response.message = "No side ad found";
      return response;
    }

    ads.title = title !== undefined ? title : ads.title;
    ads.category = category !== undefined ? category : ads.category;
    ads.link = link !== undefined ? link : ads.link;
    if (typeof isActive === "boolean") ads.isActive = isActive;

    // Replacing the image releases the old asset so it does not leak.
    if (image && image !== ads.image) {
      const oldFileId = ads.imageFileId || (await resolveFileId(ads.image));
      if (oldFileId) await deleteOne(oldFileId);
      ads.image = image;
      ads.imageFileId = imageFileId || undefined;
    } else if (imageFileId && !ads.imageFileId) {
      ads.imageFileId = imageFileId;
    }

    await ads.save();

    response.data.ads = ads;
    // The controller decided success by looking for a `link` key, which this
    // function never returned, so the happy path here was unreachable.
    response.link = ads.link;

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteAds = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Side ad deleted successfully",
  };

  try {
    const ads = await Ads.findOne({ _id: id }).exec();
    if (!ads) {
      response.code = 404;
      response.status = "failed";
      response.message = "No side ad found";
      return response;
    }

    // Release the banner image; this used to orphan it in ImageKit.
    if (ads.image && ads.image !== "empty") {
      const fileId = ads.imageFileId || (await resolveFileId(ads.image));
      if (fileId) await deleteOne(fileId);
    }

    // Document.remove() is deprecated in Mongoose 6 and removed in 7.
    await Ads.deleteOne({ _id: ads._id });

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteMany = async (req, res) => {
  const ids = Array.isArray(req.body) ? req.body : req.body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(422)
      .json({ status: "failed", message: "No side ads selected" });
  }

  try {
    const docs = await Ads.find({ _id: { $in: ids } })
      .select("image imageFileId")
      .lean()
      .exec();

    for (const doc of docs) {
      if (!doc.image || doc.image === "empty") continue;
      const fileId = doc.imageFileId || (await resolveFileId(doc.image));
      if (fileId) await deleteOne(fileId);
    }

    // The callback passed to deleteMany() is never invoked on Mongoose 6, so
    // this both responded twice and skipped its own error handling.
    const result = await Ads.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: "success",
      message: "Deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: "failed", message: "Error. Try again" });
  }
};
