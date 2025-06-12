const prisma = require("../config/prisma");

const asyncHandler = require("express-async-handler");

module.exports.getIndex = asyncHandler(async (req, res) => {
  if (req.isAuthenticated()) {
    const directory = await prisma.directory.findFirst({
      where: {
        ownerId: req.user.id,
        parentDirectoryId: null,
      },
    });

    res.redirect(`/directory/${directory.id}`);
  } else {
    res.redirect("/user/log-in");
  }
});
