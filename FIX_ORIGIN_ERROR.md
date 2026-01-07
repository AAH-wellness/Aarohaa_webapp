# Fix "unregistered_origin" Error

## The Problem
Error: **"The given origin is not allowed for the given client ID"**
Reason: **"unregistered_origin"**

This means `http://localhost:5173` is NOT in your Google Cloud Console authorized origins.

## Solution: Add Authorized JavaScript Origin

### Step 1: Go to Credentials Page

**Direct Link:**
https://console.cloud.google.com/apis/credentials

Or:
1. Go to https://console.cloud.google.com/
2. Select project: **Aarohaa wellness**
3. Click **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth Client

1. Find your OAuth client: **"Aarohaa Wellness Web Client"**
2. Click on it (or click the **pencil/edit icon**)

### Step 3: Add Authorized JavaScript Origin

1. Scroll down to **"Authorized JavaScript origins"** section
2. Click **"+ ADD URI"** button
3. Enter exactly: `http://localhost:5173`
   - **Important**: 
     - Use `http://` (NOT `https://`)
     - Use `localhost` (NOT `127.0.0.1`)
     - No trailing slash
     - Exact match required
4. Click outside the input (or press Enter)

### Step 4: Add Authorized Redirect URI (if needed)

1. Scroll to **"Authorized redirect URIs"** section
2. Click **"+ ADD URI"** button
3. Enter exactly: `http://localhost:5173`
4. Click outside the input

### Step 5: Save

1. Scroll to the bottom
2. Click **"SAVE"** button
3. Wait 1-2 minutes for changes to propagate

### Step 6: Test

1. **Hard refresh** your browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Or use **Incognito/Private window**
3. Go to: `http://localhost:5173`
4. Click "Sign in with Google"
5. It should work now!

## Visual Guide

**What you should see in Authorized JavaScript origins:**
```
http://localhost:5173    [X]
```

**What you should NOT have:**
- ❌ `https://localhost:5173` (wrong protocol)
- ❌ `http://localhost:5173/` (trailing slash)
- ❌ `http://127.0.0.1:5173` (wrong hostname)
- ❌ `localhost:5173` (missing protocol)

## Still Not Working?

1. **Double-check the URL** in your browser address bar
   - Should be exactly: `http://localhost:5173`
   - If it's different (like `http://127.0.0.1:5173`), add that too

2. **Check for typos** in Google Cloud Console
   - Copy-paste from your browser address bar to avoid typos

3. **Wait longer** - Sometimes takes 3-5 minutes to propagate

4. **Clear browser cache** completely

5. **Try different browser** to rule out cache issues

