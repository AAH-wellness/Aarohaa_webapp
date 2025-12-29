# Quick Start: SendGrid Setup (5 Minutes)

This is the **fastest way** to get enterprise email working for your application.

## Why SendGrid?

✅ **Free tier:** 100 emails/day forever  
✅ **Easy setup:** 5 minutes  
✅ **Works globally:** All email providers (Gmail, Outlook, Yahoo, etc.)  
✅ **High deliverability:** 95%+ emails reach inbox  
✅ **No coding:** Just API key  

## Step-by-Step Setup

### Step 1: Create SendGrid Account (2 minutes)

1. Go to: **https://signup.sendgrid.com/**
2. Fill in your details:
   - Email address
   - Password
   - Company name (optional)
3. Click "Get Started for Free"
4. Verify your email address (check inbox)

### Step 2: Verify Sender Email (1 minute)

1. Login to SendGrid dashboard
2. Go to: **Settings** → **Sender Authentication**
3. Click **"Verify a Single Sender"**
4. Fill in the form:
   - **From Email:** noreply@yourdomain.com (or your email)
   - **From Name:** Aarohaa Wellness
   - **Reply To:** (same as from email)
   - **Company Address:** Your address
   - **Website:** Your website
5. Click **"Create"**
6. **Check your email** and click the verification link

### Step 3: Create API Key (1 minute)

1. In SendGrid dashboard, go to: **Settings** → **API Keys**
2. Click **"Create API Key"** (top right)
3. Fill in:
   - **API Key Name:** Aarohaa Backend
   - **API Key Permissions:** 
     - Choose **"Full Access"** (for simplicity)
     - OR **"Restricted Access"** → Select only **"Mail Send"**
4. Click **"Create & View"**
5. **⚠️ IMPORTANT:** Copy the API key immediately!
   - It starts with `SG.`
   - You won't be able to see it again
   - Save it somewhere safe

### Step 4: Configure Your Backend (1 minute)

1. **Create `.env` file** in `backend/authentication/` folder:
   ```env
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # SendGrid Configuration
   SENDGRID_API_KEY=SG.your-api-key-here
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Aarohaa Wellness
   
   NODE_ENV=production
   ```

2. **Replace:**
   - `SG.your-api-key-here` with your actual SendGrid API key
   - `noreply@yourdomain.com` with your verified email

### Step 5: Restart Server

```bash
cd backend/authentication
npm run dev
```

### Step 6: Test It!

**Option A: Using Test Endpoint**
```bash
POST http://localhost:3001/api/test-email
Content-Type: application/json

{
  "email": "your-test-email@gmail.com"
}
```

**Option B: Try Forgot Password**
1. Go to your frontend
2. Click "Forgot Password"
3. Enter any email address
4. Check inbox (and spam folder)

## ✅ You're Done!

Your application can now send emails to **any email address worldwide**:
- Gmail ✅
- Outlook ✅
- Yahoo ✅
- Any email provider ✅

## Troubleshooting

### "Email service not configured"
- ✅ Check `.env` file exists
- ✅ Check `SENDGRID_API_KEY` is set correctly
- ✅ Restart server after creating `.env`

### "Invalid API key"
- ✅ Make sure API key starts with `SG.`
- ✅ No spaces or extra characters
- ✅ Copy the full key

### "Sender not verified"
- ✅ Check Settings → Sender Authentication
- ✅ Make sure you clicked verification link in email
- ✅ Use the verified email in `EMAIL_FROM`

### Emails not arriving
- ✅ Check spam/junk folder
- ✅ Check SendGrid dashboard → Activity (see delivery status)
- ✅ Wait a few minutes (sometimes delayed)

## Next Steps

- **Monitor:** Check SendGrid dashboard for delivery stats
- **Upgrade:** If you need >100 emails/day, upgrade plan
- **Domain:** For better deliverability, verify your domain (not just email)

## Need Help?

- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/

---

**That's it! Your enterprise email is ready. 🎉**

