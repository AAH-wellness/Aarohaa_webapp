const { pool } = require('../config/database');

class Support {
  /**
   * Create support table if it doesn't exist
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS support (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        admin_notes TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_support_user_id ON support(user_id);
      CREATE INDEX IF NOT EXISTS idx_support_user_email ON support(user_email);
      CREATE INDEX IF NOT EXISTS idx_support_status ON support(status);
      CREATE INDEX IF NOT EXISTS idx_support_created_at ON support(created_at);
    `;
    
    try {
      await pool.query(query);
      console.log('✅ Support table created/verified');
    } catch (error) {
      console.error('❌ Error creating support table:', error);
      throw error;
    }
  }

  /**
   * Create a new support ticket
   */
  static async create(supportData) {
    const {
      userId,
      userName,
      userEmail,
      subject,
      messageType,
      message
    } = supportData;

    const query = `
      INSERT INTO support (user_id, user_name, user_email, subject, message_type, message, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        userId || null,
        userName,
        userEmail,
        subject,
        messageType,
        message
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  /**
   * Get all support tickets (for admin)
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM support WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.userEmail) {
      query += ` AND user_email = $${paramCount}`;
      params.push(filters.userEmail);
      paramCount++;
    }

    if (filters.userId) {
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      throw error;
    }
  }

  /**
   * Get support ticket by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM support WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      throw error;
    }
  }

  /**
   * Update support ticket status
   */
  static async updateStatus(id, status, adminNotes = null) {
    const query = `
      UPDATE support 
      SET status = $1, 
          admin_notes = $2,
          updated_at = CURRENT_TIMESTAMP,
          resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [status, adminNotes, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }
}

module.exports = Support;
