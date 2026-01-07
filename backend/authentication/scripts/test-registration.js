/**
 * Test Registration Script
 * 
 * This script tests user registration and verifies data is saved to Supabase
 * 
 * Usage: node scripts/test-registration.js [email] [password] [name]
 */

require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function testRegistration() {
  const testEmail = process.argv[2] || `testuser_${Date.now()}@example.com`;
  const testPassword = process.argv[3] || 'TestPassword123!';
  const testName = process.argv[4] || 'Test User';

  try {
    console.log('🧪 Testing User Registration to Supabase...\n');
    console.log('Test Data:');
    console.log(`  Email: ${testEmail}`);
    console.log(`  Name: ${testName}`);
    console.log(`  Password: ${testPassword}\n`);

    // Step 1: Check if user already exists
    console.log('Step 1: Checking if user already exists...');
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [testEmail]);
    
    if (existingUser.rows.length > 0) {
      console.log(`⚠️  User already exists with ID: ${existingUser.rows[0].id}`);
      console.log('   Deleting existing user for clean test...\n');
      await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
      console.log('✅ Existing user deleted\n');
    } else {
      console.log('✅ No existing user found\n');
    }

    // Step 2: Hash password
    console.log('Step 2: Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(testPassword, saltRounds);
    console.log('✅ Password hashed\n');

    // Step 3: Insert user into database
    console.log('Step 3: Inserting user into Supabase...');
    const insertResult = await pool.query(
      `INSERT INTO users (email, password, name, role, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, name, role, phone, created_at`,
      [testEmail, passwordHash, testName, 'user', null]
    );

    const newUser = insertResult.rows[0];
    console.log('✅ User inserted successfully!');
    console.log(`   User ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Created At: ${newUser.created_at}\n`);

    // Step 4: Verify user exists in database
    console.log('Step 4: Verifying user in Supabase...');
    const verifyResult = await pool.query('SELECT * FROM users WHERE id = $1', [newUser.id]);
    
    if (verifyResult.rows.length === 0) {
      console.log('❌ ERROR: User not found after insertion!');
      process.exit(1);
    }

    const verifiedUser = verifyResult.rows[0];
    console.log('✅ User verified in database!');
    console.log(`   Verified User ID: ${verifiedUser.id}`);
    console.log(`   Verified Email: ${verifiedUser.email}`);
    console.log(`   Verified Name: ${verifiedUser.name}\n`);

    // Step 5: Test password verification
    console.log('Step 5: Testing password verification...');
    const passwordMatch = await bcrypt.compare(testPassword, verifiedUser.password);
    
    if (passwordMatch) {
      console.log('✅ Password verification successful!\n');
    } else {
      console.log('❌ Password verification failed!\n');
      process.exit(1);
    }

    // Step 6: Get database connection info
    console.log('Step 6: Database Connection Info...');
    const dbInfo = await pool.query('SELECT current_database(), current_user, version()');
    console.log(`   Database: ${dbInfo.rows[0].current_database}`);
    console.log(`   User: ${dbInfo.rows[0].current_user}`);
    console.log(`   PostgreSQL Version: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    // Step 7: Count total users
    console.log('Step 7: Database Statistics...');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Total users in database: ${userCount.rows[0].count}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅✅✅ REGISTRATION TEST PASSED!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ User successfully registered in Supabase`);
    console.log(`✅ User ID: ${newUser.id}`);
    console.log(`✅ Data is saved and verified in Supabase database`);
    console.log(`✅ Password hashing and verification working correctly`);
    console.log('\n📊 Next Steps:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to Table Editor → users table');
    console.log('   3. You should see the test user with ID:', newUser.id);
    console.log(`   4. Email: ${testEmail}`);
    console.log('\n🧹 Cleanup (optional):');
    console.log(`   To delete this test user, run:`);
    console.log(`   node scripts/delete-user.js ${testEmail}`);
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌❌❌ REGISTRATION TEST FAILED!');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('\nTroubleshooting:');
    console.error('   1. Check your .env file has correct DATABASE_URL');
    console.error('   2. Verify Supabase connection is working');
    console.error('   3. Check if users table exists in Supabase');
    console.error('   4. Run: node scripts/test-db.js');
    console.error('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

testRegistration();

