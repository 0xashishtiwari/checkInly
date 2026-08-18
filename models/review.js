const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    comment: {
        type: String,
        trim: true
    },

    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    reviewerName: {
        type: String,
        trim: true
    },

    externalReviewerId: {
        type: String
    },

    externalReviewId: {
        type: String,
        unique: true,
        sparse: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
});

module.exports.Review =
    mongoose.model("Review", reviewSchema);