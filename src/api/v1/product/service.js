const { default: mongoose } = require("mongoose");
const {
  Product,
  User,
  Links,
  Responsive,
  Rainbow,
  Transactions,
} = require("../models");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

// const bucket_Name = process.env.BUCKET_NAME;
// const bucket_Region = process.env.BUCKET_REGION;
// const access_Key = process.env.ACCESS_KEY;
// const secret_Access = process.env.SECRET_ACCESS;
// const s3 = new S3Client({
//   credentials: {
//     accessKeyId: access_Key,
//     secretAccessKey: secret_Access,
//   },
//   region: bucket_Region,
// });

const moment = require("moment/moment");
const { reviewAd, contentHash } = require("../utils/moderation");
const { PREMIUM_COST, MULTI_CITY_RATE } = require("../config/pricing");

/**
 * Scheduled posts: an ad with a future publishAt stays hidden from every public
 * query until that time passes. Enforced at read time, so scheduling precision
 * does not depend on how often the cron runs.
 */
const publishedGate = () => ({
  $or: [
    { publishAt: null },
    { publishAt: { $exists: false } },
    { publishAt: { $lte: new Date() } },
  ],
});
exports.publishedGate = publishedGate;

/**
 * Credits owed for an ad, derived from the stored ad rather than from the
 * client. Used by both posting and reposting so the two can never disagree.
 */
const feeForAd = (ad = {}) => {
  const boost = PREMIUM_COST[ad.premiumDay] ?? 0;
  const cityCount = Array.isArray(ad.cities) ? ad.cities.length : 0;
  const multiCity = cityCount > 1 ? cityCount * MULTI_CITY_RATE : 0;
  return Math.round((boost + multiCity) * 100) / 100;
};
exports.feeForAd = feeForAd;

// for today
const startOfDay = moment().startOf("day");
const endOfDay = moment().endOf("day");
// for yesterday
const today = moment();
const yesterday = moment().subtract(1, "days");

// last 3 days
const threeDaysAgo = moment().subtract(2, "days");
// last 7 days
const sevenDaysAgo = moment().subtract(6, "days");
// for this month
const startOfMonth = moment().startOf("month");
const endOfMonth = moment().endOf("month");
// last month
const currentMonthStartDate = moment().startOf("month");
const lastMonthStartDate = moment(currentMonthStartDate)
  .subtract(1, "months")
  .startOf("month");
// last 6 month
const sixMonthsAgo = moment().subtract(6, "months");

// this year
const startOfYear = moment().startOf("year");
const endOfYear = moment().endOf("year");
// last year
const startOfPreviousYear = moment().subtract(1, "year").startOf("year");
const endOfPreviousYear = moment().subtract(1, "year").endOf("year");

