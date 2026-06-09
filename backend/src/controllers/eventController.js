import Event from '../models/Event.js';
import EventMember from '../models/EventMember.js';
import JoinRequest from '../models/JoinRequest.js';
import Media from '../models/Media.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import { deleteFile } from '../services/storageService.js';
import { broadcastToEvent } from '../services/socketService.js';

export const createEvent = async (req, res) => {
  const { name, description, date, category } = req.body;

  try {
    if (!name || !date || !category) {
      return res.status(400).json({ message: 'Please provide event name, date, and category' });
    }

    const event = await Event.create({
      name,
      description,
      date,
      category,
      isPublic: true,
      createdById: req.user._id,
    });

    await EventMember.create({
      eventId: event._id,
      userId: req.user._id,
      role: 'ADMIN',
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).json({ message: 'Server error creating event', error: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }).populate('createdById', 'name email');

    const mappedEvents = await Promise.all(
      events.map(async (event) => {
        const isCreator = event.createdById._id.toString() === req.user._id.toString();

        const member = await EventMember.findOne({ eventId: event._id, userId: req.user._id });
        const isMember = !!member;
        const role = member ? member.role : (isCreator ? 'ADMIN' : null);

        const request = await JoinRequest.findOne({ eventId: event._id, userId: req.user._id });
        const requestStatus = request ? request.status : null;

        const isLocked = !event.isPublic && !isMember;

        return {
          _id: event._id,
          name: event.name,
          description: event.description,
          date: event.date,
          category: event.category,
          isPublic: event.isPublic,
          creator: event.createdById,
          isLocked,
          isMember,
          role,
          requestStatus,
        };
      })
    );

    res.json(mappedEvents);
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ message: 'Server error fetching events', error: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
   
    const request = await JoinRequest.findOne({ eventId: req.event._id, userId: req.user._id });
    const requestStatus = request ? request.status : null;

    const populatedEvent = await req.event.populate('createdById', 'name email profilePicture');

    res.json({
      ...populatedEvent.toObject(),
      isMember: req.isEventMember,
      role: req.eventMembership ? req.eventMembership.role : (req.isEventAdmin ? 'ADMIN' : null),
      isLocked: !req.event.isPublic && !req.isEventMember,
      requestStatus,
    });
  } catch (error) {
    console.error('Error fetching event detail:', error.message);
    res.status(500).json({ message: 'Server error fetching event details', error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  const { category, name, description } = req.body;
  try {
    const event = req.event;
    
    if (category !== undefined) event.category = category;
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    event.isPublic = true;

    await event.save();

    broadcastToEvent(event._id, 'event_updated');

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error.message);
    res.status(500).json({ message: 'Server error updating event', error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isCreator = event.createdById.toString() === req.user._id.toString();
    const membership = await EventMember.findOne({ eventId, userId: req.user._id });
    const isAdmin = isCreator || (membership && membership.role === 'ADMIN');

    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Only the event creator or an administrator can delete this event.' });
    }

    console.log(`Cascade deleting event ${eventId} ("${event.name}")...`);

    const eventMedia = await Media.find({ eventId });
    for (const media of eventMedia) {
     
      await Like.deleteMany({ mediaId: media._id });
      await Comment.deleteMany({ mediaId: media._id });

      await Notification.deleteMany({ relatedId: media._id });

      try {
        await deleteFile(media.filename);
      } catch (fileErr) {
        console.error(`Failed to delete physical file ${media.filename}:`, fileErr.message);
      }

      await Media.deleteOne({ _id: media._id });
    }

    await EventMember.deleteMany({ eventId });

    await JoinRequest.deleteMany({ eventId });

    await Notification.deleteMany({ relatedId: eventId });

    await Event.deleteOne({ _id: eventId });

    broadcastToEvent(eventId, 'media_updated', { action: 'delete_bulk' });
    broadcastToEvent(eventId, 'event_updated', { action: 'delete', eventId });

    res.json({ message: 'Event and all its associated content deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error.message);
    res.status(500).json({ message: 'Server error deleting event', error: error.message });
  }
};
