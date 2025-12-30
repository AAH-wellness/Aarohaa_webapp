require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist yet.');
      console.log('   Run the server once to create the table.');
      process.exit(0);
    }
    
    // Get all users
    const result = await pool.query('SELECT id, email, password_hash, name, role, created_at FROM users ORDER BY created_at DESC');
    
    if (result.rows.length === 0) {
      console.log('📭 No users found in database.\n');
      process.exit(0);
    }
    
    console.log(`📊 Found ${result.rows.length} user(s):\n`);
    
    for (const user of result.rows) {
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'N/A'}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.created_at}`);
      
      // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = user.password_hash && (
        user.password_hash.startsWith('$2a$') ||
        user.password_hash.startsWith('$2b$') ||
        user.password_hash.startsWith('$2y$')
      );
      
      if (isHashed) {
        console.log(`Password: ✅ Properly hashed (bcrypt)`);
      } else {
        console.log(`Password: ⚠️  NOT HASHED (stored as plain text or invalid format)`);
        console.log(`   Password value: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);
      }
      
      console.log('---\n');
    }
    
    // Check for users with unhashed passwords
    const unhashedUsers = result.rows.filter(user => {
      const hash = user.password_hash;
      return !hash || (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$'));
    });
    
    if (unhashedUsers.length > 0) {
      console.log(`⚠️  WARNING: ${unhashedUsers.length} user(s) have unhashed passwords!`);
      console.log('   These users need to re-register or have their passwords rehashed.\n');
    } else {
      console.log('✅ All users have properly hashed passwords!\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();

