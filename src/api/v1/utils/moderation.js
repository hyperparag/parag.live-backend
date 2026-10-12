/**
 * Content moderation: duplicates, banned words, suspicious links and the spam
 * patterns that get a domain penalised by search engines.
 *
 * Ads that trip any of these are held in the pending queue (isApproved: false)
 * for an admin to approve or delete, rather than being blocked outright.
 *
 * The thresholds below are quoted to users on /posting-rules and in the post
 * form (skipthegames), so change them there too.
 */
const crypto = require("crypto");
const { Product } = require("../models");
const { hasUnsafeHtml } = require("./sanitizeHtml");

/** How far back to look for a near-duplicate by title from the same poster. */
const DUPLICATE_WINDOW_DAYS = 30;

/** Fewer words than this is thin content: no value to readers or to Google. */
const MIN_DESCRIPTION_WORDS = 20;

/** More distinct links than this in one ad reads as link spam. */
const MAX_LINKS = 2;

/** New ads per poster per 24 hours before the rest go to review. */
const MAX_ADS_PER_DAY = 5;

/**
 * Keyword stuffing: one word making up more than STUFFING_SHARE of the
 * description and used at least STUFFING_MIN_REPEATS times, or the same word
 * three times in a title.
 */
const STUFFING_SHARE = 0.1;
const STUFFING_MIN_REPEATS = 6;
const TITLE_MAX_REPEATS = 2;

// Too common to count as stuffing however often they appear.
const STOPWORDS = new Set([
  "the", "and", "you", "your", "for", "with", "are", "this", "that", "have",
  "will", "can", "not", "all", "our", "from", "but", "get", "who", "any",
  "out", "now", "just", "more", "one", "has", "was", "her", "his", "she",
  "him", "they", "them", "its", "into", "also", "very", "only", "about",
  "what", "when", "where", "how", "here", "there", "than", "then", "some",
]);

/** What each reason means, for the poster's message and the admin panel. */
const REASON_LABELS = {
  "banned-word": "contains wording that is not allowed",
  "suspicious-link": "contains a link type that is not allowed",
  duplicate: "repeats an ad you already posted",
  "cross-account-duplicate": "repeats an ad posted from another account",
  "thin-content": `description is shorter than ${MIN_DESCRIPTION_WORDS} words`,
  "too-many-links": `contains more than ${MAX_LINKS} links`,
  "keyword-stuffing": "repeats the same keyword too many times",
  "unsafe-html": "contains code or hidden markup",
  "posting-limit": `more than ${MAX_ADS_PER_DAY} ads posted in 24 hours`,
};

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

const wordsOf = (text) => normalizeText(text).split(" ").filter(Boolean);

/** Distinct links in the description and link field, ignoring http/www/case. */
function countLinks(body = {}) {
  const raw = (body.description ?? "") + " " + (body.link ?? "");
  const found = raw.match(/(?:https?:\/\/|www\.)[^\s"'<>]+/gi) || [];
  const distinct = new Set(
    found.map((url) =>
      url
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/+$/, "")
    )
  );
  return distinct.size;
}

/** The word repeated past the stuffing limits, or null. */
function findStuffedKeyword(body = {}) {
  const tally = (words) => {
    const counts = new Map();
    for (const word of words) {
      if (word.length < 3 || STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }
    return counts;
  };

  for (const [word, n] of tally(wordsOf(body.name))) {
    if (n > TITLE_MAX_REPEATS) return word;
  }

  const words = wordsOf(body.description);
  for (const [word, n] of tally(words)) {
    if (n >= STUFFING_MIN_REPEATS && n / words.length > STUFFING_SHARE) return word;
  }
  return null;
}

/**
 * The same title + description already live under a different account. One
 * person running several accounts to repeat an ad is the classic spam pattern
 * the per-poster check cannot see.
 */
async function findCrossAccountDuplicate({ posterId, hash, excludeId } = {}) {
  if (!hash) return null;
  const query = { contentHash: hash, isDelete: false };
  if (posterId) query.posterId = { $ne: posterId };
  if (excludeId) query._id = { $ne: excludeId };
  return Product.findOne(query).select("_id").lean().exec();
}

/**
 * Whether this poster already created MAX_ADS_PER_DAY ads in the last 24
 * hours. A repost moves createdAt forward, so ads bumped inside the window
 * (lastRepostAt in range) are left out: a paid bump is not a new ad.
 */
async function exceedsDailyLimit(posterId) {
  if (!posterId) return false;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await Product.countDocuments({
    posterId,
    createdAt: { $gte: since },
    lastRepostAt: { $not: { $gte: since } },
  });
  return recent >= MAX_ADS_PER_DAY;
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
 *
 * Every check runs, so the admin (and the poster) see all the reasons at once
 * instead of fixing one and tripping the next. Pass the description before it
 * is sanitized, or hand-crafted markup cannot be detected.
 *
 * skipQualityChecks leaves out the thin-content, link-count and stuffing
 * rules. Reposts use it: those ads were already live, and holding them back
 * under rules added after they were approved would charge for a bump that
 * never shows.
 *
 * Returns { isApproved, moderationReason, reasons, contentHash }, where
 * moderationReason is the reasons joined with commas.
 */
async function reviewAd(
  body = {},
  {
    excludeId = null,
    skipDuplicateCheck = false,
    skipQualityChecks = false,
    checkPostingRate = false,
  } = {}
) {
  const hash = contentHash(body);
  const reasons = [];

  const screen = screenContent(body);
  if (screen.flagged) reasons.push(screen.reason);
  if (hasUnsafeHtml(body.description) || hasUnsafeHtml(body.name)) {
    reasons.push("unsafe-html");
  }

  if (!skipQualityChecks) {
    if (wordsOf(body.description).length < MIN_DESCRIPTION_WORDS) {
      reasons.push("thin-content");
    }
    if (countLinks(body) > MAX_LINKS) reasons.push("too-many-links");
    if (findStuffedKeyword(body)) reasons.push("keyword-stuffing");
  }

  if (!skipDuplicateCheck) {
    const duplicate = await findDuplicate({
      posterId: body.posterId,
      hash,
      name: body.name,
      excludeId,
    });
    if (duplicate) {
      reasons.push("duplicate");
    } else if (
      await findCrossAccountDuplicate({ posterId: body.posterId, hash, excludeId })
    ) {
      reasons.push("cross-account-duplicate");
    }
  }

  if (checkPostingRate && (await exceedsDailyLimit(body.posterId))) {
    reasons.push("posting-limit");
  }

  return {
    isApproved: reasons.length === 0,
    moderationReason: reasons.length ? reasons.join(",") : null,
    reasons,
    contentHash: hash,
  };
}

/** One sentence for the poster saying why their ad is waiting for review. */
function describeReasons(reasons = []) {
  const parts = reasons.map((r) => REASON_LABELS[r]).filter(Boolean);
  return parts.length ? `Your ad ${parts.join("; ")}.` : "";
}

module.exports = {
  BANNED_WORDS,
  SUSPICIOUS_LINK_PATTERNS,
  DUPLICATE_WINDOW_DAYS,
  MIN_DESCRIPTION_WORDS,
  MAX_LINKS,
  MAX_ADS_PER_DAY,
  REASON_LABELS,
  normalizeText,
  contentHash,
  screenContent,
  countLinks,
  findStuffedKeyword,
  findDuplicate,
  findCrossAccountDuplicate,
  reviewAd,
  describeReasons,
};
