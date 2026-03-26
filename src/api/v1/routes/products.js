const router = require("express").Router();

const verifyAdmin = require("../middleware/adminCheck");
const verifyToken = require("../middleware/checkLogin");
const {
  addProduct,
  getProducts,
  searchProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  updatePremium,
  getPosterPost,
  getAdminPost,
  getPosts,
  updateApprove,
  updateManyById,
  getAllPost,
  getAdminPosterPost,
  getPostsSitemap,
  getPostsSitemapSecond,
  getPostsSitemapThird,
  getPostsSitemapFourth,
} = require("../product/controller");
const { updateApproveMany, deleteMany } = require("../product/service");

router.post("/", addProduct);

router.patch("/:id", updateProduct);
router.get("/posterid/:id", getPosterPost);
router.get("/admin", verifyAdmin, getAdminPost);

router.get("/sitemap", getPostsSitemap);
router.get("/sitemap2", getPostsSitemapSecond);
router.get("/sitemap3", getPostsSitemapThird);
router.get("/sitemap4", getPostsSitemapFourth);

router.patch("/approved/:id", verifyAdmin, updateApprove);

router.post("/many", updateApproveMany);

router.post("/deleteMany", deleteMany);

router.get("/", getPosts);

router.get("/all", getAllPost);

router.delete("/:id", deleteProduct);

router.get("/search", searchProduct);

router.get("/:id", getProduct);
router.get("/admin-user/:id", getAdminPosterPost);

module.exports = router;
