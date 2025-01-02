const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await prisma.user.findUnique({
      where: {
        username: req.user.username,
      },
    });
    // console.log(user);

    const directory = await prisma.directory.findFirst({
      where: {
        ownerId: req.user.id,
        parentDirectoryId: null,
      },
      include: {
        files: true,
        subDirectories: true,
      },
    });
    // console.log(directory);

    res.render("index", {
      currentUser: user,
      directory: directory,
      parents: [], // Because the view get the parents object from another router.
    });
  } else {
    res.render("index");
  }
});

module.exports = router;
