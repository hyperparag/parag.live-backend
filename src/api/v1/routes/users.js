const express = require("express");
const {
  addUser,
  getUser,
  getUsers,
  updateUser,
  deleteUser,
  updateUserAddress,
  updatePassword,
  updateCredit,
  giveBonus,
  saveUserController,
} = require("../users/controller");
const {
  addUserService,
  getUsersService,
  signinUsers,
  increaseUserCredit,
  saveUser,
} = require("../users/services");
const { convertReferralEarnings } = require("../utils/referral");
const verifyToken = require("../middleware/checkLogin");
const verifyAdmin = require("../middleware/adminCheck");

const router = express.Router();

// A user may change only their own record; admins may change anyone's. This
// PATCH used to be open, so any visitor could rewrite another user's name,
// email or avatar.
const selfOrAdmin = (req, res, next) => {
  const d = req.decoded || {};
  if (d.role === "admin" || d.role === "superAdmin") return next();
  if (String(d._id) === String(req.params.id)) return next();
  return res.status(403).json({ message: "Forbidden" });
};

router.post("/", addUserService);
router.post("/login", signinUsers);
router.post("/save", saveUser);
// Turn referral earnings into posting credit (amount optional = all of it).
router.post("/referral/convert", verifyToken, async (req, res) => {
  try {
    const result = await convertReferralEarnings({
      userId: req.decoded?._id,
      amount: req.body?.amount,
    });
    res.status(result.code).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, code: 500, message: "Error. Try again" });
  }
});
// Admin: send a bonus ("earn" or "credit") to a list of selected users.
router.post("/bonus", verifyAdmin, giveBonus);
router.get("/", verifyAdmin, getUsersService);

router.get("/:id", getUser);
router.patch("/:id", verifyToken, selfOrAdmin, updateUser);
// Adding credit by hand is an admin action; it was open to anyone.
router.patch("/add-credit/:id", verifyAdmin, updateCredit);
router.patch("/address/:id", updateUserAddress);
router.patch("/password/:id", verifyToken, updatePassword);
router.delete("/:id", verifyAdmin, deleteUser);

module.exports = router;
