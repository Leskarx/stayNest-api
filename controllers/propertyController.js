import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { validationResult } from 'express-validator';
import { cloudinary } from '../utils/cloudinary.js';

// @desc    Create new property
// @route   POST /api/properties
// @access  Private (Owner only)
export const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const propertyData = {
      ...req.body,
      owner: req.user.id
    };

    // Fix nested location from FormData
    if (req.body.location) {
      propertyData.location = req.body.location;
    } else {
      propertyData.location = {
        address: req.body['location[address]'],
        city: req.body['location[city]'],
        state: req.body['location[state]'],
        country: req.body['location[country]'],
        postalCode: req.body['location[postalCode]']
      };
    }

    // Handle cover image
    if (req.files?.coverImage && req.files.coverImage.length > 0) {
      const cover = req.files.coverImage[0];

      propertyData.coverImage = {
        public_id: cover.filename,
        url: cover.path
      };
    }

    // Handle additional images
    if (req.files?.images && req.files.images.length > 0) {
      propertyData.images = req.files.images.map(file => ({
        public_id: file.filename,
        url: file.path
      }));
    }

    const property = await Property.create(propertyData);

    res.status(201).json({
      success: true,
      data: property
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
export const getProperties = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      minPrice, 
      maxPrice, 
      propertyType,
      guests,
      city,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    // Filter by price
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    // Filter by property type
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Filter by guests capacity
    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    // Filter by city
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Only show available properties
    query.isAvailable = true;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const properties = await Property.find(query)
      .populate('owner', 'name email profileImage')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Property.countDocuments(query);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
export const getProperty = async (req, res) => {
  try {
    console.log("received..........");
    
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email profileImage phoneNumber')
      .populate('reviews');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.log("---------->",error);
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Owner only)
export const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this property'
      });
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Owner only)
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property'
      });
    }

    // Delete images from Cloudinary
    if (property.images && property.images.length > 0) {
      for (const image of property.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    if (property.coverImage && property.coverImage.public_id) {
      await cloudinary.uploader.destroy(property.coverImage.public_id);
    }

    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Upload property images
// @route   POST /api/properties/:id/images
// @access  Private (Owner only)
export const uploadPropertyImages = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this property'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    const images = req.files.map(file => ({
      public_id: file.filename,
      url: file.path
    }));

    property.images = [...property.images, ...images];
    await property.save();

    res.status(200).json({
      success: true,
      data: property.images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Search properties
// @route   GET /api/properties/search
// @access  Public
export const searchProperties = async (req, res) => {
  try {
    const { query, postalCode, city, propertyName } = req.query;
    
    let searchQuery = { isAvailable: true };

    if (query) {
      searchQuery.$text = { $search: query };
    } else if (postalCode) {
      searchQuery['location.postalCode'] = { $regex: postalCode, $options: 'i' };
    } else if (city) {
      searchQuery['location.city'] = { $regex: city, $options: 'i' };
    } else if (propertyName) {
      searchQuery.name = { $regex: propertyName, $options: 'i' };
    }

    const properties = await Property.find(searchQuery)
      .populate('owner', 'name email profileImage')
      .limit(20);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get owner's properties
// @route   GET /api/properties/owner/me
// @access  Private (Owner only)
export const getMyProperties = async (req, res) => {
  try {
    console.log(req.user["_id"]);
    
    const properties = await Property.find({ owner: req.user["_id"] })
      .populate('reviews');

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};