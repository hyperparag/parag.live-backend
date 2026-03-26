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
  },
  { timestamps: true }
);
module.exports = model("transaction", transactionSchema);

