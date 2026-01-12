const nodemailer = require('nodemailer');

/**
 * Email Service for Aarohaa Wellness
 * Handles all automated email notifications
 */

// Email configuration from environment variables
// Default to Microsoft/Outlook settings (common for GoDaddy-hosted emails)
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.office365.com', // Microsoft 365 SMTP
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // false for 587 (STARTTLS), true for 465
  auth: {
    user: process.env.EMAIL_USER, // Your Microsoft email (e.g., support@yourdomain.com)
    pass: process.env.EMAIL_PASSWORD // Your Microsoft email password
  },
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'support@aarohaa.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Aarohaa Wellness Support',
  // Microsoft/Outlook specific settings
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Set to true in production with proper SSL certificates
  }
};

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file.');
    return null;
  }

  if (!transporter) {
    // Detect GoDaddy SMTP server
    const isGoDaddy = EMAIL_CONFIG.host.includes('secureserver.net');
    
    const transporterConfig = {
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
      connectionTimeout: 20000, // Increased timeout
      greetingTimeout: 20000,   // Increased timeout
      socketTimeout: 20000,     // Added socket timeout
      debug: false,              // Set to true for detailed logs
      logger: false
    };

    // Configure TLS based on server type
    if (isGoDaddy) {
      // GoDaddy SMTP configuration - try simpler approach
      transporterConfig.tls = {
        rejectUnauthorized: false,
        minVersion: 'TLSv1'
      };
      // Don't force requireTLS - let nodemailer decide
      if (EMAIL_CONFIG.port === 587) {
        transporterConfig.requireTLS = true;
      } else if (EMAIL_CONFIG.port === 465) {
        transporterConfig.requireTLS = false;
      }
    } else {
      // Microsoft/Outlook configuration
      transporterConfig.tls = EMAIL_CONFIG.tls || {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      };
      transporterConfig.requireTLS = true;
    }

    transporter = nodemailer.createTransport(transporterConfig);
    
    // Verify connection on initialization (async, don't block server startup)
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service connection failed:', error.message);
        console.error('');
        console.error('📧 Email Configuration Help:');
        console.error('   1. Check your .env file in backend/authentication/.env');
        console.error('   2. Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD are set');
        console.error('   3. For GoDaddy, try: EMAIL_HOST=smtpout.secureserver.net, EMAIL_PORT=587, EMAIL_SECURE=false');
        console.error('   4. Make sure to RESTART the server after updating .env');
        console.error('   5. See EMAIL_SETUP_GUIDE.md for detailed instructions');
        console.error('');
      } else {
        console.log('✅ Email service connection verified successfully');
        console.log('   Host:', EMAIL_CONFIG.host);
        console.log('   Port:', EMAIL_CONFIG.port);
        console.log('   From:', EMAIL_CONFIG.from);
      }
    });
  }

  return transporter;
}

/**
 * Send email
 */
