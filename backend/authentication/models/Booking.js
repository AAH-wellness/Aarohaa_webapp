const { pool } = require('../config/database');

class Booking {
  /**
   * Create bookings table if it doesn't exist
   * Note: Tables user_bookings and provider_bookings already exist in database
   */
  static async createTable() {
    // Tables already exist, but we may need to ensure provider_bookings has expected columns
    try {
      await pool.query(`
        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS notes TEXT;

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS provider_specialty VARCHAR(255);

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS provider_title VARCHAR(255);

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS provider_hourly_rate NUMERIC;

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS appointment_day VARCHAR(20);

        ALTER TABLE user_bookings
        ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMPTZ;

        ALTER TABLE user_bookings
        ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ;

        ALTER TABLE user_bookings
        ADD COLUMN IF NOT EXISTS rescheduled_by VARCHAR(30);

        ALTER TABLE user_bookings
        ADD COLUMN IF NOT EXISTS reschedule_history JSONB;

        ALTER TABLE user_bookings
        ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMPTZ;

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ;

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS rescheduled_by VARCHAR(30);

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS reschedule_history JSONB;

        ALTER TABLE provider_bookings
        ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;

        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMPTZ;

        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ;

        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS rescheduled_by VARCHAR(30);

        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS reschedule_history JSONB;

        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;
      `);
      console.log('✅ Bookings tables (user_bookings, provider_bookings) verified (+ provider_bookings columns)');
    } catch (e) {
      console.warn('⚠️  Booking.createTable - Could not verify provider_bookings columns:', e?.message || e);
      console.log('✅ Bookings tables (user_bookings, provider_bookings) already exist');
    }
  }

