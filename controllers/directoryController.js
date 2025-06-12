const prisma = require("../config/prisma");

const asyncHandler = require("express-async-handler");
const CustomNotFoundError = require("../errors/CustomNotFoundError");
const ConflictRequestError = require("../errors/ConflictRequestError");

const { body, validationResult } = require("express-validator");

const validateDirectoryNameInput = [
  body("newFolder")
    .trim()
    .notEmpty()
    .withMessage("Directory/Folder name is required.")
    .isLength({ min: 3, max: 10 })
    .withMessage("Directory/Folder name must be between 3 and 10 characters.")
    .escape(),
];

module.exports.createDirectory = [
  validateDirectoryNameInput,
  asyncHandler(async (req, res) => {
    // Extract validation errors from the request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).redirect(req.get("referer"));
    }

    await prisma.directory.create({
      data: {
        name: req.body.newFolder,
        ownerId: req.user.id,
        parentDirectoryId: parseInt(req.params.parentDirectoryId),
      },
    });

    // res.redirect(`/directory/${parseInt(req.params.parentDirectoryId)}`);
    res.redirect(req.get("referer"));
  }),
];

module.exports.getDirectory = asyncHandler(async (req, res) => {
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

    // Handling errors.
    if (!directory) {
      throw new CustomNotFoundError("Directory not found.");
    }

    // Send parents' list of the directory to the view to render
    // link bread crumbs.
    let parents = [];
    let tempDir = directory;

    while (tempDir.parentDirectory !== null) {
      parents.push(tempDir.parentDirectory);

      tempDir = await prisma.directory.findUnique({
        where: {
          id: parseInt(tempDir.parentDirectoryId),
        },
        include: {
          parentDirectory: true,
        },
      });
    }

    res.render("index", {
      currentUser: user,
      directory: directory,
      parents: parents.reverse(), // Reverse the list for easy iteration in view
    });
  } else {
    res.render("index");
  }
});

module.exports.deleteDirectory = asyncHandler(async (req, res) => {
  // console.log(req.params);
  const directory = await prisma.directory.findUnique({
    where: {
      id: parseInt(req.params.directoryId),
      ownerId: parseInt(req.user.id), // can only delete self directories
      // parentDirectoryId: {
      //   not: null,
      // },
    },
    include: {
      files: true,
      subDirectories: true,
    },
  });

  if (!directory) {
    throw new CustomNotFoundError("Directory not found");
  } else if (directory.parentDirectoryId === null) {
    throw new ConflictRequestError("Can not delete the root dirctory");
  } else if (
    directory.files.length > 0 ||
    directory.subDirectories.length > 0
  ) {
    throw new ConflictRequestError("Directory has files or sub-folders.");
  } else {
    // Delete the directory.
    await prisma.directory.delete({
      where: {
        id: parseInt(req.params.directoryId),
        ownerId: parseInt(req.user.id),
      },
    });

    res.redirect(`/directory/${directory.parentDirectoryId}`);
  }
});
