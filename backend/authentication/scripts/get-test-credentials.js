const { pool } = require('../config/database');

async function getTestCredentials() {
  try {
    console.log('🔍 Fetching test account credentials...\n');

    const query = `
      SELECT 
        id,
        email,
        name,
        phone,
        role,
        auth_method,
        created_at,
        last_login
      FROM users 
      WHERE email = $1
    `;

    const result = await pool.query(query, ['ram123@gmail.com']);

    if (result.rows.length === 0) {
      console.log('❌ No account found with email: ram123@gmail.com');
      console.log('\n📝 Available accounts:');
      
      // Show all accounts
      const allUsers = await pool.query('SELECT email, auth_method FROM users ORDER BY created_at DESC LIMIT 10');
      allUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.auth_method})`);
      });
      
      process.exit(0);
    }

    const user = result.rows[0];

    console.log('✅ Account found!\n');
    console.log('=== Test Account Credentials ===');
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name || 'Not set'}`);
    console.log(`Phone: ${user.phone || 'Not set'}`);
    console.log(`Role: ${user.role}`);
    console.log(`Auth Method: ${user.auth_method}`);
    console.log(`Created: ${user.created_at}`);
    console.log(`Last Login: ${user.last_login || 'Never'}`);
    console.log('================================\n');

    // Check if this is a password-based account
    if (user.auth_method === 'email') {
      console.log('⚠️  PASSWORD NOTE:');
      console.log('Passwords are hashed using bcrypt and cannot be retrieved in plain text.');
      console.log('This is a security best practice.\n');
      console.log('OPTIONS:');
      console.log('1. Reset the password to a known value (recommended)');
      console.log('2. Create a new test account with a known password\n');
      console.log('Would you like me to:');
      console.log('A) Reset this account password to "Test@123"');
      console.log('B) Show you how to create a new test account');
    } else if (user.auth_method === 'google') {
      console.log('ℹ️  This is a Google OAuth account.');
      console.log('No password is needed - user signs in via Google.\n');
    } else if (user.auth_method === 'wallet') {
      console.log('ℹ️  This is a wallet-based account.');
      console.log('No password is needed - user signs in via crypto wallet.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getTestCredentials();

