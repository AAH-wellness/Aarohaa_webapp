// PostgreSQL Database Connection Pool
import pkg from 'pg'
const { Pool } = pkg

// Load environment variables in this module too (in case server.js hasn't loaded them yet)
import dotenv from 'dotenv'
dotenv.config()

// Function to check if database is configured (lazy evaluation)
const checkDatabaseConfig = () => {
  // Remove quotes from password if present and trim whitespace
  const dbPassword = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^["']|["']$/g, '').trim() : null
  const isConfigured = process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && dbPassword
  
  return {
    isConfigured,
    dbPassword,
    config: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: dbPassword,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000')
    }
  }
}

// Database configuration from environment variables
let pool = null
let configChecked = false

// Function to initialize pool (lazy initialization)
const initializePool = () => {
  if (pool) return pool // Already initialized
  
  const dbConfig = checkDatabaseConfig()
  
  // Debug logging
  console.log('🔍 Database configuration check:', {
    hasHost: !!process.env.DB_HOST,
    hasName: !!process.env.DB_NAME,
    hasUser: !!process.env.DB_USER,
    hasPassword: !!dbConfig.dbPassword,
    passwordLength: dbConfig.dbPassword ? dbConfig.dbPassword.length : 0,
    isConfigured: dbConfig.isConfigured
  })
  
  if (dbConfig.isConfigured) {
    pool = new Pool(dbConfig.config)
    configChecked = true
    
    // Set up event handlers
    pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database')
    })

    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err)
      // Don't exit process, just log error
    })
  } else {
    configChecked = true
  }
  
  return pool
}

// Initialize pool on first access
initializePool()

// Test connection function
export const testConnection = async () => {
  const currentPool = initializePool()
  
  if (!currentPool) {
    console.log('⚠️  Database not configured - skipping connection test')
    return false
  }
  
  try {
    const result = await currentPool.query('SELECT NOW()')
    console.log('✅ Database connection test successful:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message)
    console.error('   Please check your database configuration in .env file')
    return false
  }
}

// Get pool (lazy initialization)
const getPool = () => {
  return initializePool()
}

// Export pool getter for use in models
// Returns null if database is not configured
export default getPool

// Check if database is available
export const isDatabaseAvailable = () => {
  return initializePool() !== null
}

// Helper function to execute queries
export const query = async (text, params) => {
  const currentPool = getPool()
  if (!currentPool) {
    throw new Error('Database not configured')
  }
  
  const start = Date.now()
  try {
    const res = await currentPool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Query error', { text, error: error.message })
    throw error
  }
}

