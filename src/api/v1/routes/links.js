const express = require("express");
const { addLink, updateLink, getLink } = require("../links/controller");
const { getLinks } = require("../links/service");

const verifyAdmin = require("../middleware/adminCheck");

const router = express.Router();

router.post("/", verifyAdmin, addLink);
router.get("/", getLinks);
router.get("/header", getLink);
router.patch("/:id", verifyAdmin , updateLink);

// router.post("/login", signinUsers);
// router.get("/", verifyToken,  getUsersService);
// router.get("/:id", getUser);
// router.patch("/:id", updateUser);

module.exports = router;