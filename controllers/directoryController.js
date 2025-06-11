const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // This logs all queries and other messages
});

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
  // console.log({ user: req.user, location: "getDirectory" });
  if (req.isAuthenticated()) {
    if (!req.user.directories) {
      req.user.directories = await prisma.directory.findMany({
        where: { ownerId: req.user.id },
        include: {
          files: true,
          subDirectories: true,
          parentDirectory: true,
        },
      });
    }

    const userDirectories = req.user.directories;

    let currentDirectory = userDirectories.find((folder) => {
      return folder.id == req.params.directoryId;
    });

    // Handling errors.
    if (!currentDirectory) {
      throw new CustomNotFoundError("Directory not found.");
    }

    // console.log(currentDirectory);

    // Send parents' list of the directory to the view to render
    // link bread crumbs.
    let parents = [];
    let tempDir = currentDirectory;

    while (tempDir.parentDirectory !== null) {
      parents.push(tempDir.parentDirectory);

      tempDir = userDirectories.find((folder) => {
        return folder.id == tempDir.parentDirectoryId;
      });
    }

    res.render("index", {
      currentUser: req.user,
      directory: currentDirectory,
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
