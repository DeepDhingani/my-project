// Run from the project root:  node init/index.js
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../Models/listing.js");
const User = require("../Models/user.js");

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
    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");

    const owner = await getSeedUser();

    const listings = initData.data.map((obj) => ({
        ...obj,
        // convert string image -> { url, filename } to match the schema
        image: {
            url: typeof obj.image === "string" ? obj.image : obj.image.url,
            filename: "listingimage",
        },
        owner: owner._id,
    }));

    await Listing.deleteMany({});
    await Listing.insertMany(listings);
    console.log(`data was initialized (${listings.length} listings)`);
}

initDB()
    .catch((err) => console.log("INIT ERROR:", err))
    .finally(() => mongoose.connection.close());