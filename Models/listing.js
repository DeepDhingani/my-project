const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60";

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: { type: String, default: DEFAULT_IMAGE },
        filename: { type: String, default: "listingimage" },
    },
    price: Number,
    location: String,
    country: String,
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
    }, ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    // GeoJSON point used by the Mapbox map on the show page: [longitude, latitude]
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
        },
    },
    category: {
        type: String,
        enum: [
            "trending", "rooms", "iconic-cities", "mountains", "castles",
            "amazing-pools", "camping", "farms", "arctic",
        ],
    },
});

listingSchema.post("findOneAndDelete", async(listing) => {
    if (listing && listing.reviews.length) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

module.exports = mongoose.model("Listing", listingSchema);