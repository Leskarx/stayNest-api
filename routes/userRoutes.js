import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getUserStats
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadUserProfile, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/image', 
  uploadUserProfile, 
  handleUploadError, 
  uploadProfileImage
);
router.get('/stats', getUserStats);

export default router;