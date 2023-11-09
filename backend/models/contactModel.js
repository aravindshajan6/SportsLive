const mongoose = require('mongoose');

const contactSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },

    message: {
        type: String,
        required: true,
    },
});

let contactModel = mongoose.model('contactInfo', contactSchema);

module.exports = contactModel;
