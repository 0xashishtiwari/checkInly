const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const dotenv = require("dotenv");

dotenv.config();

const Listing = require("../models/listing");
const { Review } = require("../models/review");

const DB_URL = process.env.ATLASDB_URL;

async function seedReviews() {
    try {
        await mongoose.connect(DB_URL);

        console.log("MongoDB connected");

        // --------------------------------------------------
        // 1. Delete all existing reviews
        // --------------------------------------------------

        const deletedReviews = await Review.deleteMany({});

        console.log(
            `Deleted ${deletedReviews.deletedCount} existing reviews`
        );

        // --------------------------------------------------
        // 2. Clear review references from all listings
        // --------------------------------------------------

        await Listing.updateMany(
            {},
            {
                $set: {
                    reviews: [],
                    reviewCount: 0
                }
            }
        );

        console.log(
            "Cleared old review references from listings"
        );

        // --------------------------------------------------
        // 3. Load listings
        // --------------------------------------------------

        const listings = await Listing.find(
            {},
            {
                _id: 1,
                externalId: 1
            }
        ).lean();

        console.log(
            `Loaded ${listings.length} listings`
        );

        // --------------------------------------------------
        // 4. Create externalId -> MongoDB _id map
        // --------------------------------------------------

        const listingMap = new Map();

        for (const listing of listings) {
            listingMap.set(
                String(listing.externalId),
                listing._id
            );
        }

        console.log(
            `Created mapping for ${listingMap.size} listings`
        );

        // --------------------------------------------------
        // 5. Read reviews CSV
        // --------------------------------------------------

        const reviews = [];

        let totalRows = 0;
        let matchedRows = 0;
        let skippedRows = 0;

        fs.createReadStream("./data/reviews.csv")
            .pipe(csv())
            .on("data", (row) => {
                totalRows++;

                const externalListingId =
                    String(row.listing_id || "").trim();

                // Find MongoDB Listing._id
                const listingId =
                    listingMap.get(
                        externalListingId
                    );

                if (!listingId) {
                    skippedRows++;
                    return;
                }

                matchedRows++;

                reviews.push({
                    listing: listingId,

                    comment:
                        row.comments?.trim() ||
                        "",

                    reviewerName:
                        row.reviewer_name?.trim() ||
                        "Anonymous",

                    externalReviewerId:
                        String(
                            row.reviewer_id || ""
                        ).trim(),

                    externalReviewId:
                        String(
                            row.id || ""
                        ).trim(),

                    createdAt:
                        parseDate(row.date)
                });
            })

            .on("end", async () => {
                try {
                    console.log(
                        `Total CSV reviews: ${totalRows}`
                    );

                    console.log(
                        `Matched reviews: ${matchedRows}`
                    );

                    console.log(
                        `Skipped reviews: ${skippedRows}`
                    );

                    console.log(
                        `Reviews ready: ${reviews.length}`
                    );

                    // --------------------------------------------------
                    // 6. Insert reviews
                    // --------------------------------------------------

                    if (reviews.length === 0) {
                        console.log(
                            "No reviews to insert"
                        );
                        return;
                    }

                    const insertedReviews =
                        await Review.insertMany(
                            reviews,
                            {
                                ordered: false
                            }
                        );

                    console.log(
                        `Inserted ${insertedReviews.length} reviews`
                    );

                    // --------------------------------------------------
                    // 7. Group review IDs by listing
                    // --------------------------------------------------

                    const reviewsByListing =
                        new Map();

                    for (const review of insertedReviews) {
                        const listingId =
                            String(review.listing);

                        if (
                            !reviewsByListing.has(
                                listingId
                            )
                        ) {
                            reviewsByListing.set(
                                listingId,
                                []
                            );
                        }

                        reviewsByListing
                            .get(listingId)
                            .push(review._id);
                    }

                    // --------------------------------------------------
                    // 8. Add review IDs to listings
                    // --------------------------------------------------

                    const operations = [];

                    for (
                        const [
                            listingId,
                            reviewIds
                        ]
                        of reviewsByListing
                    ) {
                        operations.push({
                            updateOne: {
                                filter: {
                                    _id: listingId
                                },

                                update: {
                                    $push: {
                                        reviews: {
                                            $each:
                                                reviewIds
                                        },

                                    },

                                    $set: {
                                        reviewCount:
                                            reviewIds.length
                                    }
                                }
                            }
                        });
                    }

                    if (operations.length > 0) {
                        const result =
                            await Listing.bulkWrite(
                                operations
                            );

                        console.log(
                            `Updated ${result.modifiedCount} listings with reviews`
                        );
                    }

                    console.log(
                        "Review import completed successfully"
                    );

                } catch (error) {
                    console.error(
                        "Review import failed:",
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
// Parse date
// --------------------------------------------------

function parseDate(value) {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? undefined
        : date;
}


// --------------------------------------------------
// Start
// --------------------------------------------------

seedReviews();