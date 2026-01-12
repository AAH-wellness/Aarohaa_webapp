const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const UserLoginEvent = require('../models/UserLoginEvent');
const { pool } = require('../config/database');
const JWT_CONFIG = require('../config/jwt');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Initialize Google OAuth client
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * Register a new user
 */
async function register(req, res, next) {
  try {
    const { email, password, name, role, phone } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'Email already registered',
          code: 'EMAIL_EXISTS',
          status: 409
        }
      });
    }

    // SECURITY: Check if provider with same email exists (prevent duplicate emails across tables)
    const existingProvider = await Provider.findByEmail(email);
    if (existingProvider) {
      return res.status(409).json({
        error: {
          message: 'Email already registered as provider',
          code: 'EMAIL_EXISTS',
          status: 409
        }
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user - ALWAYS with role='user' (ignore any role parameter)
    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'user', // ALWAYS 'user' for /register endpoint
      phone: phone || null
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    // Return user (without password hash) and token
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user', // ALWAYS 'user' for /register endpoint
        phone: user.phone,
        createdAt: user.created_at
      },
      token,
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new provider
 * Separate endpoint for provider registration
 * Creates provider record ONLY in providers table (NOT in users table)
 */
async function registerProvider(req, res, next) {
  try {
    const { email, password, name, phone, specialty, title, bio, hourlyRate } = req.body;

    // Validation
    if (!email || !password || !name || !phone) {
      return res.status(400).json({
        error: {
          message: 'Email, password, name, and phone number are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // Check if provider already exists
    const existingProvider = await Provider.findByEmail(email);
    if (existingProvider) {
      return res.status(409).json({
        error: {
          message: 'Email already registered as provider',
          code: 'EMAIL_EXISTS',
          status: 409
        }
      });
    }

    // Check if user with same email exists (prevent duplicate emails across tables)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'Email already registered as user',
          code: 'EMAIL_EXISTS',
          status: 409
        }
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create provider record ONLY in providers table (NOT in users table)
    const provider = await Provider.create({
      passwordHash,
      name,
      email,
      phone: phone || null,
      specialty: specialty || null,
      title: title || null,
      bio: bio || null,
      hourlyRate: hourlyRate || 0
    });

    console.log(`✅ Provider registered: ${provider.email} (ID: ${provider.id})`);

    // Generate JWT token (use provider.id and role='provider')
    const token = jwt.sign(
      { userId: provider.id, email: provider.email, role: 'provider' },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    // Return provider (without password hash) and token
    res.status(201).json({
      user: {
        id: provider.id,
        email: provider.email,
        name: provider.name,
        role: 'provider',
        phone: provider.phone,
        createdAt: provider.created_at
      },
      token,
      message: 'Provider registration successful'
    });
  } catch (error) {
    console.error('Provider registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
    
    // Provide more specific error messages
    if (error.code === '23502') { // NOT NULL violation
      return res.status(500).json({
        error: {
          message: 'Database configuration error: password column is missing or nullable. Please run FIX_PROVIDERS_TABLE.sql script.',
          code: 'DATABASE_ERROR',
          status: 500
        }
      });
    }
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: {
          message: 'Email already registered',
          code: 'EMAIL_EXISTS',
          status: 409
        }
      });
    }
    
    next(error);
  }
}

/**
 * Login user (ONLY checks users table, NOT providers)
 * 
 * SECURITY: This function ONLY authenticates against the 'users' table.
 * If credentials are not found in the 'users' table, it will return
 * "Invalid email or password" WITHOUT checking the 'providers' table.
 * Provider credentials will be rejected with "Invalid email or password".
 */
async function login(req, res, next) {
  try {
    const { email, password, loginMethod } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // SECURITY: ONLY check users table - NEVER check providers table
    // If email is not in users table, return "Invalid credentials" immediately
    const user = await User.findByEmail(email);
    
    if (!user) {
      // User not found in users table - reject immediately
      // Do NOT check providers table - this ensures provider credentials
      // cannot be used to login as a user
      console.log(`User login attempt failed: Email '${email}' not found in users table`);
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401
        }
      });
    }

    console.log(`User login attempt for: ${user.email}`);

    // Verify password
    if (!user.password) {
      console.log(`User login attempt failed: No password set for user: ${user.email}`);
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401
        }
      });
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`User login attempt failed: Invalid password for user: ${user.email}`);
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401
        }
      });
    }

    // SECURITY: Reject providers trying to login via user endpoint
    // Providers must use the provider login endpoint (/login/provider)
    if (user.role === 'provider') {
      console.log(`User login attempt rejected: Email '${email}' is a provider and must use provider login endpoint`);
      return res.status(403).json({
        error: {
          message: 'Provider accounts must use the provider login. Please use the provider login form.',
          code: 'PROVIDER_USE_PROVIDER_LOGIN',
          status: 403
        }
      });
    }

    console.log(`User login successful: ${user.email}`);

    // Update last_login timestamp
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    // Return user (without password hash) and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
        phone: user.phone || null,
        createdAt: user.created_at
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login provider (ONLY checks providers table, NOT users)
 * 
 * SECURITY: This function ONLY authenticates against the 'providers' table.
 * If credentials are not found in the 'providers' table, it will return
 * "Invalid email or password" WITHOUT checking the 'users' table.
 * User credentials will be rejected with "Invalid email or password".
 */
