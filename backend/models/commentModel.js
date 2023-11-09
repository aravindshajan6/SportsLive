const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    matchId: {
        type: Number,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },

    userComment: {
        type: String,
        required: true,
    },
});

let commentModel = mongoose.model('commentsInfo', commentSchema);

module.exports = commentModel;
