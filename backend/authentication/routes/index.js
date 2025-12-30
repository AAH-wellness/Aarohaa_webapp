const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
// const userRoutes = require('./user');

// Mount routes
router.use('/users', authRoutes); // Mount auth routes under /users to match API contract

// Placeholder route
router.get('/', (req, res) => {
  res.json({
    message: 'Authentication Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      register: 'POST /api/users/register',
      login: 'POST /api/users/login',
      logout: 'POST /api/users/logout'
    }
  });
});

module.exports = router;

