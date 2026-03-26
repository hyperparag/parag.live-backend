const express = require("express");
const {
  addTransaction,
  deleteTransaction,
  getTransaction,
  updateTransactions,
  getTransactionUser,
} = require("../transaction/controllers");
const verifyAdmin = require("../middleware/adminCheck");
const { getTransactionsService } = require("../transaction/services");
const router = express.Router();

router.post("/", addTransaction);
router.get("/", getTransaction);
router.get("/user", getTransactionUser);
router.get("/:id" , getTransactionsService);
router.patch("/:id", verifyAdmin , updateTransactions);
router.delete("/:id", verifyAdmin , deleteTransaction);


module.exports = router;
