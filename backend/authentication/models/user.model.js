// User model - PostgreSQL database
import getPool, { isDatabaseAvailable } from '../config/database.js'

// Fallback to in-memory storage if database not configured
let users = []
let userIdCounter = 1
let passwordResetCodes = []

// Helper function to convert snake_case to camelCase
const convertToCamelCase = (row) => {
  if (!row) return null
  
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    googleId: row.google_id,
    googlePicture: row.google_picture,
    walletAddress: row.wallet_address,
    authMethod: row.auth_method,
    emailVerified: row.email_verified,
    emailVerificationToken: row.email_verification_token,
    emailVerificationExpires: row.email_verification_expires,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLogin: row.last_login
  }
}

// Find user by email
export const findUserByEmail = async (email) => {
  // Use database if available, otherwise use in-memory
  if (!isDatabaseAvailable()) {
    return users.find(user => user.email === email) || null
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      return users.find(user => user.email === email) || null
    }
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return convertToCamelCase(result.rows[0])
  } catch (error) {
    console.error('Error finding user by email:', error)
    throw error
  }
}

// Find user by ID
export const findUserById = async (id) => {
  if (!isDatabaseAvailable()) {
    return users.find(user => user.id === id) || null
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      return users.find(user => user.id === id) || null
    }
    
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    return convertToCamelCase(result.rows[0])
  } catch (error) {
    console.error('Error finding user by ID:', error)
    throw error
  }
}

// Find user by Google ID
export const findUserByGoogleId = async (googleId) => {
  if (!isDatabaseAvailable()) {
    return users.find(user => user.googleId === googleId) || null
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      return users.find(user => user.googleId === googleId) || null
    }
    
    const result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    )
    return convertToCamelCase(result.rows[0])
  } catch (error) {
    console.error('Error finding user by Google ID:', error)
    throw error
  }
}

