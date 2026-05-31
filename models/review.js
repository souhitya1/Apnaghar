const mongoose = require("mongoose");
const schema = mongoose.Schema;

const reviewschema = new schema({
    Comments:{
        type: String
    },
    rating:{
        type: String,
        min: 1,
        max: 5
    },
    Created_at:{
      type:  Date,
      default: Date.now()
    },
    author: {
        type: schema.Types.ObjectId,
        ref: "User"
    }
})
const Review = mongoose.model("Review",reviewschema);
module.exports = Review;