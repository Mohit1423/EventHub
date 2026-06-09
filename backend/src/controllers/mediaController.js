import mongoose from 'mongoose';
import Media from '../models/Media.js';
import Event from '../models/Event.js';
import EventMember from '../models/EventMember.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import { uploadFile, getFileBuffer, deleteFile, getBlobSasUrl } from '../services/storageService.js';
import { generateImageTags } from '../services/aiService.js';
import { applyWatermark } from '../services/watermarkService.js';
import { sendRealtimeNotification, broadcastToEvent } from '../services/socketService.js';

export const uploadMedia = async (req, res) => {
  const { eventId, isPublic, taggedUsers } = req.body;

  try {
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const membership = await EventMember.findOne({ eventId, userId: req.user._id });
    const isCreator = event.createdById.toString() === req.user._id.toString();
    
    if (!isCreator && (!membership || membership.role !== 'ADMIN' && membership.role !== 'MEMBER')) {
      return res.status(403).json({ message: 'Forbidden: Only event members/admins can upload media.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No media files provided for upload' });
    }

    let parsedTaggedUsers = [];
    if (taggedUsers) {
      try {
        parsedTaggedUsers = JSON.parse(taggedUsers);
      } catch (err) {
       
        if (typeof taggedUsers === 'string') {
          parsedTaggedUsers = taggedUsers.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    const uploadedMediaList = [];

    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video');

      const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype);

      let tags = [];
      const mediaId = new mongoose.Types.ObjectId();

      if (!isVideo) {
        try {
          console.log(`Analyzing AI features for tagging: ${file.originalname}`);

          tags = await generateImageTags(file.buffer, file.originalname);
          
          console.log(`AI Analysis complete. Tags: [${tags.join(', ')}]`);
        } catch (aiErr) {
          console.error(`AI analysis failed for ${file.originalname}:`, aiErr.message);
        }
      } else {
        tags = ['video', 'media'];
      }

      const media = await Media.create({
        _id: mediaId,
        eventId,
        uploaderId: req.user._id,
        url: uploadResult.url,
        filename: uploadResult.filename,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        isPublic: isPublic !== undefined ? isPublic === 'true' || isPublic === true : true,
        tags,
        taggedUsers: parsedTaggedUsers,
      });

      for (const taggedUserId of parsedTaggedUsers) {
        if (taggedUserId.toString() === req.user._id.toString()) continue;

        const notification = await Notification.create({
          userId: taggedUserId,
          senderId: req.user._id,
          message: `${req.user.name} tagged you in a photo in event "${event.name}".`,
          type: 'TAG',
          relatedId: media._id,
        });

        sendRealtimeNotification(taggedUserId.toString(), 'notification', {
          ...notification.toObject(),
          senderName: req.user.name,
          senderPicture: req.user.profilePicture,
        });
      }

      uploadedMediaList.push(media);
    }

    broadcastToEvent(eventId, 'media_updated', { action: 'upload', count: uploadedMediaList.length });

    res.status(201).json({
      message: `Successfully uploaded ${uploadedMediaList.length} media file(s)`,
      media: uploadedMediaList,
    });
  } catch (error) {
    import('fs').then(fs => fs.appendFileSync('upload_error.log', new Date().toISOString() + ' ' + (error.stack || error.message) + '\n'));
    console.error('Upload media error:', error.message);
    res.status(500).json({ message: 'Server error uploading media', error: error.message });
  }
};

export const getEventMedia = async (req, res) => {
  const { eventId } = req.params;

  try {
   
    const event = req.event;
    const isMember = req.isEventMember;

    let mediaQuery = { eventId };

    if (!isMember) {
      mediaQuery.isPublic = true;
    }

    const mediaList = await Media.find(mediaQuery)
      .populate('uploaderId', 'name email profilePicture')
      .populate('taggedUsers', 'name email profilePicture')
      .sort({ createdAt: -1 });

    const mediaWithSas = await Promise.all(mediaList.map(async (media) => {
      const doc = media.toObject();
      doc.url = await getBlobSasUrl(media.filename);
      return doc;
    }));

    res.json(mediaWithSas);
  } catch (error) {
    console.error('Error fetching event media:', error.message);
    res.status(500).json({ message: 'Server error fetching media', error: error.message });
  }
};

export const downloadMedia = async (req, res) => {
  const { mediaId } = req.params;

  try {
    const media = await Media.findById(mediaId).populate('eventId');
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const event = media.eventId;

    const isCreator = event.createdById.toString() === req.user._id.toString();
    const membership = await EventMember.findOne({ eventId: event._id, userId: req.user._id });
    const isMember = !!membership || isCreator;
    const role = isCreator ? 'ADMIN' : (membership ? membership.role : 'Viewer');

    if (!event.isPublic && !isMember) {
      return res.status(403).json({ message: 'Access Denied: Private Event' });
    }

    if (!media.isPublic && !isMember) {
      return res.status(403).json({ message: 'Access Denied: Private Media file' });
    }

    const fileBuffer = await getFileBuffer(media.filename, media.url);

    const isUploader = media.uploaderId.toString() === req.user._id.toString();
    const shouldWatermark = true;

    if (shouldWatermark && media.type === 'IMAGE') {
      console.log(`Applying watermark for user ${req.user.name} on ${media.filename}...`);
      const watermarkedBuffer = await applyWatermark(fileBuffer, {
        clubName: event.category || 'Club',
        eventName: event.name || 'Event',
        userRole: role,
      });

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="watermarked_${media.filename}"`);
      return res.send(watermarkedBuffer);
    }

    const mimeType = media.type === 'VIDEO' ? 'video/mp4' : 'image/jpeg';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${media.filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download media error:', error.message);
    res.status(500).json({ message: 'Server error downloading media file', error: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  const { mediaId } = req.params;

  try {
    const media = await Media.findById(mediaId).populate('eventId');
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const event = media.eventId;

    const isUploader = media.uploaderId.toString() === req.user._id.toString();
    const isCreator = event.createdById.toString() === req.user._id.toString();
    const membership = await EventMember.findOne({ eventId: event._id, userId: req.user._id });
    const isAdmin = isCreator || (membership && membership.role === 'ADMIN');

    if (!isUploader && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this media.' });
    }

    await Like.deleteMany({ mediaId });
    await Comment.deleteMany({ mediaId });

    try {
      await deleteFile(media.filename);
    } catch (err) {
      console.error(`Failed to delete storage file ${media.filename}:`, err.message);
    }

    await Notification.deleteMany({ relatedId: mediaId });

    await Media.deleteOne({ _id: mediaId });

    broadcastToEvent(event._id, 'media_updated', { action: 'delete', mediaId });

    res.json({ message: 'Media successfully deleted' });
  } catch (error) {
    console.error('Delete media error:', error.message);
    res.status(500).json({ message: 'Server error deleting media', error: error.message });
  }
};

export const getMediaInfo = async (req, res) => {
  try {
    const media = await Media.findById(req.params.mediaId);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    res.json({ eventId: media.eventId, mediaId: media._id });
  } catch (error) {
    console.error('Error fetching media info:', error.message);
    res.status(500).json({ message: 'Server error fetching media information' });
  }
};
