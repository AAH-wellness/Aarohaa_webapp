import { OAuth2Client } from 'google-auth-library'
import { generateToken } from '../utils/auth.utils.js'
import { findUserByEmail, createUser, findUserByGoogleId, updateUser } from '../models/user.model.js'
import crypto from 'crypto'

// Initialize Google OAuth client
const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured')
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

// Generate secure state token for OAuth flow
export const generateStateToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Store state tokens (in production, use Redis or database)
const stateTokens = new Map()

// Initiate Google OAuth flow
export const initiateGoogleAuth = (req, res) => {
  try {
    const { role = 'user' } = req.query

    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file')
      return res.status(500).json({
        error: {
          message: 'Google OAuth is not configured. Please set up Google OAuth credentials in .env file. See GOOGLE_OAUTH_SETUP.md for instructions.',
          code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
          status: 500,
          setupRequired: true
        }
      })
    }

    // Generate state token for CSRF protection
    const stateToken = generateStateToken()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store state token with role
    stateTokens.set(stateToken, {
      role,
      expiresAt
    })

    // Clean up expired tokens
    cleanupExpiredTokens()

    const client = getGoogleClient()
    
    // Generate authorization URL
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      state: stateToken,
      prompt: 'consent' // Force consent screen to get refresh token
    })

    res.status(200).json({
      authUrl,
      state: stateToken
    })
  } catch (error) {
    console.error('Google OAuth initiation error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to initiate Google authentication'
    let errorCode = 'GOOGLE_AUTH_ERROR'
    
    if (error.message.includes('not configured')) {
      errorMessage = 'Google OAuth is not configured. Please set up Google OAuth credentials in .env file. See GOOGLE_OAUTH_SETUP.md for instructions.'
      errorCode = 'GOOGLE_OAUTH_NOT_CONFIGURED'
    }
    
    res.status(500).json({
      error: {
        message: errorMessage,
        code: errorCode,
        status: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    })
  }
}

// Handle Google OAuth callback
export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query

    if (!code) {
      return res.status(400).json({
        error: {
          message: 'Authorization code is missing',
          code: 'MISSING_CODE',
          status: 400
        }
      })
    }

    if (!state) {
      return res.status(400).json({
        error: {
          message: 'State token is missing',
          code: 'MISSING_STATE',
          status: 400
        }
      })
    }

    // Verify state token
    const stateData = stateTokens.get(state)
    if (!stateData) {
      return res.status(400).json({
        error: {
          message: 'Invalid or expired state token',
          code: 'INVALID_STATE',
          status: 400
        }
      })
    }

    // Check if state token expired
    if (Date.now() > stateData.expiresAt) {
      stateTokens.delete(state)
      return res.status(400).json({
        error: {
          message: 'State token has expired',
          code: 'EXPIRED_STATE',
          status: 400
        }
      })
    }

    const { role } = stateData
    stateTokens.delete(state) // Remove used state token

    const client = getGoogleClient()

    // Exchange authorization code for tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified
    } = payload

    if (!email_verified) {
      return res.status(400).json({
        error: {
          message: 'Google email is not verified',
          code: 'EMAIL_NOT_VERIFIED',
          status: 400
        }
      })
    }

    // Check if user exists by Google ID
    let user = await findUserByGoogleId(googleId)

    // If not found by Google ID, check by email
    if (!user) {
      user = await findUserByEmail(email)
      
      // If user exists with email but no Google ID, link Google account
      if (user) {
        user = await updateUser(user.id, {
          googleId,
          googlePicture: picture,
          authMethod: 'google'
        })
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      user = await createUser({
        email,
        name,
        googleId,
        googlePicture: picture,
        authMethod: 'google',
        role: role || 'user',
        emailVerified: true
      })
    } else {
      // Update user info from Google
      user = await updateUser(user.id, {
        name: name || user.name,
        googlePicture: picture || user.googlePicture,
        authMethod: 'google'
      })
    }

    // Generate JWT token
    const token = generateToken(user)

    // Return user data and token
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.googlePicture,
      authMethod: 'google',
      createdAt: user.createdAt
    }

    // Redirect to frontend with token (for OAuth callback flow)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const redirectUrl = `${frontendUrl}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`

    res.redirect(redirectUrl)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`)
  }
}

// Verify Google ID token (for frontend token verification)
export const verifyGoogleToken = async (req, res) => {
  try {
    const { idToken, role = 'user' } = req.body

    if (!idToken) {
      return res.status(400).json({
        error: {
          message: 'ID token is required',
          code: 'MISSING_TOKEN',
          status: 400
        }
      })
    }

    const client = getGoogleClient()

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified
    } = payload

    if (!email_verified) {
      return res.status(400).json({
        error: {
          message: 'Google email is not verified',
          code: 'EMAIL_NOT_VERIFIED',
          status: 400
        }
      })
    }

    // Check if user exists
    let user = await findUserByGoogleId(googleId)

    if (!user) {
      user = await findUserByEmail(email)
      
      if (user) {
        // Link Google account to existing user
        user = await updateUser(user.id, {
          googleId,
          googlePicture: picture,
          authMethod: 'google'
        })
      } else {
        // Create new user
        user = await createUser({
          email,
          name,
          googleId,
          googlePicture: picture,
          authMethod: 'google',
          role: role || 'user',
          emailVerified: true
        })
      }
    } else {
      // Update user info
      user = await updateUser(user.id, {
        name: name || user.name,
        googlePicture: picture || user.googlePicture,
        authMethod: 'google'
      })
    }

    // Generate JWT token
    const token = generateToken(user)

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.googlePicture,
      authMethod: 'google',
      createdAt: user.createdAt
    }

    res.status(200).json({
      data: {
        user: userData,
        token
      },
      message: 'Google authentication successful',
      status: 'success'
    })
  } catch (error) {
    console.error('Google token verification error:', error)
    res.status(401).json({
      error: {
        message: 'Invalid Google token',
        code: 'INVALID_TOKEN',
        status: 401
      }
    })
  }
}

// Cleanup expired state tokens
const cleanupExpiredTokens = () => {
  const now = Date.now()
  for (const [token, data] of stateTokens.entries()) {
    if (now > data.expiresAt) {
      stateTokens.delete(token)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000)

