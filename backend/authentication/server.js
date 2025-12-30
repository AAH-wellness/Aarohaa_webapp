require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { testConnection, getDatabaseStatus } = require('./config/database');
const User = require('./models/User');
const Provider = require('./models/Provider');
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await getDatabaseStatus();
  res.json({
    status: 'ok',
    service: 'authentication-service',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// API routes
app.use('/api', require('./routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      status: 404
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Authentication service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API base: http://localhost:${PORT}/api`);
  
  // Test database connection on startup
  console.log('\n🔍 Testing database connection...');
  await testConnection();
  
  // Initialize database tables
  console.log('\n🔧 Initializing database tables...');
  try {
    await User.createTable();
    await Provider.createTable();
    await Booking.createTable();
    console.log('✅ All database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error);
  }
});

module.exports = app;

