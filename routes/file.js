const express = require("express");
const router = express.Router();

// Multer
const { uploadSingleFile } = require("../config/multer");

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
  uploadSingleFile,
  fileController.createFile
);

// Display file information route
router.get("/:fileId", fileController.getFileInfo);

// Delete file
router.post("/:fileId", fileController.deleteFile);

module.exports = router;
