import EventMember from '../models/EventMember.js';
import JoinRequest from '../models/JoinRequest.js';
import Notification from '../models/Notification.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Media from '../models/Media.js';
import { deleteFile } from '../services/storageService.js';
import { sendRealtimeNotification, broadcastToEvent } from '../services/socketService.js';

/**
 * Send a request to join an Event
 * POST /api/events/:eventId/join-request
 */
export const sendJoinRequest = async (req, res) => {
  const { eventId } = req.params;

  try {
    // checkEventAccess middleware already ran, so req.event is populated
    const event = req.event;

    // Check if already a member
    const existingMember = await EventMember.findOne({ eventId, userId: req.user._id });
    if (existingMember) {
      return res.status(400).json({ message: 'You are already a member of this event' });
    }

    // Check if there is an existing pending/approved request
    const existingRequest = await JoinRequest.findOne({ eventId, userId: req.user._id });
    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({ message: 'You already have a pending join request for this event' });
      } else if (existingRequest.status === 'APPROVED') {
        return res.status(400).json({ message: 'Your join request was already approved' });
      }
      // If DENIED, we let them request again by resetting status to PENDING
      existingRequest.status = 'PENDING';
      await existingRequest.save();
      return res.status(200).json({ message: 'Join request re-submitted', request: existingRequest });
    }

    const request = await JoinRequest.create({
      eventId,
      userId: req.user._id,
      status: 'PENDING',
    });

    // Notify Event Creator/Admin
    const notification = await Notification.create({
      userId: event.createdById,
      senderId: req.user._id,
      message: `${req.user.name} has requested to join your event "${event.name}".`,
      type: 'JOIN_REQUEST',
      relatedId: event._id,
    });

    // Send real-time notification
    sendRealtimeNotification(event.createdById, 'notification', {
      ...notification.toObject(),
      senderName: req.user.name,
      senderPicture: req.user.profilePicture,
    });

    // Broadcast join request list update in real-time
    broadcastToEvent(eventId, 'requests_updated');

    res.status(201).json({ message: 'Join request sent successfully', request });
  } catch (error) {
    console.error('Error sending join request:', error.message);
    res.status(500).json({ message: 'Server error sending join request', error: error.message });
  }
};

/**
 * List all pending join requests for an event
 * GET /api/events/:eventId/join-requests
 * Restricted to Event Admin (requireEventAdmin middleware)
 */
export const getJoinRequests = async (req, res) => {
  const { eventId } = req.params;

  try {
    const requests = await JoinRequest.find({ eventId, status: 'PENDING' })
      .populate('userId', 'name email bio profilePicture')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching join requests:', error.message);
    res.status(500).json({ message: 'Server error fetching requests', error: error.message });
  }
};

/**
 * Approve or Deny a join request
 * PUT /api/events/:eventId/join-requests/:requestId
 * Restricted to Event Admin
 */
export const handleJoinRequest = async (req, res) => {
  const { eventId, requestId } = req.params;
  const { status } = req.body; // 'APPROVED' or 'DENIED'

  try {
    if (!['APPROVED', 'DENIED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Choose APPROVED or DENIED' });
    }

    const request = await JoinRequest.findById(requestId).populate('userId', 'name email');
    if (!request || request.eventId.toString() !== eventId) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    request.status = status;
    await request.save();

    const event = req.event;

    if (status === 'APPROVED') {
      // Create EventMember
      await EventMember.create({
        eventId,
        userId: request.userId._id,
        role: 'MEMBER',
      });

      // Send approval notification
      const notification = await Notification.create({
        userId: request.userId._id,
        senderId: req.user._id,
        message: `Your request to join "${event.name}" was approved!`,
        type: 'JOIN_APPROVED',
        relatedId: eventId,
      });

      sendRealtimeNotification(request.userId._id, 'notification', {
        ...notification.toObject(),
        senderName: req.user.name,
        senderPicture: req.user.profilePicture,
      });
    } else {
      // Send denial notification
      const notification = await Notification.create({
        userId: request.userId._id,
        senderId: req.user._id,
        message: `Your request to join "${event.name}" was declined.`,
        type: 'JOIN_DENIED',
        relatedId: eventId,
      });

      sendRealtimeNotification(request.userId._id, 'notification', {
        ...notification.toObject(),
        senderName: req.user.name,
        senderPicture: req.user.profilePicture,
      });
    }

    // Broadcast request approval/denial and membership changes in real-time
    broadcastToEvent(eventId, 'requests_updated');
    broadcastToEvent(eventId, 'membership_updated', { userId: request.userId._id, status });

    res.json({ message: `Request successfully ${status.toLowerCase()}`, request });
  } catch (error) {
    console.error('Error handling join request:', error.message);
    res.status(500).json({ message: 'Server error handling request', error: error.message });
  }
};

