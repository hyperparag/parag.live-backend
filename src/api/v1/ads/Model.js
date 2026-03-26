const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const adsSchema = Schema({
  title : { type: String},
  category : { type: String},
  image : { type: String},
  link : { type: String},
  isDelete : { type : Boolean , default: false }
},
{ timestamps: true }
);

module.exports = model('ads', adsSchema);