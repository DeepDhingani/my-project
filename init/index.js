const mongoose = require("mongoose")
const initData = require("./data")
const Listing = require("../Models/listing")

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Wanderlust");
}

const initDb = async () => {
   await Listing.deleteMany({});
   await Listing.insertMany(initData.data);
   console.log("Data was initialized")
}

initDb();