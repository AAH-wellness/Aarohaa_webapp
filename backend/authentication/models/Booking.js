const { pool } = require('../config/database');

class Booking {
  /**
   * Create bookings table if it doesn't exist
   * Note: Tables user_bookings and provider_bookings already exist in database
   */
  static async createTable() {
    // Tables already exist, no need to create
    console.log('✅ Bookings tables (user_bookings, provider_bookings) already exist');
  }

  /**
   * Create a new booking
   */
  static async create(bookingData) {
    const { userId, providerId, appointmentDate, sessionType, notes, userName, providerName } = bookingData;
    
    console.log('Booking.create - Input data:', {
      userId,
      providerId,
      appointmentDate,
      sessionType,
      notes,
      userName,
      providerName,
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
    
    // Insert booking with user_name and provider_name
    const query = `
      INSERT INTO user_bookings (user_id, provider_id, appointment_date, session_type, notes, status, user_name, provider_name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        parseInt(userId), // Ensure it's an integer
        parseInt(providerId), // Ensure it's an integer
        appointmentDate,
        sessionType || 'Video Consultation',
        notes || null,
        'scheduled', // Default status
        userName || null, // User name
        providerName || null // Provider name
      ]);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Booking creation returned no rows');
      }
      
      const createdBooking = result.rows[0];
      
      // Also insert into provider_bookings table if it exists (with same data)
      // This ensures both tables stay in sync
      try {
        const providerBookingQuery = `
          INSERT INTO provider_bookings (user_id, provider_id, appointment_date, session_type, notes, status, user_name, provider_name, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        await pool.query(providerBookingQuery, [
          parseInt(userId),
          parseInt(providerId),
          appointmentDate,
          sessionType || 'Video Consultation',
          notes || null,
          'scheduled',
          userName || null,
          providerName || null
        ]);
        console.log('Booking.create - Also created entry in provider_bookings table');
      } catch (providerBookingError) {
        // If provider_bookings table doesn't exist or insert fails, log but don't fail the main booking
        console.warn('Booking.create - Could not insert into provider_bookings (this is okay if table doesn\'t exist):', providerBookingError.message);
      }
      
      console.log('Booking.create - Successfully created booking:', createdBooking);
      return createdBooking;
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
      FROM user_bookings b
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
      FROM user_bookings b
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
      FROM provider_bookings b
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
      FROM user_bookings b
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
      UPDATE user_bookings 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [status, id]);
      
      // Also update provider_bookings if it exists
      try {
        const providerBookingQuery = `
          UPDATE provider_bookings 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        await pool.query(providerBookingQuery, [status, id]);
        console.log('Booking.updateStatus - Also updated provider_bookings table');
      } catch (providerBookingError) {
        // If provider_bookings table doesn't exist or update fails, log but don't fail
        console.warn('Booking.updateStatus - Could not update provider_bookings (this is okay if table doesn\'t exist):', providerBookingError.message);
      }
      
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

