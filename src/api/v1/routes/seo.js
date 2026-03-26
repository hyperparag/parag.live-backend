const express = require("express");
const {
  getToday,
  getYesterDay,
  getLast3Days,
  getLast7Days,
  getLast15Days,
  getThisMonths,
  getLastMonths,
} = require("../seo/service");
const router = express.Router();

router.get("/today", getToday);
router.get("/yesterday", getYesterDay);
router.get("/last-3-days", getLast3Days);
router.get("/last-7-days", getLast7Days);
router.get("/last-15-days", getLast15Days);
router.get("/this-month", getThisMonths);
router.get("/last-month", getLastMonths);

module.exports = router;
