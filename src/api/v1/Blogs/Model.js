const { Schema, model } = require("mongoose");

const blogSchema = Schema(
  {
    title: { type: String, trim: true },
    permalink: { type: String, trim: true },
	  metaKey: { type: String, trim: true },
    metaDesc: { type: String, trim: true },
    category: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    desc : { type: String },
    status : { type: String,  default: "published" },
    image : { type: String },
    // Accessibility / SEO alt text for the cover image.
    altText: { type: String, trim: true, default: "" },
    // null (or past) = visible now. A future date hides the post from every
    // public query until then.
    publishAt: { type: Date, default: null },
    // Reposting moves a post back to the top of the public list.
    repostCount: { type: Number, default: 0 },
    lastRepostAt: { type: Date, default: null },
    writer : { type: String },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);


blogSchema.index({ publishAt: 1 });

module.exports = model("blogs", blogSchema);
