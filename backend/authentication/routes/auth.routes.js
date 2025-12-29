import express from 'express'
import { register, login, logout, getProfile, updateProfile, forgotPassword, verifyCode, resetPassword } from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { 
  registerValidator, 
  loginValidator, 
  forgotPasswordValidator,
  verifyCodeValidator,
  resetPasswordValidator,
  updateProfileValidator 
} from '../validators/auth.validators.js'

const router = express.Router()

// Public routes
router.post('/users/register', registerValidator, register)
router.post('/users/login', loginValidator, login)
router.post('/users/forgot-password', forgotPasswordValidator, forgotPassword)
router.post('/users/verify-code', verifyCodeValidator, verifyCode)
router.post('/users/reset-password', resetPasswordValidator, resetPassword)

// Protected routes
router.post('/users/logout', authenticateToken, logout)
router.get('/users/profile', authenticateToken, getProfile)
router.put('/users/profile', authenticateToken, updateProfileValidator, updateProfile)

export default router

