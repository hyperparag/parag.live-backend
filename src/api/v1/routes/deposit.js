const express = require("express");
const {
  addDeposit,
  getDeposits,
  updateStatus,
  getDeposits2,
  deleteDeposit,
  deleteManyDeposits,
} = require("../deposit/controller");
const verifyAdmin = require("../middleware/adminCheck");
const verifyToken = require("../middleware/checkLogin");

const router = express.Router();

// Submitting a deposit needs a signed-in user: the user id is taken from the
// token rather than trusted from the body.
router.post("/", verifyToken, addDeposit);
router.get("/", verifyAdmin, getDeposits);

// A user may read only their own deposits (admins may read anyone's).
router.get(
  "/get/:id",
  verifyToken,
  (req, res, next) => {
    const d = req.decoded || {};
    if (d.role === "admin" || d.role === "superAdmin") return next();
    if (String(d._id) === String(req.params.id)) return next();
    return res.status(403).json({ message: "Forbidden" });
  },
  getDeposits2
);

// Must stay above "/:id".
router.post("/delete-many", verifyAdmin, deleteManyDeposits);
router.patch("/:id", verifyAdmin, updateStatus);
router.delete("/:id", verifyAdmin, deleteDeposit);

module.exports = router;
