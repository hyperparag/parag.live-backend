const { default: mongoose } = require("mongoose");
const { Product, User, Links, Responsive, Rainbow } = require("../models");
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

const PREMIUM_COST = { 168: 7, 336: 10, 720: 15 };

// add Products
exports.addProductService = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const cost = PREMIUM_COST[body.premiumDay] ?? 0;

    if (cost > 0) {
      const user = await User.findById(body.posterId).exec();
      if (!user || parseFloat(user.credit) < cost) {
        response.code = 402;
        response.status = "failed";
        response.message = "Insufficient credits";
        return response;
      }
      user.credit = parseFloat(user.credit) - cost;
      await user.save();
    }

    if (body.premiumDay > 0) {
      body.isPremium = true;
      body.boostExpiresAt = new Date(
        Date.now() + body.premiumDay * 60 * 60 * 1000,
      );
    }

    const newProduct = new Product(body);
    await newProduct.save();
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

    console.log(product, "product");

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
        { $set: { isApproved: true } },
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
    const posts = await Product.find({}, "category").limit(30000);
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
    const posts = await Product.find({}, "category").skip(30000).limit(30000);
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
    const posts = await Product.find({}, "category").skip(60000).limit(30000);
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
    const posts = await Product.find({}, "category").skip(90000).limit(30000);
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
      };
    } else {
      filter = {
        subCategory: category,
        cities: { $elemMatch: { $eq: state } },
        isApproved: true,
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
    let query = { isDelete: false };
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
        },
      },
    ]);

    if (posts.length == 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product found";
      return response;
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
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("name imgOne");

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
