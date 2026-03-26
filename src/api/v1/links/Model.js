const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const countrySchema = Schema(
  {
    shemale: { type: String },
    meet: { type: String },
    live: { type: String },
    header: { type: String },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('links', countrySchema);