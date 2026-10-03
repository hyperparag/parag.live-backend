/**
 * Content moderation: duplicate detection, banned words and suspicious links.
 *
 * Ads that trip any of these are held in the pending queue (isApproved: false)
 * for an admin to review rather than being published automatically.
 */
const crypto = require("crypto");
const { Product } = require("../models");

/** How far back to look for a near-duplicate by title from the same poster. */
const DUPLICATE_WINDOW_DAYS = 30;

/**
 * Words and phrases that put a post in review. Kept as one exported array so
 * the list can be grown in a single place.
 */
const BANNED_WORDS = [
  // Age / minors — the highest-priority category for a classifieds site.
  "underage", "under age", "minor", "teen", "teens", "preteen", "lolita",
  "schoolgirl", "school girl", "jailbait", "barely legal", "young girl",
  // Coercion / trafficking signals.
  "trafficking", "forced", "no choice", "smuggle",
  // Illegal drugs.
  "cocaine", "heroin", "meth", "crystal meth", "mdma", "fentanyl", "ketamine",
  // Weapons.
  "handgun", "ar 15", "silencer", "untraceable gun",
  // Unprotected-service red flags commonly used to evade filters.
  "bareback", "bbfs", "no condom", "raw only",
  // Fraud.
  "stolen card", "cc dump", "fullz", "cashapp flip", "money flip",
];

/**
 * Links that should not auto-publish: shorteners (they hide the destination),
 * off-platform contact funnels, and paid-content redirects.
 */
const SUSPICIOUS_LINK_PATTERNS = [
  /\b(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co|is\.gd|cutt\.ly|rb\.gy|shorturl\.at|rebrand\.ly|ow\.ly|buff\.ly)\b/i,
  /\b(?:t\.me|telegram\.(?:me|org)|wa\.me|whatsapp\.com|chat\.whatsapp\.com)\b/i,
  /\b(?:onlyfans\.com|fansly\.com|chaturbate\.com|cash\.app|venmo\.com)\b/i,
  // IP-literal URLs and non-standard ports are almost never legitimate here.
  /https?:\/\/\d{1,3}(?:\.\d{1,3}){3}/i,
  /https?:\/\/[^\s/]+:\d{2,5}\//i,
];

/**
 * Strip HTML, lowercase, drop punctuation and collapse whitespace, so that
 * cosmetic edits (a bold tag, an extra space, different capitalisation) do not
 * disguise a repost as a new ad.
 */
function normalizeText(input) {
  if (!input) return "";
  return String(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable fingerprint of an ad's substance (title + description). */
function contentHash(body = {}) {
  const basis = normalizeText(body.name) + "|" + normalizeText(body.description);
  return crypto.createHash("sha1").update(basis).digest("hex");
}

/**
 * Check an ad against the banned-word list and the link rules.
 *
 * normalizeText() reduces the text to lowercase words separated by single
 * spaces, so padding both sides with a space turns a plain substring test into
 * an exact word-boundary test: " canteen job " does not contain " teen ".
 */
function screenContent(body = {}) {
  const haystack = " " + normalizeText((body.name ?? "") + " " + (body.description ?? "")) + " ";

  for (const word of BANNED_WORDS) {
    const needle = normalizeText(word);
    if (!needle) continue;
    if (haystack.includes(" " + needle + " ")) {
      return { flagged: true, reason: "banned-word", match: word };
    }
  }

  // Links must be checked against the raw text; normalizeText removes the dots.
  const rawLinks = (body.description ?? "") + " " + (body.link ?? "");
  for (const pattern of SUSPICIOUS_LINK_PATTERNS) {
    const found = rawLinks.match(pattern);
    if (found) {
      return { flagged: true, reason: "suspicious-link", match: found[0] };
    }
  }

  return { flagged: false, reason: null, match: null };
}

/**
 * Find an existing ad from the same poster that this one duplicates.
 *
 * Two tests: an exact content fingerprint match (any time), or the same
 * normalized title within DUPLICATE_WINDOW_DAYS.
 */
async function findDuplicate({ posterId, hash, name, excludeId } = {}) {
  if (!posterId) return null;

  const base = { posterId, isDelete: false };
  if (excludeId) base._id = { $ne: excludeId };

  if (hash) {
    const byHash = await Product.findOne({ ...base, contentHash: hash })
      .select("_id name createdAt")
      .lean()
      .exec();
    if (byHash) return byHash;
  }

  const normalizedName = normalizeText(name);
  if (!normalizedName) return null;

  const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recent = await Product.find({ ...base, createdAt: { $gte: since } })
    .select("_id name createdAt")
    .lean()
    .exec();

  return recent.find((ad) => normalizeText(ad.name) === normalizedName) ?? null;
}

/**
 * The one decision point for whether a new or edited ad may publish.
 * Returns { isApproved, moderationReason, contentHash }.
 */
async function reviewAd(body = {}, { excludeId = null, skipDuplicateCheck = false } = {}) {
  const hash = contentHash(body);
  const screen = screenContent(body);

  if (screen.flagged) {
    return { isApproved: false, moderationReason: screen.reason, contentHash: hash };
  }

  if (!skipDuplicateCheck) {
    const duplicate = await findDuplicate({
      posterId: body.posterId,
      hash,
      name: body.name,
      excludeId,
    });
    if (duplicate) {
      return { isApproved: false, moderationReason: "duplicate", contentHash: hash };
    }
  }

  return { isApproved: true, moderationReason: null, contentHash: hash };
}

module.exports = {
  BANNED_WORDS,
  SUSPICIOUS_LINK_PATTERNS,
  DUPLICATE_WINDOW_DAYS,
  normalizeText,
  contentHash,
  screenContent,
  findDuplicate,
  reviewAd,
};
