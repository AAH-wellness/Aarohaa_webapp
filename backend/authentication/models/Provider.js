const { pool } = require('../config/database');

class Provider {
  /**
   * Create providers table if it doesn't exist
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS providers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        specialty VARCHAR(255),
        title VARCHAR(255),
        bio TEXT,
        hourly_rate DECIMAL(10, 2) DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 0,
        sessions_completed INTEGER DEFAULT 0,
        reviews_count INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'pending',
        availability JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
      CREATE INDEX IF NOT EXISTS idx_providers_email ON providers(email);
      CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers(verified);
      CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
    `;
    
    try {
      await pool.query(query);
      console.log('✅ Providers table created/verified');
    } catch (error) {
      console.error('❌ Error creating providers table:', error);
      throw error;
    }
  }

  /**
   * Create a new provider
   */
  static async create(providerData) {
    const { userId, name, email, phone, specialty, title, bio, hourlyRate } = providerData;
    const query = `
      INSERT INTO providers (user_id, name, email, phone, specialty, title, bio, hourly_rate, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, name, email, phone, specialty, title, bio, hourly_rate, rating, sessions_completed, reviews_count, verified, status, availability, created_at, updated_at
    `;
    
    try {
      const result = await pool.query(query, [
        userId,
        name,
        email,
        phone || null,
        specialty || null,
        title || null,
        bio || null,
        hourlyRate || 0
      ]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Provider with this email already exists');
      }
      if (error.code === '23503') { // Foreign key violation
        throw new Error('User not found');
      }
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  /**
   * Find provider by user ID
   */
  static async findByUserId(userId) {
    const query = 'SELECT * FROM providers WHERE user_id = $1';
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding provider by user_id:', error);
      throw error;
    }
  }

  /**
   * Find provider by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM providers WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding provider by id:', error);
      throw error;
    }
  }

  /**
   * Find provider by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM providers WHERE email = $1';
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding provider by email:', error);
      throw error;
    }
  }

  /**
   * Get all providers with optional filters
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM providers WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.verified !== undefined) {
      query += ` AND verified = $${paramCount++}`;
      params.push(filters.verified);
    }

    if (filters.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.specialty) {
      query += ` AND specialty ILIKE $${paramCount++}`;
      params.push(`%${filters.specialty}%`);
    }

    query += ' ORDER BY created_at DESC';

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding providers:', error);
      throw error;
    }
  }

  /**
   * Update provider
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.specialty !== undefined) {
      fields.push(`specialty = $${paramCount++}`);
      values.push(updates.specialty);
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(updates.bio);
    }
    if (updates.hourlyRate !== undefined) {
      fields.push(`hourly_rate = $${paramCount++}`);
      values.push(updates.hourlyRate);
    }
    if (updates.verified !== undefined) {
      fields.push(`verified = $${paramCount++}`);
      values.push(updates.verified);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE providers 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  }

  /**
   * Update provider availability
   * When availability is saved, provider status becomes 'ready' and they are auto-verified
   */
  static async updateAvailability(id, availability) {
    const query = `
      UPDATE providers 
      SET availability = $1, status = 'ready', verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [JSON.stringify(availability), id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating provider availability:', error);
      throw error;
    }
  }

  /**
   * Get provider availability
   */
  static async getAvailability(id) {
    const query = 'SELECT availability FROM providers WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      if (result.rows[0]) {
        return result.rows[0].availability || {};
      }
      return null;
    } catch (error) {
      console.error('Error getting provider availability:', error);
      throw error;
    }
  }
}

module.exports = Provider;

