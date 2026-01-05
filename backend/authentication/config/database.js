const { Pool } = require('pg');

// Database configuration
// Support both connection string (for Supabase) and individual parameters
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string (Supabase format: postgresql://postgres:[password]@[host]:[port]/postgres)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL.includes('supabase') ? {
      rejectUnauthorized: false // Required for Supabase
    } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Increased timeout for cloud connections
  };
} else {
  // Use individual parameters (for local PostgreSQL)
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aarohaa_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  };
  
  // Add SSL if configured
  if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle database client', err);
  process.exit(-1);
});

// Test connection function
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);
    client.release();
    return { connected: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return { connected: false, error: error.message };
  }
}

// Get database status
async function getDatabaseStatus() {
  try {
    const result = await pool.query('SELECT version()');
    return {
      connected: true,
      version: result.rows[0].version,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  pool,
  testConnection,
  getDatabaseStatus
};

