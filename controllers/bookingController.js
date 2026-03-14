import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import { validationResult } from 'express-validator';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    console.log(req.body);
    
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({
    //     success: false,
    //     errors: errors.array()
    //   });
    // }

    const { propertyId, checkIn, checkOut, guestsCount, paymentMethod, specialRequests } = req.body;

    // Check if property exists and is available
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (!property.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Property is not available for booking'
      });
    }

    // Check if guests count exceeds max guests
    if (guestsCount > property.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Maximum guests allowed is ${property.maxGuests}`
      });
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      property: propertyId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) }
        }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Property is already booked for these dates'
      });
    }

    // Calculate total price
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * property.pricePerNight;

    // Create booking
    const booking = await Booking.create({
      property: propertyId,
      user: req.user.id,
      checkIn,
      checkOut,
      guestsCount,
      totalPrice,
      paymentMethod,
      specialRequests,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.log("error in booking",error);
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'property',
        select: 'name location pricePerNight coverImage'
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get owner's property bookings
// @route   GET /api/bookings/property-bookings
// @access  Private (Owner only)
export const getPropertyBookings = async (req, res) => {
  try {
    // Get all properties owned by user
    const properties = await Property.find({ owner: req.user.id }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const bookings = await Booking.find({ property: { $in: propertyIds } })
      .populate('user', 'name email profileImage')
      .populate('property', 'name location')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed bookings cannot be cancelled'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// @desc    Confirm booking (Owner action)
// @route   PUT /api/bookings/:id/confirm
// @access  Private (Owner only)
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('property');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the property
    if (booking.property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this booking'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be confirmed as it is ${booking.status}`
      });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};