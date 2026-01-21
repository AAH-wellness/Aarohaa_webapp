const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const UserLoginEvent = require('../models/UserLoginEvent');
const Support = require('../models/Support');
const VideoMeeting = require('../models/VideoMeeting');
const { pool } = require('../config/database');
const JWT_CONFIG = require('../config/jwt');
const emailService = require('../services/emailService');
const dailyVideoService = require('../services/dailyVideoService');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const AVAILABILITY_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const DEFAULT_AVAILABILITY = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '10:00', end: '14:00' },
  sunday: { enabled: false, start: '10:00', end: '14:00' }
};

function normalizeTimeValue(value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  // Handle ISO datetime values (timezone fixes may have stored full timestamps)
  if (trimmed.includes('T') || trimmed.endsWith('Z')) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const hours = String(parsed.getHours()).padStart(2, '0');
      const minutes = String(parsed.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (Number.isInteger(hours) && Number.isInteger(minutes) &&
        hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return fallback;
}

function normalizeAvailability(inputAvailability) {
  if (!inputAvailability || typeof inputAvailability !== 'object') {
    return {};
  }

  const normalized = {};
  AVAILABILITY_DAYS.forEach((day) => {
    const dayInput = inputAvailability[day];
    const defaults = DEFAULT_AVAILABILITY[day];

    if (dayInput && typeof dayInput === 'object') {
      const enabledValue = dayInput.enabled;
      normalized[day] = {
        enabled: typeof enabledValue === 'boolean'
          ? enabledValue
          : enabledValue === 'true' || enabledValue === 1,
        start: normalizeTimeValue(dayInput.start, defaults.start),
        end: normalizeTimeValue(dayInput.end, defaults.end)
      };
    } else if (defaults) {
      normalized[day] = { ...defaults };
    }
  });

  return normalized;
}

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

    // Send welcome email (non-blocking - don't wait for it)
    emailService.sendWelcomeEmail(user.name || 'User', user.email, 'user')
      .then(result => {
        if (result.success) {
          console.log('✅ Welcome email sent to:', user.email);
        } else {
          console.warn('⚠️  Failed to send welcome email:', result.error);
        }
      })
      .catch(err => {
        console.error('❌ Error sending welcome email:', err);
        // Don't fail registration if email fails
      });

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
    console.log('registerProvider: Checking if provider exists with email:', email);
    const existingProvider = await Provider.findByEmail(email);
    if (existingProvider) {
      console.log('❌ Provider registration failed: Email already registered as provider:', email);
      return res.status(409).json({
        error: {
          message: 'Email already registered as provider',
          code: 'EMAIL_EXISTS',
          status: 409
        }
      });
    }
    console.log('✅ No existing provider found with email:', email);

    // Check if user with same email exists (prevent duplicate emails across tables)
    console.log('registerProvider: Checking if user exists with email:', email);
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ Provider registration failed: Email already registered as user:', email);
      return res.status(409).json({
        error: {
          message: 'Email already registered as user',
          code: 'EMAIL_EXISTS',
          status: 409
        }
      });
    }
    console.log('✅ No existing user found with email:', email);

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

    // Send welcome email to provider (non-blocking - don't wait for it)
    emailService.sendWelcomeEmail(provider.name || 'Provider', provider.email, 'provider')
      .then(result => {
        if (result.success) {
          console.log('✅ Welcome email sent to provider:', provider.email);
        } else {
          console.warn('⚠️  Failed to send welcome email to provider:', result.error);
        }
      })
      .catch(err => {
        console.error('❌ Error sending welcome email to provider:', err);
        // Don't fail registration if email fails
      });

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
    const authMethod = req.user?.authMethod; // present for Google provider tokens we issue
    
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
    
    // Determine whether this update completes onboarding (Google providers only)
    const wasHourly = parseFloat(provider.hourly_rate ?? 0) || 0;
    const wasProfileIncomplete =
      !provider.phone || !provider.title || !provider.specialty || !provider.bio || wasHourly <= 0;

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

    // If a Google-auth provider just completed their profile, send welcome/thank-you email once
    try {
      const isGoogleProvider = authMethod === 'google';
      const nowHourly = parseFloat(updatedProvider.hourly_rate ?? 0) || 0;
      const nowProfileIncomplete =
        !updatedProvider.phone ||
        !updatedProvider.title ||
        !updatedProvider.specialty ||
        !updatedProvider.bio ||
        nowHourly <= 0;

      const welcomeAlreadySent = updatedProvider.welcome_email_sent === true;

      if (isGoogleProvider && wasProfileIncomplete && !nowProfileIncomplete && !welcomeAlreadySent) {
        emailService
          .sendWelcomeEmail(updatedProvider.name || 'Provider', updatedProvider.email, 'provider')
          .then((result) => {
            if (result.success) {
              console.log('✅ Welcome email sent after provider onboarding:', updatedProvider.email);
            } else {
              console.warn('⚠️  Welcome email failed after provider onboarding:', result.error);
            }
          })
          .catch((err) => console.error('❌ Error sending onboarding welcome email:', err));

        // Mark as sent (best-effort)
        await pool.query(
          `UPDATE providers SET welcome_email_sent = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [updatedProvider.id]
        );
      }
    } catch (e) {
      console.warn('updateProviderProfile: welcome email post-onboarding failed:', e?.message || e);
    }
    
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
    const normalizedAvailability = normalizeAvailability(availability);
    
    res.json({
      availability: Object.keys(normalizedAvailability).length > 0 ? normalizedAvailability : (availability || {}),
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

    const normalizedAvailability = normalizeAvailability(availability);
    const updatedProvider = await Provider.updateAvailability(provider.id, normalizedAvailability);
    
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
 * Helper function to generate available time slots
 */
function generateAvailableSlots({ availability, bookings, startDate, endDate, slotDuration = 15 }) {
  const sessionDurationMinutes = 60;
  const slots = [];
  
  // Validate inputs
  if (!availability || typeof availability !== 'object') {
    console.warn('Invalid availability object:', availability);
    return [];
  }
  
  if (!startDate || !endDate) {
    console.warn('Missing date range:', { startDate, endDate });
    return [];
  }
  
  // Parse dates as local dates (YYYY-MM-DD format) to avoid timezone issues
  // When you do new Date("2026-01-15"), it's interpreted as UTC midnight
  // Instead, parse the date components directly
  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0); // Local midnight
  };
  
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid date range:', { startDate, endDate });
    return [];
  }
  
  // Group bookings by date and time for quick lookup
  // Store both the time and user_id so we can distinguish between current user's bookings and others'
  // IMPORTANT: Bookings are stored in UTC in the database, but we need to match them with local time slots
  const bookingsByDate = {};
  if (Array.isArray(bookings)) {
    bookings.forEach(booking => {
      if (!booking || !booking.appointment_date) return;
      
      try {
        const bookingDate = new Date(booking.appointment_date);
        if (isNaN(bookingDate.getTime())) return;
        
        const dateKey = bookingDate.toISOString().split('T')[0];
        // Convert UTC booking time to local time for matching with local time slots
        const hours = String(bookingDate.getHours()).padStart(2, '0');
        const minutes = String(bookingDate.getMinutes()).padStart(2, '0');
        const timeKey = `${hours}:${minutes}`; // HH:MM in local time
        
        if (!bookingsByDate[dateKey]) {
          bookingsByDate[dateKey] = [];
        }
        // Store time and user_id to identify who booked it
        bookingsByDate[dateKey].push({
          time: timeKey,
          userId: booking.user_id || booking.userId
        });
      } catch (err) {
        console.warn('Error processing booking:', err, booking);
      }
    });
  }
  
  // Day name mapping
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Iterate through each day in the range
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];
    const dayAvailability = availability[dayName];
    
    // Skip if provider is not available on this day
    // Check if enabled is explicitly false (default to true if not set)
    if (!dayAvailability || typeof dayAvailability !== 'object') {
      console.warn(`No availability data for ${dayName} on ${date.toISOString().split('T')[0]}`);
      continue;
    }
    
    // Only skip if enabled is explicitly false
    // If enabled is undefined or true, treat as enabled
    if (dayAvailability.enabled === false) {
      console.log(`Skipping ${dayName} ${date.toISOString().split('T')[0]} - explicitly disabled`);
      continue;
    }
    
    // Log when day is enabled (for debugging)
    if (dayAvailability.enabled === true || dayAvailability.enabled === undefined) {
      const dateKeyForLog = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      console.log(`Processing ${dayName} ${dateKeyForLog} - enabled: ${dayAvailability.enabled !== false}, start: ${dayAvailability.start}, end: ${dayAvailability.end}`);
    }
    
    // Validate and parse start/end times
    if (!dayAvailability.start || !dayAvailability.end) {
      console.warn(`Missing start/end time for ${dayName}:`, dayAvailability);
      continue;
    }
    
    let startHour, startMin, endHour, endMin;
    try {
      const startParts = dayAvailability.start.split(':');
      const endParts = dayAvailability.end.split(':');
      
      if (startParts.length < 2 || endParts.length < 2) {
        console.warn(`Invalid time format for ${dayName}:`, dayAvailability);
        continue;
      }
      
      startHour = parseInt(startParts[0], 10);
      startMin = parseInt(startParts[1], 10);
      endHour = parseInt(endParts[0], 10);
      endMin = parseInt(endParts[1], 10);
      
      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        console.warn(`Invalid time values for ${dayName}:`, dayAvailability);
        continue;
      }
    } catch (err) {
      console.warn(`Error parsing times for ${dayName}:`, err, dayAvailability);
      continue;
    }
    
    // Create date objects for start and end times
    // IMPORTANT: Availability times (startHour, endHour) are stored as local time
    // Extract the date components from the date (which is already in local time)
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayStart = new Date(localDate);
    dayStart.setHours(startHour, startMin, 0, 0);
    
    const dayEnd = new Date(localDate);
    dayEnd.setHours(endHour, endMin, 0, 0);
    
    // Validate day times
    if (dayStart >= dayEnd) {
      console.warn(`Invalid time range for ${dayName}: start >= end`, dayAvailability);
      continue;
    }
    
    // Get current time in local timezone
    const now = new Date();
    const minLeadTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minute buffer
    
    // Debug logging for Thursday
    const dateKeyForLog = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (dayName === 'thursday') {
      console.log(`[Thursday Debug] Date: ${dateKeyForLog}, dayStart: ${dayStart.toLocaleString()}, dayEnd: ${dayEnd.toLocaleString()}, now: ${now.toLocaleString()}, minLeadTime: ${minLeadTime.toLocaleString()}`);
    }
    
    // Generate slots using local time, then convert to UTC for storage
    let currentTime = new Date(dayStart);
    let slotCountForDay = 0;
    
    while (currentTime < dayEnd) {
      // Generate dateKey from the date object (already in local time)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      // Extract time in local timezone (HH:MM format)
      const hours = String(currentTime.getHours()).padStart(2, '0');
      const minutes = String(currentTime.getMinutes()).padStart(2, '0');
      const timeKey = `${hours}:${minutes}`;
      
      // Check if this slot is already booked (by any user)
      const slotBookings = bookingsByDate[dateKey]?.filter(b => {
        if (!b.time) return false;
        const [bookingHours, bookingMinutes] = b.time.split(':').map(Number);
        const bookingStart = bookingHours * 60 + bookingMinutes;
        const slotStart = currentTime.getHours() * 60 + currentTime.getMinutes();
        const bookingEnd = bookingStart + sessionDurationMinutes;
        const slotEnd = slotStart + sessionDurationMinutes;
        return slotStart < bookingEnd && bookingStart < slotEnd;
      }) || [];
      const isBooked = slotBookings.length > 0;
      
      // Include all future slots (at least 1 hour away)
      // Include ALL slots (even if booked) so frontend can grey out the current user's booked slots
      // Compare in local time to match availability times
      // For today, only include slots that are at least 5 minutes in the future (>= minLeadTime)
      // For future days, include all slots that are in the future
      // Compare dates in local time to avoid timezone issues
      const todayLocal = new Date();
      const todayYear = todayLocal.getFullYear();
      const todayMonth = String(todayLocal.getMonth() + 1).padStart(2, '0');
      const todayDay = String(todayLocal.getDate()).padStart(2, '0');
      const todayKey = `${todayYear}-${todayMonth}-${todayDay}`;
      const isToday = dateKey === todayKey;
      
      // For today: include slots >= minLeadTime (at least 5 minutes away)
      // For future days: include slots >= now (any future time)
      const shouldInclude = isToday 
        ? currentTime.getTime() >= minLeadTime.getTime()  // Changed from > to >= to include slots exactly 5 minutes away
        : currentTime.getTime() >= now.getTime(); // Changed from > to >= for consistency
      
      // Debug logging for 11:00 and 11:30 slots on Thursday
      if (dayName === 'thursday' && (timeKey === '11:00' || timeKey === '11:30')) {
        console.log(`[Slot Debug] ${timeKey} on ${dateKeyForLog}:`, {
          currentTime: currentTime.toLocaleString(),
          currentTimeMs: currentTime.getTime(),
          now: now.toLocaleString(),
          nowMs: now.getTime(),
          minLeadTime: minLeadTime.toLocaleString(),
          minLeadTimeMs: minLeadTime.getTime(),
          isToday,
          shouldInclude,
          timeDiffMinutes: isToday ? Math.round((currentTime.getTime() - minLeadTime.getTime()) / (60 * 1000)) : Math.round((currentTime.getTime() - now.getTime()) / (60 * 1000))
        });
      }
      
      if (shouldInclude) {
        // Convert local time to UTC for datetime field
        // currentTime is in local time, so we need to convert it to UTC
        // The easiest way is to create a new Date with the local time components
        // and then get its ISO string (which will be in UTC)
        const localYear = currentTime.getFullYear();
        const localMonth = currentTime.getMonth();
        const localDate = currentTime.getDate();
        const localHours = currentTime.getHours();
        const localMinutes = currentTime.getMinutes();
        
        // Create a date string that represents this local time, then parse it
        // This ensures the UTC conversion is correct
        const localTimeStr = `${localYear}-${String(localMonth + 1).padStart(2, '0')}-${String(localDate).padStart(2, '0')}T${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}:00`;
        const utcDateTime = new Date(localTimeStr);
        
        slots.push({
          date: dateKey,
          time: timeKey,
          datetime: utcDateTime.toISOString(),
          available: !isBooked, // Mark as unavailable if booked by anyone
          booked: isBooked, // Explicitly mark as booked
          bookedBy: slotBookings.map(b => b.userId) // Array of user IDs who booked this slot
        });
        slotCountForDay++;
      }
      
      // Move to next slot (in local time)
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      
      // Safety check to prevent infinite loop
      if (slots.length > 10000) {
        console.warn('Too many slots generated, stopping');
        break;
      }
    }
    
    // Debug logging for Thursday
    if (dayName === 'thursday') {
      console.log(`[Thursday Debug] Generated ${slotCountForDay} slots for ${dateKeyForLog}`);
    }
  }
  
  return slots;
}

/**
 * Get available time slots for a provider
 * GET /api/providers/:providerId/available-slots?startDate=2024-01-13&endDate=2024-01-24
 */
async function getProviderAvailableSlots(req, res, next) {
  try {
    const { providerId } = req.params;
    const { startDate, endDate } = req.query;
    
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

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: {
          message: 'startDate and endDate query parameters are required',
          code: 'MISSING_DATE_RANGE',
          status: 400
        }
      });
    }

    // Get provider
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

    // Get provider's recurring availability
    let availability = await Provider.getAvailability(providerIdNum);
    
    // Parse availability if it's a string (JSONB from database)
    if (typeof availability === 'string') {
      try {
        availability = JSON.parse(availability);
      } catch (parseError) {
        console.error('Error parsing availability JSON:', parseError);
        availability = {};
      }
    }
    
    if (!availability || Object.keys(availability).length === 0) {
      return res.json({
        providerId: providerIdNum,
        slots: []
      });
    }

    // Get existing bookings for the date range
    let bookings = [];
    try {
      bookings = await Booking.getByProviderAndDateRange(
        providerIdNum,
        startDate,
        endDate
      );
    } catch (bookingError) {
      console.error('Error fetching bookings:', bookingError);
      // Continue with empty bookings array if query fails
      bookings = [];
    }

    // Generate available slots
    let slots = [];
    try {
      slots = generateAvailableSlots({
        availability,
        bookings,
        startDate,
        endDate,
        slotDuration: 15 // 15-minute slots
      });
    } catch (slotError) {
      console.error('Error generating slots:', slotError);
      // Return empty slots if generation fails
      slots = [];
    }

    res.json({
      providerId: providerIdNum,
      slots: slots
    });
  } catch (error) {
    console.error('Error getting provider available slots:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: {
        message: 'Failed to load available slots',
        code: 'SERVER_ERROR',
        status: 500
      }
    });
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
    const formattedProviders = providers.map(provider => {
      // Deep clone availability to prevent sharing between providers
      let availability = provider.availability || {};
      
      // Handle JSONB - PostgreSQL returns it as object, but ensure it's cloned
      if (typeof availability === 'string') {
        try {
          availability = JSON.parse(availability);
        } catch (e) {
          console.error(`Error parsing availability for provider ${provider.id}:`, e);
          availability = {};
        }
      } else if (availability && typeof availability === 'object') {
        // Deep clone to prevent object sharing
        availability = JSON.parse(JSON.stringify(availability));
      }
      
      // Log each provider's availability to debug
      console.log(`[getAllProviders] Provider ${provider.id} (${provider.name}) availability:`, {
        providerId: provider.id,
        providerName: provider.name,
        availabilityKeys: Object.keys(availability),
        monday: availability.monday,
        tuesday: availability.tuesday,
        wednesday: availability.wednesday,
        thursday: availability.thursday,
        friday: availability.friday,
        saturday: availability.saturday,
        sunday: availability.sunday
      });
      
      return {
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
        availability: availability,
        createdAt: provider.created_at,
        updatedAt: provider.updated_at
      };
    });
    
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

    // Enforce minimum lead time (at least 5 minutes from now)
    const now = new Date();
    const minLeadTimeMs = 5 * 60 * 1000;
    if (appointmentDateTime.getTime() < now.getTime() + minLeadTimeMs) {
      return res.status(400).json({
        error: {
          message: 'Please select a time at least 5 minutes from now.',
          code: 'INSUFFICIENT_LEAD_TIME',
          status: 400
        }
      });
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

    // Check if slot is already booked (prevent double-booking)
    const appointmentDateObj = new Date(formattedDate);
    const dateKey = appointmentDateObj.toISOString().split('T')[0];
    const timeKey = appointmentDateObj.toTimeString().slice(0, 5);
    
    // Get bookings for this provider on the same date
    const existingBookings = await Booking.getByProviderAndDateRange(
      providerIdNum,
      dateKey,
      dateKey
    );
    
    const sessionDurationMinutes = 60;
    // Check if this slot overlaps an existing 1-hour booking
    const slotConflict = existingBookings.find(booking => {
      const bookingDate = new Date(booking.appointment_date);
      const bookingStart = bookingDate.getHours() * 60 + bookingDate.getMinutes();
      const slotStart = appointmentDateObj.getHours() * 60 + appointmentDateObj.getMinutes();
      const bookingEnd = bookingStart + sessionDurationMinutes;
      const slotEnd = slotStart + sessionDurationMinutes;
      return slotStart < bookingEnd && bookingStart < slotEnd;
    });
    
    if (slotConflict) {
      console.log('createBooking: Slot already booked:', {
        requestedTime: timeKey,
        conflictingBooking: slotConflict.id
      });
      return res.status(409).json({
        error: {
          message: 'This time slot is already booked. Please select another time.',
          code: 'SLOT_ALREADY_BOOKED',
          status: 409
        }
      });
    }

    // Get user name for the booking
    const user = await User.findById(userId);
    const userName = user?.name || null;
    
    console.log('createBooking: Creating booking with:', {
      userId,
      userIdType: typeof userId,
      providerId: providerIdNum,
      providerIdType: typeof providerIdNum,
      providerIdFromDB: provider.id,
      appointmentDate: formattedDate,
      appointmentDateType: typeof formattedDate,
      sessionType,
      notes,
      userName,
      providerName: provider.name
    });
    
    // Verify the date format before sending to database
    if (formattedDate && typeof formattedDate === 'string') {
      const verifyDate = new Date(formattedDate);
      console.log('createBooking: Date format verification before storage:', {
        sendingToDB: formattedDate,
        parsedBack: verifyDate.toISOString(),
        matches: formattedDate === verifyDate.toISOString(),
        utcTime: verifyDate.getTime()
      });
    }

    const booking = await Booking.create({
      userId,
      providerId: providerIdNum,
      appointmentDate: formattedDate,
      sessionType,
      notes,
      userName: userName,
      providerName: provider.name,
      providerSpecialty: provider.specialty || null,
      providerTitle: provider.title || null,
      providerHourlyRate: provider.hourly_rate || null
    });
    
    console.log('createBooking: Booking created successfully:', {
      bookingId: booking.id,
      userId: booking.user_id,
      providerId: booking.provider_id,
      providerIdType: typeof booking.provider_id,
      appointmentDate: booking.appointment_date,
      status: booking.status
    });
    
    // Verify the booking was created with the correct provider ID
    if (booking.provider_id !== providerIdNum && booking.provider_id !== provider.id) {
      console.error('⚠️  WARNING: Provider ID mismatch!', {
        expectedProviderId: providerIdNum,
        providerIdFromDB: provider.id,
        actualProviderIdInBooking: booking.provider_id
      });
    }

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

    // Send booking confirmation emails (non-blocking)
    // Email to user
    emailService.sendBookingConfirmationEmail(
      user.email,
      userName || user.name || 'User',
      provider.name,
      fullBooking.appointment_date,
      sessionType,
      notes
    ).then(result => {
      if (result.success) {
        console.log('✅ Booking confirmation email sent to user:', user.email);
      } else {
        console.warn('⚠️  Failed to send booking confirmation email to user:', result.error);
      }
    }).catch(err => {
      console.error('❌ Error sending booking confirmation email to user:', err);
    });

    // Email to provider
    emailService.sendProviderBookingNotificationEmail(
      provider.email,
      provider.name,
      userName || user.name || 'User',
      fullBooking.appointment_date,
      sessionType,
      notes
    ).then(result => {
      if (result.success) {
        console.log('✅ Booking notification email sent to provider:', provider.email);
      } else {
        console.warn('⚠️  Failed to send booking notification email to provider:', result.error);
      }
    }).catch(err => {
      console.error('❌ Error sending booking notification email to provider:', err);
    });

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
    
    // Helper function to convert date to ISO string (same as in getUserBookings)
    const toISOString = (dateValue) => {
      if (!dateValue) return null
      if (dateValue instanceof Date) {
        return dateValue.toISOString()
      }
      if (typeof dateValue === 'string') {
        if (dateValue.includes('Z') || dateValue.includes('+') || dateValue.match(/-\d{2}:\d{2}$/)) {
          return dateValue
        }
        // PostgreSQL timestamp format without timezone - treat as UTC
        const parsed = new Date(dateValue + 'Z')
        return isNaN(parsed.getTime()) ? dateValue : parsed.toISOString()
      }
      return new Date(dateValue).toISOString()
    }
    
    res.json({
      bookings: bookings.map(booking => ({
        id: booking.id,
        providerId: booking.provider_id,
        providerName: booking.provider_name,
        providerTitle: booking.provider_title,
        providerSpecialty: booking.provider_specialty,
        appointmentDate: toISOString(booking.appointment_date),
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
    console.log('getProviderBookings: Request received', {
      providerIdFromToken: providerId,
      userRole: req.user?.role,
      userEmail: req.user?.email
    });
    
    if (!providerId) {
      console.error('getProviderBookings: No providerId found in token');
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
      console.error('getProviderBookings: Provider not found for ID:', providerId);
      return res.status(404).json({
        error: {
          message: 'Provider profile not found',
          code: 'PROVIDER_NOT_FOUND',
          status: 404
        }
      });
    }

    console.log('getProviderBookings: Provider found', {
      providerId: provider.id,
      providerName: provider.name,
      providerEmail: provider.email
    });

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

    // Helper function to convert date to ISO string (same as in getUserBookings)
    const toISOString = (dateValue) => {
      if (!dateValue) return null
      if (dateValue instanceof Date) {
        return dateValue.toISOString()
      }
      if (typeof dateValue === 'string') {
        if (dateValue.includes('Z') || dateValue.includes('+') || dateValue.match(/-\d{2}:\d{2}$/)) {
          return dateValue
        }
        // PostgreSQL timestamp format without timezone - treat as UTC
        const parsed = new Date(dateValue + 'Z')
        return isNaN(parsed.getTime()) ? dateValue : parsed.toISOString()
      }
      return new Date(dateValue).toISOString()
    }

    res.json({
      bookings: activeBookings.map(booking => ({
        id: booking.id,
        userId: booking.user_id,
        userName: booking.user_name || booking.userName || 'Patient',
        userEmail: booking.user_email || booking.userEmail,
        userPhone: booking.user_phone || booking.userPhone,
        appointmentDate: toISOString(booking.appointment_date || booking.appointmentDate),
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
    console.log('🔐 Google OAuth login attempt started');
    const { idToken, role } = req.body;

    if (!idToken) {
      console.error('❌ No Google ID token provided');
      return res.status(400).json({
        error: {
          message: 'Google ID token is required',
          code: 'MISSING_TOKEN',
          status: 400
        }
      });
    }

    if (!googleClient) {
      console.error('❌ Google OAuth client not initialized');
      console.error('   GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
      return res.status(500).json({
        error: {
          message: 'Google OAuth is not configured',
          code: 'OAUTH_NOT_CONFIGURED',
          status: 500
        }
      });
    }
    
    console.log('✅ Google OAuth client initialized');

    // Verify the Google ID token
    let ticket;
    try {
      console.log('🔐 Verifying Google token...');
      console.log('   Client ID:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
      console.log('   Token length:', idToken ? idToken.length : 0);
      
      ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID
      });
      console.log('✅ Google token verified successfully');
    } catch (error) {
      console.error('❌ Google token verification error:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error details:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Invalid Google token';
      if (error.message?.includes('audience')) {
        errorMessage = 'Google Client ID mismatch. Please check GOOGLE_CLIENT_ID in backend .env matches your Google OAuth app.';
      } else if (error.message?.includes('expired')) {
        errorMessage = 'Google token has expired. Please try again.';
      } else if (error.message?.includes('signature')) {
        errorMessage = 'Google token signature is invalid. Please try again.';
      }
      
      return res.status(401).json({
        error: {
          message: errorMessage,
          code: 'INVALID_TOKEN',
          status: 401,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    const requestedRole = role === 'provider' ? 'provider' : 'user';

    // Provider Google OAuth should authenticate against providers table (not users table)
    if (requestedRole === 'provider') {
      let provider = await Provider.findByEmail(email);
      let isNewProvider = false;

      if (!provider) {
        // If a user exists with this email, only allow "legacy provider-in-users" migration if role was provider.
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.role !== 'provider') {
          return res.status(409).json({
            error: {
              message: 'Email already registered as user. Please use user login.',
              code: 'EMAIL_EXISTS',
              status: 409
            }
          });
        }

        // Create provider with a random password hash (OAuth providers won’t use password login)
        isNewProvider = true;
        const randomPassword = Math.random().toString(36).slice(-12);
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        provider = await Provider.create({
          passwordHash,
          name: name || email.split('@')[0],
          email,
          phone: null,
          specialty: null,
          title: null,
          bio: null,
          hourlyRate: 0
        });
        console.log(`✅ Provider account created successfully via Google OAuth: ${provider.email} (ID: ${provider.id})`);
      }

      // Update provider last_login (best-effort)
      try {
        await pool.query(
          `UPDATE providers
           SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [provider.id]
        );
      } catch (e) {
        console.warn('⚠️  Could not update provider last_login:', e?.message || e);
      }

      // Provider Google OAuth onboarding requirements
      const providerHourlyRate = parseFloat(provider.hourly_rate ?? provider.hourlyRate ?? 0) || 0;
      const providerProfileIncomplete =
        !provider.phone ||
        !provider.title ||
        !provider.specialty ||
        !provider.bio ||
        providerHourlyRate <= 0;

      const token = jwt.sign(
        { userId: provider.id, email: provider.email, role: 'provider', authMethod: 'google' },
        JWT_CONFIG.SECRET,
        { expiresIn: JWT_CONFIG.EXPIRES_IN }
      );

      // Welcome email (optional, best-effort)
      if (isNewProvider) {
        emailService.sendWelcomeEmail(provider.name || 'Provider', provider.email, 'provider')
          .catch(() => {});
      }

      return res.json({
        user: {
          id: provider.id,
          email: provider.email,
          name: provider.name,
          role: 'provider',
          phone: provider.phone || null,
          picture: picture || null,
          authMethod: 'google',
          profileIncomplete: providerProfileIncomplete,
          createdAt: provider.created_at
        },
        token,
        message: isNewProvider ? 'Provider account created and logged in successfully' : 'Google login successful',
        isNewUser: isNewProvider
      });
    }

    // User Google OAuth stays on users table
    let user = await User.findByEmail(email);
    let isNewUser = false;

    // SECURITY: Check if provider with same email exists (prevent duplicate emails across tables)
    if (!user) {
      const existingProvider = await Provider.findByEmail(email);
      if (existingProvider) {
        return res.status(409).json({
          error: {
            message: 'Email already registered as provider. Please use provider login.',
            code: 'EMAIL_EXISTS',
            status: 409
          }
        });
      }
    }

    if (user) {
      // User exists - update last login and Google info
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
      user = await User.findById(user.id);
    } else {
      isNewUser = true;
      console.log(`🆕 Creating new user account for Google OAuth: ${email}`);

      const randomPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const insertQuery = `
        INSERT INTO users (email, password, name, role, phone, google_id, google_picture, auth_method, created_at, updated_at, last_login)
        VALUES ($1, $2, $3, 'user', $4, $5, $6, 'google', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, name, role, phone, google_id, google_picture, auth_method, date_of_birth, created_at, updated_at
      `;

      const result = await pool.query(insertQuery, [
        email,
        passwordHash,
        name || email.split('@')[0],
        null,
        googleId,
        picture
      ]);

      user = result.rows[0];
      console.log(`✅ User account created successfully: ${user.email} (ID: ${user.id})`);

      emailService.sendWelcomeEmail(user.name || 'User', user.email, 'user')
        .catch(() => {});
    }

    // Log login event (users only)
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
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );

    const profileIncomplete = user.auth_method === 'google' && (!user.name || !user.phone || !user.date_of_birth);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
        picture: user.google_picture || picture || null,
        authMethod: user.auth_method || 'google',
        profileIncomplete: profileIncomplete,
        createdAt: user.created_at
      },
      token,
      message: isNewUser ? 'Account created and logged in successfully' : 'Google login successful',
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

    // Get user and provider details for email notifications
    const user = await User.findById(userIdNum);
    const provider = await Provider.findById(booking.provider_id);
    
    const cancelledBooking = await Booking.cancel(bookingIdNum, reason.trim());
    console.log('cancelBooking: Booking cancelled successfully:', cancelledBooking);
    
    // Send cancellation emails (non-blocking)
    // Email to user
    if (user && user.email) {
      emailService.sendBookingCancellationEmail(
        user.email,
        user.name || booking.user_name || 'User',
        booking.provider_name || provider?.name || 'Provider',
        booking.appointment_date,
        booking.session_type,
        reason.trim()
      ).then(result => {
        if (result.success) {
          console.log('✅ Cancellation email sent to user:', user.email);
        } else {
          console.warn('⚠️  Failed to send cancellation email to user:', result.error);
        }
      }).catch(err => {
        console.error('❌ Error sending cancellation email to user:', err);
      });
    }
    
    // Email to provider
    if (provider && provider.email) {
      emailService.sendProviderCancellationNotificationEmail(
        provider.email,
        provider.name || 'Provider',
        user?.name || booking.user_name || 'User',
        booking.appointment_date,
        booking.session_type,
        reason.trim()
      ).then(result => {
        if (result.success) {
          console.log('✅ Cancellation notification email sent to provider:', provider.email);
        } else {
          console.warn('⚠️  Failed to send cancellation notification email to provider:', result.error);
        }
      }).catch(err => {
        console.error('❌ Error sending cancellation notification email to provider:', err);
      });
    }
    
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

