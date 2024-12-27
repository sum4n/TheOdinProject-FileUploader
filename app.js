const path = require("node:path");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const session = require("express-session");

const bcrypt = require("bcryptjs");

const passport = require("./config/passport");

const app = express();
// Set views path and view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// Custom middleware that simplifies access to the currentUser in views.
// This enables access to the currentUser variable in all views without manually passing it in controllers.
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.get("/", (req, res) => {
  // consSole.log(req.user);
  // res.render("index", { user: req.user }); // sending user object (if it came along with req object cookies) to view
  // Above line is commented out because of the above custom middleware.
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App is listening on port: ${PORT}`));
