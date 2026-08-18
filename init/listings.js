const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const dotenv = require("dotenv");

dotenv.config();

const Listing = require("../models/listing");
const User = require("../models/user");

const DB_URL = process.env.ATLASDB_URL;

async function seedListings() {
    try {
        await mongoose.connect(DB_URL);
        console.log("MongoDB connected");

        // --------------------------------------------------
        // 1. Fix old indexes
        // --------------------------------------------------

        console.log("Current indexes:");
        console.log(await Listing.collection.indexes());

        try {
            await Listing.collection.dropIndex("externalID_1");
            console.log("Dropped old externalID_1 index");
        } catch (error) {
            if (error.codeName === "IndexNotFound") {
                console.log("Old externalID_1 index not found");
            } else {
                throw error;
            }
        }

        // Make MongoDB indexes match the current Mongoose schema
        await Listing.syncIndexes();

        console.log("Indexes after sync:");
        console.log(await Listing.collection.indexes());

        // --------------------------------------------------
        // 2. Find owner
        // --------------------------------------------------

        const owner = await User.findOne();

        if (!owner) {
            throw new Error(
                "No CheckInly user found. Create a user first."
            );
        }

        console.log(
            `Listings will be owned by: ${owner.username}`
        );

        // --------------------------------------------------
        // 3. Remove existing listings
        // --------------------------------------------------

        const deleted = await Listing.deleteMany({});

        console.log(
            `Deleted ${deleted.deletedCount} existing listings`
        );

        // --------------------------------------------------
        // 4. Read CSV
        // --------------------------------------------------

        const listings = [];

        let firstRow = true;

        fs.createReadStream("./data/listings.csv")
            .pipe(csv())
            .on("data", (row) => {

                // Debug first row only
                if (firstRow) {
                    console.log(
                        "CSV columns:",
                        Object.keys(row)
                    );

                    console.log(
                        "First CSV listing ID:",
                        row.id
                    );

                    firstRow = false;
                }

                // --------------------------------------------------
                // Validate CSV ID
                // --------------------------------------------------

                if (!row.id || String(row.id).trim() === "") {
                    console.log(
                        "Skipping listing without CSV id"
                    );
                    return;
                }

                const listing = {

                    // --------------------------------------------------
                    // Original Airbnb listing ID
                    // --------------------------------------------------

                    externalId: String(row.id).trim(),

                    // --------------------------------------------------
                    // Basic information
                    // --------------------------------------------------

                    title:
                        row.name?.trim() ||
                        "Untitled Listing",

                    description:
                        row.description?.trim() ||
                        "",

                    image: {
                        url:
                            row.picture_url?.trim() ||
                            "",

                        filename: "listing-image"
                    },

                    // --------------------------------------------------
                    // Price
                    // --------------------------------------------------

                    price: parsePrice(row.price),

                    // --------------------------------------------------
                    // Location
                    // --------------------------------------------------

                    location:
                        row.neighbourhood_cleansed?.trim() ||
                        row.neighbourhood?.trim() ||
                        row.city?.trim() ||
                        "",

                    country:
                        row.country?.trim() ||
                        "",

                    // --------------------------------------------------
                    // GeoJSON
                    // --------------------------------------------------

                    geometry: createGeometry(row),

                    // --------------------------------------------------
                    // Property information
                    // --------------------------------------------------

                    propertyType:
                        row.property_type?.trim() ||
                        "",

                    roomType:
                        row.room_type?.trim() ||
                        "",

                    guests: parseNumber(
                        row.accommodates,
                        1
                    ),

                    bedrooms: parseNumber(
                        row.bedrooms,
                        0
                    ),

                    beds: parseNumber(
                        row.beds,
                        0
                    ),

                    bathrooms: parseBathrooms(
                        row.bathrooms
                    ),

                    amenities: parseAmenities(
                        row.amenities
                    ),

                    // --------------------------------------------------
                    // Reviews / ratings
                    // --------------------------------------------------

                    rating: parseNumber(
                        row.review_scores_rating,
                        0
                    ),

                    reviewCount: parseNumber(
                        row.number_of_reviews,
                        0
                    ),

                    // --------------------------------------------------
                    // Booking rules
                    // --------------------------------------------------

                    minimumNights: parseNumber(
                        row.minimum_nights,
                        1
                    ),

                    maximumNights:
                        parseOptionalNumber(
                            row.maximum_nights
                        ),

                    instantBookable:
                        parseBoolean(
                            row.instant_bookable
                        ),

                    // --------------------------------------------------
                    // Availability
                    // --------------------------------------------------

                    availability30:
                        parseNumber(
                            row.availability_30,
                            0
                        ),

                    availability365:
                        parseNumber(
                            row.availability_365,
                            0
                        ),

                    // --------------------------------------------------
                    // Host information
                    // --------------------------------------------------

                    host: {
                        name:
                            row.host_name?.trim() ||
                            "",

                        isSuperhost:
                            parseBoolean(
                                row.host_is_superhost
                            ),

                        responseRate:
                            row.host_response_rate?.trim() ||
                            ""
                    },

                    // --------------------------------------------------
                    // CheckInly owner
                    // --------------------------------------------------

                    owner: owner._id
                };

                listings.push(listing);
            })

            .on("end", async () => {
                try {

                    console.log(
                        `CSV loaded: ${listings.length} listings`
                    );

                    // --------------------------------------------------
                    // Validate external IDs
                    // --------------------------------------------------

                    const invalidListings =
                        listings.filter(
                            listing =>
                                !listing.externalId
                        );

                    if (invalidListings.length > 0) {
                        throw new Error(
                            `${invalidListings.length} listings have invalid externalId`
                        );
                    }

                    // Check duplicate IDs inside CSV
                    const externalIds =
                        listings.map(
                            listing => listing.externalId
                        );

                    const uniqueExternalIds =
                        new Set(externalIds);

                    if (
                        uniqueExternalIds.size !==
                        externalIds.length
                    ) {
                        throw new Error(
                            "Duplicate externalId values found in CSV"
                        );
                    }

                    console.log(
                        "External IDs validated"
                    );

                    // --------------------------------------------------
                    // Insert listings
                    // --------------------------------------------------

                    const inserted =
                        await Listing.insertMany(
                            listings,
                            {
                                ordered: true
                            }
                        );

                    console.log(
                        `Successfully inserted ${inserted.length} listings`
                    );

                    // --------------------------------------------------
                    // Verify
                    // --------------------------------------------------

                    const count =
                        await Listing.countDocuments();

                    console.log(
                        `Listings currently in database: ${count}`
                    );

                    const sample =
                        await Listing.findOne();

                    console.log(
                        "Sample listing:"
                    );

                    console.log({
                        mongoId: sample._id,
                        externalId: sample.externalId,
                        title: sample.title,
                        price: sample.price,
                        owner: sample.owner
                    });

                } catch (error) {

                    console.error(
                        "Import failed:",
                        error
                    );

                } finally {

                    await mongoose.connection.close();

                    console.log(
                        "MongoDB connection closed"
                    );
                }
            })

            .on("error", async (error) => {

                console.error(
                    "CSV reading failed:",
                    error
                );

                await mongoose.connection.close();
            });

    } catch (error) {

        console.error(
            "Database connection failed:",
            error
        );

        await mongoose.connection.close();

        process.exit(1);
    }
}


