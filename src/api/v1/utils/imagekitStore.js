/**
 * Removing stored images, wherever they live.
 *
 * Images uploaded after the move to Cloudflare R2 are deleted from R2. Images
 * uploaded earlier are still on ImageKit and are deleted from there, if
 * ImageKit is still configured.
 */
const { isR2Key, r2KeyFromUrl, deleteR2Object } = require("./storage");

function imagekitConfigured() {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT
  );
}

/**
 * Turn an image URL into an id that deleteOne() understands.
 *
 * R2 URLs map straight to their object key. Legacy ImageKit rows stored only
 * the URL, never the fileId, so those are looked up by filename. Returns null
 * when it cannot be resolved — the caller then just drops the database
 * reference rather than failing.
 */
async function resolveFileId(url) {
  if (!url || typeof url !== "string") return null;

  const r2Key = r2KeyFromUrl(url);
  if (r2Key) return r2Key;

  if (!imagekitConfigured()) return null;
  try {
    const { getImagekit } = require("./imagekit");
    const name = decodeURIComponent(url.split("?")[0].split("/").pop() || "");
    if (!name) return null;
    const found = await getImagekit().listFiles({
      searchQuery: `name = "${name.replace(/"/g, '\\"')}"`,
      limit: 1,
    });
    return found?.[0]?.fileId ?? null;
  } catch (error) {
    console.error(`[storage] could not resolve fileId for ${url}:`, error.message);
    return null;
  }
}

async function deleteOne(fileId) {
  if (!fileId) return false;
  try {
    if (isR2Key(fileId)) {
      await deleteR2Object(fileId);
      return true;
    }
    if (!imagekitConfigured()) return false;
    const { getImagekit } = require("./imagekit");
    await getImagekit().deleteFile(fileId);
    return true;
  } catch (error) {
    // A 404 means it is already gone, which is the outcome we wanted anyway.
    console.error(`[storage] delete(${fileId}) failed:`, error.message);
    return false;
  }
}

module.exports = {
  resolveFileId,
  deleteOne,
};