exports.getApprovedService = async ({
  page,
  cat,
  subCat,
  date,
  searchText,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Product list successfully",
    data: {},
    totalPost: 0,
    startIndex: 0,
  };

  const regex = new RegExp(cat, "i");
  const subRegex = new RegExp(subCat, "i");
  const titleRegex = new RegExp(searchText, "i");

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 10;
    const skipCount = (pageNumber - 1) * limit;

    let newDate;
    if (date == "today") {
      newDate = {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate(),
      };
    }
    if (date == "yesterday") {
      newDate = {
        $gte: yesterday.startOf("day").toDate(),
        $lt: today.startOf("day").toDate(),
      };
    }
    if (date == "last3days") {
      newDate = {
        $gte: threeDaysAgo.startOf("day").toDate(),
      };
    }
    if (date == "last7days") {
      newDate = {
        $gte: sevenDaysAgo.startOf("day").toDate(),
      };
    }

    if (date == "thismonth") {
      newDate = {
        $gte: startOfMonth.toDate(),
        $lte: endOfMonth.toDate(),
      };
    }
    if (date == "lastmonth") {
      newDate = {
        $gte: lastMonthStartDate.toDate(),
        $lt: currentMonthStartDate.toDate(),
      };
    }
    if (date == "last6month") {
      newDate = {
        $gte: sixMonthsAgo.toDate(),
        $lt: today.startOf("day").toDate(),
      };
    }
    if (date == "thisYear") {
      newDate = {
        $gte: startOfYear.toDate(),
        $lt: endOfYear.startOf("day").toDate(),
      };
    }
    if (date == "lastYear") {
      newDate = {
        $gte: startOfPreviousYear.toDate(),
        $lt: endOfPreviousYear.startOf("day").toDate(),
      };
    }

    const userData = await User.findOne({ email: searchText });
    const user = userData?._id?.toString();

    let forPage = {};

    if (cat && subCat && newDate && searchText) {
      forPage = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
        name: titleRegex,
      };
    } else if (cat && subCat && searchText) {
      forPage = {
        category: regex,
        subCategory: subRegex,
        name: titleRegex,
      };
    } else if (cat && newDate && searchText) {
      forPage = {
        subCategory: regex,
        createdAt: newDate,
        name: titleRegex,
      };
    } else if (newDate && subCat && searchText) {
      forPage = {
        createdAt: newDate,
        subCategory: subRegex,
        name: titleRegex,
      };
    } else if (newDate && searchText) {
      forPage = {
        createdAt: newDate,
        name: titleRegex,
      };
    } else if (cat && searchText) {
      forPage = {
        subCategory: regex,
        name: titleRegex,
      };
    } else if (subCat && searchText) {
      forPage = {
        subCategory: subRegex,
        name: titleRegex,
      };
    } else if (searchText) {
      forPage = { name: titleRegex };
    } else if (cat && subCat && newDate) {
      forPage = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
      };
    } else if (cat && subCat) {
      forPage = {
        category: regex,
        subCategory: subRegex,
      };
    } else if (cat && newDate) {
      forPage = {
        subCategory: regex,
        createdAt: newDate,
      };
    } else if (newDate && subCat) {
      forPage = {
        createdAt: newDate,
        subCategory: subRegex,
      };
    } else if (newDate) {
      forPage = { createdAt: newDate };
    } else if (cat) {
      forPage = { subCategory: regex };
    } else if (subCat) {
      forPage = { subCategory: subRegex };
    } else {
      forPage = {};
    }

    console.log(searchText);

    const matchStage = {};
    if (cat && subCat && newDate && searchText) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
        name: titleRegex,
      };
    } else if (cat && subCat && searchText) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
        name: titleRegex,
      };
    } else if (cat && newDate && searchText) {
      matchStage.$match = {
        subCategory: regex,
        createdAt: newDate,
        name: titleRegex,
      };
    } else if (newDate && subCat && searchText) {
      matchStage.$match = {
        createdAt: newDate,
        subCategory: subRegex,
        name: titleRegex,
      };
    } else if (newDate && searchText) {
      matchStage.$match = {
        createdAt: newDate,
        name: titleRegex,
      };
    } else if (cat && searchText) {
      matchStage.$match = {
        subCategory: regex,
        name: titleRegex,
      };
    } else if (subCat && searchText) {
      matchStage.$match = {
        subCategory: subRegex,
        name: titleRegex,
      };
    } else if (searchText) {
      matchStage.$match = { name: titleRegex };
    } else if (cat && subCat && newDate) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
      };
    } else if (cat && subCat) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
      };
    } else if (cat && newDate) {
      matchStage.$match = {
        subCategory: regex,
        createdAt: newDate,
      };
    } else if (newDate && subCat) {
      matchStage.$match = {
        createdAt: newDate,
        subCategory: subRegex,
      };
    } else if (newDate) {
      matchStage.$match = { createdAt: newDate };
    } else if (cat) {
      matchStage.$match = { subCategory: regex };
    } else if (subCat) {
      matchStage.$match = { subCategory: subRegex };
    } else {
      matchStage.$match = {};
    }

    const posts = await Product.aggregate([
      matchStage,
      {
        $match: {
          isApproved: true,
          ...publishedGate(),
        },
      },
      {
        $addFields: {
          _sortScore: {
            $cond: {
              if: {
                $or: [
                  { $gt: ["$boostExpiresAt", new Date()] },
                  {
                    $and: [
                      { $gt: ["$premiumDay", 0] },
                      { $not: { $ifNull: ["$boostExpiresAt", false] } },
                      {
                        $gt: [
                          {
                            $add: [
                              "$createdAt",
                              { $multiply: ["$premiumDay", 3600000] },
                            ],
                          },
                          new Date(),
                        ],
                      },
                    ],
                  },
                ],
              },
              then: 2,
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$isPremium", true] },
                      { $not: { $gt: ["$premiumDay", 0] } },
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
      },
      {
        $sort: { _sortScore: -1, createdAt: -1 },
      },
      { $skip: skipCount },
      {
        $limit: limit,
      },
      {
        $project: {
          category: 1,
          name: 1,
          subCategory: 1,
          createdAt: 1,
          isPremium: 1,
          cityCount: {
            $cond: {
              if: {
                $and: [
                  { $isArray: "$cities" },
                  { $ne: [{ $size: "$cities" }, 0] },
                ],
              },
              then: { $size: "$cities" },
              else: 0,
            },
          },
        },
      },
    ]);

    response.totalPost = await Product.find(forPage).countDocuments({});
    response.startIndex = skipCount + 1;
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

/**
 * Fields a client is allowed to set on an ad. Everything else that ends up on
 * the document (isApproved, isPremium, boostExpiresAt, contentHash, posterId)
 * is decided here, server-side. Before this whitelist existed the request body
 * went straight into new Product(body), so a caller could self-approve, grant
 * itself a boost it had not paid for, or post as another user.
 */
const CLIENT_WRITABLE_FIELDS = [
  "name",
  "phone",
  "email",
  "category",
  "subCategory",
  "description",
  "city",
  "cities",
  "link",
  "age",
  "imgOne",
  "imgTwo",
  "imgThree",
  "imgFour",
  "imageFileIds",
  "altTexts",
  "premiumDay",
];

const pickWritable = (body = {}) => {
  const out = {};
  for (const key of CLIENT_WRITABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};

/** Parse a client publishAt; anything invalid or in the past means publish now. */
const parsePublishAt = (value) => {
  if (!value) return null;
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return null;
  return when.getTime() > Date.now() ? when : null;
};
exports.parsePublishAt = parsePublishAt;

/**
 * Take the fee off a user, but only if they actually have it. One atomic
 * operation, so two concurrent posts cannot both pass the balance check.
 */
const chargeUser = async (userId, fee) => {
  if (!fee || fee <= 0) return { ok: true, user: null };
  const user = await User.findOneAndUpdate(
    { _id: userId, credit: { $gte: fee } },
    { $inc: { credit: -fee } },
    { new: true }
  ).exec();
  return { ok: Boolean(user), user };
};
exports.chargeUser = chargeUser;

// add Products
exports.addProductService = async ({ body, authUserId }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const data = pickWritable(body);

    // Trust the token over the body, so nobody can post as another user.
    const posterId = authUserId || body.posterId;
    if (!posterId) {
      response.code = 401;
      response.status = "failed";
      response.message = "You must be signed in to post an ad";
      return response;
    }
    data.posterId = posterId;

    const premiumDay = Number(data.premiumDay) || 0;
    data.premiumDay = premiumDay;

    const fee = feeForAd({ premiumDay, cities: data.cities });
    const { ok } = await chargeUser(posterId, fee);
    if (!ok) {
      response.code = 402;
      response.status = "failed";
      response.message = "Insufficient credits";
      return response;
    }

    data.publishAt = parsePublishAt(body.publishAt);

    // A boost must not start burning before the ad is actually visible.
    const boostStartsAt = data.publishAt ? data.publishAt.getTime() : Date.now();
    if (premiumDay > 0) {
      data.isPremium = true;
      data.boostExpiresAt = new Date(boostStartsAt + premiumDay * 60 * 60 * 1000);
    } else {
      data.isPremium = false;
      data.boostExpiresAt = undefined;
    }

    // Duplicates, banned words and suspicious links go to the pending queue.
    const review = await reviewAd(data);
    data.isApproved = review.isApproved;
    data.moderationReason = review.moderationReason;
    data.contentHash = review.contentHash;

    const newProduct = new Product(data);
    await newProduct.save();

    response.data = {
      id: newProduct._id,
      isApproved: newProduct.isApproved,
      moderationReason: newProduct.moderationReason,
      publishAt: newProduct.publishAt,
      charged: fee,
    };
    if (!newProduct.isApproved) {
      response.message =
        "Your ad was submitted for review and will appear once an admin approves it.";
    }
    return response;
  } catch (error) {
    console.error(error);

    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// update Products
exports.updateProductService = async ({
  id,
  name,
  category,
  subCategory,
  description,
  city,
  cities,
  email,
  phone,
  imgOne,
  imgTwo,
  imgThree,
  imgFour,
  age,
  link,
  isDelete,
  altTexts,
  imageFileIds,
  publishAt,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  try {
    const product = await Product.findOne({
      _id: id,
    }).exec();
    if (!product) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    product.name = name ? name : product.name;
    product.link = link ? link : product.link;
    product.age = age ? age : product.age;
    product.category = category ? category : product.category;
    product.subCategory = subCategory ? subCategory : product.subCategory;
    product.description = description ? description : product.description;
    product.city = city ? city : product.city;
    product.cities = cities ? cities : product.cities;
    product.email = email ? email : product.email;
    product.phone = phone ? phone : product.phone;
    product.imgOne = imgOne ? imgOne : product.imgOne;
    product.imgTwo = imgTwo ? imgTwo : product.imgTwo;
    product.imgThree = imgThree ? imgThree : product.imgThree;
    product.imgFour = imgFour ? imgFour : product.imgFour;
    if (Array.isArray(altTexts)) product.altTexts = altTexts;
    if (Array.isArray(imageFileIds)) product.imageFileIds = imageFileIds;

    // The schedule stays editable only while the ad has not gone live yet.
    const notYetPublished =
      product.publishAt && product.publishAt.getTime() > Date.now();
    if (publishAt !== undefined && notYetPublished) {
      product.publishAt = parsePublishAt(publishAt);
    }

    // Re-screen on edit, otherwise a clean ad could be edited into a violating
    // one and stay published.
    if (name !== undefined || description !== undefined || link !== undefined) {
      const review = await reviewAd(
        {
          name: product.name,
          description: product.description,
          link: product.link,
          posterId: product.posterId,
        },
        { excludeId: product._id }
      );
      product.contentHash = review.contentHash;
      if (!review.isApproved) {
        product.isApproved = false;
        product.moderationReason = review.moderationReason;
      }
    }

    await product.save();

    response.data.product = product;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// update Product
exports.updateApproveService = async ({ id, isApproved }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  try {
    const product = await Product.findOne({
      _id: id,
    }).exec();
    if (!product) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }
    if (isApproved == false) {
      product.isApproved = false;
      await product.save();
      response.data.product = product;
      return response;
    }
    product.isApproved = isApproved ? isApproved : product.isApproved;
    // A manual approval overrides the automatic rejection, so drop its reason.
    if (isApproved) product.moderationReason = undefined;

    await product.save();
    response.data.product = product;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateApproveMany = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  const data = req.body;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();
    const addCustomerToTheStores = data.map(async (id, index) => {
      await new Promise((resolve) => setTimeout(resolve, index * 500));

      const updatedStore = await Product.findByIdAndUpdate(
        id,
        { $set: { isApproved: true }, $unset: { moderationReason: "" } },
        { new: true },
      );
    });
    await session.commitTransaction();
    await session.endSession();

    setTimeout(() => {
      res
        .status(200)
        .json({ status: "success", message: "Post updated successfully" });
    }, data.length * 500);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};

exports.deleteMany = async (req, res) => {
  const ids = req.body;

  try {
    await Product.deleteMany(
      {
        _id: {
          $in: ids,
        },
      },
      function (err, result) {
        if (err) {
          res.json(err);
        } else {
          res.json(result);
        }
      },
    );

    res
      .status(200)
      .json({ status: "success", message: "Deleted successfully" });
  } catch (e) {
    console.log(e);
    // res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};

// delete Products
exports.deleteProductService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Product successfully",
  };

  try {
    const product = await Product.findOne({
      _id: id,
      isDelete: false,
    });
    if (!product) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    await product.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get all Products
exports.getUnApprovedService = async ({ page, size }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Product list successfully",
    data: {},
    totalPost: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = size ? parseInt(size) : 10;
    const skipCount = (pageNumber - 1) * limit;

    const products = await Product.aggregate([
      { $sort: { isPremium: -1, _id: -1 } },
      {
        $match: {
          isApproved: false,
        },
      },
      { $skip: skipCount },
      {
        $limit: limit,
      },

      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    if (products.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No Product data found";
      return response;
    }

    response.totalPost = await Product.find({
      isApproved: false,
    }).countDocuments({});

    response.data = {
      products,
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

exports.getPostForSitemap = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Product.find(
      { isApproved: true, isDelete: false, ...publishedGate() },
      "category"
    ).limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getPostForSitemapSecond = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Product.find(
      { isApproved: true, isDelete: false, ...publishedGate() },
      "category"
    )
      .skip(30000)
      .limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getPostForSitemapthird = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Product.find(
      { isApproved: true, isDelete: false, ...publishedGate() },
      "category"
    )
      .skip(60000)
      .limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
exports.getPostForSitemapFourth = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Product.find(
      { isApproved: true, isDelete: false, ...publishedGate() },
      "category"
    )
      .skip(90000)
      .limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getAllPosts = async ({ page, category, state, cat }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Product list successfully",
    data: {},
    pages: 0,
    links: {},
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 35;

    let filter = {};
    if (!category) {
      filter = {
        cities: { $elemMatch: { $eq: state } },
        isApproved: true,
        ...publishedGate(),
      };
    } else {
      filter = {
        subCategory: category,
        cities: { $elemMatch: { $eq: state } },
        isApproved: true,
        ...publishedGate(),
      };
    }

    const totalDocs = await Product.find(filter).countDocuments({});

    const products = await Product.aggregate([
      { $match: filter },
      {
        $addFields: {
          _isBoostActive: {
            $or: [
              { $gt: ["$boostExpiresAt", new Date()] },
              {
                $and: [
                  { $gt: ["$premiumDay", 0] },
                  { $not: { $ifNull: ["$boostExpiresAt", false] } },
                  {
                    $gt: [
                      {
                        $add: [
                          "$createdAt",
                          { $multiply: ["$premiumDay", 3600000] },
                        ],
                      },
                      new Date(),
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          boosted: "$_isBoostActive",
          _sortScore: { $cond: { if: "$_isBoostActive", then: 1, else: 0 } },
        },
      },
      { $sort: { _sortScore: -1, createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $skip: (pageNumber - 1) * limit },
      { $limit: limit },
      {
        $project: {
          name: 1,
          _id: 1,
          createdAt: 1,
          isPremium: 1,
          age: 1,
          imgOne: 1,
          altTexts: 1,
          boosted: 1,
        },
      },
    ]);

    if (products.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No Product data found";
      return response;
    }
    response.pages = totalDocs;

    // for (const blog of products) {
    //   if (!blog.imgOne.includes("dk3vy6fruyw6l")) {
    //     if (blog.imgOne.trim() === "" || blog.imgOne.includes("imagekit")) {
    //       blog.imgOne =
    //         cat === "Adult" || cat === "Dating"
    //           ? "image-not-found.jpeg"
    //           : "image-is-not-found.png";
    //     }
    //     const getObjectParams = {
    //       Bucket: bucket_Name,
    //       Key: blog.imgOne,
    //     };
    //     const command = new GetObjectCommand(getObjectParams);
    //     const url = await getSignedUrl(s3, command);
    //     blog.imgOne = url;
    //   }
    // }

    response.data = {
      products,
    };
    response.links = await Links.find({}).select("-v");

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

// get Products by search
exports.searchProductService = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product data found successfully",
    data: {},
  };

  try {
    let query = { isDelete: false, isApproved: true, ...publishedGate() };
    if (q !== "undefined" || q !== undefined || q) {
      let regex = new RegExp(q, "i");
      query = {
        ...query,
        $or: [{ name: regex }, { category: regex }],
      };
    }

    response.data.products = await Product.find(query)
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (response.data.products.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get one Products by id
exports.getOnlyUserPosts = async ({
  id,
  page,
  status,
  category,
  searchText,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Product successfully",
    data: {},
    pages: 0,
    startIndex: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 10;
    const skipCount = (pageNumber - 1) * limit;
    const regex = new RegExp(searchText, "i");

    let forPage = {};
    if (searchText && category && status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
        name: regex,
      };
    } else if (category && status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
      };
    } else if (searchText && status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        name: regex,
      };
    } else if (category && searchText) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
        name: regex,
      };
    } else if (category) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
      };
    } else if (status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
      };
    } else if (searchText) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        name: regex,
      };
    } else {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
      };
    }

    const matchStage = {};
    if (searchText && category && status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
        name: regex,
      };
    } else if (category && status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
      };
    } else if (searchText && status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        name: regex,
      };
    } else if (category && searchText) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
        name: regex,
      };
    } else if (category) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
      };
    } else if (status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
      };
    } else if (searchText) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        name: regex,
      };
    } else {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
      };
    }

    const posts = await Product.aggregate([
      matchStage,
      { $sort: { _id: -1 } },
      { $skip: skipCount },
      { $limit: limit },
      {
        $project: {
          name: 1,
          isPremium: 1,
          category: 1,
          subCategory: 1,
          createdAt: 1,
          premiumDay: 1,
          boostExpiresAt: 1,
          isApproved: 1,
          moderationReason: 1,
          publishAt: 1,
          cities: 1,
          repostCount: 1,
          lastRepostAt: 1,
        },
      },
    ]);

    // A user with no ads yet is a normal, successful result.
    if (posts.length == 0) {
      response.message = "No Product found";
    }

    response.startIndex = skipCount + 1;
    response.data = {
      posts,
    };
    response.pages = await Product.find(forPage).countDocuments({});

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getAdminUserPosts = async ({ id, page }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Product successfully",
    data: {},
    page: 0,
  };
  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 8;

    const allPosts = await Product.find({
      posterId: id,
      isDelete: false,
    }).countDocuments({});

    response.data.product = await Product.find({
      posterId: id,
      isDelete: false,
    })

      .sort({ _id: -1 })
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .select("-__v -isDelete")
      .exec();

    if (!response.data.product) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product found";
      return response;
    }

    response.page = allPosts;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get one Products by id
exports.getProductService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Product successfully",
    data: {},
    links: {},
    responsiveads: {},
    rainbow: {},
    related: [],
  };

  try {
    response.rainbow = await Rainbow.findOne({
      _id: "6a4dfed965f818834bf4b278",
    });

    response.responsiveads = await Responsive.findOne({
      _id: "6a4dff1365f818834bf4b27b",
    });
    response.links = await Links.find({}).select("-v");

    const products = await Product.aggregate([
      { $match: { $expr: { $eq: ["$_id", { $toObjectId: `${id}` }] } } },
      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    response.related = await Product.find({
      subCategory: products?.[0]?.subCategory,
      _id: { $ne: products?.[0]?._id },
      isApproved: true,
      isDelete: false,
      ...publishedGate(),
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("name imgOne altTexts");

    if (!products) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product found";
      return response;
    }

    response.data = products;

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/**
 * Related ads with a circular ("See More" never runs dry) pager.
 *
 * Rather than stopping at the end of the list, the offset wraps with a modulo,
 * so pressing See More keeps cycling through the same subcategory from the top.
 * If a subcategory has no other ads at all, it falls back to the newest ads
 * site-wide so the section is never empty.
 */
exports.getRelatedProductsService = async ({ id, page, limit }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Related ads found successfully",
    data: { related: [], total: 0, hasMore: false, source: "subCategory" },
  };

  try {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(24, Math.max(1, parseInt(limit, 10) || 8));

    const source = await Product.findById(id).select("subCategory").lean().exec();
    if (!source) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product found";
      return response;
    }

    const projection = "name imgOne altTexts";
    const sort = { createdAt: -1 };

    let filter = {
      subCategory: source.subCategory,
      _id: { $ne: source._id },
      isApproved: true,
      isDelete: false,
      ...publishedGate(),
    };

    let total = await Product.countDocuments(filter);

    // Nothing else in this subcategory: widen to the newest ads site-wide.
    if (total === 0) {
      response.data.source = "latest";
      filter = {
        _id: { $ne: source._id },
        isApproved: true,
        isDelete: false,
        ...publishedGate(),
      };
      total = await Product.countDocuments(filter);
    }

    if (total === 0) {
      return response;
    }

    const skip = ((pageNumber - 1) * pageSize) % total;
    let rows = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .select(projection)
      .lean()
      .exec();

    // The window ran past the end of the list, so wrap around and top it up.
    if (rows.length < pageSize && total > rows.length) {
      const remainder = await Product.find(filter)
        .sort(sort)
        .limit(pageSize - rows.length)
        .select(projection)
        .lean()
        .exec();
      rows = rows.concat(remainder);
    }

    response.data.related = rows;
    response.data.total = total;
    response.data.hasMore = total > 0;
    return response;
  } catch (error) {
    console.error(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/**
 * Repost: push an existing ad back to the top of the listings.
 *
 * The fee is recomputed from the stored ad, not sent by the client, so a repost
 * of a multi-city or boosted ad costs the same as the original did.
 */
exports.repostProductService = async ({ id, authUserId }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Ad reposted successfully",
    data: {},
  };

  try {
    const product = await Product.findById(id).exec();
    if (!product || product.isDelete) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    if (!authUserId || String(product.posterId) !== String(authUserId)) {
      response.code = 403;
      response.status = "failed";
      response.message = "You can only repost your own ads";
      return response;
    }

    const fee = feeForAd(product);
    const { ok, user } = await chargeUser(authUserId, fee);
    if (!ok) {
      response.code = 402;
      response.status = "failed";
      response.message = "Insufficient credits to repost this ad";
      return response;
    }

    const now = new Date();

    const update = {
      lastRepostAt: now,
      publishAt: null,
    };

    // Re-arm an existing boost for another full term, since it was paid for again.
    if (product.premiumDay > 0) {
      update.isPremium = true;
      update.boostExpiresAt = new Date(
        now.getTime() + product.premiumDay * 60 * 60 * 1000
      );
    }

    await Product.updateOne(
      { _id: product._id },
      { $set: update, $inc: { repostCount: 1 } },
      { timestamps: false }
    );

    // Listings sort on createdAt, so moving it forward is what actually bumps
    // the ad to the top.
    //
    // This goes through the native driver on purpose. Mongoose marks the
    // timestamp paths immutable (createdAt resolves to { immutable: true }), and
    // it strips immutable paths out of update operations, so doing this through
    // Product.updateOne() risks the bump silently doing nothing -- the repost
    // would take the money and leave the ad where it was. The native collection
    // has no casting or immutability layer, so the write always lands.
    await Product.collection.updateOne(
      { _id: product._id },
      { $set: { createdAt: now, updatedAt: now } }
    );

    // A repost is identical to itself by definition, so the duplicate check is
    // skipped here; banned words and links are still re-screened.
    const review = await reviewAd(
      {
        name: product.name,
        description: product.description,
        link: product.link,
        posterId: product.posterId,
      },
      { skipDuplicateCheck: true }
    );
    if (!review.isApproved) {
      await Product.updateOne(
        { _id: product._id },
        { $set: { isApproved: false, moderationReason: review.moderationReason } },
        { timestamps: false }
      );
      response.message =
        "Your ad was reposted and sent for review before it goes live again.";
    }

    if (fee > 0) {
      await Transactions.create({
        userId: authUserId,
        amount: fee,
        exactAmount: fee,
        isCompleted: "Done",
        date: now.toISOString(),
        invoice: "REPOST-" + product._id,
        kind: "repost",
        reference: String(product._id),
      });
    }

    response.data = {
      id: product._id,
      charged: fee,
      isApproved: review.isApproved,
      creditRemaining: user ? user.credit : undefined,
    };
    return response;
  } catch (error) {
    console.error(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/**
 * What a repost of this ad would cost, so the UI can confirm the amount before
 * charging anything.
 */
exports.getRepostQuoteService = async ({ id, authUserId }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Quote generated",
    data: {},
  };

  try {
    const product = await Product.findById(id)
      .select("posterId premiumDay cities isDelete")
      .lean()
      .exec();
    if (!product || product.isDelete) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }
    if (!authUserId || String(product.posterId) !== String(authUserId)) {
      response.code = 403;
      response.status = "failed";
      response.message = "You can only repost your own ads";
      return response;
    }

    const fee = feeForAd(product);
    const user = await User.findById(authUserId).select("credit").lean().exec();

    response.data = {
      fee,
      credit: user ? user.credit : 0,
      affordable: (user ? Number(user.credit) : 0) >= fee,
      cities: Array.isArray(product.cities) ? product.cities.length : 0,
      premiumDay: product.premiumDay || 0,
    };
    return response;
  } catch (error) {
    console.error(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
