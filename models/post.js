const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: false
    },
    content: {
      type: String,
      required: true
    },
    creator: {
      type: Schema.Types.ObjectID,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
