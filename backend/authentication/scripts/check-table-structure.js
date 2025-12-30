require('dotenv').config();
const { pool } = require('../config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking users table structure...\n');
    
    // Get table columns
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Users table does not exist.');
      process.exit(0);
    }
    
    console.log('📊 Users table structure:');
    console.log('─'.repeat(60));
    result.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('─'.repeat(60));
    
    // Get sample data
    const sample = await pool.query('SELECT * FROM users LIMIT 1');
    if (sample.rows.length > 0) {
      console.log('\n📋 Sample user data:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTableStructure();

