// Sample data. "image" is a plain URL here; init/index.js converts it to { url, filename }.
// "owner" is added by init/index.js.
const sampleListings = [{
        title: "Cozy Beachfront Cottage",
        description: "Escape to this charming beachfront cottage for a relaxing getaway. Enjoy stunning ocean views and easy beach access.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60",
        price: 1500,
        location: "Malibu",
        country: "United States",
    },
    {
        title: "Modern Loft in Downtown",
        description: "Stay in the heart of the city in this stylish loft apartment. Close to restaurants, shops and nightlife.",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=60",
        price: 1200,
        location: "New York City",
        country: "United States",
    },
    {
        title: "Mountain Retreat",
        description: "Unplug in a peaceful mountain cabin surrounded by nature, with hiking trails right outside the door.",
        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=60",
        price: 1000,
        location: "Aspen",
        country: "United States",
    },
    {
        title: "Historic Villa in Tuscany",
        description: "Experience the charm of Tuscany in this beautifully restored villa with vineyard views.",
        image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=60",
        price: 2500,
        location: "Florence",
        country: "Italy",
    },
    {
        title: "Heritage Haveli Stay",
        description: "A traditional haveli with courtyards and local cuisine, minutes from the old city.",
        image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=60",
        price: 3500,
        location: "Rajkot",
        country: "India",
    },
    {
        title: "Lakeside Cabin",
        description: "Wake up to calm lake views. Kayaks and a fire pit are included.",
        image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=60",
        price: 1800,
        location: "Banff",
        country: "Canada",
    },
];

module.exports = { data: sampleListings };