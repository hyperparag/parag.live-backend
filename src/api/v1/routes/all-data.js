const express = require("express");
const verifyAdmin = require("../middleware/adminCheck");
const { Product, Blogs, User, Transactions } = require("../models");
const router = express.Router();

router.get("/", verifyAdmin, async (req, res) => {
  const allProducts = await Product.countDocuments({});
  const allPremiumProducts = await Product.find({
    isPremium: false,
  }).countDocuments({});

  const allBlogs = await Blogs.countDocuments({});

  const data = {
    allPost: allProducts,
    premiumPost: allPremiumProducts,
    allBlogs: allBlogs,
  };

  res.send(data);
});

module.exports = router;
