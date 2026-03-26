const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const countrySchema = Schema({
  name: { type: String},
  parentId: {
    type: String,
    default: undefined,
  },
  isDelete : { type : Boolean , default: false }
},
{ timestamps: true }
);

module.exports = model('country', countrySchema);
