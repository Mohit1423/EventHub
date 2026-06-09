import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Media from '../models/Media.js';
import { uploadFile } from '../services/storageService.js';

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const nameExists = await User.findOne({ name });
    if (nameExists) {
      return res.status(400).json({ message: 'User already exists with this name' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

/**
 * Authenticate user & get token
 * POST /api/auth/login
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        hasSelfie: !!user.referenceFaceDescriptor,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (user) {
      res.json({
        ...user.toObject(),
        hasSelfie: !!user.referenceFaceDescriptor,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
};

/**
 * Update user profile (bio, profile picture, or reference selfie)
 * PUT /api/auth/profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update bio if provided
    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }

    // Update profile picture if uploaded
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture[0];
      const uploadResult = await uploadFile(file.buffer, file.originalname, file.mimetype);
      user.profilePicture = uploadResult.url;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      hasSelfie: !!user.referenceFaceDescriptor,
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

/**
 * Get another user's public profile
 * GET /api/auth/users/:userId
 */
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email bio profilePicture');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching public profile:', error.message);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
};
