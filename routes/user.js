const express = require("express");
const router = express.Router();
const passport = require("passport")
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../Models/user.js");
const { saveRedirectUrl } = require("../middleware.js")

// Show signup form
router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

// Handle signup
router.post("/signup", wrapAsync(async(req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser)
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect(req.session.redirectUrl);
        })

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

// Show login form
router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

// Login 
router.post(
    "/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    (req, res) => {
        req.flash("success", "Welcome back to Wanderlust!");
        res.redirect(res.locals.redirectUrl || "/listings");
    }
);

// Logout
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
});

module.exports = router;