const path = require("node:path");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const bcrypt = require("bcryptjs");

// Import passport and session from config
const passport = require("./config/passport");
const session = require("./config/session");

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
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.get("/", (req, res) => {
  res.render("index");
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App is listening on port: ${PORT}`));
