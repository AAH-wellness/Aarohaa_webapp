const { pool } = require('../config/database');

class Booking {
  /**
   * Create bookings table if it doesn't exist
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        appointment_date TIMESTAMP NOT NULL,
        session_type VARCHAR(100) DEFAULT 'Video Consultation',
        notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    `;
    
    try {
      await pool.query(query);
      console.log('✅ Bookings table created/verified');
    } catch (error) {
      console.error('❌ Error creating bookings table:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  static async create(bookingData) {
    const { userId, providerId, appointmentDate, sessionType, notes } = bookingData;
    
    console.log('Booking.create - Input data:', {
      userId,
      providerId,
      appointmentDate,
      sessionType,
      notes,
      userIdType: typeof userId,
      providerIdType: typeof providerId
    });
    
    // Validate required fields
    if (!userId || !providerId || !appointmentDate) {
      const missingFields = [];
      if (!userId) missingFields.push('userId');
      if (!providerId) missingFields.push('providerId');
      if (!appointmentDate) missingFields.push('appointmentDate');
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    const query = `
      INSERT INTO bookings (user_id, provider_id, appointment_date, session_type, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        parseInt(userId), // Ensure it's an integer
        parseInt(providerId), // Ensure it's an integer
        appointmentDate,
        sessionType || 'Video Consultation',
        notes || null
      ]);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Booking creation returned no rows');
      }
      
      console.log('Booking.create - Successfully created booking:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Booking.create - Error creating booking:', error);
      console.error('Booking.create - Error code:', error.code);
      console.error('Booking.create - Error detail:', error.detail);
      console.error('Booking.create - Error message:', error.message);
      throw error;
    }
  }

  /**
   * Find booking by ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        b.*,
        u.name as user_name,
        u.email as user_email,
        p.name as provider_name,
        p.email as provider_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN providers p ON b.provider_id = p.id
      WHERE b.id = $1
    `;
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding booking by id:', error);
      throw error;
    }
  }

  /**
   * Get bookings by user ID
   */
  static async findByUserId(userId) {
    const query = `
      SELECT 
        b.*,
        p.name as provider_name,
        p.email as provider_email,
        p.title as provider_title,
        p.specialty as provider_specialty
      FROM bookings b
      JOIN providers p ON b.provider_id = p.id
      WHERE b.user_id = $1
      ORDER BY b.appointment_date DESC
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding bookings by user_id:', error);
      throw error;
    }
  }

  /**
   * Get bookings by provider ID
   */
  static async findByProviderId(providerId) {
    const query = `
      SELECT 
        b.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.provider_id = $1
      ORDER BY b.appointment_date DESC
    `;
    try {
      const result = await pool.query(query, [providerId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding bookings by provider_id:', error);
      throw error;
    }
  }

  /**
   * Get upcoming bookings for a user
   */
  static async getUpcomingByUserId(userId) {
    const query = `
      SELECT 
        b.*,
        p.name as provider_name,
        p.email as provider_email,
        p.title as provider_title,
        p.specialty as provider_specialty
      FROM bookings b
      JOIN providers p ON b.provider_id = p.id
      WHERE b.user_id = $1 
        AND b.appointment_date > CURRENT_TIMESTAMP
        AND b.status = 'scheduled'
      ORDER BY b.appointment_date ASC
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding upcoming bookings:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE bookings 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [status, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  static async cancel(id) {
    return await this.updateStatus(id, 'cancelled');
  }
}

module.exports = Booking;

