/**
 * Check Users in Supabase
 * 
 * This script lists all users in the Supabase database
 * 
 * Usage: node scripts/check-users-in-supabase.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in Supabase database...\n');

    // Get database connection info
    const dbInfo = await pool.query('SELECT current_database(), current_user, version()');
    console.log('Database Connection:');
    console.log(`  Database: ${dbInfo.rows[0].current_database}`);
    console.log(`  User: ${dbInfo.rows[0].current_user}`);
    console.log(`  PostgreSQL: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    // Check if users table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Users table does not exist!');
      console.log('   Please create the users table first.');
      process.exit(1);
    }

    console.log('✅ Users table exists\n');

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);
    console.log(`📊 Total Users: ${totalUsers}\n`);

    if (totalUsers === 0) {
      console.log('ℹ️  No users found in database.');
      console.log('   Register a user to see it here.\n');
      process.exit(0);
    }

    // Get all users
    const users = await pool.query(`
      SELECT 
        id, 
        email, 
        name, 
        role, 
        phone,
        created_at,
        updated_at,
        last_login
      FROM users 
      ORDER BY created_at DESC
      LIMIT 50
    `);

    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('📋 Users in Supabase Database:');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Login: ${user.last_login || 'Never'}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(`✅ Found ${users.rows.length} user(s) in Supabase`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    console.log('💡 To view in Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Navigate to Table Editor → users table');
    console.log('   4. You should see all the users listed above\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkUsers();

