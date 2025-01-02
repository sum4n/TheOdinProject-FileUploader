const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Multer
// const upload = require("../config/multer");

module.exports.createFile = async (req, res, next) => {
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
};

module.exports.getFileInfo = async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  res.render("file-info", {
    file,
  });
};
