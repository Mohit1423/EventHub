import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'DENIED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Compounding index to make sure a user can only have one active request per event
joinRequestSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
export default JoinRequest;
