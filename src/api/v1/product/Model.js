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
  // ImageKit file ids, parallel to imgOne..imgFour. Needed to call deleteFile().
  imageFileIds: { type: [String], default: [] },
  // Accessibility / SEO alt text, parallel to imgOne..imgFour.
  altTexts: { type: [String], default: [] },
  // null (or past) = visible now. A future date hides the ad from public queries.
  publishAt: { type: Date, default: null },
  // Normalized hash of title + description, used for duplicate detection.
  contentHash: { type: String },
  // Why the ad was held back: "duplicate" | "banned-word" | "suspicious-link"
  moderationReason: { type: String },
  repostCount: { type: Number, default: 0 },
  lastRepostAt: { type: Date },
  posterId : {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  isDelete : { type : Boolean , default: false },
  isPremium : { type : Boolean },
  boostExpiresAt : { type : Date }
},
{ timestamps: true }
);

// Every listing query was a full collection scan before these.
productSchema.index({ subCategory: 1, isApproved: 1, isDelete: 1, createdAt: -1 });
productSchema.index({ cities: 1, isApproved: 1, isDelete: 1, createdAt: -1 });
productSchema.index({ posterId: 1, createdAt: -1 });
productSchema.index({ publishAt: 1 });
productSchema.index({ contentHash: 1 });

module.exports = model('product', productSchema);
