const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep original name.
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 100, // 100 kb limit
  },
});

module.exports = upload;
