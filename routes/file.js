const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Multer
const upload = require("../config/multer");

// Get upload file form
router.get("/upload-file", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("upload-file-form");
  } else {
    res.render("sign-up-form");
  }
});

// Post upload file form.
router.post(
  "/upload-file/:directoryId",
  upload.single("uploaded-file"),
  async (req, res, next) => {
    // console.table(req.file);
    // console.log(req.params);

    await prisma.file.create({
      data: {
        name: req.file.originalname,
        size: req.file.size.toString(),
        type: req.file.mimetype,
        path: "./uploads/" + req.file.originalname,
        directoryId: parseInt(req.params.directoryId),
        ownerId: req.user.id,
      },
    });
    res.redirect("/");
  }
);

// Display file information route
router.get("/:fileId", async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  res.render("file-info", {
    file,
  });
});

module.exports = router;
