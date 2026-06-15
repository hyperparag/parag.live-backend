const { Schema, model } = require("mongoose");
const mongoose = require('mongoose');

const verificationSchema = Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    images: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    note: { type: String, trim: true },
    reviewedAt: { type: Date },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = model("verification", verificationSchema);
