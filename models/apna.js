const mongoose = require("mongoose");
const schema = mongoose.Schema;

const apnaschema = new schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        url: String,
        filename: String
    },
    description:{
        type: String,
        required: true
    },
    place: {
        type: String,
        required: true
    },
    reviews: [
        {
        type: schema.Types.ObjectId,
        ref: "Review"
        }
    ],
    owner: {
        type: schema.Types.ObjectId,
        ref: "User"
    },
    catagory:{
        type: String,
        enum: ["Mountains", "Desert", "Beach", "Coastal", "Arctic",
        "Tropical", "Lake", "Countryside", "Islands", "Camping",
        "Tiny Homes", "Farms", "Skiing", "National Parks"]
    }
})
const Apna= mongoose.model("Apna",apnaschema);

module.exports = Apna;