const express = require('express');
const router = express.Router();
const { 
  register, 
  registerProvider,
  login, 
  loginWithGoogle,
  completeGoogleProfile,
  logout, 
  deleteUser, 
  getProfile, 
  updateProfile,
  getProviderProfile,
  updateProviderProfile,
  getProviderAvailability,
  updateProviderAvailability,
  getAllProviders,
  getProviderAvailabilityById,
  createBooking,
  getUserBookings,
  getUpcomingBookings,
  getProviderBookings,
  cancelBooking
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { authenticateToken } = require('../middleware/auth');

// Register new user (ALWAYS creates role='user', NO provider record)
router.post('/register', validateRegister, register);

// Register new provider (creates record ONLY in providers table, NOT in users table)
router.post('/register/provider', validateRegister, registerProvider);

// Login user
router.post('/login', validateLogin, login);

// Login with Google OAuth
router.post('/login/google', loginWithGoogle);

// Complete Google profile (for Google OAuth users)
router.post('/profile/complete-google', authenticateToken, completeGoogleProfile);

// Logout user
router.post('/logout', logout);

// Get user profile (requires authentication)
router.get('/profile', authenticateToken, getProfile);
router.post('/profile', getProfile); // Also allow POST for backward compatibility

// Update user profile (requires authentication)
router.put('/profile', authenticateToken, updateProfile);
router.patch('/profile', authenticateToken, updateProfile);

// Provider routes
// Get all providers (public endpoint for user dashboard)
router.get('/providers', getAllProviders);

// Get provider availability by ID (public endpoint for booking page)
router.get('/providers/:providerId/availability', getProviderAvailabilityById);

// Get provider profile (requires authentication)
router.get('/provider/profile', authenticateToken, getProviderProfile);
router.post('/provider/profile', getProviderProfile); // Also allow POST for backward compatibility

// Update provider profile (requires authentication)
router.put('/provider/profile', authenticateToken, updateProviderProfile);
router.patch('/provider/profile', authenticateToken, updateProviderProfile);

// Get provider availability (requires authentication)
router.get('/provider/availability', authenticateToken, getProviderAvailability);
router.post('/provider/availability', getProviderAvailability); // Also allow POST for backward compatibility

// Update provider availability (requires authentication)
router.put('/provider/availability', authenticateToken, updateProviderAvailability);
router.patch('/provider/availability', authenticateToken, updateProviderAvailability);

// Booking routes
// Create booking (requires authentication)
router.post('/bookings', authenticateToken, createBooking);

// Get user bookings (requires authentication)
router.get('/bookings', authenticateToken, getUserBookings);
router.get('/bookings/upcoming', authenticateToken, getUpcomingBookings);

// Get provider bookings (requires authentication)
router.get('/bookings/provider', authenticateToken, getProviderBookings);
router.get('/provider/bookings', authenticateToken, getProviderBookings);

// Cancel booking (requires authentication)
router.post('/bookings/cancel', authenticateToken, cancelBooking);

// Delete user permanently (WARNING: This permanently deletes the user)
router.delete('/delete', deleteUser);

module.exports = router;

