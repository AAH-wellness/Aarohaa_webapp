/**
 * Diagnostic script to check provider bookings
 * Usage: node scripts/check-provider-bookings.js [providerId]
 */

// Load environment variables first
require('dotenv').config();

const { pool } = require('../config/database');

async function checkProviderBookings(providerId) {
  try {
    console.log('🔍 Checking bookings for provider ID:', providerId);
    console.log('');

    // Check provider_bookings table
    console.log('📋 Checking provider_bookings table:');
    const providerBookingsQuery = `
      SELECT 
        id, 
        provider_id, 
        user_id, 
        appointment_date, 
        status, 
        user_name, 
        provider_name,
        created_at
      FROM provider_bookings
      WHERE provider_id = $1
      ORDER BY appointment_date ASC
    `;
    const providerResult = await pool.query(providerBookingsQuery, [parseInt(providerId)]);
    console.log(`   Found ${providerResult.rows.length} bookings in provider_bookings`);
    providerResult.rows.forEach((booking, index) => {
      console.log(`   ${index + 1}. ID: ${booking.id}, User: ${booking.user_name || 'N/A'}, Date: ${booking.appointment_date}, Status: ${booking.status}`);
    });
    console.log('');

    // Check user_bookings table
    console.log('📋 Checking user_bookings table:');
    const userBookingsQuery = `
      SELECT 
        id, 
        provider_id, 
        user_id, 
        appointment_date, 
        status, 
        user_name, 
        provider_name,
        created_at
      FROM user_bookings
      WHERE provider_id = $1
      ORDER BY appointment_date ASC
    `;
    const userResult = await pool.query(userBookingsQuery, [parseInt(providerId)]);
    console.log(`   Found ${userResult.rows.length} bookings in user_bookings`);
    userResult.rows.forEach((booking, index) => {
      console.log(`   ${index + 1}. ID: ${booking.id}, User: ${booking.user_name || 'N/A'}, Date: ${booking.appointment_date}, Status: ${booking.status}`);
    });
    console.log('');

    // Check active bookings (not cancelled/completed)
    console.log('✅ Active bookings (not cancelled/completed):');
    const activeProviderBookings = providerResult.rows.filter(b => 
      b.status !== 'cancelled' && b.status !== 'completed'
    );
    const activeUserBookings = userResult.rows.filter(b => 
      b.status !== 'cancelled' && b.status !== 'completed'
    );
    console.log(`   provider_bookings: ${activeProviderBookings.length} active`);
    console.log(`   user_bookings: ${activeUserBookings.length} active`);
    console.log('');

    // Check provider exists
    console.log('👤 Checking provider:');
    const providerQuery = `SELECT id, name, email FROM providers WHERE id = $1`;
    const providerResult = await pool.query(providerQuery, [parseInt(providerId)]);
    if (providerResult.rows.length > 0) {
      const provider = providerResult.rows[0];
      console.log(`   Provider found: ${provider.name} (${provider.email})`);
    } else {
      console.log(`   ⚠️  Provider not found with ID: ${providerId}`);
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Provider ID: ${providerId}`);
    console.log(`   Total bookings in provider_bookings: ${providerResult.rows.length}`);
    console.log(`   Total bookings in user_bookings: ${userResult.rows.length}`);
    console.log(`   Active bookings in provider_bookings: ${activeProviderBookings.length}`);
    console.log(`   Active bookings in user_bookings: ${activeUserBookings.length}`);
    
    if (activeProviderBookings.length === 0 && activeUserBookings.length > 0) {
      console.log('');
      console.log('⚠️  ISSUE DETECTED: Bookings exist in user_bookings but not in provider_bookings!');
      console.log('   This means the sync between tables failed.');
    } else if (activeProviderBookings.length > 0) {
      console.log('');
      console.log('✅ Bookings found in provider_bookings - they should be visible to the provider.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Get provider ID from command line argument
const providerId = process.argv[2];

if (!providerId) {
  console.error('Usage: node scripts/check-provider-bookings.js [providerId]');
  console.error('Example: node scripts/check-provider-bookings.js 1');
  process.exit(1);
}

checkProviderBookings(providerId);
