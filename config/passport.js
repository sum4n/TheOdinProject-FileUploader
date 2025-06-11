const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const bcrypt = require("bcryptjs");

// Authentication: Setting up LocalStrategy.
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });
      // console.log(user);

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      // Compare hashed password.
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorect password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Authentication: Sessions and serialization.
passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
  });
});

passport.deserializeUser((sessionUser, done) => {
  done(null, sessionUser);
});

module.exports = passport;
