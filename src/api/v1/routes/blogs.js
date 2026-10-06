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
  repostBlog,
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
router.get("/admin", verifyAdmin, getBlogAdmin);
router.get("/single", singleBlog);
router.get("/:id", singleBlogById);
router.post("/repost/:id", verifyAdmin, repostBlog);
router.patch("/:id", verifyAdmin, updateBlogs);
router.delete("/:id", verifyAdmin, deleteBlog);
router.post("/deleteMany", verifyAdmin, deleteMany);
router.post("/updatedMany", verifyAdmin, updatePauseMany);
router.post("/updatedpublishMany", verifyAdmin, updatePablishMany);

module.exports = router;
