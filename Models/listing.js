const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: String,
    default:
      "https://unsplash.com/photos/a-beach-with-palm-trees-and-a-sunset-2YjUoTdqD1s",
    set: (v) =>
      v === " "
        ? "https://unsplash.com/photos/a-beach-with-palm-trees-and-a-sunset-2YjUoTdqD1s"
        : v,
  },
  price: Number,
  location: String,
  country: String,
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
