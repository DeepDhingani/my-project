const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schemaValidation.js");
const Listing = require("../Models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, msg);
    }
    next();
};

const validateId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    next();
};

// Index
router.get("/", wrapAsync(async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// New (must be before "/:id")
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

// Show
router.get("/:id", validateId, wrapAsync(async(req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}));

// Create
router.post("/", isLoggedIn, validateListing, wrapAsync(async(req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}));

// Edit
router.get("/:id/edit", isLoggedIn, validateId, wrapAsync(isOwner), wrapAsync(async(req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
}));

// Update
router.put("/:id", isLoggedIn, validateId, wrapAsync(isOwner), validateListing, wrapAsync(async(req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing }, { runValidators: true });
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}));

// Delete
router.delete("/:id", isLoggedIn, validateId, wrapAsync(isOwner), wrapAsync(async(req, res) => {
    await Listing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}));

module.exports = router;