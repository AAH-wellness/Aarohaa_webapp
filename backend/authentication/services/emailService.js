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

// Premium email signature with logo (reusable component)
function getEmailSignature() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Use the new circular gradient logo from public folder
  const logoUrl = process.env.EMAIL_LOGO_URL || `${frontendUrl}/logo.png`;
  const websiteUrl = process.env.COMPANY_WEBSITE || frontendUrl;
  const supportEmail = process.env.EMAIL_FROM || 'support1@aarohaa.io';
  const companyName = 'Aarohaa Wellness';
  const companyAddress = process.env.COMPANY_ADDRESS || 'Your Company Address';
  const companyPhone = process.env.COMPANY_PHONE || '+1 (555) 123-4567';
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 60px; padding-top: 40px; border-top: 1px solid rgba(14, 72, 38, 0.1);">
      <tr>
        <td style="text-align: center; padding-bottom: 30px;">
          <img src="${logoUrl}" alt="${companyName} Logo" style="max-width: 140px; width: 140px; height: 140px; display: block; margin: 0 auto; border-radius: 50%; box-shadow: 0 6px 25px rgba(14, 72, 38, 0.2); object-fit: contain; background: transparent;" />
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 0 20px 30px;">
          <h3 style="margin: 0 0 8px 0; color: #0e4826; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${companyName}</h3>
          <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${companyAddress}</p>
          <div style="margin: 20px 0;">
            <a href="mailto:${supportEmail}" style="display: inline-block; color: #0e4826; text-decoration: none; margin: 0 12px; font-size: 14px; font-weight: 500; transition: color 0.2s; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${supportEmail}</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="tel:${companyPhone}" style="display: inline-block; color: #0e4826; text-decoration: none; margin: 0 12px; font-size: 14px; font-weight: 500; transition: color 0.2s; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${companyPhone}</a>
          </div>
          <a href="${websiteUrl}" style="display: inline-block; color: #0e4826; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Visit Our Website →</a>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 30px 20px 20px; border-top: 1px solid rgba(14, 72, 38, 0.08);">
          <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Best regards,<br>
            <strong style="color: #0e4826; font-weight: 600;">The ${companyName} Team</strong>
          </p>
          <p style="margin: 20px 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            This is an automated email. Please do not reply directly to this message.<br>
            For support, please contact us at <a href="mailto:${supportEmail}" style="color: #0e4826; text-decoration: none; font-weight: 500;">${supportEmail}</a>
          </p>
          <p style="margin: 0; color: #d1d5db; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  `;
}

