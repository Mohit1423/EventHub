import mongoose from 'mongoose';

const eventMemberSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ['ADMIN', 'MEMBER'],
      default: 'MEMBER',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of user membership per event
eventMemberSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventMember = mongoose.model('EventMember', eventMemberSchema);
export default EventMember;
