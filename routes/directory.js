const express = require("express");
const router = express.Router();

const directoryController = require("../controllers/directoryController");

// Create directory
router.post("/create/:parentDirectoryId", directoryController.createDirectory);

// Get directory
router.get("/:directoryId", directoryController.getDirectory);

module.exports = router;
