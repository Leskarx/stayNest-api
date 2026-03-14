import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide property name'],
    trim: true,
    maxlength: [100, 'Property name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide property description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'cabin', 'cottage', 'studio'],
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    country: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Please provide price per night'],
    min: 0
  },
  maxGuests: {
    type: Number,
    required: [true, 'Please provide maximum number of guests'],
    min: 1
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },
  beds: {
    type: Number,
    required: true,
    min: 1
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 1
  },
  amenities: [{
    type: String,
    enum: [
     'wifi', 'pool', 'kitchen', 'parking', 'gym', 'ac', 
'washer', 'tv', 'fireplace', 'balcony', 'beach access', 
'bbq', 'dryer', 'heating', 'dedicated workspace', 'hair dryer', 
'iron', 'hot tub', 'free parking', 'ev charger', 'crib', 'king bed', 
'breakfast', 'smoking allowed', 'beachfront', 'waterfront', 
'smoke alarm', 'carbon monoxide alarm', 'first aid kit', 
'fire extinguisher', 'essentials', 'shampoo', 'hangers', 'self check-in'
    ]
  }],
  images: [{
    public_id: String,
    url: String
  }],
  coverImage: {
    public_id: String,
    url: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'flexible'
  },
  checkInTime: {
    type: String,
    default: '15:00'
  },
  checkOutTime: {
    type: String,
    default: '11:00'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
propertySchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'property',
  justOne: false
});

// Index for search functionality
propertySchema.index({ 
  'location.postalCode': 'text', 
  'location.city': 'text',
  'location.address': 'text',
  name: 'text' 
});

const Property = mongoose.model('Property', propertySchema);
export default Property;