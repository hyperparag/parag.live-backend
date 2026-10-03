const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const adsSchema = Schema({
  title : { type: String},
  category : { type: String},
  image : { type: String},
  // ImageKit file id for the banner, so deleting an ad can release the asset.
  imageFileId : { type: String},
  link : { type: String},
  // Lets an admin hide a side ad without deleting it.
  isActive : { type: Boolean, default: true },
  isDelete : { type : Boolean , default: false }
},
{ timestamps: true }
);

adsSchema.index({ category: 1, isDelete: 1, createdAt: -1 });

module.exports = model('ads', adsSchema);