async function loginProvider(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // SECURITY: ONLY check providers table - NEVER check users table
    // If email is not in providers table, return "Invalid credentials" immediately
    const provider = await Provider.findByEmail(email);
    
    if (!provider) {
      // Provider not found in providers table - reject immediately
      // Do NOT check users table - this ensures user credentials
      // cannot be used to login as a provider
      console.log(`Provider login attempt failed: Email '${email}' not found in providers table`);
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401
        }
      });
    }

    console.log(`Provider login attempt for: ${provider.email}`);

    // Verify password
    if (!provider.password) {
      console.log(`Provider login attempt failed: No password set for provider: ${provider.email}`);
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401
        }
      });
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, provider.password);
    
    if (!isPasswordValid) {
      console.log(`Provider login attempt failed: Invalid password for provider: ${provider.email}`);
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401
        }
      });
    }

    console.log(`Provider login successful: ${provider.email}`);

    // Update last_login timestamp
    await pool.query('UPDATE providers SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [provider.id]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: provider.id, email: provider.email, role: 'provider' },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    // Return provider (without password hash) and token
    res.json({
      user: {
        id: provider.id,
        email: provider.email,
        name: provider.name,
        role: 'provider',
        phone: provider.phone || null,
        createdAt: provider.created_at
      },
      token,
      message: 'Provider login successful'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user (client-side token removal, but we can invalidate if needed)
 */
async function logout(req, res, next) {
  try {
    // In a stateless JWT system, logout is handled client-side
    // If you need server-side logout, implement token blacklisting
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user permanently (by ID or email)
 * WARNING: This permanently deletes the user from the database
 */
async function deleteUser(req, res, next) {
  try {
    const { id, email } = req.body;

    if (!id && !email) {
      return res.status(400).json({
        error: {
          message: 'Either user ID or email is required',
          code: 'MISSING_IDENTIFIER',
          status: 400
        }
      });
    }

    let deletedUser = null;

    if (id) {
      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND',
            status: 404
          }
        });
      }
      deletedUser = await User.deleteById(id);
    } else if (email) {
      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND',
            status: 404
          }
        });
      }
      deletedUser = await User.deleteByEmail(email);
    }

    if (!deletedUser) {
      return res.status(404).json({
        error: {
          message: 'User not found or could not be deleted',
          code: 'DELETE_FAILED',
          status: 404
        }
      });
    }

    res.json({
      message: 'User permanently deleted',
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user profile
 */
async function getProfile(req, res, next) {
  try {
    // Get user ID from JWT token (set by auth middleware) or from request
    const userId = req.user?.userId || req.body.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          status: 404
        }
      });
    }

    // Check if profile is incomplete (for Google users)
    const profileIncomplete = user.auth_method === 'google' && (!user.name || !user.phone || !user.date_of_birth);

    // Return user profile without password
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null,
        address: user.address || null,
        dateOfBirth: user.date_of_birth || null,
        picture: user.google_picture || null,
        authMethod: user.auth_method || 'email',
        profileIncomplete: profileIncomplete,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res, next) {
  try {
    // Get user ID from JWT token (set by auth middleware) or from request
    const userId = req.user?.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    const { name, phone, address } = req.body;
    
    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: {
          message: 'No fields to update',
          code: 'NO_UPDATES',
          status: 400
        }
      });
    }

    const updatedUser = await User.update(userId, updates);
    
    // Return updated user profile without password
    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone || null,
        address: updatedUser.address || null,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get provider profile
 */
