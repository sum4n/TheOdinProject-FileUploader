const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports.createDirectory = async (req, res) => {
  await prisma.directory.create({
    data: {
      name: req.body.newFolder,
      ownerId: req.user.id,
      parentDirectoryId: parseInt(req.params.parentDirectoryId),
    },
  });

  // res.redirect(`/directory/${parseInt(req.params.parentDirectoryId)}`);
  res.redirect(req.get("referer"));
};

module.exports.getDirectory = async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await prisma.user.findUnique({
      where: {
        username: req.user.username,
      },
    });
    // console.log(user);

    const directory = await prisma.directory.findUnique({
      where: {
        ownerId: req.user.id,
        id: parseInt(req.params.directoryId),
      },
      include: {
        files: true,
        subDirectories: true,
        parentDirectory: true,
      },
    });
    // console.log({ directory });

    // Send parents' list of the directory to the view to render
    // link bread crumbs.
    let parents = [];
    let tempDir = directory;

    while (tempDir.parentDirectory !== null) {
      parents.push(tempDir.parentDirectory);
      // console.log("---in while-------");
      // console.log({ parents });
      tempDir = await prisma.directory.findUnique({
        where: {
          id: parseInt(tempDir.parentDirectoryId),
        },
        include: {
          parentDirectory: true,
        },
      });
      // console.log("---in while-------");
      // console.log({ tempDir });
    }
    // console.log("----------");
    // console.log(parents);

    res.render("index", {
      currentUser: user,
      directory: directory,
      parents: parents.reverse(), // Reverse the list for easy iteration in view
    });
  } else {
    res.render("index");
  }
};
