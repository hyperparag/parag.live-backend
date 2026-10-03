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
router.get("/", verifyToken, getUsersService);

router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.patch("/add-credit/:id", updateCredit);
router.patch("/address/:id", updateUserAddress);
router.patch("/password/:id", verifyToken, updatePassword);
router.delete("/:id", verifyAdmin, deleteUser);

module.exports = router;
