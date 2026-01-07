// Test Supabase connection using the actual database config
require('dotenv').config();
const { testConnection, getDatabaseStatus } = require('./config/database');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  
  // Check configuration
  console.log('Configuration Check:');
  if (process.env.DATABASE_URL) {
    const isSupabase = process.env.DATABASE_URL.includes('supabase');
    console.log(`  ✅ DATABASE_URL: SET ${isSupabase ? '(Supabase URL detected)' : ''}`);
    
    // Show masked URL (hide password)
    const url = process.env.DATABASE_URL;
    const maskedUrl = url.replace(/:[^:@]+@/, ':***@');
    console.log(`  📍 Connection String: ${maskedUrl}`);
  } else {
    console.log('  ⚠️  DATABASE_URL: NOT SET');
    console.log('  📍 Using individual parameters instead');
  }
  
  console.log(`  🔒 SSL: ${process.env.DB_SSL || 'false'}`);
  console.log('');
  
  // Test connection
  console.log('Testing connection...\n');
  const result = await testConnection();
  
  if (result.connected) {
    console.log('✅ SUCCESS: Connected to Supabase database!');
    console.log(`   Timestamp: ${result.timestamp}\n`);
    
    // Get database status
    const status = await getDatabaseStatus();
    if (status.connected) {
      console.log('📊 Database Information:');
      console.log(`   Status: Connected`);
      console.log(`   Version: ${status.version.split(' ')[0]} ${status.version.split(' ')[1]}`);
      console.log(`   Timestamp: ${status.timestamp}\n`);
    }
    
    console.log('🎉 Your database is successfully connected to Supabase!');
    console.log('   Team members can now access the database using the same connection string.\n');
    
    return true;
  } else {
    console.log('❌ FAILED: Could not connect to database');
    console.log(`   Error: ${result.error}\n`);
    console.log('💡 Troubleshooting:');
    console.log('   1. Verify DATABASE_URL in .env file is correct');
    console.log('   2. Check if your Supabase project is active (not paused)');
    console.log('   3. Verify the password in the connection string is correct');
    console.log('   4. Ensure DB_SSL=true is set for Supabase');
    console.log('   5. Check your internet connection\n');
    
    return false;
  }
}

// Run test
testSupabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });








