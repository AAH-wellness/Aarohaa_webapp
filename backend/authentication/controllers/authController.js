const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Register a new user
 */
async function register(req, res, next) {
  try {
    const { email, password, name, role, phone } = req.body;

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

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    // IMPORTANT: User registration endpoint ALWAYS creates 'user' role
    // Provider registration must use the separate /register/provider endpoint
    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'user', // ALWAYS 'user' for this endpoint - never 'provider'
      phone: phone // Phone is now required
    });

    // DO NOT create provider record here - this is user registration only
    // Provider registration uses separate endpoint /register/provider

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user (without password hash) and token
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
 * Creates user with role='provider' AND creates provider record
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

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      // Check if the existing user is already a provider
      if (existingUser.role === 'provider') {
        return res.status(409).json({
          error: {
            message: 'This email is already registered as a provider. Please use a different email or try logging in.',
            code: 'EMAIL_EXISTS_PROVIDER',
            status: 409
          }
        });
      } else {
        // User exists but is not a provider
        return res.status(409).json({
          error: {
            message: 'This email is already registered as a user. Please use a different email or try logging in.',
            code: 'EMAIL_EXISTS_USER',
            status: 409
          }
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with role='provider'
    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'provider', // ALWAYS 'provider' for provider registration
      phone: phone
    });

    // Create provider record in providers table
    try {
      const provider = await Provider.create({
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: phone || null,
        specialty: specialty || null,
        title: title || null,
        bio: bio || null,
        hourlyRate: hourlyRate || 0
      });
      console.log(`✅ Provider record created for user ${user.id}`);
    } catch (error) {
      console.error('Error creating provider record:', error);
      // If provider creation fails, delete the user to maintain data integrity
      await User.deleteById(user.id);
      
      // Check if it's a unique constraint violation (email already exists in providers table)
      if (error.code === '23505' || error.message?.includes('already exists')) {
        return res.status(409).json({
          error: {
            message: 'Provider with this email already exists',
            code: 'PROVIDER_EMAIL_EXISTS',
            status: 409
          }
        });
      }
      
      return res.status(500).json({
        error: {
          message: 'Failed to create provider profile',
          code: 'PROVIDER_CREATION_FAILED',
          status: 500,
          detail: error.message
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user (without password hash) and token
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        createdAt: user.created_at
      },
      token,
      message: 'Provider registration successful'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
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

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return res.status(401).json({
        error: {
          message: 'User not found. Please check your email or sign up.',
          code: 'USER_NOT_FOUND',
          status: 401
        }
      });
    }

    console.log(`Login attempt for user: ${user.email}, role: ${user.role || 'not set'}`);

    // Verify password - THIS IS THE CRITICAL PART
    // Check if password exists and is hashed
    if (!user.password) {
      console.log(`Login attempt failed: No password set for user: ${user.email}`);
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
      console.log(`Login attempt failed: Invalid password for user: ${user.email}`);
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          status: 401
        }
      });
    }

    console.log(`Login successful for user: ${user.email}, role: ${user.role || 'not set'}`);

    // Update last_login timestamp
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user (without password hash) and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
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

    // Return user profile without password
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null,
        address: user.address || null,
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
    // Get userId from JWT token (could be userId or id)
    const userId = req.user?.userId || req.user?.id || req.body.userId || req.query.userId;
    
    if (!userId) {
      console.error('getProviderProfile: No userId found in request', { user: req.user, body: req.body, query: req.query });
      return res.status(401).json({
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    console.log('getProviderProfile: Fetching provider for userId:', userId);
    const provider = await Provider.findByUserId(userId);
    
    if (!provider) {
      console.error('getProviderProfile: Provider not found for userId:', userId);
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
        userId: provider.user_id,
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

    // Find provider by user ID
    const provider = await Provider.findByUserId(userId);
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
        userId: updatedProvider.user_id,
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

    const provider = await Provider.findByUserId(userId);
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

    const provider = await Provider.findByUserId(userId);
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
    
    res.json({
      provider: {
        id: updatedProvider.id,
        availability: updatedProvider.availability || {}
      },
      message: 'Availability updated successfully'
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
    const { verified, status, specialty } = req.query;
    
    const filters = {};
    // Only show providers who are ready (have set availability)
    // Default: only show ready providers unless status is explicitly provided
    if (status) {
      filters.status = status;
    } else {
      filters.status = 'ready'; // Default: only show ready providers
    }
    // Note: Providers are auto-verified when they set availability, so verified filter is optional
    // If verified filter is provided, use it; otherwise show all ready providers
    if (verified !== undefined) {
      filters.verified = verified === 'true' || verified === true;
    }
    if (specialty) filters.specialty = specialty;

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

    if (provider.status !== 'ready') {
      console.log('createBooking: Provider not ready:', provider.status);
      return res.status(400).json({
        error: {
          message: 'Provider is not ready to accept bookings',
          code: 'PROVIDER_NOT_READY',
          status: 400
        }
      });
    }

    // Validate and format appointment date
    let formattedDate = appointmentDate;
    if (typeof appointmentDate === 'string') {
      // Try to parse and validate the date
      const dateObj = new Date(appointmentDate);
      if (isNaN(dateObj.getTime())) {
        console.log('createBooking: Invalid appointment date:', appointmentDate);
        return res.status(400).json({
          error: {
            message: 'Invalid appointment date format',
            code: 'INVALID_DATE',
            status: 400
          }
        });
      }
      formattedDate = dateObj.toISOString();
    }

    console.log('createBooking: Creating booking with:', {
      userId,
      providerId: providerIdNum,
      appointmentDate: formattedDate,
      sessionType,
      notes
    });

    const booking = await Booking.create({
      userId,
      providerId: providerIdNum,
      appointmentDate: formattedDate,
      sessionType,
      notes
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
    
    if (!fullBooking) {
      console.error('createBooking: Could not find booking after creation:', booking.id);
      // Fallback to using the booking data we have
      return res.status(201).json({
        booking: {
          id: booking.id,
          userId: booking.user_id,
          providerId: booking.provider_id,
          providerName: provider.name, // Use provider name we already have
          appointmentDate: booking.appointment_date,
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
        appointmentDate: fullBooking.appointment_date,
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
    
    // Generic error response
    return res.status(500).json({
      error: {
        message: error.message || 'Failed to create booking',
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
        detail: error.stack
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
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }

    // Get provider by user_id
    const provider = await Provider.findByUserId(userId);
    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider profile not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    // Get upcoming bookings for this provider
    const bookings = await Booking.findByProviderId(provider.id);
    
    // Filter for upcoming/scheduled bookings
    const now = new Date();
    const upcomingBookings = bookings
      .filter(booking => {
        const appointmentDate = new Date(booking.appointment_date);
        return appointmentDate > now && booking.status === 'scheduled';
      })
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    res.json({
      bookings: upcomingBookings.map(booking => ({
        id: booking.id,
        userId: booking.user_id,
        userName: booking.user_name,
        userEmail: booking.user_email,
        userPhone: booking.user_phone,
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
 * Cancel booking
 */
async function cancelBooking(req, res, next) {
  try {
    const userId = req.user?.userId || req.body.userId;
    const { bookingId } = req.body;
    
    if (!userId || !bookingId) {
      return res.status(400).json({
        error: {
          message: 'User ID and booking ID are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // Verify booking belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.user_id !== userId) {
      return res.status(404).json({
        error: {
          message: 'Booking not found or access denied',
          code: 'BOOKING_NOT_FOUND',
          status: 404
        }
      });
    }

    const cancelledBooking = await Booking.cancel(bookingId);
    
    res.json({
      booking: {
        id: cancelledBooking.id,
        status: cancelledBooking.status
      },
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  registerProvider,
  login,
  logout,
  deleteUser,
  getProfile,
  updateProfile,
  getProviderProfile,
  updateProviderProfile,
  getProviderAvailability,
  updateProviderAvailability,
  getAllProviders,
  createBooking,
  getUserBookings,
  getUpcomingBookings,
  getProviderBookings,
  cancelBooking
};

