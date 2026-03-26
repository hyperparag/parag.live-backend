const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const productSchema = Schema({
  name: { type: String, trim: true },
  phone: { type: String, trim: true  },
  email: { type: String, trim: true },
  category : { type: String },
  premiumDay : {type : Number},
  subCategory : { type: String },
  description: { type: String },
  city: { type: String },
  link : {type : String},
  age: { type: String },
  cities: { type: Array },
  isApproved : { type : Boolean , default: false },
  imgOne: {type : String},
  imgTwo: {type : String},
  imgThree: {type : String},
  imgFour: {type : String},
  posterId : {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  isDelete : { type : Boolean , default: false },
  isPremium : { type : Boolean }
},
{ timestamps: true }
);

module.exports = model('product', productSchema);
