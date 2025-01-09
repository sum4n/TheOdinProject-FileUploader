const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const passport = require("../config/passport");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const alphaErr = "must only contains letters.";
const lengthErr = "must be between 1 and 10 characters.";

const validateUserSignUp = [
  body("username")
    .trim()
    .isAlpha()
    .withMessage(`Username ${alphaErr}`)
    .isLength({ min: 1, max: 10 })
    .withMessage(`Username ${lengthErr}`)
    .escape(),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email format.")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 4, max: 10 })
    .withMessage("Password must be between 4 and 10 characters.")
    .not()
    .matches(/\s/)
    .withMessage("Password must not contain spaces."),
];

module.exports.getSignUp = (req, res) => {
  const data = {}; // for view
  res.render("sign-up-form", {
    data,
  });
};

module.exports.postSignUp = [
  validateUserSignUp,
  asyncHandler(async (req, res) => {
    // Extract validation errors from request
    const errors = validationResult(req);

    const data = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };

    if (!errors.isEmpty()) {
      return res.status(400).render("sign-up-form", {
        data,
        errors: errors.array(),
      });
    }

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
  }),
];

module.exports.postLogIn = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })(req, res, next);
};

module.exports.getLogOut = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};
