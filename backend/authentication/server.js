// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import googleAuthRoutes from './routes/googleAuth.routes.js'
import testRoutes from './routes/test.routes.js'
import { testConnection, isDatabaseAvailable } from './config/database.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', googleAuthRoutes) // Google OAuth routes
app.use('/api', authRoutes)
app.use('/api', testRoutes) // Test routes for debugging

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'authentication-service', port: PORT })
})

// Start server
app.listen(PORT, async () => {
  console.log(`Authentication service running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`API endpoints: http://localhost:${PORT}/api`)
  
  // Test database connection
  if (isDatabaseAvailable()) {
    console.log('\n📊 Testing database connection...')
    await testConnection()
  } else {
    console.log('\n⚠️  Database not configured. Using in-memory storage.')
    console.log('   Set DB_HOST, DB_NAME, DB_USER, DB_PASSWORD in .env to use PostgreSQL')
  }
})

export default app

