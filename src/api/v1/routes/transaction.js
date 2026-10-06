const express = require("express");
const {
  addTransaction,
  deleteTransaction,
  getTransaction,
  getMyTransactions,
  updateTransactions,
} = require("../transaction/controllers");
const verifyAdmin = require("../middleware/adminCheck");
const verifyToken = require("../middleware/checkLogin");
const router = express.Router();

// Ledger entries are written by the server (purchases, spends, referrals) and by
// admins. This POST was open, which let anyone fabricate history.
router.post("/", verifyAdmin, addTransaction);
router.get("/", verifyAdmin, getTransaction);
// Must stay above "/:id".
router.get("/mine", verifyToken, getMyTransactions);
router.patch("/:id", verifyAdmin, updateTransactions);
router.delete("/:id", verifyAdmin, deleteTransaction);

module.exports = router;
