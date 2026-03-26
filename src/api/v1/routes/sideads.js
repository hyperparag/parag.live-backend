const express = require("express");
const { addAd, updateAd, deleteAd } = require("../ads/controller");
const { getAds, deleteMany, getAdsbyCategory } = require("../ads/service");
const verifyAdmin = require("../middleware/adminCheck");
const router = express.Router();



router.post("/", verifyAdmin, addAd);
router.get("/"  , getAds);
router.get("/category"  , getAdsbyCategory);
router.patch("/:id", verifyAdmin, updateAd);
router.delete("/:id",  deleteAd);
router.post("/deleteMany",  deleteMany);

module.exports = router;
