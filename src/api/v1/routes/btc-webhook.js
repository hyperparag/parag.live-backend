const express = require("express");
const { Transactions } = require("../models");
const { increaseUserCredit } = require("../users/services");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    console.log("Webhook Event Received:", body);

    if (body.type !== "InvoiceSettled") {
      return res.status(200).json({ message: "Ignored non-settled invoice" });
    }

    const invoiceId = body.invoiceId;
    const userId = body.metadata?.user_id;
    const amountPaid = parseFloat(body.amountPaid);

    if (!userId || !amountPaid) {
      return res.status(400).json({ error: "Missing userId or amountPaid" });
    }

    // Store transaction record
    const transaction = new Transactions({
      exactAmount: amountPaid,
      amount: amountPaid, // Adjust this if conversion logic is needed
      date: new Date().toISOString(),
      invoice: invoiceId,
      isCompleted: "Done",
      userId,
      isDelete: false,
    });

    await transaction.save();

    // Update user credit
    await increaseUserCredit(userId, amountPaid);

    console.log(`User ${userId} credited with ${amountPaid} BTC`);
    return res.status(200).json({ message: "User credited successfully" });
  } catch (error) {
    console.error("Webhook Processing Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
