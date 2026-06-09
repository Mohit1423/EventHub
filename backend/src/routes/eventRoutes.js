import express from 'express';
import { 
  createEvent, 
  getEvents, 
  getEventById,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import {
  sendJoinRequest,
  getJoinRequests,
  handleJoinRequest,
  getEventMembers,
  removeMember,
  leaveEvent
} from '../controllers/memberController.js';
import { 
  protect, 
  checkEventAccess, 
  enforceEventAccess,
  requireEventAdmin 
} from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All event routes require authentication

// Event listing and creation
router.post('/', createEvent);
router.get('/', getEvents);

// Single event metadata (non-members can fetch to see if it's locked/request join)
router.get('/:eventId', checkEventAccess, getEventById);
router.put('/:eventId', checkEventAccess, requireEventAdmin, updateEvent);
router.delete('/:eventId', checkEventAccess, requireEventAdmin, deleteEvent);

// Membership join requests
router.post('/:eventId/join-request', checkEventAccess, sendJoinRequest);
router.get('/:eventId/join-requests', checkEventAccess, requireEventAdmin, getJoinRequests);
router.put('/:eventId/join-requests/:requestId', checkEventAccess, requireEventAdmin, handleJoinRequest);

// Event Member list and management
router.get('/:eventId/members', checkEventAccess, enforceEventAccess, getEventMembers);
router.delete('/:eventId/members/:memberUserId', checkEventAccess, requireEventAdmin, removeMember);
router.delete('/:eventId/leave', checkEventAccess, leaveEvent);

export default router;
