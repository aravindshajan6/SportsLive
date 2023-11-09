const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: [3, "Must be minimum 3 characters"],
    },
    password: {
        type: String,
        required: true,
        min: [3, "Must be minimum 3 characters"],
        max: [3, "Must be maximum 8 characters"]
    },
    email: {
        type: String,
        required: true,
        
    }
});

let userModel = mongoose.model('userInfo', userSchema);

module.exports = userModel;