const Listing = require("../Models/listing.js");
const { cloudinary } = require("../cloudConfig.js");
const geocode = require("../utils/geoCode.js");

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

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A failed geocode (no token, Mapbox down, unknown place) must never block saving a listing
const safeGeocode = async(location, country) => {
    try {
        return await geocode(location, country);
    } catch (err) {
        console.log("Geocoding skipped:", err.message);
        return null;
    }
};

module.exports.index = async(req, res) => {
    const { category, search } = req.query;
    const isValid = CATEGORIES.includes(category);
    const searchQuery = typeof search === "string" ? search.trim().slice(0, 60) : "";

    const filter = {};
    if (isValid) filter.category = category;
    if (searchQuery) {
        const rx = new RegExp(escapeRegex(searchQuery), "i");
        filter.$or = [{ title: rx }, { location: rx }, { country: rx }];
    }

    const allListings = await Listing.find(filter);

    if (isValid && !searchQuery && allListings.length === 0) {
        req.flash("error", "No listings found in this category yet.");
        return res.redirect("/listings");
    }

    res.render("listings/index.ejs", {
        allListings,
        activeCategory: isValid ? category : "",
        searchQuery,
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
        mapToken: process.env.MAP_TOKEN,
    });
};

module.exports.createListing = async(req, res) => {
    const data = {...req.body.listing };
    delete data.image; // the image comes from the upload, never from a text field
    if (!data.category) delete data.category; // "" is not a valid enum value

    const newListing = new Listing(data);
    newListing.owner = req.user._id;

    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }

    const geometry = await safeGeocode(data.location, data.country);
    if (geometry) newListing.geometry = geometry;

    try {
        await newListing.save();
    } catch (err) {
        if (req.file) await removeCloudImage(req.file.filename); // don't orphan the upload
        throw err;
    }

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

    res.render("listings/edit.ejs", { listing, originalImageUrl, categories: CATEGORIES });
};

module.exports.updateListing = async(req, res) => {
    const { id } = req.params;
    const data = {...req.body.listing };
    delete data.image;

    const update = {...data };
    if (!data.category) {
        delete update.category;
        update.$unset = { category: 1 }; // cleared in the form -> remove it
    }

    const geometry = await safeGeocode(data.location, data.country);
    if (geometry) update.geometry = geometry;

    let listing;
    try {
        listing = await Listing.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    } catch (err) {
        if (req.file) await removeCloudImage(req.file.filename);
        throw err;
    }

    if (!listing) {
        if (req.file) await removeCloudImage(req.file.filename);
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