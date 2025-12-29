import express from 'express'
import { initiateGoogleAuth, handleGoogleCallback, verifyGoogleToken } from '../controllers/googleAuth.controller.js'

const router = express.Router()

// Initiate Google OAuth flow
router.get('/google', initiateGoogleAuth)

// Handle Google OAuth callback
router.get('/google/callback', handleGoogleCallback)

// Verify Google ID token (alternative flow)
router.post('/google/verify', verifyGoogleToken)

export default router

