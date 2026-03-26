const { Schema, model } = require("mongoose");
const mongoose = require('mongoose');

const reportsSchema = Schema(
  {
    subject : { type: String, trim: true },
    isRead : { type : Boolean },
    reportDesc : { type: String, trim: true },
    posterId : {type: mongoose.Schema.Types.ObjectId},
    postId : {type: mongoose.Schema.Types.ObjectId},
    reporterId : {type: mongoose.Schema.Types.ObjectId},
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = model("reports", reportsSchema);
