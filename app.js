if (process.env.NODE_ENV != "production") {
    require('dotenv').config()
}
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError.js");
const User = require("./Models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js")

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

main()
    .then(() => console.log("connected to DB"))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect(process.env.ATLAS_URL || "mongodb://127.0.0.1:27017/Wanderlust");
    console.log("connected to DB");
    app.listen(8080, () => console.log("server is listening to port 8080"));
}

main().catch((err) => {
    console.log("Could not connect to MongoDB:", err.message);
    process.exit(1);
});

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
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

// app.get("/", (req, res) => {
//     res.send("Hii I am root");
// });

// temporary: visit once, then delete
// app.get("/demouser", async(req, res) => {
//     try {
//         const fakeUser = new User({ email: "student@gmail.com", username: "delta-student" });
//         const registeredUser = await User.register(fakeUser, "helloworld");
//         res.send(registeredUser);
//     } catch (err) {
//         console.log(err);
//         res.status(500).send(err.message);
//     }
// });

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    console.log(err);
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});