/**
 * Initialize user_login_events table
 * Run this script to create the user_login_events table in Supabase
 */

require('dotenv').config();
const UserLoginEvent = require('../models/UserLoginEvent');

async function initTable() {
  try {
    console.log('🔧 Initializing user_login_events table...\n');
    await UserLoginEvent.createTable();
    console.log('\n✅ user_login_events table initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing table:', error);
    process.exit(1);
  }
}

initTable();

