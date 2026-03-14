import express from 'express';
import { body } from 'express-validator';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  searchProperties,
  getMyProperties
} from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadPropertyImages as uploadImages, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const propertyValidation = [
  body('name').notEmpty().withMessage('Property name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('propertyType').isIn(['apartment', 'house', 'villa', 'cabin', 'cottage', 'studio'])
    .withMessage('Invalid property type'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.country').notEmpty().withMessage('Country is required'),
  body('location.postalCode').notEmpty().withMessage('Postal code is required'),
  body('pricePerNight').isNumeric().withMessage('Price must be a number'),
  body('maxGuests').isInt({ min: 1 }).withMessage('Max guests must be at least 1'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a number'),
  body('beds').isInt({ min: 1 }).withMessage('Beds must be at least 1'),
  body('bathrooms').isInt({ min: 1 }).withMessage('Bathrooms must be at least 1')
];

// Public routes
router.get('/', getProperties);
router.get('/search', searchProperties);
router.get('/:id', getProperty);

// Private routes
router.use(protect);

// Owner routes
router.post(
  '/',
  protect,
  authorize('owner'),
  uploadImages,
  handleUploadError,
  propertyValidation,
  createProperty
);

router.get('/owner/me', 
  authorize('owner'),
  getMyProperties
);

router.put('/:id', 
  authorize('owner'),
  updateProperty
);

router.delete('/:id', 
  authorize('owner'),
  deleteProperty
);

router.post('/:id/images',
  authorize('owner'),
  uploadImages,
  handleUploadError,
  uploadPropertyImages
);

export default router;