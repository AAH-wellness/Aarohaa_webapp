require('dotenv').config();
const { testConnection, getDatabaseStatus } = require('../config/database');

async function main() {
  console.log('🔍 Testing database connection...\n');
  console.log('Database Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}`);
  console.log(`  Database: ${process.env.DB_NAME || 'aarohaa_db'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}\n`);
  
  const result = await testConnection();
  
  if (result.connected) {
    console.log('\n✅ Database connection successful!');
    process.exit(0);
  } else {
    console.log('\n❌ Database connection failed!');
    console.log(`Error: ${result.error}`);
    console.log('\nPlease check:');
    console.log('  1. PostgreSQL is running');
    console.log('  2. Database credentials in .env file are correct');
    console.log('  3. Database exists');
    process.exit(1);
  }
}

main().catch(console.error);

