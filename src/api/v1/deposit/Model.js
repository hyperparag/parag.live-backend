const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const depositSchema = Schema(
  {
    userName: { type: String },
    provider: { type: String },
    userId: { type: String },
    email: { type: String },
    amount: { type: String },
    trxid: { type: String },
    // Referral code entered with a manual deposit. The referrer is paid 50% of
    // the amount when an admin confirms the deposit.
    referralCode: { type: String, trim: true, uppercase: true },
    status: { type: String, default: "pending" },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("deposit", depositSchema);
