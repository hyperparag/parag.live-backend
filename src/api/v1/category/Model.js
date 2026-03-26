const { Schema, model } = require("mongoose");

const categorySchema = Schema(
  {
    name: { type: String, trim: true },
    createdBy: String,
    isDelete: { type: Boolean, default: false },
    parentId: {
      type: String,
      default: undefined,
    },
  },
  { timestamps: true }
);
module.exports = model("postCategory", categorySchema);
