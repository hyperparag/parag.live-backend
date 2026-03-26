const express = require("express");
const { addLinkRainbow, updateLinkRainbow } = require("../rainbow/controller");
const { getLinksRainbow } = require("../rainbow/service");

const router = express.Router();

router.post("/", addLinkRainbow);
router.get("/", getLinksRainbow);
router.patch("/:id", updateLinkRainbow);

module.exports = router;
