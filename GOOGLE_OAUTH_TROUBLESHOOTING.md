# Google OAuth "Can't Continue" Error - Fix Guide

## Problem
When clicking "Sign in with Google", you see the email selection popup, but after selecting an email, you get: **"Can't continue with google.com - Something went wrong"**

## Root Cause
This happens when your OAuth app is in **Testing** mode and the user's email is not added as a test user.

## Solution

### Step 1: Go to OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **Aarohaa wellness**
3. Navigate to: **APIs & Services** → **OAuth consent screen**

### Step 2: Check Publishing Status

Look at the top of the page. You'll see:
- **Testing** (with a warning) - This is the issue!
- **In production** - This is what you want (but requires verification)

### Step 3: Add Test Users (Quick Fix for Testing)

If your app is in **Testing** mode:

1. Scroll down to **Test users** section
2. Click **+ ADD USERS**
3. Add your email address (the one you're trying to sign in with)
4. Click **ADD**
5. **Wait 1-2 minutes** for changes to propagate
6. Try signing in again

### Step 4: Verify Authorized Origins (Also Important)

While you're in Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth client: **Aarohaa Wellness Web Client**
3. Check **Authorized JavaScript origins**:
   - Must include: `http://localhost:5173`
   - No trailing slash
   - Exact match required
4. Check **Authorized redirect URIs**:
   - Should include: `http://localhost:5173`
5. Click **SAVE**

### Step 5: Clear Browser Cache

After making changes:
- Clear browser cache or use **Incognito/Private window**
- Try signing in again

## Alternative: Publish Your App (For Production)

If you want anyone to be able to sign in (not just test users):

1. Go to **OAuth consent screen**
2. Click **PUBLISH APP** button
3. Confirm the warning
4. **Note:** This requires app verification if you request sensitive scopes

## Quick Checklist

- [ ] OAuth consent screen configured
- [ ] Your email added as test user (if in Testing mode)
- [ ] Authorized JavaScript origins includes `http://localhost:5173`
- [ ] Authorized redirect URIs includes `http://localhost:5173`
- [ ] Client ID matches in frontend `.env` file
- [ ] Waited 1-2 minutes after making changes
- [ ] Cleared browser cache or using incognito mode

## Still Not Working?

1. **Check browser console** (F12) for specific error messages
2. **Check Network tab** to see if requests are being blocked
3. **Verify Client ID** in frontend `.env` matches Google Cloud Console
4. **Try a different browser** to rule out browser-specific issues
