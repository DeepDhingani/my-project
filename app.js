const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
    require("dotenv").config();
    // Local-only: helps resolve Atlas SRV records on some home networks
    require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError.js");
const User = require("./Models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const DB_URL = process.env.ATLAS_URL || "mongodb://127.0.0.1:27017/Wanderlust";
const SESSION_SECRET = process.env.SESSION_SECRET || (isProd ? "" : "dev-only-secret-change-me");
const PORT = process.env.PORT || 8080;

if (isProd && (!process.env.ATLAS_URL || !SESSION_SECRET)) {
    console.error("ATLAS_URL and SESSION_SECRET must be set in production.");
    process.exit(1);
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Hosts such as Render/Railway/Heroku sit behind a proxy; needed for secure cookies
if (isProd) app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Health check for hosting platforms
app.get("/healthz", (req, res) => res.status(200).send("ok"));

const store = MongoStore.create({
    mongoUrl: DB_URL,
    touchAfter: 24 * 3600,
});
store.on("error", (err) => console.log("SESSION STORE ERROR:", err));

app.use(
    session({
        store,
        name: "wanderlust.sid",
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "lax",
            secure: isProd,
        },
    })
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.get("/", (req, res) => res.redirect("/listings"));
app.get("/privacy", (req, res) => res.render("static/privacy.ejs"));
app.get("/terms", (req, res) => res.render("static/terms.ejs"));

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    console.log(err);
    if (res.headersSent) return next(err);

    let { statusCode = 500, message = "Something went wrong!" } = err;

    // Upload problems (too large, wrong field, ...) are the user's fault, not a server error
    if (err.name === "MulterError") {
        statusCode = 400;
        message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller." : "Invalid file upload.";
    }
    // Don't leak internals for unexpected errors in production
    if (isProd && statusCode >= 500 && !(err instanceof ExpressError)) {
        message = "Something went wrong!";
    }

    res.status(statusCode).render("error.ejs", {
        message,
        success: res.locals.success || [],
        error: res.locals.error || [],
        currentUser: res.locals.currentUser,
    });
});

mongoose
    .connect(DB_URL)
    .then(() => {
        console.log("connected to DB");
        app.listen(PORT, () => console.log(`server is listening on port ${PORT}`));
    })
    .catch((err) => {
        console.log("Could not connect to MongoDB:", err.message);
        process.exit(1);
    });