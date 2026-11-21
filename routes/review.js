const express = require("express");
const router = express.Router({ mergeParams: true });
const mongoose = require("mongoose");

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schemaValidation.js");
const Listing = require("../Models/listing.js");
const Review = require("../Models/review.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/reviews.js")

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
router.post("/", isLoggedIn, validateId, validateReview, wrapAsync(reviewController.createReview));

// Delete review
router.delete("/:reviewId", isLoggedIn, validateId, wrapAsync(isReviewAuthor), wrapAsync(reviewController.destroyReview));

module.exports = router;