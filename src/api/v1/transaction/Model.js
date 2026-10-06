const { Schema, model } = require("mongoose");
const mongoose = require('mongoose');

const transactionSchema = Schema(
  {
    isCompleted: { type: String },
    date: { type: String },
    invoice: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    exactAmount: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDelete: { type: Boolean, default: false },
    // What moved the money. Before this, only recharges were ever recorded --
    // ad spends and boosts left no ledger entry at all.
    kind: {
      type: String,
      enum: [
        "recharge",
        "ad-spend",
        "repost",
        "referral-bonus",
        "referral-convert",
        // Money the admin hands out: "earn-bonus" lands in the user's earnings
        // (convertible to credit), "admin-credit" is posting credit directly.
        "earn-bonus",
        "admin-credit",
      ],
      default: "recharge",
    },
    // Ad id for a spend/repost, or the referred buyer for a referral bonus.
    reference: { type: String, trim: true },
    // Free-text reason, shown to the user (e.g. the note on an admin bonus).
    note: { type: String, trim: true },
    // Payment-provider event id. Unique, so a replayed webhook cannot pay twice.
    eventId: { type: String, trim: true },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ eventId: 1 }, { unique: true, sparse: true });

module.exports = model("transaction", transactionSchema);
