const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("node:path");
const fs = require("fs");

const asyncHandler = require("express-async-handler");
const CustomNotFoundError = require("../errors/CustomNotFoundError");

module.exports.createFile = asyncHandler(async (req, res, next) => {
  // console.table(req.file);
  // console.log(req.params);
  if (!req.file) {
    throw new Error("No file selected.");
  }

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
  // res.redirect(`/directory/${parseInt(req.params.directoryId)}`);
  res.redirect(req.get("referer"));
});

module.exports.getFileInfo = asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  if (!file) {
    throw new CustomNotFoundError("File does not exist");
  }

  res.render("file-info", {
    file,
  });
});

module.exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  if (!file) {
    throw new CustomNotFoundError("File does not exist");
  } else {
    await prisma.file.delete({
      where: {
        id: parseInt(req.params.fileId),
        ownerId: req.user.id,
      },
    });
  }

  // res.send(JSON.stringify(file.directoryId));
  res.redirect(`/directory/${file.directoryId}`);
});

module.exports.downloadFile = asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  if (!file) {
    throw new CustomNotFoundError("File does not exist");
  }

  const fileName = file.name;
  const directoryPath = path.join(__dirname, "../uploads");
  const filePath = `${directoryPath}/${fileName}`;

  // handling errors
  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(`Error downloading the file: ${err.message}`);
        res.status(500).send("Could not download the file.");
      }
    });
  } else {
    res.status(404).send("File not found");
  }
});
