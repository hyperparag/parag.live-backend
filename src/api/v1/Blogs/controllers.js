const {
  addBlogServices,
  getBlogsServices,
  updateBlogServices,
  deleteBlogServices,
  singleBlogServices,
  getBlogsAdminServices,
  singleBlogByIdServices,
  getBlogsForSitemap,
} = require("./services");

exports.addBlog = async (req, res) => {
  const { status, code, message } = await addBlogServices({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

exports.getBlog = async (req, res) => {
  const { status, code, message, data, page } = await getBlogsServices({
    ...req.query,
  });
  if (data.blogs) {
    return res.status(code).json({ code, status, message, data, page });
  }
  res.status(code).json({ code, status, message });
};
exports.getSitemap = async (req, res) => {
  const { status, code, message, data, page } = await getBlogsForSitemap({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data, page });
  }
  res.status(code).json({ code, status, message });
};

exports.getBlogAdmin = async (req, res) => {
  const { status, code, message, data, page } = await getBlogsAdminServices({
    ...req.query,
  });
  if (data.blogs) {
    return res.status(code).json({ code, status, message, data, page });
  }
  res.status(code).json({ code, status, message });
};

exports.singleBlog = async (req, res) => {
  const { status, code, message, data } = await singleBlogServices({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};
exports.singleBlogById = async (req, res) => {
  const { status, code, message, data } = await singleBlogByIdServices({
    ...req.params,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Blogs
exports.updateBlogs = async (req, res) => {
  const { status, code, message, data } = await updateBlogServices({
    ...req.params,
    ...req.body,
  });
  if (data.blog) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Blogs
exports.deleteBlog = async (req, res) => {
  const { status, code, message } = await deleteBlogServices({
    ...req.params,
  });
  res.status(code).json({ code, status, message });
};
