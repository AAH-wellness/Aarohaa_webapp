# Enterprise Email Setup Guide

This guide explains how to set up enterprise-grade email delivery for your application that works globally for all users.

## Why Enterprise Email Service?

**Personal Gmail/SMTP Limitations:**
- ❌ Daily sending limits (500 emails/day for Gmail)
- ❌ Poor deliverability (emails go to spam)
- ❌ Not scalable for production
- ❌ Can get blocked by email providers
- ❌ No analytics or tracking

**Enterprise Email Services Benefits:**
- ✅ High deliverability rates (95%+)
- ✅ No daily limits (or very high limits)
- ✅ Global reach (works for all email providers)
- ✅ Analytics and tracking
- ✅ Bounce and spam handling
- ✅ Professional reputation
- ✅ Scalable for millions of emails

## Recommended Solutions

### Option 1: SendGrid (Easiest & Most Popular) ⭐ RECOMMENDED

**Why SendGrid?**
- Free tier: 100 emails/day forever
- Easy setup (5 minutes)
- Excellent deliverability
- Great documentation
- Used by major companies

**Setup Steps:**

1. **Sign up for SendGrid:**
   - Go to: https://signup.sendgrid.com/
   - Create a free account
   - Verify your email address

2. **Create API Key:**
   - Login to SendGrid dashboard
   - Go to: Settings → API Keys
   - Click "Create API Key"
   - Name: "Aarohaa Backend"
   - Permissions: "Full Access" (or "Mail Send" only)
   - Click "Create & View"
   - **IMPORTANT:** Copy the API key immediately (you won't see it again!)

3. **Verify Sender Identity (Required):**
   - Go to: Settings → Sender Authentication
   - Choose "Single Sender Verification"
   - Enter your email address (e.g., noreply@yourdomain.com)
   - Verify the email by clicking the link sent to you
   - **OR** verify your domain (better for production)

4. **Add to `.env` file:**
   ```env
   SENDGRID_API_KEY=SG.your-api-key-here
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Aarohaa Wellness
   ```

5. **Restart your server:**
   ```bash
   npm run dev
   ```

6. **Test it:**
   ```bash
   # Test endpoint
   POST http://localhost:3001/api/test-email
   Body: {"email": "test@example.com"}
   ```

**SendGrid Pricing:**
- Free: 100 emails/day
- Essentials: $19.95/month - 50,000 emails
- Pro: $89.95/month - 100,000 emails
- Higher tiers available

---

### Option 2: AWS SES (Most Cost-Effective for Scale)

**Why AWS SES?**
- Very cheap ($0.10 per 1,000 emails)
- Highly scalable
- Part of AWS ecosystem
- Great for high volume

**Setup Steps:**

1. **Create AWS Account:**
   - Go to: https://aws.amazon.com/
   - Create account (requires credit card, but free tier available)

2. **Go to AWS SES:**
   - Search "SES" in AWS Console
   - Select your region (e.g., us-east-1)

3. **Verify Email Address:**
   - Go to: Verified identities → Create identity
   - Choose "Email address"
   - Enter your email
   - Click verification link in email

4. **Move Out of Sandbox (Important!):**
   - By default, SES is in "sandbox mode" (can only send to verified emails)
   - Go to: Account dashboard → Request production access
   - Fill out the form (explain your use case)
   - Usually approved within 24 hours

5. **Create SMTP Credentials:**
   - Go to: SMTP settings → Create SMTP credentials
   - IAM User Name: "aarohaa-email-sender"
   - Click "Create"
   - **IMPORTANT:** Download the credentials (you'll see username and password)
   - Save these credentials securely

6. **Add to `.env` file:**
   ```env
   AWS_SES_REGION=us-east-1
   AWS_SES_SMTP_USER=your-smtp-username
   AWS_SES_SMTP_PASSWORD=your-smtp-password
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Aarohaa Wellness
   ```

**AWS SES Pricing:**
- $0.10 per 1,000 emails
- First 62,000 emails/month free (if using EC2)
- Very cost-effective for high volume

---

### Option 3: Mailgun (Developer-Friendly)

**Why Mailgun?**
- Free tier: 5,000 emails/month for 3 months
- Great API and documentation
- Good for developers

**Setup Steps:**

1. **Sign up:**
   - Go to: https://www.mailgun.com/
   - Create account
   - Verify email

2. **Add Domain:**
   - Go to: Sending → Domains
   - Add your domain
   - Add DNS records (MX, TXT, CNAME)
   - Wait for verification

3. **Get API Key:**
   - Go to: Sending → API Keys
   - Copy "Private API key"

4. **Add to `.env` file:**
   ```env
   MAILGUN_API_KEY=your-api-key
   MAILGUN_DOMAIN=yourdomain.com
   MAILGUN_SMTP_USER=postmaster@yourdomain.com
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Aarohaa Wellness
   ```

---

## Quick Comparison

| Service | Free Tier | Best For | Setup Time |
|---------|-----------|----------|------------|
| **SendGrid** | 100/day | Most users | 5 min ⭐ |
| **AWS SES** | 62k/month* | High volume | 30 min |
| **Mailgun** | 5k/month | Developers | 15 min |

*If using EC2

## Recommended Flow for Your Application

### For Development/Testing:
- Use **SendGrid Free Tier** (100 emails/day is enough for testing)

### For Production:
1. **Start with SendGrid** (easy setup, good deliverability)
2. **Scale to AWS SES** if you need >50k emails/month (cost-effective)
3. **Use dedicated domain** for better deliverability

## Complete Setup Example (SendGrid)

```env
# Server
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Enterprise Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Aarohaa Wellness

# Environment
NODE_ENV=production
```

## Testing Your Setup

1. **Test endpoint:**
   ```bash
   POST http://localhost:3001/api/test-email
   Content-Type: application/json
   
   {
     "email": "your-test-email@gmail.com"
   }
   ```

2. **Check email inbox** (and spam folder)

3. **Check SendGrid dashboard** for delivery status

## Troubleshooting

### Emails not sending?
- ✅ Check API key is correct
- ✅ Verify sender email is verified
- ✅ Check SendGrid dashboard for errors
- ✅ Check server logs for error messages

### Emails going to spam?
- ✅ Verify your domain (not just email)
- ✅ Set up SPF, DKIM, DMARC records
- ✅ Use a professional "from" address
- ✅ Avoid spam trigger words in subject

### Rate limits?
- ✅ Check your plan limits
- ✅ Upgrade plan if needed
- ✅ Implement email queue for high volume

## Next Steps

1. **Choose a service** (SendGrid recommended for start)
2. **Set up account** and get API key
3. **Add credentials to `.env`**
4. **Test with test endpoint**
5. **Verify emails are delivered**
6. **Deploy to production**

---

**Need Help?**
- SendGrid Docs: https://docs.sendgrid.com/
- AWS SES Docs: https://docs.aws.amazon.com/ses/
- Mailgun Docs: https://documentation.mailgun.com/

