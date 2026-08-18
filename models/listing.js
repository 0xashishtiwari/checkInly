const mongoose = require("mongoose");
const { Review } = require("./review");

const Schema = mongoose.Schema;

const listingSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true
        },

        description: {
            type: String,
            trim: true
        },
        externalId:{
            type: String,
            unique: true,
            index: true,
           required: [true, "External ID is required"]
        },

        image: {
            url: String,
            filename: String
        },

        price: {
            type: Number,
            min: 0
        },

        location: {
            type: String,
            trim: true
        },

        country: {
            type: String,
            trim: true
        },

        // GeoJSON Point
        geometry: {
            type: {
                type: String,
                enum: ["Point"]
            },
            coordinates: {
                type: [Number]
            }
        },

        // Property information
        propertyType: {
            type: String,
            trim: true
        },

        roomType: {
            type: String,
            trim: true
        },

        guests: {
            type: Number,
            min: 1
        },

        bedrooms: {
            type: Number,
            min: 0
        },

        beds: {
            type: Number,
            min: 0
        },

        bathrooms: {
            type: Number,
            min: 0
        },

        amenities: {
            type: [String],
            default: []
        },

        // Reviews / ratings
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },

        reviewCount: {
            type: Number,
            min: 0,
            default: 0
        },

        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review"
            }
        ],

        // Booking rules
        minimumNights: {
            type: Number,
            min: 1,
            default: 1
        },

        maximumNights: {
            type: Number,
            min: 1
        },

        instantBookable: {
            type: Boolean,
            default: false
        },

        // Availability
        availability30: {
            type: Number,
            min: 0
        },

        availability365: {
            type: Number,
            min: 0
        },

        // Host information
        host: {
            name: String,

            isSuperhost: {
                type: Boolean,
                default: false
            },

            responseRate: String
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

// Indexes

listingSchema.index({ location: 1 });
listingSchema.index({ country: 1 });
listingSchema.index({ price: 1 });

listingSchema.index({
    title: "text",
    description: "text"
});

listingSchema.index({
    geometry: "2dsphere"
});

listingSchema.index({
    propertyType: 1
});

listingSchema.index({
    roomType: 1
});

listingSchema.index({
    guests: 1
});

listingSchema.index({
    bedrooms: 1
});

listingSchema.index({
    rating: -1
});


listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing?.reviews?.length) {
        await Review.deleteMany({
            _id: { $in: listing.reviews }
        });
    }
});


const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;