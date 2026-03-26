const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const responsiveAds = Schema(
  {
    image: { type: String },
    link: { type: String },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("responsive", responsiveAds);
