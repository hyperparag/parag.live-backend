const router = require("express").Router();

const verifyAdmin = require("../middleware/adminCheck");
const {
  addVerification,
  getVerifications,
  getUserVerification,
  updateVerification,
  deleteVerification,
  deleteManyVerifications,
} = require("../verification/controllers");

router.post("/", addVerification);
router.get("/user/:userId", getUserVerification);
router.get("/", verifyAdmin, getVerifications);
router.patch("/:id", verifyAdmin, updateVerification);

// Permanent removal, including the submitted ID photos. Registered before
// /:id so the literal path is not captured as an id.
router.post("/deleteMany", verifyAdmin, deleteManyVerifications);
router.delete("/:id", verifyAdmin, deleteVerification);

module.exports = router;
