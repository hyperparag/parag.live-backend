const { Blogs } = require("../models");
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

/**
 * Scheduled posts: a blog with a future publishAt stays hidden from every public
 * query until that time passes. Enforced at read time, so it does not depend on
 * how often any cron runs.
 */
const publishedGate = () => ({
  $or: [
    { publishAt: null },
    { publishAt: { $exists: false } },
    { publishAt: { $lte: new Date() } },
  ],
});

/** Parse a client publishAt; anything invalid or in the past means publish now. */
const parsePublishAt = (value) => {
  if (!value) return null;
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return null;
  return when.getTime() > Date.now() ? when : null;
};

// Where a post sits in the public list: the latest repost, else its go-live
// time, else when it was created.
const sortAtStage = {
  $addFields: {
    sortAt: {
      $ifNull: ["$lastRepostAt", { $ifNull: ["$publishAt", "$createdAt"] }],
    },
  },
};

exports.addBlogServices = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Blog added successfully",
  };

  try {
    const newProduct = new Blogs(body);
    await newProduct.save();
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getBlogsForSitemap = async () => {
  const response = {
    code: 201,
    status: "success",
    message: "Blog added successfully",
    data: {},
  };
  try {
    const blogs = await Blogs.find(publishedGate(), "permalink");

    response.data = blogs;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getBlogsServices = async ({ q, page, cat }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Blog list successfully",
    data: {},
    page: 0,
  };

  const regex = new RegExp(q, "i");
  const catregex = new RegExp(cat, "i");
  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 6;
    const skipCount = (pageNumber - 1) * limit;

    let forPage = {};
    if (q && cat) {
      forPage = {
        category: catregex,
        title: regex,
      };
    } else if (q) {
      forPage = { title: regex };
    } else if (cat) {
      forPage = { category: catregex };
    } else {
      forPage = {};
    }

    let matchStage = {};
    if (q && cat) {
      matchStage.$match = {
        category: catregex,
        title: regex,
      };
    } else if (q) {
      matchStage.$match = { title: regex };
    } else if (cat) {
      matchStage.$match = { category: catregex };
    } else {
      matchStage.$match = {};
    }

    // Only published posts reach the public list.
    matchStage.$match = { $and: [matchStage.$match, publishedGate()] };
    forPage = { $and: [forPage, publishedGate()] };

    const blogs = await Blogs.aggregate([
      matchStage,
      sortAtStage,
      {
        $sort: { sortAt: -1, _id: -1 },
      },
      { $skip: skipCount },
      {
        $limit: limit,
      },
      {
        $project: {
          permalink: 1,
          title: 1,
          category: 1,
          image: 1,
          altText: 1,
        },
      },
    ]);
    // for (const blog of blogs) {
    //   const url = `https://dk3vy6fruyw6l.cloudfront.net/${blog.image}`;
    //   blog.image = url;
    // }

    if (blogs.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No Product data found";
      return response;
    }

    // const totalBlogs = await Blogs.countDocuments({}, { maxTimeMS: 20000 });
    const totalBlogs = await Blogs.find(forPage).countDocuments({});
    response.page = totalBlogs;
    response.data = {
      blogs,
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

exports.getBlogsAdminServices = async ({ q, page, cat }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Blog list successfully",
    data: {},
    page: 0,
  };

  const regex = new RegExp(q, "i");
  const catregex = new RegExp(cat, "i");
  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 6;
    const skipCount = (pageNumber - 1) * limit;

    // Admins see every post, including scheduled ones.
    const filter = {};
    if (q) filter.title = regex;
    if (cat) filter.category = catregex;

    const matchStage = { $match: filter };
    const forPage = filter;

    const blogs = await Blogs.aggregate([
      matchStage,
      sortAtStage,
      {
        $sort: { sortAt: -1, _id: -1 },
      },
      { $skip: skipCount },
      {
        $limit: limit,
      },
      {
        $project: {
          title: 1,
          category: 1,
          status: 1,
          writer: 1,
          createdAt: 1,
          publishAt: 1,
          repostCount: 1,
          lastRepostAt: 1,
        },
      },
    ]);

    if (blogs.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No Product data found";
      return response;
    }

    // const totalBlogs = await Blogs.countDocuments({}, { maxTimeMS: 20000 });
    const totalBlogs = await Blogs.find(forPage).countDocuments({});
    response.page = totalBlogs;
    response.data = {
      blogs,
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

exports.singleBlogServices = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Blog list successfully",
    data: {},
  };

  try {
    const blogs = await Blogs.find({ permalink: q, ...publishedGate() });
    if (!blogs) {
      response.code = 404;
      response.status = "failed";
      response.message = "Error. Try again";
      return response;
    }

    // for (const blog of blogs) {
    //   const url = `https://dk3vy6fruyw6l.cloudfront.net/${blog.image}`;
    //   blog.image = url;
    // }

    response.data = { blogs };

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

exports.singleBlogByIdServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Blog list successfully",
    data: {},
  };

  try {
    const blogs = await Blogs.find({ _id: id });

    if (!blogs) {
      response.code = 404;
      response.status = "failed";
      response.message = "Error. Try again";
      return response;
    }

    // for (const blog of blogs) {
    //   const url = `https://dk3vy6fruyw6l.cloudfront.net/${blog.image}`;
    //   blog.image = url;
    // }

    // console.log(blogs);
    response.data = { blogs };

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

// update blogs
exports.updateBlogServices = async ({
  id,
  title,
  category,
  desc,
  image,
  altText,
  publishAt,
  writer,
  status,
  permalink,
  metaDesc,
  metaKey,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Blog  updated successfully",
    data: {},
  };

  try {
    const blog = await Blogs.findOne({
      _id: id,
    }).exec();
    if (!blog) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    blog.title = title ? title : blog.title;
    blog.permalink = permalink ? permalink : blog.permalink;
    blog.category = category ? category : blog.category;
    blog.desc = desc ? desc : blog.desc;
    blog.image = image ? image : blog.image;
    if (altText !== undefined) blog.altText = altText;
    // An empty value means "post now"; only touch the schedule if it was sent.
    if (publishAt !== undefined) blog.publishAt = parsePublishAt(publishAt);
    blog.writer = writer ? writer : blog.writer;
    blog.status = status ? status : blog.status;
    blog.metaDesc = metaDesc ? metaDesc : blog.metaDesc;
    blog.metaKey = metaKey ? metaKey : blog.metaKey;

    await blog.save();

    response.data.blog = blog;

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteBlogServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Product successfully",
  };

  try {
    const blog = await Blogs.findOne({
      _id: id,
      isDelete: false,
    });
    if (!blog) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    await blog.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteMany = async (req, res) => {
  const ids = req.body;

  try {
    await Blogs.deleteMany({
      _id: {
        $in: Array.isArray(ids) ? ids : [],
      },
    });

    res
      .status(200)
      .json({ status: "success", message: "Deleted successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong deleting posts" });
  }
};

exports.updatePauseMany = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  const { data } = req.body;

  try {
    data.map((a) => {
      const f = Blogs.findByIdAndUpdate(
        a,
        { $set: { status: "paused" } },
        function (err, docs) {
          console.log(err);
        },
      );
    });
    res
      .status(200)
      .json({ status: "success", message: "Post updated successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};

exports.updatePablishMany = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  const { data } = req.body;
  try {
    data.map((a) => {
      const f = Blogs.findByIdAndUpdate(
        a,
        { $set: { status: "published" } },
        function (err, docs) {
          console.log(err);
        },
      );
    });
    res
      .status(200)
      .json({ status: "success", message: "Post updated successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};

/**
 * Repost: push an existing blog post back to the top of the public list.
 * Blogs are written by admins only, so unlike an ad repost there is no fee.
 */
exports.repostBlogServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Blog reposted successfully",
    data: {},
  };

  try {
    const blog = await Blogs.findOneAndUpdate(
      { _id: id },
      {
        $set: { lastRepostAt: new Date(), publishAt: null },
        $inc: { repostCount: 1 },
      },
      { new: true }
    ).exec();

    if (!blog) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Blog data found";
      return response;
    }

    response.data.blog = blog;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