async function sendEmail(to, subject, html, text = null) {
  try {
    console.log('📧 Attempting to send email to:', to);
    console.log('   Subject:', subject);
    
    const emailTransporter = initializeTransporter();
    
    if (!emailTransporter) {
      console.error('❌ Email service not configured. Skipping email to:', to);
      console.error('   Please check EMAIL_USER and EMAIL_PASSWORD in .env file');
      return { success: false, message: 'Email service not configured' };
    }

    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.error('❌ Email credentials not set in environment variables');
      console.error('   EMAIL_USER:', EMAIL_CONFIG.auth.user ? 'Set' : 'NOT SET');
      console.error('   EMAIL_PASSWORD:', EMAIL_CONFIG.auth.pass ? 'Set' : 'NOT SET');
      return { success: false, message: 'Email credentials not configured' };
    }

    const mailOptions = {
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', {
      to: to,
      subject: subject,
      messageId: info.messageId
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email to:', to);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    if (error.response) {
      console.error('   SMTP Response:', error.response);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Email Templates
 */

// Email signature with logo (reusable component)
function getEmailSignature() {
  // Use the new logo - construct URL from FRONTEND_URL
  // The new logo is a circular logo with blue-to-green gradient and white abstract symbol
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const logoUrl = process.env.EMAIL_LOGO_URL || `${frontendUrl}/logo.png`; // New circular gradient logo
  const websiteUrl = process.env.COMPANY_WEBSITE || frontendUrl;
  const supportEmail = process.env.EMAIL_FROM || 'support1@aarohaa.io';
  const companyName = 'Aarohaa Wellness';
  const companyAddress = process.env.COMPANY_ADDRESS || 'Your Company Address';
  const companyPhone = process.env.COMPANY_PHONE || '+1 (555) 123-4567';
  
  return `
    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="text-align: center; padding-bottom: 20px;">
            <img src="${logoUrl}" alt="${companyName} Logo" style="max-width: 180px; height: auto; display: block; margin: 0 auto; border-radius: 50%;" />
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <p style="margin: 5px 0; color: #0e4826; font-size: 18px; font-weight: bold;">${companyName}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">${companyAddress}</p>
            <p style="margin: 10px 0;">
              <a href="mailto:${supportEmail}" style="color: #0e4826; text-decoration: none; margin: 0 10px;">${supportEmail}</a>
              <span style="color: #999;">|</span>
              <a href="tel:${companyPhone}" style="color: #0e4826; text-decoration: none; margin: 0 10px;">${companyPhone}</a>
            </p>
            <p style="margin: 10px 0;">
              <a href="${websiteUrl}" style="color: #0e4826; text-decoration: none; font-weight: 500;">Visit Our Website</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="margin: 5px 0; color: #999; font-size: 12px;">
              Best regards,<br>
              <strong style="color: #0e4826;">The ${companyName} Team</strong>
            </p>
            <p style="margin: 15px 0 5px 0; color: #999; font-size: 11px;">
              This is an automated email. Please do not reply directly to this message.<br>
              For support, please contact us at <a href="mailto:${supportEmail}" style="color: #0e4826;">${supportEmail}</a>
            </p>
            <p style="margin: 10px 0; color: #999; font-size: 10px;">
              © ${new Date().getFullYear()} ${companyName}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Welcome email template for user registration
function getWelcomeEmailTemplate(name, email, role = 'user') {
  const roleText = role === 'provider' ? 'Provider' : 'User';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0e4826 0%, #0a3620 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #0e4826; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Aarohaa Wellness! 🌿</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for registering with Aarohaa Wellness. We're excited to have you join our wellness community!</p>
          <p>Your account has been successfully created:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Account Type:</strong> ${roleText}</li>
          </ul>
          <p>You can now log in to your account and start your wellness journey.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login to Your Account</a>
          <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
        </div>
        ${getEmailSignature()}
      </div>
    </body>
    </html>
  `;
}

// Password reset email template
function getPasswordResetEmailTemplate(name, resetToken, resetLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0e4826 0%, #0a3620 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #0e4826; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request 🔐</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>We received a request to reset your password for your Aarohaa Wellness account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0e4826;">${resetLink}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password will remain unchanged if you don't click the link</li>
            </ul>
          </div>
        </div>
        ${getEmailSignature()}
      </div>
    </body>
    </html>
  `;
}

// Booking confirmation email template
function getBookingConfirmationEmailTemplate(userName, providerName, appointmentDate, sessionType, notes = null) {
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #0e4826; }
        .button { display: inline-block; padding: 12px 30px; background: #0e4826; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Booking Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Great news! Your appointment has been successfully confirmed.</p>
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Provider:</span> ${providerName}
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span> ${formattedDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Session Type:</span> ${sessionType}
            </div>
            ${notes ? `<div class="detail-row"><span class="detail-label">Notes:</span> ${notes}</div>` : ''}
          </div>
          <p>We'll send you a reminder before your session. You can view and manage your appointments from your dashboard.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-appointments" class="button">View My Appointments</a>
        </div>
        ${getEmailSignature()}
      </div>
    </body>
    </html>
  `;
}

// Booking cancellation email template
function getBookingCancellationEmailTemplate(userName, providerName, appointmentDate, sessionType, reason) {
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #0e4826; }
        .reason-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #0e4826; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Cancelled</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Your appointment has been cancelled as requested.</p>
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Provider:</span> ${providerName}
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span> ${formattedDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Session Type:</span> ${sessionType}
            </div>
            ${reason ? `<div class="detail-row"><span class="detail-label">Cancellation Reason:</span><div class="reason-box">${reason}</div></div>` : ''}
          </div>
          <p>We're sorry to see you go. You can book a new appointment anytime from your dashboard.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/book-appointment" class="button">Book New Appointment</a>
        </div>
        ${getEmailSignature()}
      </div>
    </body>
    </html>
  `;
}

// Provider booking notification email template
function getProviderBookingNotificationEmailTemplate(providerName, userName, appointmentDate, sessionType, notes = null) {
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0e4826 0%, #0a3620 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0e4826; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #0e4826; }
        .button { display: inline-block; padding: 12px 30px; background: #0e4826; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Booking Received! 📅</h1>
        </div>
        <div class="content">
          <h2>Hello ${providerName}!</h2>
          <p>You have received a new booking request.</p>
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Patient:</span> ${userName}
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span> ${formattedDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Session Type:</span> ${sessionType}
            </div>
            ${notes ? `<div class="detail-row"><span class="detail-label">Notes:</span> ${notes}</div>` : ''}
          </div>
          <p>Please review the appointment details and prepare for the session.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/provider/appointments" class="button">View My Schedule</a>
        </div>
        ${getEmailSignature()}
      </div>
    </body>
    </html>
  `;
}

/**
 * Email notification functions
 */

// Send welcome email after registration
async function sendWelcomeEmail(name, email, role = 'user') {
  const subject = 'Welcome to Aarohaa Wellness!';
  const html = getWelcomeEmailTemplate(name, email, role);
  return await sendEmail(email, subject, html);
}

// Send password reset email
async function sendPasswordResetEmail(name, email, resetToken) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request - Aarohaa Wellness';
  const html = getPasswordResetEmailTemplate(name, resetToken, resetLink);
  return await sendEmail(email, subject, html);
}

// Send booking confirmation email to user
async function sendBookingConfirmationEmail(userEmail, userName, providerName, appointmentDate, sessionType, notes = null) {
  const subject = 'Booking Confirmed - Aarohaa Wellness';
  const html = getBookingConfirmationEmailTemplate(userName, providerName, appointmentDate, sessionType, notes);
  return await sendEmail(userEmail, subject, html);
}

// Send booking notification email to provider
async function sendProviderBookingNotificationEmail(providerEmail, providerName, userName, appointmentDate, sessionType, notes = null) {
  const subject = 'New Booking Received - Aarohaa Wellness';
  const html = getProviderBookingNotificationEmailTemplate(providerName, userName, appointmentDate, sessionType, notes);
  return await sendEmail(providerEmail, subject, html);
}

// Send booking cancellation email to user
async function sendBookingCancellationEmail(userEmail, userName, providerName, appointmentDate, sessionType, reason) {
  const subject = 'Appointment Cancelled - Aarohaa Wellness';
  const html = getBookingCancellationEmailTemplate(userName, providerName, appointmentDate, sessionType, reason);
  return await sendEmail(userEmail, subject, html);
}

// Send booking cancellation notification to provider
async function sendProviderCancellationNotificationEmail(providerEmail, providerName, userName, appointmentDate, sessionType, reason) {
  const subject = 'Appointment Cancelled - Aarohaa Wellness';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #0e4826; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Cancelled</h1>
        </div>
        <div class="content">
          <h2>Hello ${providerName}!</h2>
          <p>An appointment has been cancelled by the patient.</p>
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Patient:</span> ${userName}
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span> ${new Date(appointmentDate).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>
            <div class="detail-row">
              <span class="detail-label">Session Type:</span> ${sessionType}
            </div>
            ${reason ? `<div class="detail-row"><span class="detail-label">Cancellation Reason:</span> ${reason}</div>` : ''}
          </div>
        </div>
        ${getEmailSignature()}
      </div>
    </body>
    </html>
  `;
  return await sendEmail(providerEmail, subject, html);
}

// Support ticket email template
function getSupportTicketEmailTemplate(userName, userEmail, subject, messageType, message, ticketId) {
  const formattedDate = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0e4826 0%, #0a3620 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0e4826; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #0e4826; min-width: 120px; display: inline-block; }
        .message-box { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e0e0e0; white-space: pre-wrap; }
        .ticket-id { background: #0e4826; color: white; padding: 8px 15px; border-radius: 5px; display: inline-block; font-weight: bold; }
        .button { display: inline-block; padding: 12px 30px; background: #0e4826; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Support Ticket Received 📧</h1>
        </div>
        <div class="content">
          <h2>Hello Support Team!</h2>
          <p>A new support ticket has been submitted through the contact form.</p>
          
          <div class="ticket-details">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="ticket-id">Ticket ID: #${ticketId}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">From:</span> ${userName}
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span> 
              <a href="mailto:${userEmail}" style="color: #0e4826; text-decoration: none;">${userEmail}</a>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span> ${messageType}
            </div>
            <div class="detail-row">
              <span class="detail-label">Subject:</span> ${subject}
            </div>
            <div class="detail-row">
              <span class="detail-label">Submitted:</span> ${formattedDate}
            </div>
            <div class="detail-row" style="border-bottom: none; padding-top: 15px;">
              <span class="detail-label" style="display: block; margin-bottom: 10px;">Message:</span>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          
          <p style="margin-top: 20px;">Please review this ticket and respond to the user at your earliest convenience.</p>
        </div>
        ${getEmailSignature()}
      </div>
    </body>
    </html>
  `;
}

// Send support ticket email to support team
async function sendSupportTicketEmail(userName, userEmail, subject, messageType, message, ticketId) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support1@aarohaa.io';
  const emailSubject = `[Support Ticket #${ticketId}] ${subject} - ${messageType}`;
  const html = getSupportTicketEmailTemplate(userName, userEmail, subject, messageType, message, ticketId);
  return await sendEmail(supportEmail, emailSubject, html);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendProviderBookingNotificationEmail,
  sendBookingCancellationEmail,
  sendProviderCancellationNotificationEmail,
  sendSupportTicketEmail,
  initializeTransporter
};
