const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const passport = require("../config/passport");

module.exports.getSignUp = (req, res) => {
  res.render("sign-up-form");
};

module.exports.postSignUp = async (req, res, next) => {
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
};

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
