import express from 'express';
import {
  toggleLike,
  getLikeStatus,
  addComment,
  getComments,
  getNotifications,
  markNotificationsAsRead
} from '../controllers/interactionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/like', toggleLike);
router.get('/like/:mediaId', getLikeStatus);

router.post('/comment', addComment);
router.get('/comments/:mediaId', getComments);

router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsAsRead);

export default router;
