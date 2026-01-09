/**
 * Authentication Service Server
 * 
 * Express server for handling authentication, user management, and provider operations
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus.connected ? 'connected' : 'disconnected',
      service: 'authentication-service',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Aarohaa Wellness Authentication Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      register: 'POST /api/users/register',
      login: 'POST /api/users/login',
      loginGoogle: 'POST /api/users/login/google',
      logout: 'POST /api/users/logout',
      profile: 'GET /api/users/profile',
      providers: 'GET /api/users/providers'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: {
        message: 'Database connection failed. Please check your database configuration.',
        code: 'DATABASE_ERROR',
        status: 503
      }
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR',
        status: 400
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Invalid or expired token',
        code: 'AUTH_ERROR',
        status: 401
      }
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      status: 404,
      path: req.path
    }
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbTest = await testConnection();
    
    if (!dbTest.connected) {
      console.error('❌ Database connection failed:', dbTest.error);
      console.error('Please check your DATABASE_URL in .env file');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    
    // Initialize tables
    console.log('🔧 Initializing database tables...');
    const User = require('./models/User');
    const Provider = require('./models/Provider');
    const Booking = require('./models/Booking');
    const UserLoginEvent = require('./models/UserLoginEvent');
    await User.createTable();
    await Provider.createTable();
    await Booking.createTable(); // user_bookings and provider_bookings already exist
    await UserLoginEvent.createTable();
    console.log('✅ Database tables initialized');
    
    // Start listening
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🚀 Authentication Service Started');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 API endpoint: http://localhost:${PORT}/api`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('Press Ctrl+C to stop the server');
      console.log('═══════════════════════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
