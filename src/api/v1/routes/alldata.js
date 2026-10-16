const express = require("express");
const verifyAdmin = require("../middleware/adminCheck");
const { Product, Blogs, User, Transactions } = require("../models");
const router = express.Router();

// Dashboard totals for the admin panel.
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sumOf = (Model, field, match = {}) =>
      Model.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: `$${field}` } } },
      ]).then((r) => r[0]?.total ?? 0);

    const [
      allPost,
      premiumPost,
      today,
      allBlogs,
      allUsers,
      allCredits,
      allTodayTrans,
      todayTransAmount,
      totalTransctions,
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isPremium: true }),
      Product.countDocuments({ createdAt: { $gte: startOfToday } }),
      Blogs.countDocuments({}),
      User.countDocuments({}),
      // Admin accounts can hold Infinity credit, which would make the total
      // Infinity (serialised as null); only sum real balances.
      sumOf(User, "credit", { credit: { $gt: -1e15, $lt: 1e15 } }),
      Transactions.countDocuments({ createdAt: { $gte: startOfToday } }),
      sumOf(Transactions, "amount", { createdAt: { $gte: startOfToday } }),
      sumOf(Transactions, "amount"),
    ]);

    res.send({
      allPost,
      premiumPost,
      today,
      allBlogs,
      allCredits,
      allUsers,
      allTodayTrans,
      todayTransAmount,
      totalTransctions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to load dashboard data" });
  }
});

module.exports = router;