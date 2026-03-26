const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const rainbowAds = Schema(
  {
    text: { type: String },
    link: { type: String },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("rainbow", rainbowAds);
