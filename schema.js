// this file is created to validate the schema at the server side
const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title : Joi.string().required(),
        description : Joi.string().required(),
        location : Joi.string().required(),
        country : Joi.string().required(),
        price : Joi.number().required().min(0),
        image : Joi.string().allow("" , null),
        propertyType: Joi.string().allow("", null),
        roomType: Joi.string().allow("", null),
        guests: Joi.number().min(1).empty(""),
        bedrooms: Joi.number().min(0).empty(""),
        beds: Joi.number().min(0).empty(""),
        bathrooms: Joi.number().min(0).empty(""),
        amenities: Joi.alternatives().try(
            Joi.array().items(Joi.string()),
            Joi.string().allow("", null)
        ),
        minimumNights: Joi.number().min(1).empty(""),
        maximumNights: Joi.number().min(1).empty(""),
        instantBookable: Joi.boolean(),
        availability30: Joi.number().min(0).empty(""),
        availability365: Joi.number().min(0).empty(""),
        host: Joi.object({
            name: Joi.string().allow("", null),
            isSuperhost: Joi.boolean(),
            responseRate: Joi.string().allow("", null)
        })
    }).required()
})


module.exports.reviewSchema = Joi.object({
    review : Joi.object({
        rating : Joi.number().required().min(1).max(5),
        comment : Joi.string().required(),
    }).required()
})