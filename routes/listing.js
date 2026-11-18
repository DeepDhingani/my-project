const express = require("express")
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js")
const ExpressError = require("../utils/ExpressError.js")
const { listingSchema } = require("../schemaValidation.js")
const Listing = require("../Models/listing");
const mongoose = require("mongoose");

// Joi validation middleware
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
        throw new ExpressError(404, "Listing not found");
    }
    next();
};

// Index
router.get("/", wrapAsync(async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// New (must be declared before "/:id")
router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Show
router.get("/:id", validateId, wrapAsync(async(req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) throw new ExpressError(404, "Listing not found");
    res.render("listings/show.ejs", { listing });
}));

// Create
router.post("/", validateListing, wrapAsync(async(req, res) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

// Edit
router.get("/:id/edit", validateId, wrapAsync(async(req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    res.render("listings/edit.ejs", { listing });
}));

// Update
router.put("/:id", validateId, validateListing, wrapAsync(async(req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(
        id, {...req.body.listing }, { runValidators: true }
    );
    if (!listing) throw new ExpressError(404, "Listing not found");
    res.redirect(`/listings/${id}`);
}));

// Delete 
router.delete("/:id", validateId, wrapAsync(async(req, res) => {
    const { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) throw new ExpressError(404, "Listing not found");
    res.redirect("/listings");
}));

module.exports = router;