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
  console.error('EMAIL_HOST=smtp.office365.com');
  console.error('EMAIL_PORT=587');
  console.error('EMAIL_SECURE=false');
  console.error('EMAIL_USER=your-email@yourdomain.com');
  console.error('EMAIL_PASSWORD=your-password');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: config.auth,
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection with multiple configurations for GoDaddy
async function testConnection() {
  const configs = [
    { host: config.host, port: config.port, secure: config.secure, name: 'Current Configuration' },
    { host: 'smtpout.secureserver.net', port: 587, secure: false, name: 'GoDaddy SMTP (Port 587)' },
    { host: 'smtpout.secureserver.net', port: 465, secure: true, name: 'GoDaddy SMTP (Port 465 SSL)' },
    { host: 'smtpout.secureserver.net', port: 80, secure: false, name: 'GoDaddy SMTP (Port 80)' },
    { host: 'relay-hosting.secureserver.net', port: 25, secure: false, name: 'GoDaddy Relay (Port 25)' }
  ];

  for (const testConfig of configs) {
    console.log(`\n🧪 Testing: ${testConfig.name}`);
    console.log(`   Host: ${testConfig.host}, Port: ${testConfig.port}, Secure: ${testConfig.secure}`);
    
    const testTransporter = nodemailer.createTransport({
      host: testConfig.host,
      port: testConfig.port,
      secure: testConfig.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await new Promise((resolve, reject) => {
        testTransporter.verify((error, success) => {
          if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        });
      });
      
      console.log('✅ Connection Successful with this configuration!');
      console.log('');
      console.log('🎉 Your email service is configured correctly!');
      console.log('   Update your .env file with these settings:');
      console.log(`   EMAIL_HOST=${testConfig.host}`);
      console.log(`   EMAIL_PORT=${testConfig.port}`);
      console.log(`   EMAIL_SECURE=${testConfig.secure}`);
      console.log(`   EMAIL_USER=${config.auth.user}`);
      console.log('');
      process.exit(0);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // If all configurations failed
  console.error('\n❌ All connection attempts failed!');
  console.error('');
  console.error('💡 GoDaddy Email Troubleshooting:');
  console.error('   1. Verify your EMAIL_USER and EMAIL_PASSWORD are correct');
  console.error('   2. Check if your GoDaddy email account is locked (contact support)');
  console.error('   3. Try resetting your email password in GoDaddy cPanel');
  console.error('   4. Contact GoDaddy support to verify SMTP settings for your account');
  console.error('   5. Make sure SMTP is enabled in your GoDaddy email settings');
  console.error('   6. Check if your account requires an App Password (less common for GoDaddy)');
  console.error('');
  console.error('📧 Common GoDaddy SMTP Settings:');
  console.error('   Host: smtpout.secureserver.net');
  console.error('   Port: 587 (TLS) or 465 (SSL)');
  console.error('   Secure: false (for 587) or true (for 465)');
  console.error('   Username: Your full email address');
  console.error('   Password: Your email account password');
  process.exit(1);
}

testConnection();