// Premium Welcome email template for user registration
function getWelcomeEmailTemplate(name, email, role = 'user') {
  const roleText = role === 'provider' ? 'Provider' : 'User';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Welcome to Aarohaa Wellness</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Premium Header with Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #0e4826 0%, #16a34a 50%, #0e4826 100%); padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; position: relative; z-index: 1;">Welcome to Aarohaa Wellness</h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400; position: relative; z-index: 1;">Your wellness journey begins here</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.3;">Hello ${name}! 👋</h2>
                  <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">Thank you for joining the Aarohaa Wellness community. We're thrilled to have you on board and excited to support you on your path to better health and wellness.</p>
                  
                  <!-- Account Details Card -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid rgba(14, 72, 38, 0.1);">
                    <tr>
                      <td>
                        <p style="margin: 0 0 16px 0; color: #0e4826; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Account Details</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.1);">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Email Address</span>
                              <p style="margin: 4px 0 0 0; color: #111827; font-size: 15px; font-weight: 500;">${email}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Account Type</span>
                              <p style="margin: 4px 0 0 0; color: #111827; font-size: 15px; font-weight: 500;">${roleText}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">You're all set! Log in to your account to explore our services, book appointments, and start your personalized wellness experience.</p>
                  
                  <!-- Premium CTA Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 8px 0 32px;">
                        <a href="${frontendUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #0e4826 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(14, 72, 38, 0.25); transition: all 0.3s ease;">Login to Your Account</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">If you have any questions or need assistance, our support team is here to help. Don't hesitate to reach out!</p>
                </td>
              </tr>
              
              <!-- Signature -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${getEmailSignature()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Premium Password reset email template
function getPasswordResetEmailTemplate(name, resetToken, resetLink) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Reset Your Password - Aarohaa Wellness</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Premium Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0e4826 0%, #16a34a 50%, #0e4826 100%); padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                  <div style="font-size: 48px; margin-bottom: 16px; position: relative; z-index: 1;">🔐</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; position: relative; z-index: 1;">Password Reset Request</h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400; position: relative; z-index: 1;">Secure your account</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.3;">Hello ${name}!</h2>
                  <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">We received a request to reset your password for your Aarohaa Wellness account. Click the button below to create a new secure password.</p>
                  
                  <!-- Premium CTA Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 8px 0 32px;">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #0e4826 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(14, 72, 38, 0.25); transition: all 0.3s ease;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Alternative Link -->
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500; text-align: center;">Or copy and paste this link:</p>
                  <p style="margin: 0 0 32px 0; padding: 12px 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; word-break: break-all; color: #0e4826; font-size: 13px; font-family: 'Courier New', monospace; text-align: center;">${resetLink}</p>
                  
                  <!-- Security Notice -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 32px 0; border-left: 4px solid #f59e0b;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 600; display: flex; align-items: center;">
                          <span style="font-size: 20px; margin-right: 8px;">⚠️</span>
                          Security Notice
                        </p>
                        <ul style="margin: 0; padding-left: 24px; color: #78350f; font-size: 14px; line-height: 1.8;">
                          <li style="margin-bottom: 8px;">This link will expire in <strong>1 hour</strong></li>
                          <li style="margin-bottom: 8px;">If you didn't request this, please ignore this email</li>
                          <li>Your password will remain unchanged if you don't click the link</li>
                        </ul>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">For your security, never share this link with anyone. If you have concerns about your account security, please contact our support team immediately.</p>
                </td>
              </tr>
              
              <!-- Signature -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${getEmailSignature()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Premium Booking confirmation email template
function getBookingConfirmationEmailTemplate(userName, providerName, appointmentDate, sessionType, notes = null) {
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Booking Confirmed - Aarohaa Wellness</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Premium Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%); pointer-events: none;"></div>
                  <div style="font-size: 56px; margin-bottom: 16px; position: relative; z-index: 1;">✅</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; position: relative; z-index: 1;">Booking Confirmed!</h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400; position: relative; z-index: 1;">Your appointment is scheduled</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.3;">Hello ${userName}!</h2>
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">Great news! Your appointment has been successfully confirmed. We're looking forward to seeing you.</p>
                  
                  <!-- Premium Booking Details Card -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid rgba(16, 185, 129, 0.2);">
                    <tr>
                      <td>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Provider</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${providerName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${formattedDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; ${notes ? 'border-bottom: 1px solid rgba(16, 185, 129, 0.15);' : ''}">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Session Type</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${sessionType}</p>
                            </td>
                          </tr>
                          ${notes ? `
                          <tr>
                            <td style="padding: 16px 0;">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p>
                              <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">${notes}</p>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">We'll send you a reminder before your session. You can view and manage all your appointments from your dashboard.</p>
                  
                  <!-- Premium CTA Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 8px 0 32px;">
                        <a href="${frontendUrl}/my-appointments" style="display: inline-block; background: linear-gradient(135deg, #0e4826 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(14, 72, 38, 0.25); transition: all 0.3s ease;">View My Appointments</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">If you need to make any changes to your appointment, please contact us at least 24 hours in advance.</p>
                </td>
              </tr>
              
              <!-- Signature -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${getEmailSignature()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Premium Booking cancellation email template
function getBookingCancellationEmailTemplate(userName, providerName, appointmentDate, sessionType, reason) {
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Appointment Cancelled - Aarohaa Wellness</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Premium Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                  <div style="font-size: 48px; margin-bottom: 16px; position: relative; z-index: 1;">📅</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; position: relative; z-index: 1;">Appointment Cancelled</h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400; position: relative; z-index: 1;">Your cancellation has been processed</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.3;">Hello ${userName}!</h2>
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">Your appointment has been cancelled as requested. We're sorry to see you go, but we're here whenever you're ready to reschedule.</p>
                  
                  <!-- Premium Booking Details Card -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid rgba(239, 68, 68, 0.2);">
                    <tr>
                      <td>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Provider</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${providerName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${formattedDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; ${reason ? 'border-bottom: 1px solid rgba(239, 68, 68, 0.15);' : ''}">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Session Type</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${sessionType}</p>
                            </td>
                          </tr>
                          ${reason ? `
                          <tr>
                            <td style="padding: 16px 0;">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Cancellation Reason</p>
                              <div style="background: rgba(254, 243, 199, 0.5); padding: 12px 16px; border-radius: 8px; margin-top: 8px;">
                                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">${reason}</p>
                              </div>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">You can book a new appointment anytime from your dashboard. We're here to support you whenever you're ready.</p>
                  
                  <!-- Premium CTA Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 8px 0 32px;">
                        <a href="${frontendUrl}/book-appointment" style="display: inline-block; background: linear-gradient(135deg, #0e4826 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(14, 72, 38, 0.25); transition: all 0.3s ease;">Book New Appointment</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
                </td>
              </tr>
              
              <!-- Signature -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${getEmailSignature()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Premium Provider booking notification email template
function getProviderBookingNotificationEmailTemplate(providerName, userName, appointmentDate, sessionType, notes = null) {
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>New Booking Received - Aarohaa Wellness</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Premium Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0e4826 0%, #16a34a 50%, #0e4826 100%); padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                  <div style="font-size: 56px; margin-bottom: 16px; position: relative; z-index: 1;">📅</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; position: relative; z-index: 1;">New Booking Received!</h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400; position: relative; z-index: 1;">You have a new appointment</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.3;">Hello ${providerName}!</h2>
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">You have received a new booking request. Please review the appointment details below and prepare for the session.</p>
                  
                  <!-- Premium Booking Details Card -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid rgba(14, 72, 38, 0.2);">
                    <tr>
                      <td>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Patient</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${userName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${formattedDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; ${notes ? 'border-bottom: 1px solid rgba(14, 72, 38, 0.15);' : ''}">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Session Type</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${sessionType}</p>
                            </td>
                          </tr>
                          ${notes ? `
                          <tr>
                            <td style="padding: 16px 0;">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Patient Notes</p>
                              <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">${notes}</p>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">Please review the appointment details and prepare for the session. You can manage your schedule from your provider dashboard.</p>
                  
                  <!-- Premium CTA Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 8px 0 32px;">
                        <a href="${frontendUrl}/provider/appointments" style="display: inline-block; background: linear-gradient(135deg, #0e4826 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(14, 72, 38, 0.25); transition: all 0.3s ease;">View My Schedule</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Thank you for being part of the Aarohaa Wellness community. We appreciate your dedication to helping others achieve their wellness goals.</p>
                </td>
              </tr>
              
              <!-- Signature -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${getEmailSignature()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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

// Premium Send booking cancellation notification to provider
async function sendProviderCancellationNotificationEmail(providerEmail, providerName, userName, appointmentDate, sessionType, reason) {
  const subject = 'Appointment Cancelled - Aarohaa Wellness';
  const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Appointment Cancelled - Aarohaa Wellness</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Premium Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                  <div style="font-size: 48px; margin-bottom: 16px; position: relative; z-index: 1;">📅</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; position: relative; z-index: 1;">Appointment Cancelled</h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400; position: relative; z-index: 1;">Patient cancellation notification</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.3;">Hello ${providerName}!</h2>
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">An appointment has been cancelled by the patient. Please see the details below.</p>
                  
                  <!-- Premium Booking Details Card -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid rgba(239, 68, 68, 0.2);">
                    <tr>
                      <td>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Patient</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${userName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${formattedDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; ${reason ? 'border-bottom: 1px solid rgba(239, 68, 68, 0.15);' : ''}">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Session Type</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${sessionType}</p>
                            </td>
                          </tr>
                          ${reason ? `
                          <tr>
                            <td style="padding: 16px 0;">
                              <p style="margin: 0 0 6px 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Cancellation Reason</p>
                              <div style="background: rgba(254, 243, 199, 0.5); padding: 12px 16px; border-radius: 8px; margin-top: 8px;">
                                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">${reason}</p>
                              </div>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">This appointment has been removed from your schedule. You can view your updated calendar from your provider dashboard.</p>
                </td>
              </tr>
              
              <!-- Signature -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${getEmailSignature()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return await sendEmail(providerEmail, subject, html);
}

// Premium Support ticket email template
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
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>New Support Ticket - Aarohaa Wellness</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
              <!-- Premium Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0e4826 0%, #16a34a 50%, #0e4826 100%); padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                  <div style="font-size: 56px; margin-bottom: 16px; position: relative; z-index: 1;">📧</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; position: relative; z-index: 1;">New Support Ticket Received</h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400; position: relative; z-index: 1;">Action required</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.3;">Hello Support Team!</h2>
                  <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">A new support ticket has been submitted through the contact form. Please review and respond at your earliest convenience.</p>
                  
                  <!-- Premium Ticket ID Badge -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 0 0 32px;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #0e4826 0%, #16a34a 100%); color: #ffffff; padding: 12px 24px; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(14, 72, 38, 0.25);">
                          Ticket ID: #${ticketId}
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Premium Ticket Details Card -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid rgba(14, 72, 38, 0.1);">
                    <tr>
                      <td>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
                              <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${userName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                              <p style="margin: 0;">
                                <a href="mailto:${userEmail}" style="color: #0e4826; text-decoration: none; font-size: 16px; font-weight: 500;">${userEmail}</a>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Type</p>
                              <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${messageType}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Subject</p>
                              <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${subject}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid rgba(14, 72, 38, 0.15);">
                              <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Submitted</p>
                              <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${formattedDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 16px 0;">
                              <p style="margin: 0 0 12px 0; color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
                              <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid rgba(14, 72, 38, 0.1);">
                                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${message.replace(/\n/g, '<br>')}</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Please review this ticket and respond to the user at your earliest convenience. Thank you for your dedication to providing excellent customer support.</p>
                </td>
              </tr>
              
              <!-- Signature -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  ${getEmailSignature()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
