const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.get("/sign-up", userController.getSignUp);
router.post("/sign-up", userController.postSignUp);
router.post("/log-in", userController.postLogIn);
router.get("/log-out", userController.getLogOut);

module.exports = router;
