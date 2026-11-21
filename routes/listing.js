const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const { storage, cloudinary } = require("../cloudConfig.js");
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schemaValidation.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

// Must run AFTER multer, because multer parses the multipart fields into req.body
const validateListing = async(req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        // multer already uploaded the image, so remove it
        if (req.file) await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        const msg = error.details.map((el) => el.message).join(", ");
        return next(new ExpressError(400, msg));
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
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

// "/new" must come BEFORE "/:id"
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(validateId, wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        validateId,
        wrapAsync(isOwner), // before the upload, so non-owners can't upload files
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        validateId,
        wrapAsync(isOwner),
        wrapAsync(listingController.destroyListing)
    );

router.get("/:id/edit", isLoggedIn, validateId, wrapAsync(isOwner), wrapAsync(listingController.renderEditForm));

module.exports = router;