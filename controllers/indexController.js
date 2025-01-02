const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports.getIndex = async (req, res) => {
  if (req.isAuthenticated()) {
    const directory = await prisma.directory.findFirst({
      where: {
        ownerId: req.user.id,
        parentDirectoryId: null,
      },
    });

    res.redirect(`/directory/${directory.id}`);
  } else {
    res.render("index");
  }
};
