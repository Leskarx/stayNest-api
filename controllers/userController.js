import User from '../models/User.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import { cloudinary } from '../utils/cloudinary.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, email } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (email) user.email = email;
    
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const user = await User.findById(req.user.id);

    // Delete old profile image if exists
    if (user.profileImage && user.profileImage.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }

    user.profileImage = {
      public_id: req.file.filename,
      url: req.file.path
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: user.profileImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    if (req.user.role === 'owner') {
      // Get owner stats
      const properties = await Property.find({ owner: req.user.id });
      const propertyIds = properties.map(p => p._id);

      const totalBookings = await Booking.countDocuments({
        property: { $in: propertyIds },
        status: 'confirmed'
      });

      const totalRevenue = await Booking.aggregate([
        {
          $match: {
            property: { $in: propertyIds },
            status: 'confirmed',
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalProperties: properties.length,
          totalBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          properties: properties.map(p => ({
            id: p._id,
            name: p.name,
            bookings: p.numReviews || 0,
            rating: p.rating
          }))
        }
      });
    } else {
      // Get user stats
      const totalBookings = await Booking.countDocuments({
        user: req.user.id
      });

      const upcomingBookings = await Booking.countDocuments({
        user: req.user.id,
        checkIn: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      });

      res.status(200).json({
        success: true,
        data: {
          totalBookings,
          upcomingBookings
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};