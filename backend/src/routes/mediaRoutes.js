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

router.use(protect);

router.post(
  '/upload', 
  upload.array('mediaFiles', 50),
  uploadMedia
);

router.get('/event/:eventId', checkEventAccess, enforceEventAccess, getEventMedia);

router.get('/:mediaId/info', getMediaInfo);

router.get('/:mediaId/download', downloadMedia);

router.delete('/:mediaId', deleteMedia);

export default router;
