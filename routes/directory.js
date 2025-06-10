const express = require("express");
const router = express.Router();

const { isAuth } = require("../middlewares/authMiddleware");
const directoryController = require("../controllers/directoryController");

// Create directory
router.post(
  "/create/:parentDirectoryId",
  isAuth,
  directoryController.createDirectory
);

// Get directory
router.get("/:directoryId", isAuth, directoryController.getDirectory);

// Delete directory
router.post(
  "/delete/:directoryId",
  isAuth,
  directoryController.deleteDirectory
);

module.exports = router;
