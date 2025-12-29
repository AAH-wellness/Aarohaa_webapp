import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { validationResult } from 'express-validator'
import { generateToken, hashPassword, comparePassword } from '../utils/auth.utils.js'
import { findUserByEmail, createUser, updateUser } from '../models/user.model.js'
import { storeResetCode, verifyResetCode, getVerifiedResetCode, clearResetCode } from '../models/user.model.js'
import { generateResetCode, sendResetCodeEmail, sendPasswordChangeConfirmation } from '../utils/email.utils.js'

// Register new user
export const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          errors: errors.array(),
          status: 400
        }
      })
    }

    const { email, password, name, role = 'user', phone, dateOfBirth } = req.body

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        error: {
          message: 'User with this email already exists',
          code: 'USER_EXISTS',
          status: 400
        }
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await createUser({
      email,
      password: hashedPassword,
      name,
      role,
      phone: phone || null, // Phone with country code (e.g., +1234567890)
      dateOfBirth: dateOfBirth || null // Format: YYYY-MM-DD
    })

    // Generate JWT token
    const token = generateToken(user)

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    }

    res.status(201).json({
      data: {
        user: userData,
        token
      },
      message: 'User registered successfully',
      status: 'success'
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error during registration',
        code: 'REGISTRATION_ERROR',
        status: 500
      }
    })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          errors: errors.array(),
          status: 400
        }
      })
    }

    const { email, password, loginMethod = 'email' } = req.body

    // Handle wallet login
    if (loginMethod === 'wallet') {
      // For wallet login, we'll handle it differently
      // This is a placeholder - implement wallet authentication logic
      return res.status(200).json({
        data: {
          user: {
            id: 'wallet_user',
            email: `${req.body.walletAddress?.substring(0, 8)}@wallet`,
            name: 'Wallet User',
            role: req.body.role || 'user'
          },
          token: generateToken({ id: 'wallet_user', email: req.body.walletAddress })
        },
        message: 'Wallet login successful',
        status: 'success'
      })
    }

    // Handle email/password login
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found. Please check your email or sign up for a new account.',
          code: 'USER_NOT_FOUND',
          status: 404
        }
      })
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid password. Please check your password and try again.',
          code: 'INVALID_PASSWORD',
          status: 401
        }
      })
    }

    // Generate JWT token
    const token = generateToken(user)

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    }

    res.status(200).json({
      data: {
        user: userData,
        token
      },
      message: 'Login successful',
      status: 'success'
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error during login',
        code: 'LOGIN_ERROR',
        status: 500
      }
    })
  }
}

// Logout user
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // You can implement token blacklisting here if needed
    res.status(200).json({
      message: 'Logout successful',
      status: 'success'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error during logout',
        code: 'LOGOUT_ERROR',
        status: 500
      }
    })
  }
}

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await findUserByEmail(req.user.email)
    
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          status: 404
        }
      })
    }

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    }

    res.status(200).json({
      data: userData,
      message: 'Profile retrieved successfully',
      status: 'success'
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'PROFILE_ERROR',
        status: 500
      }
    })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const updates = req.body

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password
    delete updates.id
    delete updates.email // Email updates should be separate

    const updatedUser = await updateUser(userId, updates)

    if (!updatedUser) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          status: 404
        }
      })
    }

    // Return updated user data (without password)
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt
    }

    res.status(200).json({
      data: userData,
      message: 'Profile updated successfully',
      status: 'success'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'UPDATE_PROFILE_ERROR',
        status: 500
      }
    })
  }
}

// Forgot password - Generate and send 6-digit code
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await findUserByEmail(email)
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        message: 'If an account exists with this email, a password reset code has been sent',
        status: 'success'
      })
    }

    // Generate 6-digit code
    const code = generateResetCode()
    
    // Store reset code
    await storeResetCode(email, code)
    
    // Send email with code
    let emailSent = false
    try {
      const emailResult = await sendResetCodeEmail(email, code)
      emailSent = emailResult.success
      
      if (!emailSent) {
        console.error('⚠️  Email not sent - Email service not configured')
        // In development, we can return the code in response if email failed
        // But only if explicitly enabled for debugging
        if (process.env.DEV_MODE === 'true' && process.env.SHOW_CODE_ON_ERROR === 'true') {
          return res.status(200).json({
            message: 'Email service not configured. Check backend console for code.',
            status: 'warning',
            code: code, // Only in dev mode with explicit flag
            note: 'This is only shown because DEV_MODE and SHOW_CODE_ON_ERROR are enabled'
          })
        }
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error.message)
      console.error('Full error:', error)
      // Still return success to user (security best practice)
      // But log the error for admin review
    }
    
    res.status(200).json({
      message: emailSent 
        ? 'Password reset code has been sent to your email. Please check your inbox and spam folder.'
        : 'Password reset code has been generated. Please check backend console if email is not configured.',
      status: emailSent ? 'success' : 'warning'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'FORGOT_PASSWORD_ERROR',
        status: 500
      }
    })
  }
}

// Verify reset code
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          status: 404
        }
      })
    }

    const verification = await verifyResetCode(email, code)
    
    if (!verification.valid) {
      return res.status(400).json({
        error: {
          message: verification.message,
          code: 'INVALID_CODE',
          status: 400
        }
      })
    }

    res.status(200).json({
      message: 'Code verified successfully',
      status: 'success'
    })
  } catch (error) {
    console.error('Verify code error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'VERIFY_CODE_ERROR',
        status: 500
      }
    })
  }
}

// Reset password - Requires verified code, current password, new password, and confirm password
export const resetPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body

    // Check if code was verified
    const verifiedCode = await getVerifiedResetCode(email)
    if (!verifiedCode) {
      return res.status(400).json({
        error: {
          message: 'Please verify your reset code first',
          code: 'CODE_NOT_VERIFIED',
          status: 400
        }
      })
    }

    // Find user
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          status: 404
        }
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD',
          status: 401
        }
      })
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: {
          message: 'New password and confirm password do not match',
          code: 'PASSWORD_MISMATCH',
          status: 400
        }
      })
    }

    // Check if new password is different from current password
    const isSamePassword = await comparePassword(newPassword, user.password)
    if (isSamePassword) {
      return res.status(400).json({
        error: {
          message: 'New password must be different from current password',
          code: 'SAME_PASSWORD',
          status: 400
        }
      })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    const updatedUser = await updateUser(user.id, { password: hashedPassword })

    // Clear reset code
    await clearResetCode(email)

    // Send confirmation email
    await sendPasswordChangeConfirmation(email)

    res.status(200).json({
      message: 'Password has been reset successfully. A confirmation email has been sent.',
      status: 'success'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'RESET_PASSWORD_ERROR',
        status: 500
      }
    })
  }
}

