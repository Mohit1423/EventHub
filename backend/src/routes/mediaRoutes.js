import express from 'express';
import { 
  uploadMedia, 
  getEventMedia, 
  downloadMedia, 
  deleteMedia,
  getMediaInfo
} from '../controllers/mediaController.js';
import { protect, checkEventAccess, enforceEventAccess } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect); // All media routes require JWT authentication

// Upload files (single/bulk)
router.post(
  '/upload', 
  upload.array('mediaFiles', 50), // Allow up to 50 files in bulk upload
  uploadMedia
);

// Get all accessible media in an event
router.get('/event/:eventId', checkEventAccess, enforceEventAccess, getEventMedia);

// Get media details (e.g. eventId) from notification
router.get('/:mediaId/info', getMediaInfo);

// Download media with dynamic watermark
router.get('/:mediaId/download', downloadMedia);

// Delete media (uploader or event admin only)
router.delete('/:mediaId', deleteMedia);

export default router;
