# How to Enable SMTP Authentication in GoDaddy

## Method 1: Through GoDaddy Email Settings (Recommended)

### Step 1: Log into GoDaddy Account

1. Go to **https://www.godaddy.com**
2. Click **Sign In** (top right)
3. Enter your GoDaddy account credentials

### Step 2: Access Email Settings

1. Once logged in, click on **My Products** (top menu)
2. Scroll down to **Email** section
3. Find your email account: **support1@aarohaa.io**
4. Click on **Manage** or the email address

### Step 3: Enable SMTP Authentication

1. Look for **Email Settings** or **Advanced Settings**
2. Find **SMTP Authentication** or **Authenticated SMTP** option
3. **Enable** or **Turn On** SMTP Authentication
4. **Save** the changes

**Note:** Settings may take 5-15 minutes to propagate.

---

## Method 2: Through Microsoft 365 Admin Center

If your GoDaddy email uses Microsoft 365:

### Step 1: Access Microsoft 365 Admin Center

1. Go to **https://admin.microsoft.com**
2. Sign in with your GoDaddy email: **support1@aarohaa.io**
3. Use your GoDaddy email password

### Step 2: Navigate to Mail Settings

1. Click on **Settings** (left sidebar)
2. Click on **Mail** or **Email**
3. Look for **POP and IMAP** settings

### Step 3: Enable Authenticated SMTP

1. Find **"Authenticated SMTP"** option
2. **Enable** or **Turn On** Authenticated SMTP
3. **Save** changes

**Note:** Changes may take 5-15 minutes to take effect.

---

## Method 3: Contact GoDaddy Support (If Above Don't Work)

If you can't find the settings or they're not available:

### Contact GoDaddy Support

1. **Phone:** 1-480-505-8877
2. **Chat:** https://www.godaddy.com/help
3. **Email:** support@godaddy.com

### What to Ask Support:

> "I need to enable SMTP authentication for my email account support1@aarohaa.io. I'm trying to send automated emails from my application but getting '535 authentication rejected' errors. Can you please enable SMTP AUTH for this account?"

### Information to Provide:

- Email address: `support1@aarohaa.io`
- Domain: `aarohaa.io`
- Purpose: Sending automated emails from web application
- Error: "535 authentication rejected"

---

## Method 4: Use GoDaddy SMTP Relay (Alternative)

If SMTP AUTH cannot be enabled, use GoDaddy's SMTP relay instead:

### Update Your .env File:

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=support1@aarohaa.io
EMAIL_PASSWORD=Summer@2024$
```

**Note:** GoDaddy SMTP relay (`smtpout.secureserver.net`) doesn't require SMTP AUTH to be enabled in Microsoft 365. It uses GoDaddy's own authentication system.

---

## After Enabling SMTP AUTH

### Step 1: Wait 5-15 Minutes

SMTP settings changes can take a few minutes to propagate.

### Step 2: Test the Connection

Run the test script:

```powershell
cd backend/authentication
node test-email.js
```

You should see:
```
✅ Connection Successful!
```

### Step 3: Restart Your Server

After confirming the test works:

1. Stop your backend server (Ctrl+C)
2. Restart it:
   ```powershell
   npm run dev
   ```

### Step 4: Verify in Console

You should see:
```
✅ Email service connection verified successfully
```

---

## Troubleshooting

### Still Getting "535 Authentication Rejected"?

1. **Wait longer** - Some changes take up to 30 minutes
2. **Verify password** - Test at https://email.godaddy.com
3. **Check account status** - Make sure account isn't locked
4. **Try GoDaddy SMTP relay** - Use `smtpout.secureserver.net` instead

### Can't Find SMTP Settings?

- Some GoDaddy email plans don't have SMTP AUTH option in the dashboard
- Contact GoDaddy support to enable it
- Or use GoDaddy SMTP relay (Method 4)

### Account Locked?

If there were many failed authentication attempts:
- Wait 15-30 minutes
- Contact GoDaddy support to unlock
- Verify password is correct

---

## Quick Reference

**GoDaddy Support:**
- Phone: 1-480-505-8877
- Chat: https://www.godaddy.com/help
- Available 24/7

**Test Email Connection:**
```powershell
cd backend/authentication
node test-email.js
```

**Recommended SMTP Settings (GoDaddy Relay):**
```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
```

---

## Summary

1. **Try Method 1** (GoDaddy Email Settings) first
2. **Try Method 2** (Microsoft 365 Admin) if using Microsoft email
3. **Contact Support** (Method 3) if settings aren't available
4. **Use GoDaddy SMTP Relay** (Method 4) as an alternative

The easiest solution is usually to **contact GoDaddy support** and ask them to enable SMTP AUTH for your email account. They can do it quickly and verify it's working.
