const { Schema, model } = require("mongoose");
const mongoose = require('mongoose');

const reportsSchema = Schema(
  {
    subject : { type: String, trim: true },
    // Defaulted to false so existing and new rows sort consistently; without a
    // default this was undefined, which sorted ahead of both true and false.
    isRead : { type : Boolean, default: false },
    reportDesc : { type: String, trim: true },
    posterId : {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    postId : {type: mongoose.Schema.Types.ObjectId, ref: "product"},
    reporterId : {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reportsSchema.index({ isRead: 1, createdAt: -1 });

module.exports = model("reports", reportsSchema);
