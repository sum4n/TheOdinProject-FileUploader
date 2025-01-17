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

// Middleware for handling Multer errors
const uploadSingleFile = (req, res, next) => {
  const uploadSingle = upload.single("uploaded-file"); // 'uploaded-file' is the field name

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        // console.error(err);
        return res.status(400).render("errors", {
          err: { message: "File size exceeds the limit of 100kb." },
        });
      }
      // Handle other Multer-specific errors
      return res.status(400).render("errors", {
        err: { message: err.message },
      });
    }
    next(); // Proceed to the controller if no errors
  });
};

module.exports = { uploadSingleFile };
