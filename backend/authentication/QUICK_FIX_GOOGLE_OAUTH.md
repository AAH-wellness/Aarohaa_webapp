# Quick Fix: Google Sign-In "Failed to Connect"

## Problem
When clicking "Sign in with Google", you see "Failed to connect" error.

## Common Causes & Solutions

### 1. Missing .env File (Most Common)

**Symptom:** Error says "Google OAuth is not configured"

**Solution:**
1. Create `.env` file in `backend/authentication/` folder
2. Copy from `env.template`:
   ```bash
   # Windows PowerShell
   Copy-Item env.template .env
   ```

3. Add Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   ```

4. **Get credentials from Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Create project → Enable APIs → Create OAuth credentials
   - See `GOOGLE_OAUTH_SETUP.md` for detailed steps

5. **Restart backend server** after creating `.env`

---

### 2. Backend Server Not Running

**Symptom:** "Cannot connect to backend server" or network error

**Solution:**
```bash
cd backend/authentication
npm run dev
```

Check if you see:
```
Authentication service running on port 3001
```

---

### 3. Wrong Backend URL

**Symptom:** Network error or CORS error

**Solution:**
1. Check `frontend/src/services/config.js`:
   ```javascript
   USER_SERVICE: 'http://localhost:3001/api'
   ```

2. Or set environment variable:
   ```env
   VITE_USER_SERVICE_URL=http://localhost:3001
   ```

3. Restart frontend after changing

---

### 4. Google OAuth Not Set Up

**Symptom:** "Google OAuth credentials not configured"

**Solution:**
1. **Set up Google Cloud Project:**
   - Go to: https://console.cloud.google.com/
   - Create new project
   - Enable Google+ API
   - Create OAuth 2.0 Client ID

2. **Configure OAuth Consent Screen:**
   - User Type: External
   - App name: Aarohaa Wellness
   - Add your email

3. **Create OAuth Credentials:**
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
   - Copy Client ID and Client Secret

4. **Add to `.env`:**
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

5. **Restart backend**

---

### 5. CORS Error

**Symptom:** CORS policy error in browser console

**Solution:**
1. Check `backend/authentication/server.js`:
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
     credentials: true
   }))
   ```

2. Make sure `FRONTEND_URL` in `.env` matches your frontend URL

---

## Quick Diagnostic Steps

1. **Check if backend is running:**
   ```bash
   # Open browser
   http://localhost:3001/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check if .env exists:**
   ```bash
   cd backend/authentication
   # Windows
   if (Test-Path .env) { Write-Host "Exists" } else { Write-Host "Missing" }
   ```

3. **Check Google OAuth endpoint:**
   ```bash
   # In browser or Postman
   GET http://localhost:3001/api/auth/google?role=user
   ```
   - If configured: Returns `{"authUrl":"https://accounts.google.com/..."}`
   - If not: Returns error with setup instructions

4. **Check browser console:**
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

---

## Step-by-Step Fix

### Step 1: Create .env File
```bash
cd backend/authentication
Copy-Item env.template .env
```

### Step 2: Set Up Google OAuth (5 minutes)
1. Go to: https://console.cloud.google.com/
2. Create project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Copy credentials

### Step 3: Add to .env
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### Step 4: Restart Backend
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 5: Test
1. Go to frontend
2. Click "Sign in with Google"
3. Should redirect to Google

---

## Still Not Working?

1. **Check backend logs** for error messages
2. **Check browser console** (F12) for errors
3. **Verify Google Cloud Console** settings:
   - Redirect URI matches exactly
   - OAuth consent screen is configured
   - APIs are enabled

4. **Test backend endpoint directly:**
   ```bash
   curl http://localhost:3001/api/auth/google?role=user
   ```

---

## Need Help?

See detailed setup guide: `GOOGLE_OAUTH_SETUP.md`

