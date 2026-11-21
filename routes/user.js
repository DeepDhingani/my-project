const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

router.route("/signup")
    .get(userController.rendersignupform)
    .post(saveRedirectUrl, wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderloginform)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.login
    );

// Logout
router.get("/logout", userController.logout);

module.exports = router;