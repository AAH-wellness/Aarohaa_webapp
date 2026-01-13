/**
 * Simple Email Connection Test
 * Run this to test your email configuration
 * 
 * Usage: node test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🧪 Testing Email Configuration...\n');

// Read configuration from .env
const config = {
  host: process.env.EMAIL_HOST || 'smtp.office365.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

console.log('📧 Configuration:');
console.log('   Host:', config.host);
console.log('   Port:', config.port);
console.log('   Secure:', config.secure);
console.log('   User:', config.auth.user || 'NOT SET');
console.log('   Password:', config.auth.pass ? '***SET***' : 'NOT SET');
console.log('');

if (!config.auth.user || !config.auth.pass) {
  console.error('❌ EMAIL_USER and EMAIL_PASSWORD must be set in .env file');
  console.error('\nAdd these to your .env file:');
  console.error('EMAIL_HOST=smtpout.secureserver.net');
  console.error('EMAIL_PORT=587');
  console.error('EMAIL_SECURE=false');
  console.error('EMAIL_USER=support1@aarohaa.io');
  console.error('EMAIL_PASSWORD=Summer@2024$');
  process.exit(1);
}

// Create transporter with multiple configuration attempts
let transporter;

// Try different configurations
const configs = [
  {
    name: 'Standard Configuration',
    options: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false
      },
      requireTLS: !config.secure,
      connectionTimeout: 15000,
      greetingTimeout: 15000
    }
  },
  {
    name: 'Alternative Configuration (No requireTLS)',
    options: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000
    }
  },
  {
    name: 'Minimal Configuration',
    options: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    }
  }
];

let currentConfigIndex = 0;

// Test connection with multiple configurations
function testConnection(configIndex) {
  if (configIndex >= configs.length) {
    console.error('❌ All connection attempts failed!');
    console.error('');
    console.error('💡 Possible Issues:');
    console.error('   1. Account may be temporarily locked (wait 15-30 minutes)');
    console.error('   2. GoDaddy may have changed SMTP settings');
    console.error('   3. Network/firewall blocking SMTP ports');
    console.error('   4. Password may need to be reset');
    console.error('');
    console.error('🔧 Next Steps:');
    console.error('   1. Verify password at https://email.godaddy.com');
    console.error('   2. Contact GoDaddy support: 1-480-505-8877');
    console.error('   3. Ask: "What are current SMTP settings for support1@aarohaa.io?"');
    console.error('   4. Ask: "Is my account locked due to failed SMTP attempts?"');
    process.exit(1);
  }

  const testConfig = configs[configIndex];
  console.log(`🔍 Testing: ${testConfig.name}...`);
  
  transporter = nodemailer.createTransport(testConfig.options);
  
  transporter.verify((error, success) => {
    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      console.log('');
      // Try next configuration
      testConnection(configIndex + 1);
    } else {
      console.log('✅ Connection Successful!');
      console.log('');
      console.log('🎉 Your email service is configured correctly!');
      console.log(`   Working configuration: ${testConfig.name}`);
      console.log('   You can now send emails from your application.');
      console.log('');
      console.log('📝 Current Configuration:');
      console.log('   Host:', config.host);
      console.log('   Port:', config.port);
      console.log('   Secure:', config.secure);
      console.log('   User:', config.auth.user);
      process.exit(0);
    }
  });
}

console.log('🔍 Testing connection with multiple configurations...\n');
testConnection(0);
