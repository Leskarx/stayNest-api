# Rental Platform Backend API

A complete backend API for a rental platform similar to Airbnb built with Node.js, Express, MongoDB, and Cloudinary.

## Features

- User authentication (JWT)
- Role-based access control (User/Owner)
- Property management
- Booking system
- Image upload with Cloudinary
- Search functionality
- Review system

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Cloudinary for image storage
- Multer for file upload

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your environment variables
4. Start the server:
   ```bash
   npm run dev
   ```

## API Documentation

### Auth Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Logout user

### Property Endpoints
- GET /api/properties - Get all properties
- GET /api/properties/search - Search properties
- GET /api/properties/:id - Get single property
- POST /api/properties - Create property (Owner)
- PUT /api/properties/:id - Update property (Owner)
- DELETE /api/properties/:id - Delete property (Owner)
- POST /api/properties/:id/images - Upload images (Owner)
- GET /api/properties/owner/me - Get owner's properties (Owner)

### Booking Endpoints
- POST /api/bookings - Create booking (User)
- GET /api/bookings/my-bookings - Get user's bookings (User)
- PUT /api/bookings/:id/cancel - Cancel booking (User)
- GET /api/bookings/property-bookings - Get property bookings (Owner)
- PUT /api/bookings/:id/confirm - Confirm booking (Owner)

### User Endpoints
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update profile
- POST /api/users/profile/image - Upload profile image
- GET /api/users/stats - Get user statistics

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rental_platform
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Author

Gouri Shankar Konwar
