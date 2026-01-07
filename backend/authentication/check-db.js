// Database connection test script
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 5000,
});

console.log('Testing PostgreSQL connection...');
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Port: ${process.env.DB_PORT || 5432}`);
console.log(`Database: ${process.env.DB_NAME || 'postgres'}`);
console.log(`User: ${process.env.DB_USER || 'postgres'}`);
console.log('');

pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to PostgreSQL!');
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:');
    console.error(err.message);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Make sure PostgreSQL is installed');
    console.error('2. Make sure PostgreSQL service is running');
    console.error('3. Check your .env file has correct credentials');
    console.error('4. Verify PostgreSQL is listening on port 5432');
    process.exit(1);
  });








