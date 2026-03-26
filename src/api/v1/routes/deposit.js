const express = require("express");
const {
  addDeposit,
  getDeposits,
  updateStatus,
  getDeposits2,
} = require("../deposit/controller");

const router = express.Router();

router.post("/", addDeposit);
router.get("/", getDeposits);

router.get("/get/:id", getDeposits2);

router.patch("/:id", updateStatus);

module.exports = router;
