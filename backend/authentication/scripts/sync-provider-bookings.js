/**
 * Sync script to populate provider_bookings from user_bookings
 * This fixes bookings that were created but failed to sync to provider_bookings
 * Usage: node scripts/sync-provider-bookings.js
 */

// Load environment variables first
require('dotenv').config();

const { pool } = require('../config/database');

async function syncProviderBookings() {
  try {
    console.log('🔄 Starting sync of provider_bookings from user_bookings...');
    console.log('');

    // Get all bookings from user_bookings that don't exist in provider_bookings
    const syncQuery = `
      SELECT 
        ub.id as user_booking_id,
        ub.user_id,
        ub.provider_id,
        ub.appointment_date,
        ub.session_type,
        ub.notes,
        ub.status,
        ub.user_name,
        ub.provider_name,
        ub.created_at,
        ub.updated_at
      FROM user_bookings ub
      WHERE NOT EXISTS (
        SELECT 1 
        FROM provider_bookings pb 
        WHERE pb.id = ub.id
      )
      AND ub.status != 'cancelled'
      AND ub.status != 'completed'
      ORDER BY ub.created_at ASC
    `;

    const result = await pool.query(syncQuery);
    const bookingsToSync = result.rows;

    console.log(`📋 Found ${bookingsToSync.length} bookings to sync`);
    console.log('');

    if (bookingsToSync.length === 0) {
      console.log('✅ No bookings need to be synced. All bookings are already in sync.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const booking of bookingsToSync) {
      try {
        const insertQuery = `
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
            created_at, 
            updated_at
          )
          VALUES ($1, $2, $3, $4::timestamptz, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;

        const insertResult = await pool.query(insertQuery, [
          booking.user_booking_id,
          booking.user_id,
          booking.provider_id,
          booking.appointment_date,
          booking.session_type || 'Video Consultation',
          booking.notes || null,
          booking.status || 'confirmed',
          booking.user_name || null,
          booking.provider_name || null,
          booking.created_at || new Date(),
          booking.updated_at || new Date()
        ]);

        if (insertResult.rows.length > 0) {
          successCount++;
          console.log(`✅ Synced booking ID ${booking.user_booking_id} for provider ${booking.provider_id}`);
        } else {
          console.log(`⏭️  Booking ID ${booking.user_booking_id} already exists in provider_bookings (skipped)`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to sync booking ID ${booking.user_booking_id}:`, error.message);
        console.error('   Error details:', {
          code: error.code,
          detail: error.detail,
          hint: error.hint
        });
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Sync Summary:');
    console.log(`   Total bookings to sync: ${bookingsToSync.length}`);
    console.log(`   ✅ Successfully synced: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('═══════════════════════════════════════════════════════');

    // Verify sync
    console.log('');
    console.log('🔍 Verifying sync...');
    const verifyQuery = `
      SELECT 
        (SELECT COUNT(*) FROM user_bookings WHERE status != 'cancelled' AND status != 'completed') as user_bookings_count,
        (SELECT COUNT(*) FROM provider_bookings WHERE status != 'cancelled' AND status != 'completed') as provider_bookings_count
    `;
    const verifyResult = await pool.query(verifyQuery);
    const counts = verifyResult.rows[0];
    console.log(`   Active bookings in user_bookings: ${counts.user_bookings_count}`);
    console.log(`   Active bookings in provider_bookings: ${counts.provider_bookings_count}`);
    
    if (parseInt(counts.user_bookings_count) === parseInt(counts.provider_bookings_count)) {
      console.log('   ✅ Sync verification passed - counts match!');
    } else {
      console.log('   ⚠️  Sync verification warning - counts do not match');
      console.log('   This might be due to cancelled/completed bookings or other data differences');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run sync
syncProviderBookings();
