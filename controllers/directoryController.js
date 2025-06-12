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

    const createdDirectory = await prisma.directory.create({
      data: {
        name: req.body.newFolder,
        ownerId: req.user.id,
        parentDirectoryId: parseInt(req.params.parentDirectoryId),
      },
    });

    // Add extra properties
    createdDirectory["files"] = [];
    createdDirectory["subDirectories"] = [];
    // Get parent directory
    let parentDirectory = req.session.directories.find(
      (dir) => dir.id == req.params.parentDirectoryId
    );
    // Set parent directory
    createdDirectory["parentDirectory"] = { parentDirectory };

    // console.log(createdDirectory);

    // update req.sesson.directories with newly created directory
    // no database call
    req.session.directories.push(createdDirectory);

    // console.log(req.session.directories);

    req.session.save(() => {
      res.redirect(req.get("referer"));
    });
  }),
];

module.exports.getDirectory = asyncHandler(async (req, res) => {
  if (req.isAuthenticated()) {
    const currentDirectory = await prisma.directory.findUnique({
      where: { ownerId: req.user.id, id: parseInt(req.params.directoryId) },
      include: {
        files: true,
        subDirectories: true,
        parentDirectory: true,
      },
    });

    // Handling errors.
    if (!currentDirectory) {
    if (!currentDirectory) {
      throw new CustomNotFoundError("Directory not found.");
    }

    // console.log(currentDirectory);

    // Send parents' list of the directory to the view to render
    // link bread crumbs.
    let parent = [];
    if (currentDirectory.parentDirectory !== null) {
      parent.push(currentDirectory.parentDirectory);
    }

    res.render("index", {
      currentUser: req.user,
      directory: currentDirectory,
      parents: parent,
    });
  } else {
    res.render("index");
  }
});

module.exports.deleteDirectory = asyncHandler(async (req, res) => {
  // get directory from req.session, no database call.
  const directory = req.session.directories.find((dir) => {
    return dir.id == req.params.directoryId;
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
    // Delete the directory from database
    await prisma.directory.delete({
      where: {
        id: parseInt(req.params.directoryId),
        ownerId: parseInt(req.user.id),
      },
    });

    // Don't query database for new directory structure.
    // update req.session.directories
    // Delete the directory from memory and also the delete is as child directory
    const parentId = directory.parentDirectory.id;

    req.session.directories = req.session.directories.filter((dir) => {
      if (dir.id == parentId) {
        dir.subDirectories = dir.subDirectories.filter((subdir) => {
          return subdir.id != directory.id;
        });
      }
      return dir.id != directory.id;
    });

    // console.log(req.session.directories);

    // save the updated session
    req.session.save(() => {
      res.redirect(`/directory/${directory.parentDirectoryId}`);
    });
  }
});
