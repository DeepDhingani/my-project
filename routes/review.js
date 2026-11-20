const express = require("express");
const router = express.Router({ mergeParams: true });
const mongoose = require("mongoose");

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schemaValidation.js");
const Listing = require("../Models/listing.js");
const Review = require("../Models/review.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, msg);
    }
    next();
};

const validateId = (req, res, next) => {
    const { id, reviewId } = req.params;
    if (!mongoose.isValidObjectId(id) || (reviewId && !mongoose.isValidObjectId(reviewId))) {
        req.flash("error", "Not found!");
        return res.redirect("/listings");
    }
    next();
};

// Create review
router.post("/", isLoggedIn, validateId, validateReview, wrapAsync(async(req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    req.flash("success", "Review Added!");
    res.redirect(`/listings/${listing._id}`);
}));

// Delete review
router.delete("/:reviewId", isLoggedIn, validateId, wrapAsync(isReviewAuthor), wrapAsync(async(req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
}));

module.exports = router;