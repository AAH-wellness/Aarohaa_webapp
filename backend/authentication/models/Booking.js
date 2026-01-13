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
      appointmentDateType: typeof appointmentDate,
      sessionType,
      notes,
      userName,
      providerName,
      userIdType: typeof userId,
      providerIdType: typeof providerId
    });
    
    // Verify the date is in correct format (ISO string with Z)
    if (appointmentDate && typeof appointmentDate === 'string') {
      const dateObj = new Date(appointmentDate);
      console.log('Booking.create - Date verification:', {
        input: appointmentDate,
        parsedISO: dateObj.toISOString(),
        parsedUTC: dateObj.getTime(),
        hasZ: appointmentDate.includes('Z') || appointmentDate.includes('+') || appointmentDate.match(/-\d{2}:\d{2}$/)
      });
    }
    
    // Validate required fields
    if (!userId || !providerId || !appointmentDate) {
      const missingFields = [];
      if (!userId) missingFields.push('userId');
      if (!providerId) missingFields.push('providerId');
      if (!appointmentDate) missingFields.push('appointmentDate');
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Insert booking with user_name and provider_name
    // Status defaults to 'confirmed' (changed from 'scheduled')
    // CRITICAL: Cast appointment_date to timestamptz to ensure UTC storage
    const query = `
      INSERT INTO user_bookings (user_id, provider_id, appointment_date, session_type, notes, status, user_name, provider_name, created_at, updated_at)
      VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        parseInt(userId), // Ensure it's an integer
        parseInt(providerId), // Ensure it's an integer
        appointmentDate, // ISO string with 'Z' suffix (e.g., '2026-01-12T16:54:00.000Z')
        sessionType || 'Video Consultation',
        notes || null,
        'confirmed', // Default status (changed from 'scheduled')
        userName || null, // User name
        providerName || null // Provider name
      ]);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Booking creation returned no rows');
      }
      
      const createdBooking = result.rows[0];
      
      // Also insert into provider_bookings table (required for provider to see bookings)
      // This ensures both tables stay in sync
      try {
        const providerBookingQuery = `
          INSERT INTO provider_bookings (user_id, provider_id, appointment_date, session_type, notes, status, user_name, provider_name, created_at, updated_at)
          VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        const providerResult = await pool.query(providerBookingQuery, [
          parseInt(userId),
          parseInt(providerId),
          appointmentDate,
          sessionType || 'Video Consultation',
          notes || null,
          'confirmed', // Default status (changed from 'scheduled')
          userName || null,
          providerName || null
        ]);
        console.log('Booking.create - Successfully created entry in provider_bookings table with ID:', providerResult.rows[0]?.id);
      } catch (providerBookingError) {
        // Log the error but don't fail the main booking
        console.error('Booking.create - ERROR inserting into provider_bookings:', {
          error: providerBookingError.message,
          code: providerBookingError.code,
          detail: providerBookingError.detail,
          userId,
          providerId,
          appointmentDate
        });
        // Note: We continue even if this fails, but provider won't see the booking
        // In production, you might want to retry or alert admin
      }
      
      console.log('Booking.create - Successfully created booking:', {
        id: createdBooking.id,
        appointment_date: createdBooking.appointment_date,
        appointment_date_type: typeof createdBooking.appointment_date,
        appointment_date_iso: createdBooking.appointment_date instanceof Date 
          ? createdBooking.appointment_date.toISOString() 
          : new Date(createdBooking.appointment_date).toISOString()
      });
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
        p.email as provider_email,
        b.appointment_date AT TIME ZONE 'UTC' as appointment_date_utc
      FROM user_bookings b
      JOIN users u ON b.user_id = u.id
      JOIN providers p ON b.provider_id = p.id
      WHERE b.id = $1
    `;
    try {
      const result = await pool.query(query, [id]);
      if (result.rows[0]) {
        // Normalize appointment_date to UTC ISO string
        const booking = result.rows[0];
        if (booking.appointment_date) {
          const date = booking.appointment_date instanceof Date 
            ? booking.appointment_date 
            : new Date(booking.appointment_date);
          booking.appointment_date = date.toISOString();
        }
        // Remove the temporary UTC field if it exists
        delete booking.appointment_date_utc;
      }
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
        p.specialty as provider_specialty,
        b.appointment_date AT TIME ZONE 'UTC' as appointment_date_utc
      FROM user_bookings b
      JOIN providers p ON b.provider_id = p.id
      WHERE b.user_id = $1
      ORDER BY b.appointment_date DESC
    `;
    try {
      const result = await pool.query(query, [userId]);
      // Normalize appointment_date to UTC ISO string for all bookings
      return result.rows.map(booking => {
        if (booking.appointment_date) {
          // Always convert to UTC ISO string, regardless of how PostgreSQL returns it
          const date = booking.appointment_date instanceof Date 
            ? booking.appointment_date 
            : new Date(booking.appointment_date);
          // Ensure it's in UTC by using toISOString()
          booking.appointment_date = date.toISOString();
        }
        // Remove the temporary UTC field if it exists
        delete booking.appointment_date_utc;
        return booking;
      });
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
        COALESCE(u.name, b.user_name) as user_name,
        COALESCE(u.email, NULL) as user_email,
        COALESCE(u.phone, NULL) as user_phone,
        b.appointment_date AT TIME ZONE 'UTC' as appointment_date_utc
      FROM provider_bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.provider_id = $1
        AND b.status != 'cancelled'
        AND b.status != 'completed'
      ORDER BY b.appointment_date ASC
    `;
    try {
      console.log('Booking.findByProviderId: Querying for provider_id:', providerId);
      const result = await pool.query(query, [providerId]);
      console.log('Booking.findByProviderId: Found', result.rows.length, 'bookings');
      // Normalize appointment_date to UTC ISO string for all bookings
      return result.rows.map(booking => {
        if (booking.appointment_date) {
          // Always convert to UTC ISO string, regardless of how PostgreSQL returns it
          const date = booking.appointment_date instanceof Date 
            ? booking.appointment_date 
            : new Date(booking.appointment_date);
          // Ensure it's in UTC by using toISOString()
          booking.appointment_date = date.toISOString();
        }
        // Remove the temporary UTC field if it exists
        delete booking.appointment_date_utc;
        return booking;
      });
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
        p.specialty as provider_specialty,
        b.appointment_date AT TIME ZONE 'UTC' as appointment_date_utc
      FROM user_bookings b
      JOIN providers p ON b.provider_id = p.id
      WHERE b.user_id = $1 
        AND b.appointment_date > CURRENT_TIMESTAMP
        AND b.status = 'confirmed'
      ORDER BY b.appointment_date ASC
    `;
    try {
      const result = await pool.query(query, [userId]);
      // Normalize appointment_date to UTC ISO string for all bookings
      return result.rows.map(booking => {
        if (booking.appointment_date) {
          // Always convert to UTC ISO string, regardless of how PostgreSQL returns it
          const date = booking.appointment_date instanceof Date 
            ? booking.appointment_date 
            : new Date(booking.appointment_date);
          // Ensure it's in UTC by using toISOString()
          booking.appointment_date = date.toISOString();
        }
        // Remove the temporary UTC field if it exists
        delete booking.appointment_date_utc;
        return booking;
      });
    } catch (error) {
      console.error('Error finding upcoming bookings:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  static async updateStatus(id, status, reason = null) {
    // Build query dynamically based on whether reason is provided
    let query;
    let params;
    
    if (reason !== null) {
      query = `
        UPDATE user_bookings 
        SET status = $1, reason = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      params = [status, reason, id];
    } else {
      query = `
        UPDATE user_bookings 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      params = [status, id];
    }
    
    try {
      const result = await pool.query(query, params);
      
      // Also update provider_bookings if it exists
      try {
        let providerBookingQuery;
        if (reason !== null) {
          providerBookingQuery = `
            UPDATE provider_bookings 
            SET status = $1, reason = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `;
          await pool.query(providerBookingQuery, [status, reason, id]);
        } else {
          providerBookingQuery = `
            UPDATE provider_bookings 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `;
          await pool.query(providerBookingQuery, [status, id]);
        }
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
   * Cancel booking with reason
   */
  static async cancel(id, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('Cancellation reason is required');
    }
    return await this.updateStatus(id, 'cancelled', reason.trim());
  }
}

module.exports = Booking;

