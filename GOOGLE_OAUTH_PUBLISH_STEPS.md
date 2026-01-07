# Step-by-Step: Publish Google OAuth App

## Exact Steps to Fix "Can't Continue with google.com"

### Step 1: Open Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Make sure you're logged in with the correct Google account
3. **Select your project**: Look at the top bar - click the dropdown that says "Aarohaa wellness" (or your project name)

### Step 2: Navigate to OAuth Consent Screen

**Method 1 (Easiest):**
1. In the top search bar, type: **"OAuth consent screen"**
2. Click on **"OAuth consent screen"** from the results

**Method 2 (Manual):**
1. Click the **hamburger menu** (☰) on the top left
2. Go to **"APIs & Services"** (you might need to expand it)
3. Click **"OAuth consent screen"**

### Step 3: Check Current Status

You should see a page with:
- **Title**: "OAuth consent screen"
- **At the top**: You'll see either:
  - **"Testing"** (with a warning icon) ← This is the problem!
  - **"In production"** ← This is what you want

### Step 4: Publish the App

If you see **"Testing"**:

1. Look for a button that says **"PUBLISH APP"** (usually at the top right or in a banner)
2. Click **"PUBLISH APP"**
3. A warning dialog will appear saying something like:
   - "Your app will be available to any user with a Google Account"
   - "You won't be able to return to Testing mode"
4. Click **"CONFIRM"** or **"PUBLISH"**
5. Wait 2-3 minutes

### Step 5: Verify It's Published

After clicking publish:
- The status should change from **"Testing"** to **"In production"**
- You might see a green checkmark or success message

### Step 6: Test Again

1. **Close your browser completely** (or use Incognito/Private window)
2. Go to: `http://localhost:5173`
3. Click "Sign in with Google"
4. It should work now!

---

## If You Can't Find "PUBLISH APP" Button

### Option A: Add Test Users (Temporary Fix)

1. On the OAuth consent screen page
2. Scroll down to find **"Test users"** section
3. Click **"+ ADD USERS"** button
4. Enter your Gmail address (the one you're trying to sign in with)
5. Click **"ADD"**
6. Wait 1-2 minutes
7. Try signing in again

**Note**: Only the emails you add here can sign in when app is in Testing mode.

### Option B: Check App Verification Status

1. On OAuth consent screen page
2. Look for any warnings or messages
3. If you see "App verification required", you may need to:
   - Complete app verification first
   - Or add test users as a workaround

---

## Quick Checklist

- [ ] Opened Google Cloud Console
- [ ] Selected "Aarohaa wellness" project
- [ ] Navigated to "OAuth consent screen"
- [ ] Found "PUBLISH APP" button
- [ ] Clicked "PUBLISH APP"
- [ ] Confirmed the warning
- [ ] Status changed to "In production"
- [ ] Waited 2-3 minutes
- [ ] Tested in incognito window

---

## Still Can't Find It?

**Tell me what you see:**
1. When you go to OAuth consent screen, what status do you see at the top?
2. Do you see a "PUBLISH APP" button? Where is it located?
3. Are there any warning messages on the page?
4. What does the page look like? (describe what you see)

This will help me guide you more specifically!

