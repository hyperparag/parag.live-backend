/**
 * The one ImageKit client. There used to be two: an env-configured one in
 * routes/files2.js and a second account with its private key hardcoded in
 * routes/image.js. Two accounts made the storage quota impossible to measure,
 * so everything now goes through this single env-configured client.
 */
const ImageKit = require("imagekit");

let client = null;

function getImagekit() {
  if (client) return client;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT."
    );
  }

  client = new ImageKit({ publicKey, privateKey, urlEndpoint });
  return client;
}

module.exports = { getImagekit };
