import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Event from '../models/Event.js';
import EventMember from '../models/EventMember.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ message: 'User session no longer valid' });
      }
      return next();
    } catch (error) {
      console.error('JWT authentication error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const checkEventAccess = async (req, res, next) => {
  const eventId = req.params.eventId || req.body.eventId;
  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    req.event = event;
    req.isEventAdmin = false;
    req.isEventMember = false;
    req.eventMembership = null;

    if (event.createdById.toString() === req.user._id.toString()) {
      req.isEventAdmin = true;
      req.isEventMember = true;
    }

    const membership = await EventMember.findOne({ eventId, userId: req.user._id });
    if (membership) {
      req.eventMembership = membership;
      req.isEventMember = true;
      if (membership.role === 'ADMIN') {
        req.isEventAdmin = true;
      }
    }

    next();
  } catch (error) {
    console.error('checkEventAccess error:', error.message);
    return res.status(500).json({ message: 'Error checking event permissions', error: error.message });
  }
};

export const enforceEventAccess = (req, res, next) => {
  if (!req.event.isPublic && !req.isEventMember) {
    return res.status(403).json({ 
      message: 'Access Denied: This is a private event. You must be an approved member to view details.',
      isPrivateEvent: true,
      hasJoined: false
    });
  }
  next();
};

export const requireEventAdmin = (req, res, next) => {
  if (!req.isEventAdmin) {
    return res.status(403).json({ message: 'Forbidden: Admin access required for this action' });
  }
  next();
};
