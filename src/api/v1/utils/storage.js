/**
 * Image storage.
 *
 * New uploads go to Cloudflare R2 when it is configured (R2_* variables), and
 * fall back to ImageKit otherwise, so the switch can be made by setting
 * environment variables with no code change.
 *
 * R2 speaks the S3 API, so this uses the AWS SDK that is already a dependency.
 *
 * Every upload returns { url, fileId, size, name }. For R2 the fileId is the
 * object key; ImageKit ids never start with the R2 key prefix, which is how
 * deletion tells the two apart for images uploaded before the switch.
 */
const crypto = require("crypto");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const KEY_PREFIX = "uploads/";

let r2 = null;

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function isR2Configured() {
  return Boolean(r2Config());
}

function getR2() {
  const cfg = r2Config();
  if (!cfg) throw new Error("R2 is not configured.");
  if (!r2) {
    r2 = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }
  return { client: r2, cfg };
}

function safeName(originalName = "image") {
  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = originalName
    .replace(path.extname(originalName), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "image"}${ext}`;
}

/**
 * Store one image. `buffer` is the file content.
 * @returns {Promise<{url: string, fileId: string, size: number, name: string}>}
 */
async function uploadImage({ buffer, fileName, mimeType }) {
  if (isR2Configured()) {
    const { client, cfg } = getR2();
    const name = safeName(fileName);
    const key = `${KEY_PREFIX}${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${name}`;

    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType || "application/octet-stream",
        // Keys are unique, so a stored image never changes.
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return { url: `${cfg.publicUrl}/${key}`, fileId: key, size: buffer.length, name };
  }

  // Fallback: ImageKit (kept until R2 is configured).
  const { getImagekit } = require("./imagekit");
  const response = await getImagekit().upload({
    file: buffer,
    fileName: `${safeName(fileName).replace(/\.[^.]+$/, "")}-${Date.now()}`,
    mimeType,
  });
  return {
    url: response.url,
    fileId: response.fileId,
    size: response.size,
    name: response.name,
  };
}

const isR2Key = (id) => typeof id === "string" && id.startsWith(KEY_PREFIX);

/** True when this URL is an image we stored in R2. */
function isR2Url(url) {
  const cfg = r2Config();
  return Boolean(cfg && typeof url === "string" && url.startsWith(cfg.publicUrl + "/"));
}

/** The R2 object key for one of our R2 URLs, or null. */
function r2KeyFromUrl(url) {
  const cfg = r2Config();
  if (!cfg || !isR2Url(url)) return null;
  try {
    return decodeURIComponent(url.slice(cfg.publicUrl.length + 1).split("?")[0]);
  } catch (error) {
    return null;
  }
}

/** Delete an R2 object by key. Deleting a missing key succeeds in S3/R2. */
async function deleteR2Object(key) {
  const { client, cfg } = getR2();
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}

module.exports = {
  KEY_PREFIX,
  isR2Configured,
  isR2Key,
  isR2Url,
  r2KeyFromUrl,
  uploadImage,
  deleteR2Object,
};
