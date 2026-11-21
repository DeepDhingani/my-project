const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../Models/listing.js");

const OWNER_ID = "PASTE_A_REAL_USER_ID_HERE"; // 24 hex characters, no spaces

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/Wanderlust");
    console.log("connected to DB");
}

const initDb = async() => {
    if (!mongoose.isValidObjectId(OWNER_ID)) {
        throw new Error("OWNER_ID is not a valid ObjectId: " + OWNER_ID);
    }
    await Listing.deleteMany({});
    const listings = initData.data.map((obj) => ({...obj, owner: OWNER_ID }));
    await Listing.insertMany(listings);
    console.log("Data was initialized");
};

main()
    .then(initDb)
    .catch((err) => console.log(err))
    .finally(() => mongoose.connection.close());