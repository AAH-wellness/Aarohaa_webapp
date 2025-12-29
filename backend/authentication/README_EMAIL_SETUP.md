# Email Configuration Guide

This guide explains how to set up email functionality for the authentication service.

## Supported Email Services

1. **SMTP (Generic)** - Works with most email providers
2. **Gmail (App Password)** - Simple Gmail setup
3. **Gmail OAuth2** - More secure Gmail setup
4. **SendGrid** - Professional email service
5. **AWS SES** - Amazon Simple Email Service

## Quick Setup Options

### Option 1: Gmail with App Password (Easiest)

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Aarohaa Backend"
   - Copy the 16-character password

4. Add to `.env`:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

### Option 2: Generic SMTP (Works with any email provider)

Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

**Common SMTP Settings:**
- **Gmail**: smtp.gmail.com, Port 587
- **Outlook**: smtp-mail.outlook.com, Port 587
- **Yahoo**: smtp.mail.yahoo.com, Port 587
- **Custom**: Check your email provider's SMTP settings

### Option 3: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Add to `.env`:
```env
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

### Option 4: AWS SES

1. Set up AWS SES in your AWS account
2. Verify your email/domain
3. Create IAM credentials
4. Add to `.env`:
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

## Testing Email Configuration

After setting up your `.env` file:

1. Restart the backend server
2. Try the forgot password flow
3. Check your email inbox (and spam folder)
4. Check backend console for any errors

## Troubleshooting

### Email not sending?

1. **Check .env file**: Make sure all required variables are set
2. **Check console logs**: Look for error messages in the backend console
3. **Test SMTP connection**: Use a tool like `telnet` or online SMTP testers
4. **Check spam folder**: Emails might be filtered
5. **Verify credentials**: Double-check usernames, passwords, and API keys

### Gmail-specific issues:

- **"Less secure app" error**: Use App Password instead of regular password
- **OAuth2 setup**: More complex but more secure for production

### Security Best Practices:

1. **Never commit .env file** to version control
2. **Use App Passwords** instead of regular passwords
3. **Use OAuth2** for production Gmail setup
4. **Use dedicated email service** (SendGrid, AWS SES) for production
5. **Rotate credentials** regularly

## Production Recommendations

For production, we recommend:
- **SendGrid** or **AWS SES** for reliability and deliverability
- **Dedicated domain email** (e.g., noreply@yourdomain.com)
- **SPF, DKIM, and DMARC** records configured
- **Email monitoring** and bounce handling
- **Rate limiting** to prevent abuse

