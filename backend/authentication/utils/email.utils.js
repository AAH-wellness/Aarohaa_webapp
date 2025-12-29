// Email utility functions using Nodemailer
// Enterprise email support: SendGrid, AWS SES, Mailgun, and custom SMTP
// For production/enterprise use, configure SendGrid, AWS SES, or Mailgun
// See ENTERPRISE_EMAIL_SETUP.md for setup instructions

import nodemailer from 'nodemailer'

/**
 * Create email transporter based on environment configuration
 */
const createTransporter = () => {
  // Priority 1: SendGrid (Enterprise - Recommended for Production)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    })
  }

  // Priority 2: AWS SES (Enterprise - High Volume)
  // Note: For AWS SES, you need to install: npm install aws-sdk
  // Or use SMTP interface (simpler, recommended)
  if (process.env.AWS_SES_REGION && process.env.AWS_SES_SMTP_USER && process.env.AWS_SES_SMTP_PASSWORD) {
    // Using AWS SES SMTP interface (simpler, no SDK needed)
    return nodemailer.createTransport({
      host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_SES_SMTP_USER,
        pass: process.env.AWS_SES_SMTP_PASSWORD
      }
    })
  }

  // Priority 3: Mailgun (Enterprise Alternative)
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return nodemailer.createTransport({
      host: `smtp.mailgun.org`,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USER || `postmaster@${process.env.MAILGUN_DOMAIN}`,
        pass: process.env.MAILGUN_API_KEY
      }
    })
  }

  // Priority 4: Generic SMTP (For custom enterprise email servers)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
  }

  // Priority 5: Gmail OAuth2 (For development/testing only)
  if (process.env.GMAIL_CLIENT_ID) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
      }
    })
  }

  // Priority 6: Gmail App Password (Development/Testing only - NOT for production)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️  WARNING: Using Gmail App Password. This is NOT suitable for production/enterprise use.')
    console.warn('⚠️  Please use SendGrid, AWS SES, or Mailgun for enterprise email delivery.')
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })
  }

  // If no email configuration, return null (will log to console)
  return null
}

/**
 * Generate a random 6-digit code
 */
export const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generate HTML email template for password reset code
 */
const generateResetCodeEmailTemplate = (code) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Aarohaa Wellness</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        <p>You have requested to reset your password. Use the code below to verify your identity:</p>
        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Your reset code is:</p>
          <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</p>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #d32f2f; font-size: 14px; margin-top: 20px;">If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML email template for password change confirmation
 */
const generatePasswordChangeConfirmationTemplate = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Aarohaa Wellness</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Password Changed Successfully</h2>
        <p>Your password has been successfully changed.</p>
        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32;">✓ Your account password has been updated.</p>
        </div>
        <p style="color: #d32f2f; font-size: 14px; margin-top: 20px;">
          <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately to secure your account.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Send password reset code email
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit reset code
 */
export const sendResetCodeEmail = async (email, code) => {
  const transporter = createTransporter()
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@aarohaa.com'
  const fromName = process.env.EMAIL_FROM_NAME || 'Aarohaa Wellness'

  // If no email transporter configured, log to console (development fallback)
  if (!transporter) {
    console.log('\n' + '='.repeat(70))
    console.log('⚠️  EMAIL SERVICE NOT CONFIGURED')
    console.log('='.repeat(70))
    console.log('📧 PASSWORD RESET CODE EMAIL (Console Log - Email not sent)')
    console.log('='.repeat(70))
    console.log(`To: ${email}`)
    console.log(`Subject: Password Reset Code`)
    console.log(`\n🔑 YOUR PASSWORD RESET CODE IS: ${code}`)
    console.log(`⏰ This code will expire in 10 minutes.`)
    console.log(`\nIf you did not request this, please ignore this email.`)
    console.log('='.repeat(70))
    console.log('\n📝 TO FIX: Create a .env file in backend/authentication/ with email credentials.')
    console.log('   See env.template file for configuration options.')
    console.log('   Quick setup: Use Gmail App Password (see README_EMAIL_SETUP.md)')
    console.log('='.repeat(70) + '\n')
    return { success: false, message: 'Email service not configured' }
  }

  try {
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset Code - Aarohaa Wellness',
      html: generateResetCodeEmailTemplate(code),
      text: `Your password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Password reset code email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

/**
 * Send password change confirmation email
 * @param {string} email - Recipient email
 */
export const sendPasswordChangeConfirmation = async (email) => {
  const transporter = createTransporter()
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@aarohaa.com'
  const fromName = process.env.EMAIL_FROM_NAME || 'Aarohaa Wellness'

  // If no email transporter configured, log to console (development fallback)
  if (!transporter) {
    console.log('='.repeat(50))
    console.log('📧 PASSWORD CHANGE CONFIRMATION EMAIL (Console - Email not configured)')
    console.log('='.repeat(50))
    console.log(`To: ${email}`)
    console.log(`Subject: Password Changed Successfully`)
    console.log(`\nYour password has been successfully changed.`)
    console.log(`If you did not make this change, please contact support immediately.`)
    console.log('='.repeat(50))
    console.log('\n⚠️  WARNING: Email service not configured. Please set up email credentials in .env file.')
    console.log('='.repeat(50))
    return { success: false, message: 'Email service not configured' }
  }

  try {
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Password Changed Successfully - Aarohaa Wellness',
      html: generatePasswordChangeConfirmationTemplate(),
      text: `Your password has been successfully changed.\n\nIf you did not make this change, please contact our support team immediately to secure your account.`
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Password change confirmation email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending password change confirmation email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
