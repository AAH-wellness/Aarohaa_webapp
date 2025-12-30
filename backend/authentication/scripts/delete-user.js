require('dotenv').config();
const User = require('../models/User');

async function deleteUser() {
  const identifier = process.argv[2]; // Can be email or ID
  const identifierType = process.argv[3] || 'auto'; // 'email', 'id', or 'auto'

  if (!identifier) {
    console.log('❌ Usage: node scripts/delete-user.js <email|id> [type]');
    console.log('   Examples:');
    console.log('     node scripts/delete-user.js user@example.com');
    console.log('     node scripts/delete-user.js user@example.com email');
    console.log('     node scripts/delete-user.js 1 id');
    process.exit(1);
  }

  try {
    console.log('🗑️  Deleting user...\n');

    let deletedUser = null;
    let userInfo = null;

    // Determine if identifier is email or ID
    if (identifierType === 'email' || (identifierType === 'auto' && identifier.includes('@'))) {
      // Delete by email
      console.log(`📧 Looking for user with email: ${identifier}`);
      userInfo = await User.findByEmail(identifier);
      if (!userInfo) {
        console.log('❌ User not found with email:', identifier);
        process.exit(1);
      }
      console.log(`✅ Found user: ${userInfo.name} (ID: ${userInfo.id})`);
      deletedUser = await User.deleteByEmail(identifier);
    } else {
      // Delete by ID
      const userId = parseInt(identifier);
      if (isNaN(userId)) {
        console.log('❌ Invalid user ID:', identifier);
        process.exit(1);
      }
      console.log(`🆔 Looking for user with ID: ${userId}`);
      userInfo = await User.findById(userId);
      if (!userInfo) {
        console.log('❌ User not found with ID:', userId);
        process.exit(1);
      }
      console.log(`✅ Found user: ${userInfo.name} (Email: ${userInfo.email})`);
      deletedUser = await User.deleteById(userId);
    }

    if (deletedUser) {
      console.log('\n✅✅✅ User permanently deleted!');
      console.log('   Deleted User Details:');
      console.log(`   - ID: ${deletedUser.id}`);
      console.log(`   - Email: ${deletedUser.email}`);
      console.log(`   - Name: ${deletedUser.name}`);
      console.log('\n⚠️  WARNING: This deletion is permanent and cannot be undone!');
      process.exit(0);
    } else {
      console.log('❌ Failed to delete user');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    process.exit(1);
  }
}

deleteUser();