async function getProviderProfile(req, res, next) {
  try {
    // Get provider ID from JWT token (userId in token is actually provider.id for providers)
    const providerId = req.user?.userId || req.user?.id || req.body.userId || req.query.userId;
    
    if (!providerId) {
      console.error('getProviderProfile: No providerId found in request', { user: req.user, body: req.body, query: req.query });
      return res.status(401).json({
        error: {
          message: 'Provider not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    console.log('getProviderProfile: Fetching provider for id:', providerId);
    const provider = await Provider.findById(providerId);
    
    if (!provider) {
      console.error('getProviderProfile: Provider not found for id:', providerId);
      return res.status(404).json({
        error: {
          message: 'Provider profile not found. Please ensure you have registered as a provider.',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    console.log('getProviderProfile: Found provider:', provider.id, provider.name);
    res.json({
      provider: {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        specialty: provider.specialty,
        title: provider.title,
        bio: provider.bio,
        hourlyRate: parseFloat(provider.hourly_rate) || 0,
        rating: parseFloat(provider.rating) || 0,
        sessionsCompleted: provider.sessions_completed || 0,
        reviewsCount: provider.reviews_count || 0,
        verified: provider.verified,
        status: provider.status,
        availability: provider.availability || {},
        createdAt: provider.created_at,
        updatedAt: provider.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update provider profile
 */
async function updateProviderProfile(req, res, next) {
  try {
    const providerId = req.user?.userId || req.body.userId;
    
    if (!providerId) {
      return res.status(401).json({
        error: {
          message: 'Provider not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    // Find provider by ID (userId in token is actually provider.id for providers)
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider profile not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    const { name, phone, specialty, title, bio, hourlyRate } = req.body;
    
    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (specialty !== undefined) updates.specialty = specialty;
    if (title !== undefined) updates.title = title;
    if (bio !== undefined) updates.bio = bio;
    if (hourlyRate !== undefined) updates.hourlyRate = parseFloat(hourlyRate);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: {
          message: 'No fields to update',
          code: 'NO_UPDATES',
          status: 400
        }
      });
    }

    const updatedProvider = await Provider.update(provider.id, updates);
    
    res.json({
      provider: {
        id: updatedProvider.id,
        name: updatedProvider.name,
        email: updatedProvider.email,
        phone: updatedProvider.phone,
        specialty: updatedProvider.specialty,
        title: updatedProvider.title,
        bio: updatedProvider.bio,
        hourlyRate: parseFloat(updatedProvider.hourly_rate) || 0,
        rating: parseFloat(updatedProvider.rating) || 0,
        sessionsCompleted: updatedProvider.sessions_completed || 0,
        reviewsCount: updatedProvider.reviews_count || 0,
        verified: updatedProvider.verified,
        status: updatedProvider.status,
        availability: updatedProvider.availability || {},
        createdAt: updatedProvider.created_at,
        updatedAt: updatedProvider.updated_at
      },
      message: 'Provider profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get provider availability
 */
async function getProviderAvailability(req, res, next) {
  try {
    const providerId = req.user?.userId || req.body.userId || req.query.userId;
    
    if (!providerId) {
      return res.status(401).json({
        error: {
          message: 'Provider not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider profile not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    const availability = await Provider.getAvailability(provider.id);
    
    res.json({
      availability: availability || {},
      providerId: provider.id
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update provider availability
 */
async function updateProviderAvailability(req, res, next) {
  try {
    const providerId = req.user?.userId || req.body.userId;
    
    if (!providerId) {
      return res.status(401).json({
        error: {
          message: 'Provider not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider profile not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    const { availability } = req.body;
    
    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({
        error: {
          message: 'Availability data is required',
          code: 'INVALID_AVAILABILITY',
          status: 400
        }
      });
    }

    const updatedProvider = await Provider.updateAvailability(provider.id, availability);
    
    console.log(`✅ Provider ${provider.id} availability updated. Status set to 'ready', verified: true`);
    
    res.json({
      provider: {
        id: updatedProvider.id,
        availability: updatedProvider.availability || {},
        status: updatedProvider.status,
        verified: updatedProvider.verified
      },
      message: 'Availability updated successfully. Your profile is now visible to users.'
    });
  } catch (error) {
    console.error('Error updating provider availability:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    next(error);
  }
}

/**
 * Get provider availability by provider ID (public endpoint for booking page)
 */
async function getProviderAvailabilityById(req, res, next) {
  try {
    const { providerId } = req.params;
    
    if (!providerId) {
      return res.status(400).json({
        error: {
          message: 'Provider ID is required',
          code: 'MISSING_PROVIDER_ID',
          status: 400
        }
      });
    }

    const providerIdNum = parseInt(providerId);
    if (isNaN(providerIdNum)) {
      return res.status(400).json({
        error: {
          message: 'Invalid provider ID',
          code: 'INVALID_PROVIDER_ID',
          status: 400
        }
      });
    }

    const provider = await Provider.findById(providerIdNum);
    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    const availability = provider.availability || {};
    
    res.json({
      providerId: provider.id,
      providerName: provider.name,
      availability: availability
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all providers (for user dashboard)
 * Only shows providers with status='ready' (have set availability)
 */
async function getAllProviders(req, res, next) {
  try {
    const { verified, status, specialty, search } = req.query;
    
    const filters = {};
    // Default to showing only 'ready' providers (those who have set availability)
    // If status is explicitly provided, use it; otherwise default to 'ready'
    filters.status = status || 'ready';
    
    // Note: Providers are auto-verified when they set availability
    // If verified filter is provided, use it; otherwise show all ready providers
    if (verified !== undefined) {
      filters.verified = verified === 'true' || verified === true;
    }
    if (specialty) filters.specialty = specialty;
    if (search) filters.search = search; // Add search filter

    const providers = await Provider.findAll(filters);
    
    // Format providers for frontend
    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      specialty: provider.specialty,
      title: provider.title,
      bio: provider.bio,
      hourlyRate: parseFloat(provider.hourly_rate) || 0,
      rating: parseFloat(provider.rating) || 0,
      sessionsCompleted: provider.sessions_completed || 0,
      reviewsCount: provider.reviews_count || 0,
      verified: provider.verified,
      status: provider.status,
      availability: provider.availability || {},
      createdAt: provider.created_at,
      updatedAt: provider.updated_at
    }));
    
    res.json({
      providers: formattedProviders
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new booking
 */
async function createBooking(req, res, next) {
  try {
    // Extract userId from JWT token (set by auth middleware)
    const userId = req.user?.userId || req.user?.id || req.body.userId;
    
    console.log('createBooking called with:', {
      userId,
      body: req.body,
      userFromToken: req.user,
      headers: req.headers.authorization ? 'Authorization header present' : 'No authorization header'
    });
    
    if (!userId) {
      console.error('createBooking: User not authenticated - req.user:', req.user);
      return res.status(401).json({
        error: {
          message: 'User not authenticated. Please log in again.',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }
    
    console.log('createBooking: User authenticated, userId:', userId);

    const { providerId, appointmentDate, sessionType, notes } = req.body;
    
    console.log('createBooking: Parsed data:', {
      providerId,
      appointmentDate,
      sessionType,
      notes,
      providerIdType: typeof providerId
    });
    
    if (!providerId || !appointmentDate) {
      console.log('createBooking: Missing required fields');
      return res.status(400).json({
        error: {
          message: 'Provider ID and appointment date are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // Ensure providerId is a number
    const providerIdNum = parseInt(providerId);
    if (isNaN(providerIdNum)) {
      console.log('createBooking: Invalid provider ID:', providerId);
      return res.status(400).json({
        error: {
          message: 'Invalid provider ID',
          code: 'INVALID_PROVIDER_ID',
          status: 400
        }
      });
    }

    // Verify provider exists and is ready
    const provider = await Provider.findById(providerIdNum);
    if (!provider) {
      console.log('createBooking: Provider not found:', providerIdNum);
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    console.log('createBooking: Found provider:', {
      id: provider.id,
      name: provider.name,
      status: provider.status
    });

    // Check provider status - allow bookings if status is 'ready' or 'active' or null
    if (provider.status && provider.status !== 'ready' && provider.status !== 'active') {
      console.log('createBooking: Provider not ready:', provider.status);
      return res.status(400).json({
        error: {
          message: `Provider is not ready to accept bookings. Current status: ${provider.status}`,
          code: 'PROVIDER_NOT_READY',
          status: 400
        }
      });
    }

    // Validate and format appointment date
    // The date comes as ISO string from frontend (UTC), but represents local time
    // We need to parse it correctly
    let formattedDate = appointmentDate;
    let appointmentDateTime;
    if (typeof appointmentDate === 'string') {
      // Parse the ISO string - it's already in UTC format
      appointmentDateTime = new Date(appointmentDate);
      if (isNaN(appointmentDateTime.getTime())) {
        console.log('createBooking: Invalid appointment date:', appointmentDate);
        return res.status(400).json({
          error: {
            message: 'Invalid appointment date format',
            code: 'INVALID_DATE',
            status: 400
          }
        });
      }
      // Keep as ISO string for storage (PostgreSQL will store as UTC)
      formattedDate = appointmentDateTime.toISOString();
      
      console.log('createBooking: Date conversion:', {
        received: appointmentDate,
        parsed: appointmentDateTime.toISOString(),
        localTime: appointmentDateTime.toLocaleString(),
        utcTime: appointmentDateTime.toUTCString()
      });
    } else {
      appointmentDateTime = new Date(appointmentDate);
      formattedDate = appointmentDateTime.toISOString();
    }

    // Validate booking time is within provider's availability
    if (provider.availability && typeof provider.availability === 'object') {
      const availability = typeof provider.availability === 'string' 
        ? JSON.parse(provider.availability) 
        : provider.availability;
      
      // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeek = appointmentDateTime.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      const dayAvailability = availability[dayName];
      
      if (!dayAvailability || !dayAvailability.enabled) {
        console.log(`createBooking: Provider not available on ${dayName}`);
        const dayDisplay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return res.status(400).json({
          error: {
            message: `Provider is not available on ${dayDisplay}. Please select a different day.`,
            code: 'OUTSIDE_AVAILABILITY',
            status: 400
          }
        });
      }
      
      // Extract time from appointment (HH:mm format)
      // The ISO string from frontend represents the user's local time converted to UTC
      // When we parse it with new Date(), we get a Date object in UTC
      // But we need the original local time for availability comparison
      // The solution: The ISO string "2026-01-12T06:01:00.000Z" means 11:01 AM in UTC+5
      // To get back 11:01, we need to add the timezone offset
      // But we don't know the user's timezone offset from the ISO string alone
      
      // WORKAROUND: Since availability times are likely in the same timezone as the server,
      // and the server might be in UTC, we should compare UTC times
      // However, this assumes provider availability is stored in UTC, which may not be true
      
      // BETTER APPROACH: Send timezone offset from frontend, or store dates differently
      // For now, let's use the date as-is and assume the timezone handling is correct
      // The real fix should be in how we send/store the date
      
      // Use local time methods - the Date object will use server's local timezone
      // This might not match user's timezone, but it's the best we can do without timezone info
      const appointmentHours = appointmentDateTime.getHours();
      const appointmentMinutes = appointmentDateTime.getMinutes();
      const appointmentTimeMinutes = appointmentHours * 60 + appointmentMinutes;
      
      console.log('createBooking: Time extraction for availability check:', {
        isoString: appointmentDateTime.toISOString(),
        serverLocalHours: appointmentDateTime.getHours(),
        serverLocalMinutes: appointmentDateTime.getMinutes(),
        utcHours: appointmentDateTime.getUTCHours(),
        utcMinutes: appointmentDateTime.getUTCMinutes(),
        serverTimezoneOffset: appointmentDateTime.getTimezoneOffset(),
        appointmentTimeMinutes
      });
      
      // Parse provider's availability times
      const [startHours, startMinutes] = dayAvailability.start.split(':').map(Number);
      const [endHours, endMinutes] = dayAvailability.end.split(':').map(Number);
      const startTimeMinutes = startHours * 60 + startMinutes;
      const endTimeMinutes = endHours * 60 + endMinutes;
      
      console.log(`createBooking: Time validation - Appointment: ${appointmentHours}:${String(appointmentMinutes).padStart(2, '0')} (${appointmentTimeMinutes} min), Availability: ${dayAvailability.start}-${dayAvailability.end} (${startTimeMinutes}-${endTimeMinutes} min)`);
      
      // Check if appointment time is within availability window
      // Allow booking if time is >= start and <= end (end time is inclusive)
      if (appointmentTimeMinutes < startTimeMinutes || appointmentTimeMinutes > endTimeMinutes) {
        console.log(`createBooking: Appointment time ${appointmentHours}:${String(appointmentMinutes).padStart(2, '0')} is outside availability ${dayAvailability.start}-${dayAvailability.end}`);
        return res.status(400).json({
          error: {
            message: `Provider is only available between ${dayAvailability.start} and ${dayAvailability.end} on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}. Please select a time within this range.`,
            code: 'OUTSIDE_AVAILABILITY',
            status: 400
          }
        });
      }
      
      const appointmentTimeStr = `${String(appointmentHours).padStart(2, '0')}:${String(appointmentMinutes).padStart(2, '0')}`;
      console.log(`createBooking: Appointment time validated - ${appointmentTimeStr} is within ${dayAvailability.start}-${dayAvailability.end} on ${dayName}`);
    } else {
      console.log('createBooking: No availability data found for provider, allowing booking');
    }

    // Get user name for the booking
    const user = await User.findById(userId);
    const userName = user?.name || null;
    
    console.log('createBooking: Creating booking with:', {
      userId,
      providerId: providerIdNum,
      appointmentDate: formattedDate,
      sessionType,
      notes,
      userName,
      providerName: provider.name
    });

    const booking = await Booking.create({
      userId,
      providerId: providerIdNum,
      appointmentDate: formattedDate,
      sessionType,
      notes,
      userName: userName,
      providerName: provider.name
    });
    
    console.log('createBooking: Booking created successfully:', booking);

    if (!booking || !booking.id) {
      console.error('createBooking: Booking creation returned invalid data:', booking);
      return res.status(500).json({
        error: {
          message: 'Failed to create booking',
          code: 'BOOKING_CREATION_FAILED',
          status: 500
        }
      });
    }

    // Get full booking details with user and provider info
    const fullBooking = await Booking.findById(booking.id);
    
    // Helper function to convert date to ISO string
    const toISOString = (dateValue) => {
      if (!dateValue) return null
      if (dateValue instanceof Date) {
        return dateValue.toISOString()
      }
      if (typeof dateValue === 'string') {
        if (dateValue.includes('Z') || dateValue.includes('+') || dateValue.match(/-\d{2}:\d{2}$/)) {
          return dateValue
        }
        // Add Z to treat as UTC
        const parsed = new Date(dateValue + 'Z')
        return isNaN(parsed.getTime()) ? dateValue : parsed.toISOString()
      }
      return new Date(dateValue).toISOString()
    }
    
    if (!fullBooking) {
      console.error('createBooking: Could not find booking after creation:', booking.id);
      // Fallback to using the booking data we have
      return res.status(201).json({
        booking: {
          id: booking.id,
          userId: booking.user_id,
          providerId: booking.provider_id,
          providerName: provider.name, // Use provider name we already have
          appointmentDate: toISOString(booking.appointment_date),
          dateTime: toISOString(booking.appointment_date),
          sessionType: booking.session_type,
          notes: booking.notes,
          status: booking.status,
          createdAt: booking.created_at
        },
        message: 'Booking created successfully'
      });
    }

    res.status(201).json({
      booking: {
        id: fullBooking.id,
        userId: fullBooking.user_id,
        providerId: fullBooking.provider_id,
        providerName: fullBooking.provider_name || provider.name,
        appointmentDate: toISOString(fullBooking.appointment_date),
        dateTime: toISOString(fullBooking.appointment_date),
        sessionType: fullBooking.session_type,
        notes: fullBooking.notes,
        status: fullBooking.status,
        createdAt: fullBooking.created_at
      },
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('createBooking error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    
    // If it's a database error, provide more details
    if (error.code) {
      console.error('Database error code:', error.code);
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          error: {
            message: 'Invalid user or provider ID. Please ensure both user and provider exist.',
            code: 'INVALID_REFERENCE',
            status: 400,
            detail: error.detail || error.message
          }
        });
      }
      if (error.code === '23502') { // Not null violation
        return res.status(400).json({
          error: {
            message: 'Missing required fields',
            code: 'MISSING_REQUIRED_FIELDS',
            status: 400,
            detail: error.detail || error.message
          }
        });
      }
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          error: {
            message: 'Booking already exists',
            code: 'DUPLICATE_BOOKING',
            status: 409,
            detail: error.detail || error.message
          }
        });
      }
      // Generic database error
      return res.status(500).json({
        error: {
          message: 'Database error occurred',
          code: 'DATABASE_ERROR',
          status: 500,
          detail: error.detail || error.message
        }
      });
    }
    
    // Generic error response - include more details for debugging
    return res.status(500).json({
      error: {
        message: error.message || 'Failed to create booking',
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
        detail: process.env.NODE_ENV === 'development' ? error.stack : error.message,
        // Include database error details if available
        ...(error.code && { databaseErrorCode: error.code }),
        ...(error.detail && { databaseErrorDetail: error.detail }),
        ...(error.table && { databaseTable: error.table }),
        ...(error.column && { databaseColumn: error.column })
      }
    });
  }
}

/**
 * Get user bookings
 */
async function getUserBookings(req, res, next) {
  try {
    const userId = req.user?.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    const bookings = await Booking.findByUserId(userId);
    
    res.json({
      bookings: bookings.map(booking => {
        // Ensure appointment_date is returned as ISO string with 'Z' suffix for consistent parsing
        let appointmentDate = booking.appointment_date
        let appointmentDateISO
        
        if (appointmentDate instanceof Date) {
          // Already a Date object - convert to ISO
          appointmentDateISO = appointmentDate.toISOString()
        } else if (appointmentDate && typeof appointmentDate === 'string') {
          // Check if it's already a proper ISO string with timezone
          if (appointmentDate.includes('Z') || appointmentDate.includes('+') || appointmentDate.match(/-\d{2}:\d{2}$/)) {
            // Already has timezone info - use as-is
            appointmentDateISO = appointmentDate
          } else {
            // PostgreSQL timestamp format without timezone (e.g., "2026-01-12T06:12:00.000")
            // Parse it and treat as UTC by adding 'Z', then convert to ISO
            // IMPORTANT: PostgreSQL timestamps are stored in UTC, so we need to parse as UTC
            const parsed = new Date(appointmentDate + 'Z') // Add Z to indicate UTC
            if (!isNaN(parsed.getTime())) {
              appointmentDateISO = parsed.toISOString()
            } else {
              // Fallback: try parsing without Z (might be in local timezone)
              const parsedLocal = new Date(appointmentDate)
              if (!isNaN(parsedLocal.getTime())) {
                appointmentDateISO = parsedLocal.toISOString()
              } else {
                // Last resort: use as-is
                appointmentDateISO = appointmentDate
              }
            }
          }
        } else {
          // Fallback for other types
          appointmentDateISO = appointmentDate ? new Date(appointmentDate).toISOString() : null
        }
        
        return {
          id: booking.id,
          providerId: booking.provider_id,
          providerName: booking.provider_name,
          providerTitle: booking.provider_title,
          providerSpecialty: booking.provider_specialty,
          appointmentDate: appointmentDateISO,
          dateTime: appointmentDateISO, // Also include as dateTime for compatibility
          sessionType: booking.session_type,
          notes: booking.notes,
          status: booking.status,
          reason: booking.reason || null,
          createdAt: booking.created_at
        }
      })
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get upcoming bookings for user
 */
async function getUpcomingBookings(req, res, next) {
  try {
    const userId = req.user?.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    const bookings = await Booking.getUpcomingByUserId(userId);
    
    res.json({
      bookings: bookings.map(booking => ({
        id: booking.id,
        providerId: booking.provider_id,
        providerName: booking.provider_name,
        providerTitle: booking.provider_title,
        providerSpecialty: booking.provider_specialty,
        appointmentDate: booking.appointment_date,
        sessionType: booking.session_type,
        notes: booking.notes,
        status: booking.status,
        createdAt: booking.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get provider bookings (for provider dashboard)
 */
async function getProviderBookings(req, res, next) {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res.status(401).json({
        error: {
          message: 'Provider not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    // Get provider by ID (userId in token is actually provider.id for providers)
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider profile not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    // Get all bookings for this provider
    console.log('getProviderBookings: Fetching bookings for provider ID:', provider.id);
    const bookings = await Booking.findByProviderId(provider.id);
    console.log('getProviderBookings: Found', bookings.length, 'bookings');
    
    // Filter out cancelled and completed bookings, let frontend handle Today/Upcoming/All filtering
    const activeBookings = bookings
      .filter(booking => {
        const status = booking.status?.toLowerCase() || '';
        const isActive = status !== 'cancelled' && status !== 'completed';
        if (!isActive) {
          console.log('getProviderBookings: Filtering out booking', booking.id, 'with status:', status);
        }
        return isActive;
      })
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    console.log('getProviderBookings: Returning', activeBookings.length, 'active bookings');

    res.json({
      bookings: activeBookings.map(booking => ({
        id: booking.id,
        userId: booking.user_id,
        userName: booking.user_name || booking.userName || 'Patient',
        userEmail: booking.user_email || booking.userEmail,
        userPhone: booking.user_phone || booking.userPhone,
        appointmentDate: booking.appointment_date || booking.appointmentDate,
        sessionType: booking.session_type || booking.sessionType || 'Video Consultation',
        notes: booking.notes,
        status: booking.status || 'confirmed',
        reason: booking.reason || null,
        createdAt: booking.created_at || booking.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login with Google OAuth
 */
async function loginWithGoogle(req, res, next) {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: {
          message: 'Google ID token is required',
          code: 'MISSING_TOKEN',
          status: 400
        }
      });
    }

    if (!googleClient) {
      return res.status(500).json({
        error: {
          message: 'Google OAuth is not configured',
          code: 'OAUTH_NOT_CONFIGURED',
          status: 500
        }
      });
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID
      });
    } catch (error) {
      console.error('Google token verification error:', error);
      return res.status(401).json({
        error: {
          message: 'Invalid Google token',
          code: 'INVALID_TOKEN',
          status: 401
        }
      });
    }

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        error: {
          message: 'Email not provided by Google',
          code: 'NO_EMAIL',
          status: 400
        }
      });
    }

    // Get client IP and user agent for logging
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    // Parse user agent (simple parsing)
    const deviceInfo = parseUserAgent(userAgent);

    // Check if user already exists
    let user = await User.findByEmail(email);
    let isNewUser = false;

    if (user) {
      // User exists, update last login and Google info
      await pool.query(
        `UPDATE users 
         SET last_login = CURRENT_TIMESTAMP, 
             google_id = $1, 
             google_picture = $2,
             auth_method = 'google',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [googleId, picture, user.id]
      );
      
      // Refresh user data
      user = await User.findById(user.id);
    } else {
      // Create new user from Google account
      isNewUser = true;
      // Generate a random password (won't be used for OAuth users)
      const randomPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      // Create user with Google info
      const insertQuery = `
        INSERT INTO users (email, password, name, role, phone, google_id, google_picture, auth_method, created_at, updated_at, last_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'google', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, name, role, phone, google_id, google_picture, auth_method, date_of_birth, created_at, updated_at
      `;
      
      const result = await pool.query(insertQuery, [
        email,
        passwordHash,
        name || email.split('@')[0],
        role || 'user',
        null,
        googleId,
        picture
      ]);
      
      user = result.rows[0];

      // If role is provider, create provider record
      if (user.role === 'provider') {
        try {
          await Provider.create({
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: null,
            specialty: null,
            title: null,
            bio: null,
            hourlyRate: 0
          });
          console.log(`✅ Provider record created for Google OAuth user ${user.id}`);
        } catch (error) {
          console.error('Error creating provider record:', error);
        }
      }
    }

    // Log login event
    try {
      await UserLoginEvent.create({
        userId: user.id,
        loginMethod: 'google',
        ipAddress: ipAddress,
        userAgent: userAgent,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        success: true
      });
    } catch (error) {
      console.error('Error logging login event:', error);
      // Don't fail the login if logging fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    // Check if profile is incomplete (for Google users)
    const profileIncomplete = user.auth_method === 'google' && (!user.name || !user.phone || !user.date_of_birth);

    // Return user and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
        picture: user.google_picture || picture || null,
        authMethod: user.auth_method || 'google',
        profileIncomplete: profileIncomplete,
        createdAt: user.created_at
      },
      token,
      message: 'Google login successful',
      isNewUser: isNewUser
    });
  } catch (error) {
    console.error('Google login error:', error);
    next(error);
  }
}

/**
 * Helper function to parse user agent
 */
function parseUserAgent(userAgent) {
  if (!userAgent) return { deviceType: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  let deviceType = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device type
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'Tablet';
  }

  // Detect browser
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/edg/i.test(userAgent)) {
    browser = 'Edge';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/mac/i.test(userAgent)) {
    os = 'macOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/ios|iphone|ipad/i.test(userAgent)) {
    os = 'iOS';
  }

  return { deviceType, browser, os };
}

/**
 * Update profile for Google OAuth users (complete profile)
 */
async function completeGoogleProfile(req, res, next) {
  try {
    const userId = req.user?.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    const { name, dateOfBirth, phone } = req.body;

    // Validate required fields
    if (!name || !dateOfBirth || !phone) {
      return res.status(400).json({
        error: {
          message: 'Name, date of birth, and phone number are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // Validate date format
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({
        error: {
          message: 'Invalid date of birth format',
          code: 'INVALID_DATE',
          status: 400
        }
      });
    }

    // Check if user exists and is a Google user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          status: 404
        }
      });
    }

    // Update user profile
    const updateQuery = `
      UPDATE users 
      SET name = $1, 
          date_of_birth = $2, 
          phone = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, email, name, role, phone, date_of_birth, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, [name, dob.toISOString().split('T')[0], phone, userId]);
    const updatedUser = result.rows[0];

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.date_of_birth,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      },
      message: 'Profile completed successfully'
    });
  } catch (error) {
    console.error('Error completing Google profile:', error);
    next(error);
  }
}

/**
 * Cancel booking
 */
async function cancelBooking(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id || req.body.userId;
    const { bookingId, reason } = req.body;
    
    console.log('cancelBooking called with:', {
      userId,
      bookingId,
      reason,
      userFromToken: req.user,
      body: req.body
    });
    
    if (!userId || !bookingId) {
      console.log('cancelBooking: Missing required fields');
      return res.status(400).json({
        error: {
          message: 'User ID and booking ID are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }
    
    // Validate reason is provided
    if (!reason || !reason.trim()) {
      console.log('cancelBooking: Cancellation reason is required');
      return res.status(400).json({
        error: {
          message: 'Cancellation reason is required',
          code: 'MISSING_REASON',
          status: 400
        }
      });
    }
    
    if (reason.trim().length < 10) {
      console.log('cancelBooking: Cancellation reason must be at least 10 characters');
      return res.status(400).json({
        error: {
          message: 'Cancellation reason must be at least 10 characters long',
          code: 'INVALID_REASON',
          status: 400
        }
      });
    }

    // Ensure userId and bookingId are integers for comparison
    const userIdNum = parseInt(userId);
    const bookingIdNum = parseInt(bookingId);
    
    if (isNaN(userIdNum) || isNaN(bookingIdNum)) {
      console.log('cancelBooking: Invalid ID format');
      return res.status(400).json({
        error: {
          message: 'Invalid user ID or booking ID',
          code: 'INVALID_ID',
          status: 400
        }
      });
    }

    // Verify booking belongs to user
    const booking = await Booking.findById(bookingIdNum);
    console.log('cancelBooking: Found booking:', {
      bookingId: booking?.id,
      bookingUserId: booking?.user_id,
      requestUserId: userIdNum,
      match: booking?.user_id === userIdNum
    });
    
    if (!booking) {
      console.log('cancelBooking: Booking not found');
      return res.status(404).json({
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
          status: 404
        }
      });
    }
    
    if (parseInt(booking.user_id) !== userIdNum) {
      console.log('cancelBooking: Access denied - booking does not belong to user');
      return res.status(403).json({
        error: {
          message: 'Access denied. This booking does not belong to you.',
          code: 'ACCESS_DENIED',
          status: 403
        }
      });
    }

    const cancelledBooking = await Booking.cancel(bookingIdNum, reason.trim());
    console.log('cancelBooking: Booking cancelled successfully:', cancelledBooking);
    
    res.json({
      booking: {
        id: cancelledBooking.id,
        status: cancelledBooking.status,
        reason: cancelledBooking.reason
      },
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('cancelBooking error:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
}

module.exports = {
  register,
  registerProvider,
  login,
  loginProvider,
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
};

