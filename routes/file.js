const express = require("express");
const router = express.Router();

// Multer
const upload = require("../config/multer");

// Get upload file form
// router.get("/upload-file", (req, res) => {
//   if (req.isAuthenticated()) {
//     res.render("upload-file-form");
//   } else {
//     res.render("sign-up-form");
//   }
// });

const fileController = require("../controllers/fileController");

// Post upload file form.
router.post(
  "/upload-file/:directoryId",
  upload.single("uploaded-file"),
  fileController.createFile
);

// Display file information route
router.get("/:fileId", fileController.getFileInfo);

module.exports = router;
