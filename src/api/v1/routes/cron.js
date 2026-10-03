const { Product, Ads, Blogs } = require("../models");
const { resolveFileId, deleteOne } = require("../utils/imagekitStore");

const router = require("express").Router();

/**
 * Only Vercel Cron (or an operator with the secret) may run this. It used to be
 * completely open, so anyone could age every boosted ad by a day on demand.
 * When CRON_SECRET is unset the check is skipped, so existing deployments keep
 * working until the variable is added.
 */
function authorizeCron(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const header = req.headers.authorization || "";
  const provided = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.query.secret;

  if (provided === secret) return true;
  res.status(401).send("unauthorised");
  return false;
}

/** Delete the ImageKit assets attached to docs we are about to remove. */
async function purgeImages(docs) {
  for (const doc of docs) {
    const url = doc.image;
    if (!url || url === "empty" || url === "undefined") continue;
    const fileId = await resolveFileId(url);
    await deleteOne(fileId);
  }
}

router.get("/", async (req, res) => {
  if (!authorizeCron(req, res)) return;

  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  try {
    // Age every boosted ad by one day. This was a find() plus one save() per
    // document, which loads the whole boosted set into memory and will hit the
    // function timeout as the collection grows; two updateMany calls do it in
    // the database instead.
    const expiring = await Product.updateMany(
      { isDelete: false, premiumDay: { $gt: 0, $lte: 24 } },
      { $set: { premiumDay: 0, isPremium: false } }
    );

    const decremented = await Product.updateMany(
      { isDelete: false, premiumDay: { $gt: 24 } },
      { $inc: { premiumDay: -24 } }
    );

    // Keep boostExpiresAt consistent with premiumDay. These were two
    // independent expiry mechanisms that drifted apart.
    const unflagged = await Product.updateMany(
      { isDelete: false, isPremium: true, boostExpiresAt: { $lte: now } },
      { $set: { isPremium: false } }
    );

    // Tidy up schedules that have already come due, so publishAt does not grow
    // into a pile of stale past dates. Visibility is decided at read time, so
    // this is housekeeping only.
    const published = await Product.updateMany(
      { publishAt: { $ne: null, $lte: now } },
      { $set: { publishAt: null } },
      { timestamps: false }
    );

    // Hard-delete ads and blog posts older than 1 year, releasing their images
    // first -- this used to orphan every asset it deleted.
    const staleAds = await Ads.find({ createdAt: { $lte: oneYearAgo } })
      .select("image")
      .lean();
    const staleBlogs = await Blogs.find({ createdAt: { $lte: oneYearAgo } })
      .select("image")
      .lean();

    await purgeImages(staleAds);
    await purgeImages(staleBlogs);

    await Ads.deleteMany({ createdAt: { $lte: oneYearAgo } });
    await Blogs.deleteMany({ createdAt: { $lte: oneYearAgo } });

    res.json({
      status: "success",
      boostsExpired: expiring.modifiedCount ?? 0,
      boostsDecremented: decremented.modifiedCount ?? 0,
      premiumFlagsCleared: unflagged.modifiedCount ?? 0,
      schedulesSettled: published.modifiedCount ?? 0,
      adsDeleted: staleAds.length,
      blogsDeleted: staleBlogs.length,
    });
  } catch (err) {
    console.error("cron error:", err);
    res.status(500).send("cron error: " + err.message);
  }
});

module.exports = router;
