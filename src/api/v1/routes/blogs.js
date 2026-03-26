const express = require("express");
const {
  addBlog,
  getBlog,
  updateBlogs,
  deleteBlog,
  singleBlog,
  getBlogAdmin,
  singleBlogById,
  getSitemap,
} = require("../Blogs/controllers");
const {
  deleteMany,
  updatePauseMany,
  updatePablishMany,
} = require("../Blogs/services");
const verifyAdmin = require("../middleware/adminCheck");
const router = express.Router();

router.post("/", verifyAdmin, addBlog);
router.get("/", getBlog);
router.get("/sitemap", getSitemap);
router.get("/admin", getBlogAdmin);
router.get("/single", singleBlog);
router.get("/:id", singleBlogById);
router.patch("/:id", verifyAdmin, updateBlogs);
router.delete("/:id", verifyAdmin, deleteBlog);
router.post("/deleteMany", deleteMany);
router.post("/updatedMany", updatePauseMany);
router.post("/updatedpublishMany", updatePablishMany);

module.exports = router;
