const path = require("node:path");
const express = require("express");

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

const fileRouter = require("./routes/file");
app.use("/file", fileRouter);

const directoryRouter = require("./routes/directory");
app.use("/directory", directoryRouter);

// Error middleware.
app.use((err, req, res, next) => {
  console.error(err);
  // err.statusCode or internal server error.
  // res.status(err.statusCode || 500).send(err.message);
  res.status(err.statusCode || 500).render("errors", { err });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App is listening on port: ${PORT}`));
