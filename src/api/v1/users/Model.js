const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const userSchema = Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowerCase: true },
    phone: { type: String, trim: true },
    password: {
      type: String,
    },
    month: { type: String },
    avater: { type: String, default: "avater" },
    role: { type: String, default: "user" },
    address: {
      country: { type: String, default: undefined },
      regionName: { type: String, default: undefined },
      zipCode: { type: String, default: undefined },
      city: { type: String, default: undefined },
    },
    isDelete: { type: Boolean, default: false },
    credit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);
