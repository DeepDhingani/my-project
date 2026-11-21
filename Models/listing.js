const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60";

const listingSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    image: {
        url: {
            type: String,
            default: DEFAULT_IMAGE,
            // blank or whitespace-only values fall back to the default image
            set: (v) => (!v || v.trim() === "" ? DEFAULT_IMAGE : v),
        },
        filename: { type: String, default: "listingimage" },
    },
    price: { type: Number, min: 0 },
    location: { type: String, trim: true },
    country: { type: String, trim: true },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
});

// Smaller image for the index page (only changes Cloudinary URLs)
listingSchema.virtual("thumbnail").get(function() {
    return this.image.url.replace("/upload/", "/upload/w_400/");
});

// Delete all reviews of a listing when the listing is deleted
listingSchema.post("findOneAndDelete", async(listing) => {
    if (listing && listing.reviews.length) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

module.exports = mongoose.model("Listing", listingSchema);