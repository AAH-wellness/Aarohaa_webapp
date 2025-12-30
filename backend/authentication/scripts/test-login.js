require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function testLogin() {
  const email = process.argv[2] || 'kaushikkushik2001@gmail.com';
  const testPassword = process.argv[3] || 'Happy@123';
  const wrongPassword = 'WrongPassword123';

  try {
    console.log('🧪 Testing login password verification...\n');
    console.log(`Email: ${email}`);
    console.log(`Correct password: ${testPassword}`);
    console.log(`Wrong password: ${wrongPassword}\n`);

    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`✅ User found: ${user.name} (ID: ${user.id})`);
    console.log(`Password hash: ${user.password ? user.password.substring(0, 30) + '...' : 'NULL'}\n`);

    if (!user.password) {
      console.log('❌ User has no password set');
      process.exit(1);
    }

    // Test with CORRECT password
    console.log('🔐 Testing with CORRECT password...');
    const correctMatch = await bcrypt.compare(testPassword, user.password);
    if (correctMatch) {
      console.log('✅ CORRECT password: ACCEPTED (This is correct!)\n');
    } else {
      console.log('❌ CORRECT password: REJECTED (This is wrong!)\n');
    }

    // Test with WRONG password
    console.log('🔐 Testing with WRONG password...');
    const wrongMatch = await bcrypt.compare(wrongPassword, user.password);
    if (wrongMatch) {
      console.log('❌ WRONG password: ACCEPTED (SECURITY ISSUE!)\n');
      process.exit(1);
    } else {
      console.log('✅ WRONG password: REJECTED (This is correct!)\n');
    }

    // Summary
    if (correctMatch && !wrongMatch) {
      console.log('✅✅✅ ALL TESTS PASSED! Password verification is working correctly.');
      console.log('   - Correct passwords are accepted');
      console.log('   - Wrong passwords are rejected');
    } else {
      console.log('❌❌❌ TESTS FAILED! Password verification is NOT working correctly.');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();