  /**
   * Create a new booking
   */
  static async create(bookingData) {
    const {
      userId,
      providerId,
      appointmentDate,
      sessionType,
      notes,
      userName,
      providerName,
      providerSpecialty,
      providerTitle,
      providerHourlyRate
    } = bookingData;
    
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

      // Also insert into legacy `bookings` table (some dashboards/queries may rely on it).
      // Keep IDs in sync across user_bookings, provider_bookings, and bookings.
      // Note: `bookings.appointment_date` is timestamp without time zone, so we store it as UTC.
      try {
        const legacyBookingsQuery = `
          INSERT INTO bookings (id, user_id, provider_id, appointment_date, session_type, notes, status, created_at, updated_at)
          VALUES ($1, $2, $3, ($4::timestamptz AT TIME ZONE 'UTC'), $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            provider_id = EXCLUDED.provider_id,
            appointment_date = EXCLUDED.appointment_date,
            session_type = EXCLUDED.session_type,
            notes = EXCLUDED.notes,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `;
        const legacyResult = await pool.query(legacyBookingsQuery, [
          createdBooking.id,
          parseInt(userId),
          parseInt(providerId),
          appointmentDate,
          sessionType || 'Video Consultation',
          notes || null,
          'confirmed'
        ]);
        console.log('✅ Booking.create - Synced to legacy bookings table with ID:', legacyResult.rows[0]?.id);
      } catch (legacyBookingError) {
        console.warn(
          'Booking.create - Could not sync to legacy bookings table (this is OK if table is unused):',
          legacyBookingError.message
        );
      }
      
      // Also insert into provider_bookings table (required for provider to see bookings)
      // This ensures both tables stay in sync
      // Use the same ID as user_bookings to keep them in sync
      try {
        const providerBookingQuery = `
          INSERT INTO provider_bookings (
            id,
            user_id,
            provider_id,
            appointment_date,
            session_type,
            notes,
            status,
            user_name,
            provider_name,
            provider_specialty,
            provider_title,
            provider_hourly_rate,
            appointment_day,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4::timestamptz,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            to_char(($4::timestamptz AT TIME ZONE 'UTC'), 'FMDay'),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            provider_id = EXCLUDED.provider_id,
            appointment_date = EXCLUDED.appointment_date,
            session_type = EXCLUDED.session_type,
            notes = EXCLUDED.notes,
            status = EXCLUDED.status,
            user_name = EXCLUDED.user_name,
            provider_name = EXCLUDED.provider_name,
            provider_specialty = EXCLUDED.provider_specialty,
            provider_title = EXCLUDED.provider_title,
            provider_hourly_rate = EXCLUDED.provider_hourly_rate,
            appointment_day = EXCLUDED.appointment_day,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `;
        const providerResult = await pool.query(providerBookingQuery, [
          createdBooking.id, // Use the same ID from user_bookings
          parseInt(userId),
          parseInt(providerId),
          appointmentDate,
          sessionType || 'Video Consultation',
          notes || null,
          'confirmed', // Default status (changed from 'scheduled')
          userName || null,
          providerName || null,
          providerSpecialty || null,
          providerTitle || null,
          providerHourlyRate !== undefined && providerHourlyRate !== null ? parseFloat(providerHourlyRate) : null
        ]);
        console.log('✅ Booking.create - Successfully created entry in provider_bookings table with ID:', providerResult.rows[0]?.id);
      } catch (providerBookingError) {
        // Log the error prominently - this is critical for provider visibility
        console.error('❌ Booking.create - CRITICAL ERROR inserting into provider_bookings:', {
          error: providerBookingError.message,
          code: providerBookingError.code,
          detail: providerBookingError.detail,
          hint: providerBookingError.hint,
          userId,
          providerId,
          appointmentDate,
          sessionType,
          notes
        });
        console.error('⚠️  WARNING: Provider will NOT see this booking in their dashboard!');
        console.error('   The booking was created in user_bookings but failed to sync to provider_bookings.');
        // Note: We continue even if this fails, but provider won't see the booking
        // In production, you might want to retry or alert admin
        // TODO: Consider implementing a retry mechanism or background sync job
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
        p.profile_photo as provider_photo,
        p.gender as provider_gender,
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
   * First tries provider_bookings table, then falls back to user_bookings if needed
   */
  static async findByProviderId(providerId) {
    // Ensure providerId is an integer
    const providerIdInt = parseInt(providerId);
    if (isNaN(providerIdInt)) {
      console.error('Booking.findByProviderId: Invalid provider ID:', providerId);
      throw new Error('Invalid provider ID');
    }
    
    console.log('Booking.findByProviderId: Starting query', {
      providerId: providerId,
      providerIdInt: providerIdInt,
      providerIdType: typeof providerId,
      providerIdIntType: typeof providerIdInt
    });
    
    // First, try to get bookings from provider_bookings table
    const providerBookingsQuery = `
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
      console.log('Booking.findByProviderId: Querying provider_bookings for provider_id:', providerIdInt);
      const providerResult = await pool.query(providerBookingsQuery, [providerIdInt]);
      console.log('Booking.findByProviderId: Found', providerResult.rows.length, 'bookings in provider_bookings');
      
      // Debug: Check all bookings for this provider (including cancelled/completed)
      const debugQuery = `
        SELECT id, provider_id, user_id, appointment_date, status, user_name, provider_name
        FROM provider_bookings
        WHERE provider_id = $1
        ORDER BY appointment_date ASC
      `;
      const debugResult = await pool.query(debugQuery, [providerIdInt]);
      console.log('Booking.findByProviderId: DEBUG - All bookings in provider_bookings (including cancelled/completed):', 
        debugResult.rows.map(b => ({
          id: b.id,
          provider_id: b.provider_id,
          user_id: b.user_id,
          appointment_date: b.appointment_date,
          status: b.status,
          user_name: b.user_name
        }))
      );
      
      // If we found bookings in provider_bookings, return them
      if (providerResult.rows.length > 0) {
        return providerResult.rows.map(booking => {
          if (booking.appointment_date) {
            const date = booking.appointment_date instanceof Date 
              ? booking.appointment_date 
              : new Date(booking.appointment_date);
            booking.appointment_date = date.toISOString();
          }
          delete booking.appointment_date_utc;
          return booking;
        });
      }
      
      // Fallback: If no bookings found in provider_bookings, check user_bookings
      // This handles cases where the insert into provider_bookings failed
      console.log('⚠️  Booking.findByProviderId: No bookings in provider_bookings, checking user_bookings as fallback');
      const userBookingsQuery = `
        SELECT 
          b.*,
          COALESCE(u.name, b.user_name) as user_name,
          COALESCE(u.email, NULL) as user_email,
          COALESCE(u.phone, NULL) as user_phone,
          b.appointment_date AT TIME ZONE 'UTC' as appointment_date_utc
        FROM user_bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.provider_id = $1
          AND b.status != 'cancelled'
          AND b.status != 'completed'
        ORDER BY b.appointment_date ASC
      `;
      
      const userResult = await pool.query(userBookingsQuery, [providerIdInt]);
      console.log('Booking.findByProviderId: Found', userResult.rows.length, 'bookings in user_bookings (fallback)');
      
      // Debug: Check all bookings in user_bookings for this provider
      const debugUserQuery = `
        SELECT id, provider_id, user_id, appointment_date, status, user_name, provider_name
        FROM user_bookings
        WHERE provider_id = $1
        ORDER BY appointment_date ASC
      `;
      const debugUserResult = await pool.query(debugUserQuery, [providerIdInt]);
      console.log('Booking.findByProviderId: DEBUG - All bookings in user_bookings (including cancelled/completed):', 
        debugUserResult.rows.map(b => ({
          id: b.id,
          provider_id: b.provider_id,
          user_id: b.user_id,
          appointment_date: b.appointment_date,
          status: b.status,
          user_name: b.user_name
        }))
      );
      
      if (userResult.rows.length > 0) {
        console.warn('⚠️  WARNING: Found bookings in user_bookings but not in provider_bookings. This indicates a sync issue.');
        console.warn('   Consider running a sync job to populate provider_bookings from user_bookings.');
      }
      
      // Normalize appointment_date to UTC ISO string for all bookings
      return userResult.rows.map(booking => {
        if (booking.appointment_date) {
          const date = booking.appointment_date instanceof Date 
            ? booking.appointment_date 
            : new Date(booking.appointment_date);
          booking.appointment_date = date.toISOString();
        }
        delete booking.appointment_date_utc;
        return booking;
      });
    } catch (error) {
      console.error('Error finding bookings by provider_id:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        providerId: providerId,
        providerIdInt: providerIdInt
      });
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

      // Also update legacy bookings table if it exists (no reason column there)
      try {
        const legacyUpdateQuery = `
          UPDATE bookings
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        await pool.query(legacyUpdateQuery, [status, id]);
        console.log('Booking.updateStatus - Also updated legacy bookings table');
      } catch (legacyUpdateError) {
        console.warn(
          'Booking.updateStatus - Could not update legacy bookings table (this is okay if table is unused):',
          legacyUpdateError.message
        );
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

  /**
   * Get bookings by provider ID and date range
   * Returns bookings that are scheduled or confirmed (not cancelled/completed)
   */
  static async getByProviderAndDateRange(providerId, startDate, endDate) {
    const query = `
      SELECT 
        id,
        user_id,
        provider_id,
        appointment_date,
        status,
        session_type
      FROM user_bookings
      WHERE provider_id = $1
        AND appointment_date >= $2::timestamp
        AND appointment_date <= $3::timestamp
        AND status IN ('scheduled', 'confirmed')
      ORDER BY appointment_date ASC
    `;
    
    try {
      const result = await pool.query(query, [
        parseInt(providerId),
        startDate,
        endDate
      ]);
      
      // Normalize appointment_date to ISO string
      return result.rows.map(booking => {
        if (booking.appointment_date) {
          const date = booking.appointment_date instanceof Date 
            ? booking.appointment_date 
            : new Date(booking.appointment_date);
          booking.appointment_date = date.toISOString();
        }
        return booking;
      });
    } catch (error) {
      console.error('Error getting bookings by provider and date range:', error);
      throw error;
    }
  }

  /**
   * Check if a provider has conflicts near a proposed time
   */
  static async getConflicts(providerId, appointmentDate, bookingId = null) {
    const query = `
      SELECT id, appointment_date
      FROM user_bookings
      WHERE provider_id = $1
        AND status NOT IN ('cancelled', 'completed')
        AND appointment_date BETWEEN ($2::timestamptz - interval '60 minutes')
                               AND ($2::timestamptz + interval '60 minutes')
        ${bookingId ? 'AND id != $3' : ''}
    `;

    const params = bookingId
      ? [parseInt(providerId), appointmentDate, bookingId]
      : [parseInt(providerId), appointmentDate];

    const result = await pool.query(query, params);
    return result.rows || [];
  }

  /**
   * Reschedule an existing booking
   */
  static async reschedule({ bookingId, newAppointmentDate, rescheduledBy }) {
    const existingQuery = `
      SELECT * FROM user_bookings WHERE id = $1
    `;
    const existingResult = await pool.query(existingQuery, [bookingId]);
    if (!existingResult.rows[0]) {
      return null;
    }

    const existing = existingResult.rows[0];
    const oldDate = existing.appointment_date;
    const now = new Date().toISOString();

    let history = [];
    if (existing.reschedule_history) {
      try {
        history = Array.isArray(existing.reschedule_history)
          ? existing.reschedule_history
          : JSON.parse(existing.reschedule_history);
      } catch (error) {
        history = [];
      }
    }

    const historyEntry = {
      from: oldDate,
      to: newAppointmentDate,
      by: rescheduledBy,
      at: now
    };

    history = [...history, historyEntry];
    const historyJson = JSON.stringify(history);

    const updateQuery = `
      UPDATE user_bookings
      SET appointment_date = $1::timestamptz,
          rescheduled_from = $2::timestamptz,
          rescheduled_at = $3::timestamptz,
          rescheduled_by = $4,
          reschedule_history = $5::jsonb,
          reschedule_count = COALESCE(reschedule_count, 0) + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const updatedResult = await pool.query(updateQuery, [
      newAppointmentDate,
      oldDate,
      now,
      rescheduledBy,
      historyJson,
      bookingId
    ]);

    const updatedBooking = updatedResult.rows[0];

    try {
      const providerUpdateQuery = `
        UPDATE provider_bookings
        SET appointment_date = $1::timestamptz,
            appointment_day = to_char(($1::timestamptz AT TIME ZONE 'UTC'), 'FMDay'),
            rescheduled_from = $2::timestamptz,
            rescheduled_at = $3::timestamptz,
            rescheduled_by = $4,
            reschedule_history = $5::jsonb,
            reschedule_count = COALESCE(reschedule_count, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `;
      await pool.query(providerUpdateQuery, [
        newAppointmentDate,
        oldDate,
        now,
        rescheduledBy,
        historyJson,
        bookingId
      ]);
    } catch (providerBookingError) {
      console.warn('Booking.reschedule - Could not update provider_bookings:', providerBookingError.message);
    }

    try {
      const legacyUpdateQuery = `
        UPDATE bookings
        SET appointment_date = ($1::timestamptz AT TIME ZONE 'UTC'),
            rescheduled_from = $2::timestamptz,
            rescheduled_at = $3::timestamptz,
            rescheduled_by = $4,
            reschedule_history = $5::jsonb,
            reschedule_count = COALESCE(reschedule_count, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `;
      await pool.query(legacyUpdateQuery, [
        newAppointmentDate,
        oldDate,
        now,
        rescheduledBy,
        historyJson,
        bookingId
      ]);
    } catch (legacyUpdateError) {
      console.warn('Booking.reschedule - Could not update legacy bookings table:', legacyUpdateError.message);
    }

    return updatedBooking;
  }
}

module.exports = Booking;

