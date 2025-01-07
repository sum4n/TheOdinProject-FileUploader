const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const asyncHandler = require("express-async-handler");
const CustomNotFoundError = require("../errors/CustomNotFoundError");

// Multer
// const upload = require("../config/multer");

module.exports.createFile = asyncHandler(async (req, res, next) => {
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
    throw new CustomNotFoundError("File does not exists!");
  }

  res.render("file-info", {
    file,
  });
});

module.exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await prisma.file.delete({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  // res.send(JSON.stringify(file.directoryId));
  res.redirect(`/directory/${file.directoryId}`);
});
