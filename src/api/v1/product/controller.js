const {
  addProductService,
  getProductsService,
  getAdminUserPosts,
  searchProductService,
  getProductService,
  deleteProductService,
  updateProductService,
  updateApproveService,
  getOnlyUserPosts,
  getUnApprovedService,
  getApprovedService,
  updateMany,
  updateApprove,
  getAllPosts,
  getPostForSitemap,
  getPostForSitemapSecond,
  getPostForSitemapthird,
  getPostForSitemapFourth,
} = require("./service");

// add Products
exports.addProduct = async (req, res) => {
  const { status, code, message } = await addProductService({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

// update Products
exports.updateProduct = async (req, res) => {
  const { status, code, message, data } = await updateProductService({
    ...req.params,
    ...req.body,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Products
exports.updateApprove = async (req, res) => {
  const { status, code, message, data } = await updateApproveService({
    ...req.params,
    ...req.body,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Products
exports.updateManyById = async (req, res) => {
  const { status, code, message, data } = await updateApprove({
    ...req.params,
    ...req.body,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// delete Products
exports.deleteProduct = async (req, res) => {
  const { status, code, message, data } = await deleteProductService({
    ...req.params,
  });
  res.status(code).json({ code, status, message, data });
};

// get all Products
exports.getAdminPost = async (req, res) => {
  const { status, code, message, data, totalPost } = await getUnApprovedService(
    {
      ...req.query,
    }
  );
  if (data.products) {
    return res.status(code).json({ code, status, message, data, totalPost });
  }
  res.status(code).json({ code, status, message });
};

// get all Products
exports.getPosts = async (req, res) => {
  const { status, code, message, data, totalPost, startIndex } =
    await getApprovedService({
      ...req.query,
    });
  if (data) {
    return res
      .status(code)
      .json({ code, status, message, data, totalPost, startIndex });
  }
  res.status(code).json({ code, status, message });
};

exports.getPostsSitemap = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemap({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

exports.getPostsSitemapSecond = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemapSecond({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};
exports.getPostsSitemapThird = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemapthird({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};
exports.getPostsSitemapFourth = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemapFourth({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// get all Products
exports.getAllPost = async (req, res) => {
  const { status, code, message, data, pages, links } = await getAllPosts({
    ...req.query,
  });
  if (data.products) {
    return res.status(code).json({ code, status, message, data, pages, links });
  }
  res.status(code).json({ code, status, message });
};

// get Products by search
exports.searchProduct = async (req, res) => {
  const { status, code, message, data } = await searchProductService({
    ...req.query,
  });
  if (data.products && data.products.length > 0) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// get one Products
exports.getPosterPost = async (req, res) => {
  const { status, code, message, data, pages, startIndex } =
    await getOnlyUserPosts({
      ...req.params,
      ...req.query,
    });
  if (data) {
    return res
      .status(code)
      .json({ code, status, message, data, pages, startIndex });
  }
  res.status(code).json({ code, status, message });
};

// get one Products
exports.getAdminPosterPost = async (req, res) => {
  const { status, code, message, data, page } = await getAdminUserPosts({
    ...req.params,
    ...req.query,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data, page });
  }
  res.status(code).json({ code, status, message });
};

// get one Products
exports.getProduct = async (req, res) => {
  const {
    status,
    code,
    message,
    data,
    links,
    rainbow,
    responsiveads,
    related,
  } = await getProductService({
    ...req.params,
  });

  res.status(code).json({
    code,
    status,
    message,
    data,
    links,
    rainbow,
    responsiveads,
    related,
  });
};
