const express = require("express");
const verifyAdmin = require("../middleware/adminCheck");
const { Product, Blogs, User, Transactions } = require("../models");
const router = express.Router();

router.get("/", verifyAdmin, async (req, res) => {
  const allProducts = await Product.countDocuments({});
  const allPremiumProducts = await Product.find({
    isPremium: false,
  }).countDocuments({});

  let today = new Date().toDateString();

  const todayPost = await Product.find({
    createdAt: { $gte: today },
  }).countDocuments({});

  const allBlogs = await Blogs.countDocuments({});
  const allUsers = await User.countDocuments({});

  const allCredits = await User.aggregate([
    { $group: { _id: null, totalCredits: { $sum: "$credit" } } },
  ]);

  const allTodayTrans = await Transactions.find({
    createdAt: { $gte: today },
  }).countDocuments({});

  let todays = new Date();
  todays.setHours(0, 0, 0, 0);
  const todayTransAmount = await Transactions.aggregate([
    { $match: { createdAt: { $gte: todays } } },
    { $group: { _id: null, totalCredits: { $sum: "$amount" } } },
  ]);

  const totalTransctionCredits = await Transactions.aggregate([
    { $group: { _id: null, totalCredits: { $sum: "$amount" } } },
  ]);

  const data = {
    allPost: allProducts,
    premiumPost: allPremiumProducts,
    today: todayPost,
    allBlogs: allBlogs,
    allCredits: allCredits[0].totalCredits,
    allUsers: allUsers,
    allTodayTrans: allTodayTrans,
    todayTransAmount: todayTransAmount[0]?.totalCredits
      ? todayTransAmount[0]?.totalCredits
      : 0,
    todayTransAmount: todayTransAmount[0]?.totalCredits
      ? todayTransAmount[0]?.totalCredits
      : 0,
    totalTransctions: totalTransctionCredits[0]?.totalCredits
      ? totalTransctionCredits[0]?.totalCredits
      : 0,
  };

  res.send(data);
});

module.exports = router;
