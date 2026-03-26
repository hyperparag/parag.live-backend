const express = require("express");
const {
  addCategory,
  getCategories,
  updateCategories,
  deleteCategories,
  getOneCategory
} = require("../category/controllers");

const router = express.Router();

router.post("/", addCategory);
router.get("/", getCategories);
router.get("/:id", getOneCategory);
router.patch("/:id", updateCategories);
router.delete("/:id", deleteCategories);

module.exports = router;
