const multer = require("multer");
const fs = require("node:fs");
const path = require("node:path");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Dynamic directory for uploads.
    const uploadPath = path.join(
      __dirname,
      "../uploads",
      `${req.user.username}/${req.params.directoryId}`
    );
    // console.log(uploadPath);

    // Create the directory if it does not exist
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath); // Destination folder
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