// --------------------------------------------------
// Parse price
// "$80.43" -> 80.43
// --------------------------------------------------

function parsePrice(value) {

    if (!value) return 0;

    const cleaned = String(value)
        .replace(/[$,]/g, "")
        .trim();

    const number = Number(cleaned);

    return Number.isFinite(number)
        ? number
        : 0;
}


// --------------------------------------------------
// Parse number
// --------------------------------------------------

function parseNumber(
    value,
    fallback = 0
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return fallback;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


// --------------------------------------------------
// Optional number
// --------------------------------------------------

function parseOptionalNumber(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return undefined;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : undefined;
}


// --------------------------------------------------
// Parse boolean
// --------------------------------------------------

function parseBoolean(value) {

    if (!value) return false;

    const normalized =
        String(value)
            .trim()
            .toLowerCase();

    return (
        normalized === "t" ||
        normalized === "true" ||
        normalized === "1" ||
        normalized === "yes"
    );
}


// --------------------------------------------------
// Parse bathrooms
// --------------------------------------------------

function parseBathrooms(value) {

    if (!value) return 0;

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


// --------------------------------------------------
// Parse amenities
// --------------------------------------------------

function parseAmenities(value) {

    if (!value) return [];

    try {

        const parsed =
            JSON.parse(value);

        if (Array.isArray(parsed)) {

            return parsed
                .map(item =>
                    String(item).trim()
                )
                .filter(Boolean);
        }

    } catch (error) {
        // Fallback parser
    }

    return String(value)
        .replace(/[{}[\]"]/g, "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}


// --------------------------------------------------
// Create GeoJSON Point
// --------------------------------------------------

function createGeometry(row) {

    const longitude =
        Number(row.longitude);

    const latitude =
        Number(row.latitude);

    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
    ) {
        return undefined;
    }

    return {
        type: "Point",

        // GeoJSON:
        // [longitude, latitude]

        coordinates: [
            longitude,
            latitude
        ]
    };
}


// --------------------------------------------------
// Start
// --------------------------------------------------

seedListings();