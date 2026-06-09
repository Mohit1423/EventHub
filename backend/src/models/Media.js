import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['IMAGE', 'VIDEO'],
      default: 'IMAGE',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    taggedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
  },
  {
    timestamps: true,
  }
);

const Media = mongoose.model('Media', mediaSchema);
export default Media;
