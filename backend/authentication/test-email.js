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

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connection Failed:', error.message);
    console.error('');
    console.error('💡 Possible Issues:');
    console.error('   1. Check your EMAIL_HOST, EMAIL_PORT, and EMAIL_SECURE settings');
    console.error('   2. Verify your EMAIL_USER and EMAIL_PASSWORD are correct');
    console.error('   3. For Microsoft/Outlook accounts, you may need an App Password');
    console.error('   4. Check if your email provider requires SMTP to be enabled');
    process.exit(1);
  } else {
    console.log('✅ Connection Successful!');
    console.log('');
    console.log('🎉 Your email service is configured correctly!');
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
