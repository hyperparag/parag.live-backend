const express = require("express");
const { addAd, updateAd, deleteAd } = require("../ads/controller");
const { getAds, deleteMany, getAdsbyCategory } = require("../ads/service");
const verifyAdmin = require("../middleware/adminCheck");
const router = express.Router();

router.post("/", verifyAdmin, addAd);
router.get("/", getAds);
router.get("/category", getAdsbyCategory);
router.patch("/:id", verifyAdmin, updateAd);
// These two were open to anyone; the admin panel now sends its bearer token.
router.delete("/:id", verifyAdmin, deleteAd);
router.post("/deleteMany", verifyAdmin, deleteMany);

module.exports = router;
