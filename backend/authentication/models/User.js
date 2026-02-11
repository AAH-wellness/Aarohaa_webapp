const { pool } = require('../config/database');

class User {
  /**
   * Create users table if it doesn't exist
   * Note: Table already exists with different schema, so we just verify it exists
   */
  static async createTable() {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    try {
      const result = await pool.query(query);
      if (result.rows[0].exists) {
        console.log('✅ Users table exists');
        
        // Add new columns if they don't exist (migration)
        try {
          // Check and add profile_photo column
          const checkProfilePhoto = `
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'profile_photo'
            );
          `;
          const profilePhotoExists = await pool.query(checkProfilePhoto);
          
          if (!profilePhotoExists.rows[0].exists) {
            await pool.query('ALTER TABLE users ADD COLUMN profile_photo TEXT;');
            console.log('✅ Added profile_photo column to users table');
          }
          
          // Check and add gender column
          const checkGender = `
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'gender'
            );
          `;
          const genderExists = await pool.query(checkGender);
          
          if (!genderExists.rows[0].exists) {
            await pool.query('ALTER TABLE users ADD COLUMN gender VARCHAR(20);');
            console.log('✅ Added gender column to users table');
          }
        } catch (migrationError) {
          console.warn('⚠️  Warning: Could not add new columns (they may already exist):', migrationError.message);
        }
      } else {
        // Create table if it doesn't exist (shouldn't happen, but just in case)
        const createQuery = `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255),
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50),
            google_id VARCHAR(255),
            google_picture TEXT,
            wallet_address VARCHAR(255),
            auth_method VARCHAR(50),
            email_verified BOOLEAN,
            email_verification_token VARCHAR(255),
            email_verification_expires TIMESTAMP,
            phone VARCHAR(20),
            date_of_birth DATE,
            address TEXT,
            profile_photo TEXT,
            gender VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `;
        await pool.query(createQuery);
        console.log('✅ Users table created');
      }
    } catch (error) {
      console.error('❌ Error checking/creating users table:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    // Try with new columns first, fallback to basic columns if they don't exist
    let query = 'SELECT id, email, name, role, phone, address, date_of_birth, google_id, google_picture, auth_method, profile_photo, gender, created_at, updated_at, password FROM users WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      // If columns don't exist, try without them
      if (error.message && error.message.includes('profile_photo') || error.message.includes('gender')) {
        console.warn('⚠️  profile_photo or gender columns not found, using fallback query');
        query = 'SELECT id, email, name, role, phone, address, date_of_birth, google_id, google_picture, auth_method, created_at, updated_at, password FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        const user = result.rows[0] || null;
        if (user) {
          // Add null values for missing columns
          user.profile_photo = null;
          user.gender = null;
        }
        return user;
      }
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const { email, passwordHash, name, role, phone } = userData;
    const query = `
      INSERT INTO users (email, password, name, role, phone, auth_method, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'email', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, name, role, phone, created_at, updated_at
    `;
    
    try {
      const result = await pool.query(query, [
        email, 
        passwordHash, 
        name || null, 
        role || 'user',
        phone || null
      ]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`password = $${paramCount++}`);
      values.push(updates.passwordHash);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updates.address);
    }
    if (updates.dateOfBirth !== undefined) {
      fields.push(`date_of_birth = $${paramCount++}`);
      values.push(updates.dateOfBirth);
    }
    if (updates.profilePhoto !== undefined) {
      fields.push(`profile_photo = $${paramCount++}`);
      values.push(updates.profilePhoto);
    }
    if (updates.gender !== undefined) {
      fields.push(`gender = $${paramCount++}`);
      values.push(updates.gender);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, phone, address, date_of_birth, google_id, google_picture, auth_method, profile_photo, gender, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Permanently delete a user by ID
   */
  static async deleteById(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id, email, name';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Permanently delete a user by email
   */
  static async deleteByEmail(email) {
    const query = 'DELETE FROM users WHERE email = $1 RETURNING id, email, name';
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User;

