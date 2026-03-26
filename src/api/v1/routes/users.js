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
const verifyToken = require("../middleware/checkLogin");
const verifyAdmin = require("../middleware/adminCheck");

const router = express.Router();

router.post("/", addUserService);
router.post("/login", signinUsers);
router.post("/save", saveUser);
router.get("/", verifyToken, getUsersService);

router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.patch("/add-credit/:id", updateCredit);
router.patch("/address/:id", updateUserAddress);
router.patch("/password/:id", verifyToken, updatePassword);
router.delete("/:id", verifyAdmin, deleteUser);

module.exports = router;
