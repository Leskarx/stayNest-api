import { upload, uploadProfile } from '../utils/cloudinary.js';

// Accept both cover image and additional images
export const uploadPropertyImages = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

// Upload profile image
export const uploadUserProfile = uploadProfile.single('profileImage');

// Error handler
export const handleUploadError = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};