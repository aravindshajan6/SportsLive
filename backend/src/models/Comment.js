'use strict';

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    username: { type: String, required: true }, // denormalized for cheap listing
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
  },
  { timestamps: true },
);

commentSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    matchId: this.matchId,
    username: this.username,
    text: this.text,
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
  };
};

module.exports = mongoose.model('Comment', commentSchema);
