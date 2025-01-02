const path = require("node:path");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const bcrypt = require("bcryptjs");

// Import passport and session from config
const passport = require("./config/passport");
const session = require("./config/session");

// Multer
const upload = require("./config/multer");

const app = express();

// Set views and view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Use session and passport middleware.
app.use(session);
app.use(passport.session());

// Middleware to parse request body.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom middleware that simplifies access to the currentUser in views.
// This enables access to the currentUser variable in all views without manually passing it in controllers.
// app.use((req, res, next) => {
//   res.locals.currentUser = req.user;
//   // console.log(req.user);
//   next();
// });

// Import and use routes.
const indexRouter = require("./routes/index");
app.use("/", indexRouter);

const userRouter = require("./routes/user");
app.use("/user", userRouter);

app.get("/upload-file", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("upload-file-form");
  } else {
    res.render("sign-up-form");
  }
});

app.post(
  "/upload-file/:directoryId",
  upload.single("uploaded-file"),
  async (req, res, next) => {
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
  }
);

// Create folder
app.post("/create-folder/:parentDirectoryId", async (req, res) => {
  await prisma.directory.create({
    data: {
      name: req.body.newFolder,
      ownerId: req.user.id,
      parentDirectoryId: parseInt(req.params.parentDirectoryId),
    },
  });

  res.redirect("/");
});

// Get folder
app.get("/:directoryId", async (req, res) => {
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
});

// Display file information route
app.get("/file/:fileId", async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  res.render("file-info", {
    file,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App is listening on port: ${PORT}`));
