const cron = require("node-cron");
const { Product } = require("../models");

const router = require("express").Router();

router.get("/", async (req, res) => {
  const updateDataStatus = async () => {
    const validate = await Product.find({
      $and: [
        { isDelete: false },
        { premiumDay: { $gt: 0 } },
        { $project: { name: 1, premiumDay: 1, isPremium: 1 } },
      ],
    });

    const minus = validate.map(async (a) => {
      a.premiumDay = a.premiumDay - 24;
      if (a.premiumDay == 0) {
        a.isPremium = true;
      }
      await a.save();
    });

    res.send("success");
  };
  await updateDataStatus();
});

module.exports = router;
