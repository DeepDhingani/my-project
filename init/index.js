// Run from the project root:  node init/index.js
// WARNING: this DELETES all existing listings and replaces them with the sample data.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../Models/listing.js");
const User = require("../Models/user.js");
const geocode = require("../utils/geoCode.js");

const MONGO_URL = process.env.ATLAS_URL || "mongodb://127.0.0.1:27017/Wanderlust"; // same DB as app.js

async function getSeedUser() {
    // Reuse an existing user if there is one, otherwise create a demo user
    let user = await User.findOne({});
    if (!user) {
        user = await User.register(
            new User({ email: "demo@example.com", username: "demo-user" }),
            "demo1234"
        );
        console.log("created demo user: demo-user / demo1234");
    }
    return user;
}

async function initDB() {
    if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
        throw new Error("Refusing to wipe listings in production. Re-run with --force if you really mean it.");
    }

    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");

    const owner = await getSeedUser();

    const listings = [];
    for (const obj of initData.data) {
        const item = {
            ...obj,
            // convert string image -> { url, filename } to match the schema
            image: {
                url: typeof obj.image === "string" ? obj.image : obj.image.url,
                filename: "listingimage",
            },
            owner: owner._id,
        };

        // Give seeded listings a map pin when a Mapbox token is available
        if (process.env.MAP_TOKEN) {
            try {
                const geometry = await geocode(obj.location, obj.country);
                if (geometry) item.geometry = geometry;
            } catch (err) {
                console.log(`geocode skipped for ${obj.location}: ${err.message}`);
            }
        }
        listings.push(item);
    }

    await Listing.deleteMany({});
    await Listing.insertMany(listings);
    console.log(`data was initialized (${listings.length} listings)`);
}

initDB()
    .catch((err) => console.log("INIT ERROR:", err.message))
    .finally(() => mongoose.connection.close());