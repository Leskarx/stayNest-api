import express from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getMyBookings,
  getPropertyBookings,
  cancelBooking,
  confirmBooking
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const bookingValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('guestsCount').isInt({ min: 1 }).withMessage('Guests count must be at least 1'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
    .withMessage('Invalid payment method')
];

// All routes require authentication
router.use(protect);

// User routes
router.post('/', bookingValidation, createBooking);
router.get('/my-bookings', getMyBookings);
router.put('/:id/cancel', cancelBooking);

// Owner routes
router.get('/property-bookings', 
  authorize('owner'),
  getPropertyBookings
);

router.put('/:id/confirm', 
  authorize('owner'),
  confirmBooking
);

export default router;