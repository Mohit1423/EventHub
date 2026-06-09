import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getPublicProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getUserProfile);
router.get('/users/:userId', protect, getPublicProfile);
router.put(
  '/profile', 
  protect, 
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), 
  updateUserProfile
);

export default router;
