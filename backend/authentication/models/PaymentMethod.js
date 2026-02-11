const { pool } = require('../config/database');

class PaymentMethod {
  /**
   * Create payment_methods table if it doesn't exist
   */
  static async createTable() {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payment_methods'
      );
    `;
    
    try {
      const result = await pool.query(query);
      if (result.rows[0].exists) {
        console.log('✅ Payment methods table exists');
      } else {
        const createQuery = `
          CREATE TABLE IF NOT EXISTS payment_methods (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL DEFAULT 'card',
            brand VARCHAR(50),
            last4 VARCHAR(4),
            cardholder_name VARCHAR(255),
            expiry_date VARCHAR(7),
            zip_code VARCHAR(20),
            is_default BOOLEAN DEFAULT false,
            stripe_payment_method_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
          CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default);
        `;
        await pool.query(createQuery);
        console.log('✅ Payment methods table created');
      }
    } catch (error) {
      console.error('❌ Error checking/creating payment_methods table:', error);
      throw error;
    }
  }

  /**
   * Find payment methods by user ID
   */
  static async findByUserId(userId) {
    const query = `
      SELECT id, user_id, type, brand, last4, cardholder_name, expiry_date, zip_code, is_default, created_at, updated_at
      FROM payment_methods 
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding payment methods by user id:', error);
      throw error;
    }
  }

  /**
   * Find payment method by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM payment_methods WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding payment method by id:', error);
      throw error;
    }
  }

  /**
   * Create a new payment method
   */
  static async create(paymentMethodData) {
    const { userId, type, brand, last4, cardholderName, expiryDate, zipCode, stripePaymentMethodId } = paymentMethodData;
    
    // Check if this will be the first payment method (make it default)
    const existing = await this.findByUserId(userId);
    const isDefault = existing.length === 0;
    
    const query = `
      INSERT INTO payment_methods (user_id, type, brand, last4, cardholder_name, expiry_date, zip_code, is_default, stripe_payment_method_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, type, brand, last4, cardholder_name, expiry_date, zip_code, is_default, created_at, updated_at
    `;
    
    try {
      const result = await pool.query(query, [
        userId,
        type || 'card',
        brand || null,
        last4 || null,
        cardholderName || null,
        expiryDate || null,
        zipCode || null,
        isDefault,
        stripePaymentMethodId || null
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  /**
   * Set payment method as default
   */
  static async setDefault(userId, paymentMethodId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Remove default from all user's payment methods
      await client.query(
        'UPDATE payment_methods SET is_default = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
      
      // Set this one as default
      const result = await client.query(
        'UPDATE payment_methods SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $1 RETURNING *',
        [userId, paymentMethodId]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error setting default payment method:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete payment method
   */
  static async delete(userId, paymentMethodId) {
    const query = 'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING id';
    try {
      const result = await pool.query(query, [paymentMethodId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  /**
   * Get default payment method for user
   */
  static async getDefault(userId) {
    const query = 'SELECT * FROM payment_methods WHERE user_id = $1 AND is_default = true LIMIT 1';
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting default payment method:', error);
      throw error;
    }
  }
}

module.exports = PaymentMethod;
