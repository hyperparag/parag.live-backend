const { Product, Ads, Blogs } = require("../models");

const router = require("express").Router();

router.get("/", async (req, res) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  try {
    // Decrement premiumDay and expire isPremium for products
    const premiumProducts = await Product.find({
      isDelete: false,
      premiumDay: { $gt: 0 },
    });

    await Promise.all(
      premiumProducts.map(async (product) => {
        product.premiumDay = product.premiumDay - 24;
        if (product.premiumDay <= 0) {
          product.premiumDay = 0;
          product.isPremium = false;
        }
        await product.save();
      }),
    );

    // Hard-delete ads and blog posts older than 1 year
    await Ads.deleteMany({ createdAt: { $lte: oneYearAgo } });
    await Blogs.deleteMany({ createdAt: { $lte: oneYearAgo } });

    res.send("success");
  } catch (err) {
    res.status(500).send("cron error: " + err.message);
  }
});

module.exports = router;
