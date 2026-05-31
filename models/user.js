const mongoose = require("mongoose");
const schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userschema = new schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    }
});
userschema.plugin(passportLocalMongoose.default || passportLocalMongoose, {
    usernameField: "email"     // ← We will login using email
});

const User = mongoose.model("User", userschema);
module.exports = User;