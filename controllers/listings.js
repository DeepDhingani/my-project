const Listing = require("../Models/listing.js");
const { cloudinary } = require("../cloudConfig.js");

const CATEGORIES = [
    "trending", "rooms", "iconic-cities", "mountains", "castles",
    "amazing-pools", "camping", "farms", "arctic",
];

// Seed and default images use this name, so they are not stored in Cloudinary
const DEFAULT_FILENAME = "listingimage";

const removeCloudImage = async(filename) => {
    if (filename && filename !== DEFAULT_FILENAME) {
        await cloudinary.uploader.destroy(filename).catch(() => {});
    }
};

module.exports.index = async(req, res) => {
    const { category } = req.query;
    const isValid = CATEGORIES.includes(category);
    const allListings = await Listing.find(isValid ? { category } : {});

    if (category && allListings.length === 0) {
        req.flash("error", "No listings found in this category yet.");
        return res.redirect("/listings");
    }

    res.render("listings/index.ejs", {
        allListings,
        activeCategory: isValid ? category : "",
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken: process.env.MAP_TOKEN, // use the exact name from your .env
    });
};

module.exports.createListing = async(req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async(req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Small preview of the current image. Only Cloudinary URLs contain "/upload/",
    // so other URLs (like Unsplash) pass through unchanged.
    const currentUrl = listing.image && listing.image.url ? listing.image.url : "";
    const originalImageUrl = currentUrl.replace("/upload/", "/upload/w_250/");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async(req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(
        id, {...req.body.listing }, { new: true, runValidators: true }
    );

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    if (req.file) {
        await removeCloudImage(listing.image && listing.image.filename); // delete the old image
        listing.image = { url: req.file.path, filename: req.file.filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req, res) => {
    const deleted = await Listing.findByIdAndDelete(req.params.id); // also triggers the review clean-up hook

    if (deleted) {
        await removeCloudImage(deleted.image && deleted.image.filename);
    }

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};