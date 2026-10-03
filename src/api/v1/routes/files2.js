const router = require("express").Router();
const multer = require("multer");

const { uploadImage } = require("../utils/storage");

const storage = multer.memoryStorage();
// Clients compress to ~50KB before upload; this is only a backstop against a
// bypassed client. There was no byte limit at all before.
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 5 },
});

router.post("/files", upload.array("images", 5), async (req, res) => {
  try {
    const files = req.files || [];

    const uploadedFiles = [];

    for (const file of files) {
      // fileId is what delete needs later (an R2 object key, or an ImageKit id).
      uploadedFiles.push(
        await uploadImage({
          buffer: file.buffer,
          fileName: file.originalname,
          mimeType: file.mimetype,
        })
      );
    }

    res.json({
      urls: uploadedFiles.map((f) => f.url),
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: "Image is too large. Maximum size is 2MB." });
    }
    res.status(500).json({ error: "An error occurred while uploading files." });
  }
});

module.exports = router;
