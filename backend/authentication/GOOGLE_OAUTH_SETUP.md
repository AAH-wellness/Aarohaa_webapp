# Google OAuth Setup Guide

Complete guide to set up Google Sign-In for your application.

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project:**
   - Click "Select a project" → "New Project"
   - Project name: "Aarohaa Wellness"
   - Click "Create"

## Step 2: Enable Google+ API

1. **Navigate to APIs & Services:**
   - In the left sidebar, go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on it and click "Enable"

2. **Also Enable:**
   - "Google Identity Services API" (if available)
   - "People API" (for user profile access)

## Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials:**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"

2. **Configure OAuth Consent Screen (First Time):**
   - If prompted, configure the consent screen:
     - User Type: **External** (for public users)
     - App name: "Aarohaa Wellness"
     - User support email: Your email
     - Developer contact: Your email
     - Click "Save and Continue"
     - Scopes: Click "Save and Continue" (default scopes are fine)
     - Test users: Add your email for testing (optional)
     - Click "Save and Continue" → "Back to Dashboard"

3. **Create OAuth Client ID:**
   - Application type: **Web application**
   - Name: "Aarohaa Backend"
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (for development)
     - `http://localhost:3001` (backend)
     - Your production domain (when deployed)
   - **Authorized redirect URIs:**
     - `http://localhost:3001/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
   - Click "Create"

4. **Copy Credentials:**
   - You'll see a popup with:
     - **Client ID** (copy this)
     - **Client Secret** (copy this - you won't see it again!)
   - Save these securely

## Step 4: Configure Backend

1. **Add to `.env` file:**
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

2. **Replace:**
   - `your-client-id.apps.googleusercontent.com` with your actual Client ID
   - `your-client-secret` with your actual Client Secret

## Step 5: Test the Integration

1. **Start Backend:**
   ```bash
   cd backend/authentication
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Google Sign-In:**
   - Go to login page
   - Click "Sign in with Google"
   - You'll be redirected to Google
   - Sign in with your Google account
   - Grant permissions
   - You'll be redirected back and logged in

## Production Setup

### For Production Deployment:

1. **Update OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Add your production domain
   - Submit for verification (if needed for public use)

2. **Update Redirect URIs:**
   - Add production redirect URI:
     - `https://yourdomain.com/api/auth/google/callback`

3. **Update `.env`:**
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use environment variables** in production
3. **Rotate credentials** if compromised
4. **Limit redirect URIs** to your domains only
5. **Use HTTPS** in production
6. **Monitor OAuth usage** in Google Cloud Console

## Troubleshooting

### "Redirect URI mismatch"
- ✅ Check redirect URI in Google Console matches exactly
- ✅ Check `.env` file has correct `GOOGLE_REDIRECT_URI`
- ✅ No trailing slashes
- ✅ Use `http://` for localhost, `https://` for production

### "Invalid client"
- ✅ Check Client ID is correct
- ✅ Check Client Secret is correct
- ✅ Make sure OAuth consent screen is configured

### "Access blocked"
- ✅ Check OAuth consent screen is published
- ✅ Add test users if app is in testing mode
- ✅ Submit for verification if needed

### "Email not verified"
- ✅ User must have verified Google email
- ✅ Check email verification status in Google account

## API Endpoints

- **Initiate OAuth:** `GET /api/auth/google?role=user`
- **Callback:** `GET /api/auth/google/callback?code=...&state=...`
- **Verify Token:** `POST /api/auth/google/verify`

## Next Steps

1. ✅ Set up Google Cloud project
2. ✅ Create OAuth credentials
3. ✅ Configure `.env` file
4. ✅ Test the integration
5. ✅ Deploy to production

---

**Need Help?**
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- Google Cloud Console: https://console.cloud.google.com/

