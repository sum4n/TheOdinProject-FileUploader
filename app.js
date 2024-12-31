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

// Routes
app.get("/", async (req, res) => {
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
    });
  } else {
    res.render("index");
  }
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create user in the database
    await prisma.user.create({
      data: {
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
        directories: {
          create: { name: `${req.body.username}'s Drive` },
        },
      },
    });
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);

app.get("/log-out", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/upload-file", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("upload-file-form");
  } else {
    res.render("sign-up-form");
  }
});

app.post(
  "/upload-file/:directoryName",
  upload.single("uploaded-file"),
  async (req, res, next) => {
    // res.send("File saved successfully");
    // console.table(req.file);
    // console.log(req.params);
    const currentDir = await prisma.directory.findFirst({
      where: {
        name: req.params.directoryName,
      },
    });
    // console.log(currentDir);
    await prisma.file.create({
      data: {
        name: req.file.originalname,
        size: req.file.size.toString(),
        type: req.file.mimetype,
        path: "./uploads/" + req.file.originalname,
        directoryId: currentDir.id,
        ownerId: req.user.id,
      },
    });
    res.redirect("/");
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App is listening on port: ${PORT}`));
