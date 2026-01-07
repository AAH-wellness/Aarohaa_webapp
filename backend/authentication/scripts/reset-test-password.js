/**
 * Script to reset a user's password for testing purposes
 * This creates a test account or resets an existing one
 */

const fetch = require('node-fetch');

async function resetPassword() {
  try {
    console.log('🔧 Creating/Resetting test account via API...\n');

    const testEmail = 'testuser@example.com';
    const testPassword = 'Test@123';
    const testName = 'Test User';
    const testPhone = '+1234567890';

    console.log('📝 Registering test account...');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);

    // Try to register the user
    const response = await fetch('http://localhost:3001/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
        phone: testPhone,
        role: 'user'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Account created successfully!\n');
      console.log('=== Test Account Credentials ===');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      console.log(`Name: ${testName}`);
      console.log('================================\n');
      console.log('✅ You can now login with these credentials at: http://localhost:5173');
    } else if (data.error?.message?.includes('already exists')) {
      console.log('⚠️  Account already exists with this email.\n');
      console.log('Since we cannot retrieve the existing password (it\'s hashed),');
      console.log('here are your options:\n');
      console.log('1. Try logging in with: testuser@example.com / Test@123');
      console.log('   (If this account was created by this script before)\n');
      console.log('2. Use a different email to create a new test account');
      console.log('   Edit this script and change testEmail to something else\n');
      console.log('3. Check if ram123@gmail.com exists and try Google login');
    } else {
      console.error('❌ Error creating account:', data.error?.message || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   cd backend/authentication');
    console.log('   npm run dev');
  }
}

resetPassword();

