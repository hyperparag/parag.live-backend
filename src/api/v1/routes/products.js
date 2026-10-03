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
  getRelatedProducts,
  repostProduct,
  getRepostQuote,
} = require("../product/controller");
const { updateApproveMany, deleteMany } = require("../product/service");

// Posting and editing now require a signed-in user: addProductService takes
// posterId from the token so an ad cannot be created on someone else's behalf.
router.post("/", verifyToken, addProduct);

router.patch("/:id", verifyToken, updateProduct);

// Repost: quote first so the UI can confirm the fee, then charge.
router.get("/repost-quote/:id", verifyToken, getRepostQuote);
router.post("/repost/:id", verifyToken, repostProduct);

// Paged, circular related ads for the "See More" button.
router.get("/:id/related", getRelatedProducts);
router.get("/posterid/:id", getPosterPost);
router.get("/admin", verifyAdmin, getAdminPost);

router.get("/sitemap", getPostsSitemap);
router.get("/sitemap2", getPostsSitemapSecond);
router.get("/sitemap3", getPostsSitemapThird);
router.get("/sitemap4", getPostsSitemapFourth);

router.patch("/approved/:id", verifyAdmin, updateApprove);

router.post("/many", verifyAdmin, updateApproveMany);

router.post("/deleteMany", verifyAdmin, deleteMany);

router.get("/", getPosts);

router.get("/all", getAllPost);

router.delete("/:id", verifyToken, deleteProduct);

router.get("/search", searchProduct);

router.get("/:id", getProduct);
router.get("/admin-user/:id", getAdminPosterPost);

module.exports = router;
