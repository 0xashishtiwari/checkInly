const mongoose = require("mongoose");
const Listing = require("./models/listing");
const geocode = require("./utils/geocode");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URL = process.env.ATLASDB_URL;

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const run = async () => {

    await mongoose.connect(MONGO_URL);

    console.log("Connected to MongoDB");

    const listings = await Listing.find({
        $or: [
            { geometry: { $exists: false } },
            { "geometry.coordinates": { $exists: false } }
        ]
    });

    console.log(`Found ${listings.length} listings without coordinates`);

    for (const listing of listings) {

        try {

            console.log(
                `Geocoding: ${listing.location}, ${listing.country}`
            );

            const geometry = await geocode(
                listing.location,
                listing.country
            );

            if (!geometry) {
                console.log(
                    `❌ Could not find: ${listing.location}, ${listing.country}`
                );

                continue;
            }

            listing.geometry = geometry;

            await listing.save();

            console.log(
                `✅ ${listing.title} → ${geometry.coordinates}`
            );

            // Nominatim public server limit
            await sleep(1100);

        } catch (error) {

            console.error(
                `❌ Failed: ${listing.title}`,
                error.message
            );
        }
    }

    await mongoose.connection.close();

    console.log("Migration complete");
};

run();