import express from 'express'
import { testEmail } from '../controllers/test.controller.js'

const router = express.Router()

// Test email endpoint (for debugging)
router.post('/test-email', testEmail)

export default router