/**
 * List all members of an Event
 * GET /api/events/:eventId/members
 */
export const getEventMembers = async (req, res) => {
  const { eventId } = req.params;

  try {
    const members = await EventMember.find({ eventId })
      .populate('userId', 'name email bio profilePicture')
      .sort({ role: 1, createdAt: 1 }); // Admins first

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error.message);
    res.status(500).json({ message: 'Server error fetching members', error: error.message });
  }
};

/**
 * Remove a member from the event
 * DELETE /api/events/:eventId/members/:memberUserId
 * Restricted to Event Admin
 */
export const removeMember = async (req, res) => {
  const { eventId, memberUserId } = req.params;

  try {
    // Creator cannot be removed
    const event = req.event;
    if (event.createdById.toString() === memberUserId) {
      return res.status(400).json({ message: 'Cannot remove the event creator/owner.' });
    }

    const member = await EventMember.findOne({ eventId, userId: memberUserId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found in this event' });
    }

    await EventMember.deleteOne({ _id: member._id });
    
    // Clean up active Join Requests if any, so they can re-request later
    await JoinRequest.deleteOne({ eventId, userId: memberUserId });

    // Cascade delete: Fetch all media uploaded by the removed user in this event
    const userMedia = await Media.find({ eventId, uploaderId: memberUserId });
    for (const media of userMedia) {
      // Delete database comments and likes for this media
      await Like.deleteMany({ mediaId: media._id });
      await Comment.deleteMany({ mediaId: media._id });

      // Physical storage file delete
      try {
        await deleteFile(media.filename);
      } catch (err) {
        console.error(`Failed to delete user media file ${media.filename}:`, err.message);
      }

      // Delete related notifications
      await Notification.deleteMany({ relatedId: media._id });

      // Delete media entry
      await Media.deleteOne({ _id: media._id });
    }

    // Broadcast membership and media updates in real-time
    broadcastToEvent(eventId, 'membership_updated', { userId: memberUserId, status: 'REMOVED' });
    broadcastToEvent(eventId, 'media_updated', { action: 'delete_bulk' });

    res.json({ message: 'Member successfully removed and their uploaded media deleted' });
  } catch (error) {
    console.error('Error removing member:', error.message);
    res.status(500).json({ message: 'Server error removing member', error: error.message });
  }
};

/**
 * Leave the event
 * DELETE /api/events/:eventId/leave
 * Accessible to event members
 */
export const leaveEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = req.event;
    if (event.createdById.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'The creator cannot leave the event. You must delete the event instead.' });
    }

    const member = await EventMember.findOne({ eventId, userId: req.user._id });
    if (!member) {
      return res.status(400).json({ message: 'You are not a member of this event' });
    }

    await EventMember.deleteOne({ _id: member._id });
    await JoinRequest.deleteOne({ eventId, userId: req.user._id });

    // Cascade delete: Fetch all media uploaded by the leaving user in this event
    const userMedia = await Media.find({ eventId, uploaderId: req.user._id });
    for (const media of userMedia) {
      // Delete database comments and likes for this media
      await Like.deleteMany({ mediaId: media._id });
      await Comment.deleteMany({ mediaId: media._id });

      // Physical storage file delete
      try {
        await deleteFile(media.filename);
      } catch (err) {
        console.error(`Failed to delete user media file ${media.filename}:`, err.message);
      }

      // Delete related notifications
      await Notification.deleteMany({ relatedId: media._id });

      // Delete face references from Azure FaceList
      if (media.faceIds && media.faceIds.length > 0) {
        try {
          await deleteMediaFaces(media.faceIds);
        } catch (azureErr) {
          console.error(`Failed to delete Azure faces for media ${media._id}:`, azureErr.message);
        }
      }

      // Delete media entry
      await Media.deleteOne({ _id: media._id });
    }

    // Broadcast membership and media updates in real-time
    broadcastToEvent(eventId, 'membership_updated', { userId: req.user._id, status: 'LEFT' });
    broadcastToEvent(eventId, 'media_updated', { action: 'delete_bulk' });

    res.json({ message: 'Successfully left the event and all your uploaded media was deleted' });
  } catch (error) {
    console.error('Error leaving event:', error.message);
    res.status(500).json({ message: 'Server error leaving event', error: error.message });
  }
};
