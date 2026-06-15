const router = require("express").Router();

const verifyAdmin = require("../middleware/adminCheck");
const {
  addVerification,
  getVerifications,
  getUserVerification,
  updateVerification,
} = require("../verification/controllers");

router.post("/", addVerification);
router.get("/user/:userId", getUserVerification);
router.get("/", verifyAdmin, getVerifications);
router.patch("/:id", verifyAdmin, updateVerification);

module.exports = router;