/**
 * Request password reset
 */
async function requestPasswordReset(req, res, next) {
  try {
    const { email, role = 'user' } = req.body; // role: 'user' or 'provider'
    
    if (!email) {
      return res.status(400).json({
        error: {
          message: 'Email is required',
          code: 'MISSING_EMAIL',
          status: 400
        }
      });
    }
    
    let user = null;
    let resetToken = null;
    
    if (role === 'provider') {
      user = await Provider.findByEmail(email);
    } else {
      user = await User.findByEmail(email);
    }
    
    // Check if user exists - return error if not found
    if (!user) {
      const accountType = role === 'provider' ? 'provider' : 'user';
      console.log(`❌ Password reset requested for non-existent ${accountType} email:`, email);
      return res.status(404).json({
        error: {
          message: `No ${accountType} account found with this email address. Please check your email or register for a new account.`,
          code: 'EMAIL_NOT_FOUND',
          status: 404
        }
      });
    }
    
    // Generate reset token (JWT with short expiration)
    resetToken = jwt.sign(
      { userId: user.id, email: user.email, role: role, type: 'password-reset' },
      JWT_CONFIG.SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );
    
    // Send password reset email (non-blocking)
    emailService.sendPasswordResetEmail(
      user.name || 'User',
      user.email,
      resetToken
    ).then(result => {
      if (result.success) {
        console.log('✅ Password reset email sent successfully to:', user.email);
        console.log('   Message ID:', result.messageId);
      } else {
        console.error('⚠️  Failed to send password reset email to:', user.email);
        console.error('   Error:', result.error || result.message);
        console.error('   Please check email service configuration in .env file');
      }
    }).catch(err => {
      console.error('❌ Error sending password reset email to:', user.email);
      console.error('   Error details:', err.message);
      console.error('   Stack:', err.stack);
    });
    
    // Return success message
    res.json({
      message: 'Password reset link has been sent to your email address.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    next(error);
  }
}

/**
 * Reset password with token
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        error: {
          message: 'Token and new password are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: {
          message: 'Password must be at least 6 characters long',
          code: 'INVALID_PASSWORD',
          status: 400
        }
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_CONFIG.SECRET);
      
      // Check if token is for password reset
      if (decoded.type !== 'password-reset') {
        return res.status(400).json({
          error: {
            message: 'Invalid reset token',
            code: 'INVALID_TOKEN',
            status: 400
          }
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          error: {
            message: 'Reset token has expired. Please request a new one.',
            code: 'TOKEN_EXPIRED',
            status: 400
          }
        });
      }
      return res.status(400).json({
        error: {
          message: 'Invalid reset token',
          code: 'INVALID_TOKEN',
          status: 400
        }
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password based on role
    if (decoded.role === 'provider') {
      const updateQuery = `
        UPDATE providers 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, name
      `;
      const result = await pool.query(updateQuery, [passwordHash, decoded.userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: {
            message: 'Provider not found',
            code: 'USER_NOT_FOUND',
            status: 404
          }
        });
      }
    } else {
      const updateQuery = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, name
      `;
      const result = await pool.query(updateQuery, [passwordHash, decoded.userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND',
            status: 404
          }
        });
      }
    }
    
    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    next(error);
  }
}

/**
 * Submit support ticket
 */
async function submitSupportTicket(req, res, next) {
  try {
    const { name, email, subject, messageType, message } = req.body;
    
    // Validation
    if (!name || !email || !subject || !messageType || !message) {
      return res.status(400).json({
        error: {
          message: 'All fields are required',
          code: 'MISSING_FIELDS',
          status: 400
        }
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          message: 'Invalid email address',
          code: 'INVALID_EMAIL',
          status: 400
        }
      });
    }

    // Get user ID if authenticated (optional)
    let userId = null;
    if (req.user && req.user.userId) {
      userId = req.user.userId;
    } else {
      // Try to find user by email
      try {
        const user = await User.findByEmail(email);
        if (user) {
          userId = user.id;
        }
      } catch (err) {
        // User not found, continue without userId
        console.log('Support ticket from non-registered user:', email);
      }
    }

    // Create support ticket in database
    const supportTicket = await Support.create({
      userId: userId,
      userName: name,
      userEmail: email,
      subject: subject,
      messageType: messageType,
      message: message
    });

    console.log('✅ Support ticket created:', {
      id: supportTicket.id,
      email: email,
      subject: subject,
      type: messageType
    });

    // Send email notification to support team + acknowledgement to user (non-blocking)
    emailService.sendSupportTicketEmail(
      name,
      email,
      subject,
      messageType,
      message,
      supportTicket.id
    ).then(result => {
      if (result.success) {
        console.log('✅ Support ticket email sent to support team');
      } else {
        console.warn('⚠️  Failed to send support ticket email:', result.error);
      }
    }).catch(err => {
      console.error('❌ Error sending support ticket email:', err);
    });

    emailService.sendSupportTicketAcknowledgementEmail(
      name,
      email,
      subject,
      messageType,
      supportTicket.id
    ).then(result => {
      if (result.success) {
        console.log('✅ Support ticket acknowledgement email sent to user');
      } else {
        console.warn('⚠️  Failed to send support ticket acknowledgement email:', result.error);
      }
    }).catch(err => {
      console.error('❌ Error sending support ticket acknowledgement email:', err);
    });

    // Return success response
    res.status(201).json({
      message: 'Support ticket submitted successfully',
      ticketId: supportTicket.id,
      ticket: {
        id: supportTicket.id,
        subject: supportTicket.subject,
        messageType: supportTicket.messageType,
        status: supportTicket.status,
        createdAt: supportTicket.created_at
      }
    });
  } catch (error) {
    console.error('Support ticket submission error:', error);
    next(error);
  }
}

/**
 * Join video session (Daily) for a booking.
 * Providers are always host (Daily "owner").
 */
async function joinVideoSession(req, res, next) {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).json({
        error: { message: 'Invalid booking ID', code: 'INVALID_BOOKING_ID', status: 400 },
      });
    }

    if (!requesterId || !requesterRole) {
      return res.status(401).json({
        error: { message: 'User not authenticated', code: 'UNAUTHORIZED', status: 401 },
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        error: { message: 'Booking not found', code: 'BOOKING_NOT_FOUND', status: 404 },
      });
    }

    const status = String(booking.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'completed') {
      return res.status(409).json({
        error: {
          message: `Booking is ${status} and cannot be joined`,
          code: 'BOOKING_NOT_JOINABLE',
          status: 409,
        },
      });
    }

    const isProvider = requesterRole === 'provider';
    const isUser = requesterRole === 'user';
    if (!isProvider && !isUser) {
      return res.status(403).json({
        error: { message: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
      });
    }

    // Ownership checks (token userId is provider.id for providers)
    if (isProvider && parseInt(booking.provider_id) !== parseInt(requesterId)) {
      return res.status(403).json({
        error: { message: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
      });
    }
    if (isUser && parseInt(booking.user_id) !== parseInt(requesterId)) {
      return res.status(403).json({
        error: { message: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
      });
    }

    // Time gating
    const startAt = new Date(booking.appointment_date);
    if (isNaN(startAt.getTime())) {
      return res.status(500).json({
        error: {
          message: 'Booking has invalid appointment date',
          code: 'INVALID_APPOINTMENT_DATE',
          status: 500,
        },
      });
    }

    const durationMinutes = 60;
    const now = new Date();
    const providerEarlyMinutes = 15;
    const userEarlyMinutes = 5;
    const graceMinutes = 5;

    const joinEarliest = new Date(
      startAt.getTime() - (isProvider ? providerEarlyMinutes : userEarlyMinutes) * 60 * 1000
    );
    const joinLatest = new Date(startAt.getTime() + (durationMinutes + graceMinutes) * 60 * 1000);

    if (now < joinEarliest) {
      return res.status(403).json({
        error: { message: 'Session is not yet active', code: 'SESSION_NOT_ACTIVE', status: 403 },
      });
    }
    if (now > joinLatest) {
      return res.status(403).json({
        error: { message: 'Session join window has ended', code: 'SESSION_EXPIRED', status: 403 },
      });
    }

    // Room expiry: enforce "1 hour session" (+buffer).
    // If scheduled time is in the past, keep at least duration+buffer from now.
    const scheduledExpiry = new Date(startAt.getTime() + (durationMinutes + 10) * 60 * 1000);
    const expiresAt =
      scheduledExpiry > now ? scheduledExpiry : new Date(now.getTime() + (durationMinutes + 10) * 60 * 1000);

    // Resolve display name
    let displayName = null;
    if (isProvider) {
      const provider = await Provider.findById(requesterId);
      displayName = provider?.name || booking.provider_name || 'Provider';
    } else {
      const user = await User.findById(requesterId);
      displayName = user?.name || booking.user_name || 'User';
    }

    const tokensDisabled =
      String(process.env.DAILY_DISABLE_TOKENS || '').toLowerCase() === 'true' ||
      String(process.env.DAILY_USE_TOKENS || '').toLowerCase() === 'false';

    const looksLikeBillingError = (err) => {
      const statusCode = err?.status;
      const msg = String(err?.message || '').toLowerCase();
      return (
        statusCode === 402 ||
        msg.includes('payment method') ||
        msg.includes('billing') ||
        msg.includes('add a payment') ||
        msg.includes('card') ||
        msg.includes('payment')
      );
    };

    let roomName = null;
    let roomUrl = null;
    let token = null;

    // If tokens are disabled/unavailable, enforce "provider starts first" by requiring
    // an existing started video_meeting for user joins (prevents users entering first).
    if (tokensDisabled && isUser) {
      try {
        const existingMeeting = await VideoMeeting.findByBookingId(bookingId);
        const started =
          existingMeeting &&
          (String(existingMeeting.status || '').toLowerCase() === 'in_progress' || !!existingMeeting.started_at);

        if (!started) {
          return res.status(403).json({
            error: {
              message: 'Waiting for provider to start the session',
              code: 'WAITING_FOR_PROVIDER',
              status: 403,
            },
          });
        }

        roomName = existingMeeting.room_name;
        roomUrl = existingMeeting.room_url;
        token = null;
      } catch (e) {
        return res.status(403).json({
          error: {
            message: 'Waiting for provider to start the session',
            code: 'WAITING_FOR_PROVIDER',
            status: 403,
          },
        });
      }
    }

    // Prefer private rooms + tokens (provider as host). If Daily billing is not set up,
    // fallback to a public room without token so sessions can run smoothly.
    try {
      if (roomUrl) {
        // Already resolved (tokensDisabled + user path)
        throw new Error('ROOM_ALREADY_RESOLVED');
      }
      if (tokensDisabled) {
        throw new Error('DAILY_TOKENS_DISABLED');
      }

      const privateRoom = await dailyVideoService.ensureRoomForBooking({
        bookingId,
        expiresAt,
        privacy: 'private',
      });
      roomName = privateRoom.roomName;
      roomUrl = privateRoom.roomUrl;

      token = await dailyVideoService.createMeetingToken({
        roomName,
        userName: displayName,
        isOwner: isProvider, // provider is always host
        expiresAt,
      });
    } catch (e) {
      if (String(e?.message || '') === 'ROOM_ALREADY_RESOLVED') {
        // no-op: user already has roomUrl without token
      } else {
      // If tokens are disabled or Daily requires billing, use a public "open" room with no token.
      if (tokensDisabled || looksLikeBillingError(e) || String(e?.message || '') === 'DAILY_TOKENS_DISABLED') {
        const openRoom = await dailyVideoService.ensureRoomForBooking({
          bookingId,
          expiresAt,
          privacy: 'public',
          roomNameSuffix: 'open',
        });
        roomName = openRoom.roomName;
        roomUrl = openRoom.roomUrl;
        token = null;
      } else {
        throw e;
      }
      }
    }

    // Persist metadata for audit/debugging (best-effort)
    try {
      await VideoMeeting.upsert({
        bookingId,
        providerId: booking.provider_id,
        userId: booking.user_id,
        vendor: 'daily',
        roomName,
        roomUrl,
        scheduledStart: startAt.toISOString(),
        scheduledEnd: new Date(startAt.getTime() + durationMinutes * 60 * 1000).toISOString(),
        status: isProvider ? 'in_progress' : 'scheduled',
      });
      if (isProvider) {
        await VideoMeeting.markStarted(bookingId);
      }
    } catch (e) {
      console.warn('joinVideoSession: failed to upsert video_meetings:', e?.message || e);
    }

    res.json({
      vendor: 'daily',
      roomUrl,
      token,
      isOwner: isProvider,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Provider completes a session (marks booking + video meeting completed)
 */
async function completeVideoSession(req, res, next) {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).json({
        error: { message: 'Invalid booking ID', code: 'INVALID_BOOKING_ID', status: 400 },
      });
    }

    if (!requesterId || requesterRole !== 'provider') {
      return res.status(403).json({
        error: { message: 'Only providers can complete sessions', code: 'ACCESS_DENIED', status: 403 },
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        error: { message: 'Booking not found', code: 'BOOKING_NOT_FOUND', status: 404 },
      });
    }

    if (parseInt(booking.provider_id) !== parseInt(requesterId)) {
      return res.status(403).json({
        error: { message: 'Access denied', code: 'ACCESS_DENIED', status: 403 },
      });
    }

    const updated = await Booking.updateStatus(bookingId, 'completed');
    try {
      await VideoMeeting.markCompleted(bookingId);
    } catch (e) {
      console.warn('completeVideoSession: failed to mark video meeting completed:', e?.message || e);
    }

    res.json({
      message: 'Session completed',
      booking: { id: updated.id, status: updated.status },
    });
  } catch (error) {
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
  getProviderAvailableSlots,
  createBooking,
  getUserBookings,
  getUpcomingBookings,
  getProviderBookings,
  cancelBooking,
  joinVideoSession,
  completeVideoSession,
  requestPasswordReset,
  resetPassword,
  submitSupportTicket
};

