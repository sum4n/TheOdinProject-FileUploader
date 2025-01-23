const multer = require("multer");

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 100, // 100 kb limit
  },
});

// Middleware for handling file uploads
const uploadSingleFile = upload.single("uploaded-file");

module.exports = { uploadSingleFile };
