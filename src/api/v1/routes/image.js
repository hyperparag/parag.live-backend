const router = require('express').Router()

const formidable = require('formidable');

const fs = require('fs');
const { uploadImage } = require("../utils/storage");

// Avatars go through the same storage as every other image.

router.post('/upload-file', (req, res) => {
    
    const form = formidable();
    form.parse(req, (err, fields, files) => {
        if (err) {
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
        const file = files.images;
        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        uploadImage({
            buffer: fs.readFileSync(file.filepath),
            fileName: file.originalFilename,
            mimeType: file.mimetype,
        }).then(response => {
            res.status(200).json({ message: 'FIle has been uploaded', payload: response });
        }).catch(error => {
            console.log(error)
            res.status(500).json({ message: 'Error in uploading file' });
        });
    });
});

module.exports = router;
