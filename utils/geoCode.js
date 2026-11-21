const ExpressError = require("./ExpressError.js");

/**
 * Turns "location, country" into a GeoJSON Point using the Mapbox Geocoding API.
 * Returns { type: "Point", coordinates: [lng, lat] } or null when nothing matches.
 */
module.exports = async function geocode(location, country) {
    if (!process.env.MAP_TOKEN) {
        throw new ExpressError(500, "MAP_TOKEN is missing. Add it to your .env file.");
    }

    const q = encodeURIComponent(`${location}, ${country}`);
    const url =
        `https://api.mapbox.com/search/geocode/v6/forward?q=${q}&limit=1` +
        `&access_token=${process.env.MAP_TOKEN}`;

    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    } catch (err) {
        throw new ExpressError(502, "Could not reach the Mapbox geocoding service.");
    }
    if (!res.ok) {
        throw new ExpressError(502, `Mapbox geocoding failed (HTTP ${res.status}). Check MAP_TOKEN.`);
    }

    const data = await res.json();
    const first = Array.isArray(data.features) ? data.features[0] : null;
    const coords = first && first.geometry && first.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) return null;

    return { type: "Point", coordinates: coords };
};