// Create new user
export const createUser = async (userData) => {
  // Use in-memory if database not available
  if (!isDatabaseAvailable()) {
    const newUser = {
      id: `user_${userIdCounter++}`,
      email: userData.email,
      password: userData.password || null,
      name: userData.name,
      role: userData.role || 'user',
      googleId: userData.googleId || null,
      googlePicture: userData.googlePicture || null,
      walletAddress: userData.walletAddress || null,
      authMethod: userData.authMethod || 'email',
      emailVerified: userData.emailVerified || false,
      phone: userData.phone || null,
      dateOfBirth: userData.dateOfBirth || null,
      address: userData.address || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    users.push(newUser)
    return newUser
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      // Fallback to in-memory (already handled above, but double-check)
      const newUser = {
        id: `user_${userIdCounter++}`,
        email: userData.email,
        password: userData.password || null,
        name: userData.name,
        role: userData.role || 'user',
        googleId: userData.googleId || null,
        googlePicture: userData.googlePicture || null,
        walletAddress: userData.walletAddress || null,
        authMethod: userData.authMethod || 'email',
        emailVerified: userData.emailVerified || false,
        phone: userData.phone || null,
        dateOfBirth: userData.dateOfBirth || null,
        address: userData.address || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      users.push(newUser)
      return newUser
    }
    
    const result = await pool.query(
      `INSERT INTO users (
        email, password, name, role, google_id, google_picture, 
        wallet_address, auth_method, email_verified, 
        phone, date_of_birth, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userData.email,
        userData.password || null,
        userData.name,
        userData.role || 'user',
        userData.googleId || null,
        userData.googlePicture || null,
        userData.walletAddress || null,
        userData.authMethod || 'email',
        userData.emailVerified || false,
        userData.phone || null,
        userData.dateOfBirth || null,
        userData.address || null
      ]
    )
    
    // Convert snake_case to camelCase for consistency
    return convertToCamelCase(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === '23505') { // PostgreSQL unique violation
      throw new Error('User with this email already exists')
    }
    
    throw error
  }
}

// Update user
export const updateUser = async (id, updates) => {
  if (!isDatabaseAvailable()) {
    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex === -1) return null
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return users[userIndex]
  }
  
  try {
    // Build dynamic update query
    const fields = []
    const values = []
    let paramCount = 1

    // Allowed fields to update
    const allowedFields = [
      'email', 'password', 'name', 'role', 'google_id', 'google_picture',
      'wallet_address', 'auth_method', 'email_verified', 'phone',
      'date_of_birth', 'address', 'last_login'
    ]

    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case for database
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      
      if (allowedFields.includes(dbKey) && value !== undefined) {
        fields.push(`${dbKey} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (fields.length === 0) {
      // No fields to update, just return the user
      return await findUserById(id)
    }

    // Add id as last parameter
    values.push(id)
    
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const pool = getPool()
    if (!pool) {
      return await findUserById(id)
    }
    
    const result = await pool.query(query, values)
    return convertToCamelCase(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

// Delete user
export const deleteUser = async (id) => {
  if (!isDatabaseAvailable()) {
    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex === -1) return false
    users.splice(userIndex, 1)
    return true
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      const userIndex = users.findIndex(user => user.id === id)
      if (userIndex === -1) return false
      users.splice(userIndex, 1)
      return true
    }
    
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )
    return result.rows.length > 0
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

// Get all users (for admin purposes)
export const getAllUsers = async () => {
  if (!isDatabaseAvailable()) {
    return users.map(user => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      return users.map(user => {
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
      })
    }
    
    const result = await pool.query(
      'SELECT id, email, name, role, auth_method, email_verified, created_at, updated_at, last_login FROM users ORDER BY created_at DESC'
    )
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      authMethod: row.auth_method,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login
    }))
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

// Password reset code management
export const storeResetCode = async (email, code) => {
  if (!isDatabaseAvailable()) {
    passwordResetCodes = passwordResetCodes.filter(c => c.email !== email)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const resetCode = {
      email,
      code,
      expiresAt: expiresAt.toISOString(),
      verified: false,
      createdAt: new Date().toISOString()
    }
    passwordResetCodes.push(resetCode)
    return resetCode
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      passwordResetCodes = passwordResetCodes.filter(c => c.email !== email)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      const resetCode = {
        email,
        code,
        expiresAt: expiresAt.toISOString(),
        verified: false,
        createdAt: new Date().toISOString()
      }
      passwordResetCodes.push(resetCode)
      return resetCode
    }
    
    // Remove any existing codes for this email
    await pool.query(
      'DELETE FROM password_reset_codes WHERE email = $1',
      [email]
    )

    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Insert new code
    const result = await pool.query(
      `INSERT INTO password_reset_codes (email, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, code, expiresAt]
    )

    return result.rows[0]
  } catch (error) {
    console.error('Error storing reset code:', error)
    throw error
  }
}

export const verifyResetCode = async (email, code) => {
  if (!isDatabaseAvailable()) {
    const resetCode = passwordResetCodes.find(
      rc => rc.email === email && rc.code === code && !rc.verified
    )
    
    if (!resetCode) {
      return { valid: false, message: 'Invalid or expired code' }
    }
    
    if (new Date(resetCode.expiresAt) < new Date()) {
      passwordResetCodes = passwordResetCodes.filter(rc => rc !== resetCode)
      return { valid: false, message: 'Code has expired' }
    }
    
    resetCode.verified = true
    return { valid: true, message: 'Code verified successfully' }
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      const resetCode = passwordResetCodes.find(
        rc => rc.email === email && rc.code === code && !rc.verified
      )
      
      if (!resetCode) {
        return { valid: false, message: 'Invalid or expired code' }
      }
      
      if (new Date(resetCode.expiresAt) < new Date()) {
        passwordResetCodes = passwordResetCodes.filter(rc => rc !== resetCode)
        return { valid: false, message: 'Code has expired' }
      }
      
      resetCode.verified = true
      return { valid: true, message: 'Code verified successfully' }
    }
    
    // Find the code
    const result = await pool.query(
      `SELECT * FROM password_reset_codes 
       WHERE email = $1 AND code = $2 AND verified = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, code]
    )

    const resetCode = result.rows[0]

    if (!resetCode) {
      return { valid: false, message: 'Invalid or expired code' }
    }

    // Check if code has expired
    if (new Date(resetCode.expires_at) < new Date()) {
      // Delete expired code
      await pool.query(
        'DELETE FROM password_reset_codes WHERE id = $1',
        [resetCode.id]
      )
      return { valid: false, message: 'Code has expired' }
    }

    // Mark code as verified
    await pool.query(
      'UPDATE password_reset_codes SET verified = true WHERE id = $1',
      [resetCode.id]
    )

    return { valid: true, message: 'Code verified successfully' }
  } catch (error) {
    console.error('Error verifying reset code:', error)
    throw error
  }
}

export const getVerifiedResetCode = async (email) => {
  if (!isDatabaseAvailable()) {
    return passwordResetCodes.find(
      rc => rc.email === email && rc.verified === true
    ) || null
  }
  
  try {
    const result = await pool.query(
      `SELECT * FROM password_reset_codes 
       WHERE email = $1 AND verified = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting verified reset code:', error)
    throw error
  }
}

export const clearResetCode = async (email) => {
  if (!isDatabaseAvailable()) {
    passwordResetCodes = passwordResetCodes.filter(rc => rc.email !== email)
    return
  }
  
  try {
    const pool = getPool()
    if (!pool) {
      passwordResetCodes = passwordResetCodes.filter(rc => rc.email !== email)
      return
    }
    
    await pool.query(
      'DELETE FROM password_reset_codes WHERE email = $1',
      [email]
    )
  } catch (error) {
    console.error('Error clearing reset code:', error)
    throw error
  }
}
