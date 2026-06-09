import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Media from '../models/Media.js';
import Notification from '../models/Notification.js';
import { sendRealtimeNotification } from '../services/socketService.js';

/**
 * Toggle Like/Unlike on a media item
 * POST /api/interactions/like
 */
export const toggleLike = async (req, res) => {
  const { mediaId } = req.body;

  try {
    if (!mediaId) {
      return res.status(400).json({ message: 'Media ID is required' });
    }

    const media = await Media.findById(mediaId).populate('eventId');
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const existingLike = await Like.findOne({ mediaId, userId: req.user._id });
    let liked = false;

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
    } else {
      // Like
      await Like.create({ mediaId, userId: req.user._id });
      liked = true;

      // Notify the uploader (if not self)
      if (media.uploaderId.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          userId: media.uploaderId,
          senderId: req.user._id,
          message: `${req.user.name} liked your photo in "${media.eventId.name}".`,
          type: 'LIKE',
          relatedId: media._id,
        });

        // Broadcast real-time
        sendRealtimeNotification(media.uploaderId, 'notification', {
          ...notification.toObject(),
          senderName: req.user.name,
          senderPicture: req.user.profilePicture,
        });
      }
    }

    // Return the updated like count and liked status
    const likeCount = await Like.countDocuments({ mediaId });
    res.json({ liked, likeCount });
  } catch (error) {
    console.error('Like toggle error:', error.message);
    res.status(500).json({ message: 'Server error toggling like', error: error.message });
  }
};

/**
 * Check if current user liked a media item and get total count
 * GET /api/interactions/like/:mediaId
 */
export const getLikeStatus = async (req, res) => {
  const { mediaId } = req.params;

  try {
    const likeCount = await Like.countDocuments({ mediaId });
    const liked = await Like.exists({ mediaId, userId: req.user._id });
    res.json({ liked: !!liked, likeCount });
  } catch (error) {
    res.status(500).json({ message: 'Error checking like status', error: error.message });
  }
};

/**
 * Add a comment to a media item
 * POST /api/interactions/comment
 */
export const addComment = async (req, res) => {
  const { mediaId, content } = req.body;

  try {
    if (!mediaId || !content) {
      return res.status(400).json({ message: 'Media ID and content are required' });
    }

    const media = await Media.findById(mediaId).populate('eventId');
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const comment = await Comment.create({
      mediaId,
      userId: req.user._id,
      content,
    });

    // Populate user info for frontend display
    const populatedComment = await comment.populate('userId', 'name profilePicture');

    // Notify the uploader (if not self)
    if (media.uploaderId.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        userId: media.uploaderId,
        senderId: req.user._id,
        message: `${req.user.name} commented: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}" on your photo.`,
        type: 'COMMENT',
        relatedId: media._id,
      });

      sendRealtimeNotification(media.uploaderId, 'notification', {
        ...notification.toObject(),
        senderName: req.user.name,
        senderPicture: req.user.profilePicture,
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Comment creation error:', error.message);
    res.status(500).json({ message: 'Server error saving comment', error: error.message });
  }
};

/**
 * Get all comments for a media item
 * GET /api/interactions/comments/:mediaId
 */
export const getComments = async (req, res) => {
  const { mediaId } = req.params;

  try {
    const comments = await Comment.find({ mediaId })
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error.message);
    res.status(500).json({ message: 'Server error fetching comments', error: error.message });
  }
};

/**
 * Fetch all notifications for the authenticated user
 * GET /api/interactions/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('senderId', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error.message);
    res.status(500).json({ message: 'Server error fetching notifications', error: error.message });
  }
};

/**
 * Mark all user notifications as read
 * PUT /api/interactions/notifications/read
 */
export const markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
};
