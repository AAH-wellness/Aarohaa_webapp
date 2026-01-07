const { pool } = require('../config/database');

class UserLoginEvent {
  /**
   * Create user_login_events table if it doesn't exist
   */
  static async createTable() {
    // First check if table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_login_events'
      );
    `;
    
    try {
      const exists = await pool.query(checkQuery);
      if (exists.rows[0].exists) {
        console.log('✅ User login events table already exists');
        return;
      }

      // Create table
      const createQuery = `
        CREATE TABLE user_login_events (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          login_method VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          device_type VARCHAR(50),
          browser VARCHAR(100),
          os VARCHAR(100),
          location VARCHAR(255),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      
      await pool.query(createQuery);
      
      // Create indexes after table is created
      const indexQuery = `
        CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON user_login_events(user_id);
        CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON user_login_events(created_at);
        CREATE INDEX IF NOT EXISTS idx_login_events_method ON user_login_events(login_method);
      `;
      
      await pool.query(indexQuery);
      console.log('✅ User login events table created/verified');
    } catch (error) {
      console.error('❌ Error creating user_login_events table:', error);
      throw error;
    }
  }

  /**
   * Create a new login event
   */
  static async create(eventData) {
    const {
      userId,
      loginMethod,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      location,
      success = true,
      errorMessage = null
    } = eventData;

    const query = `
      INSERT INTO user_login_events (
        user_id, login_method, ip_address, user_agent, device_type,
        browser, os, location, success, error_message, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        userId,
        loginMethod,
        ipAddress || null,
        userAgent || null,
        deviceType || null,
        browser || null,
        os || null,
        location || null,
        success,
        errorMessage
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating login event:', error);
      throw error;
    }
  }

  /**
   * Get login events for a user
   */
  static async findByUserId(userId, limit = 50) {
    const query = `
      SELECT * FROM user_login_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error finding login events by user id:', error);
      throw error;
    }
  }

  /**
   * Get all login events (for admin)
   */
  static async findAll(limit = 100) {
    const query = `
      SELECT 
        ule.*,
        u.email,
        u.name,
        u.role
      FROM user_login_events ule
      JOIN users u ON ule.user_id = u.id
      ORDER BY ule.created_at DESC
      LIMIT $1
    `;

    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error finding all login events:', error);
      throw error;
    }
  }
}

module.exports = UserLoginEvent;

