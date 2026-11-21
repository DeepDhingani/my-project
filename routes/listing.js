const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schemaValidation.js");
const Listing = require("../Models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listings.js")
const multer = require("multer")
const { storage } = require("../cloudConfig.js")
const upload = multer({ storage })


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

router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync(listingController.createListings));


// New
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(validateId, wrapAsync(listingController.showListings))
    .put(isLoggedIn, validateId, wrapAsync(isOwner), validateListing, wrapAsync(listingController.renderupdateform))
    .delete(isLoggedIn, validateId, wrapAsync(isOwner), wrapAsync(listingController.deletelisting))

// Edit
router.get("/:id/edit", isLoggedIn, validateId, wrapAsync(isOwner), wrapAsync(listingController.rendereditform));

module.exports = router;