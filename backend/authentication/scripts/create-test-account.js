const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function createTestAccount() {
  try {
    console.log('🔧 Creating test account...\n');

    const email = 'testuser@example.com';
    const password = 'Test@123';
    const name = 'Test User';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const checkQuery = 'SELECT id, email FROM users WHERE email = $1';
    const existing = await pool.query(checkQuery, [email]);

    if (existing.rows.length > 0) {
      console.log('⚠️  Account already exists. Updating password...\n');
      
      const updateQuery = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE email = $2
        RETURNING id, email, name, role
      `;
      
      const result = await pool.query(updateQuery, [hashedPassword, email]);
      const user = result.rows[0];
      
      console.log('✅ Password updated!\n');
      console.log('=== Test Account Credentials ===');
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${password}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log('================================\n');
      console.log('✅ You can now login with these credentials!');
    } else {
      console.log('📝 Creating new account...\n');
      
      const insertQuery = `
        INSERT INTO users (email, password, name, role, auth_method, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, name, role
      `;
      
      const result = await pool.query(insertQuery, [
        email,
        hashedPassword,
        name,
        'user',
        'email'
      ]);
      
      const user = result.rows[0];
      
      console.log('✅ Account created!\n');
      console.log('=== Test Account Credentials ===');
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${password}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log('================================\n');
      console.log('✅ You can now login with these credentials!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestAccount();

