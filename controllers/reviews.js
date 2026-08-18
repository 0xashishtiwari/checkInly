const Listing = require('../models/listing');
const {Review} = require('../models/review');
const ExpressError = require('../utils/ExpressError');

module.exports.createReview = async(req , res)=>{
   
    let {id} = req.params
    let listing =  await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, 'Listing not found');
    }

    let newReview = new Review(req.body.review);
    newReview.listing = listing._id;
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash('success'  , 'New Review Added!')
    res.redirect(`/listings/${id}`);
}

module.exports.destroyReview = async(req ,res)=>{
    let {id , reviewId} = req.params; 
    Listing.findByIdAndUpdate(id , {$pull : {reviews : reviewId}}); // removing data from the listing review array using $pull
    await Review.findByIdAndDelete(reviewId);
     req.flash('success'  , ' Review Deleted!')
    res.redirect(`/listings/${id}`);
}