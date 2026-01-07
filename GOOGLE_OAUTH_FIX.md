# Fix "Can't Continue with google.com" Error

## Quick Fix Steps

### Step 1: Publish Your OAuth App (REQUIRED)

The error "Can't continue with google.com" happens because your OAuth app is in **Testing** mode.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **Aarohaa wellness**
3. Navigate to: **APIs & Services** → **OAuth consent screen**
4. Look at the top - you'll see **"Testing"** status
5. Click **"PUBLISH APP"** button
6. Confirm the warning dialog
7. **Wait 2-3 minutes** for changes to propagate

### Step 2: Verify Authorized Origins

1. Go to **APIs & Services** → **Credentials**
2. Click your OAuth client: **Aarohaa Wellness Web Client**
3. Check **Authorized JavaScript origins**:
   - Must include: `http://localhost:5173`
   - **NO trailing slash**
   - **Exact match** required
4. Check **Authorized redirect URIs**:
   - Should include: `http://localhost:5173`
5. Click **SAVE**

### Step 3: Clear Browser Cache

- **Chrome/Edge**: Press `Ctrl+Shift+Delete` → Clear cached images and files
- **Or use Incognito/Private window**: `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)

### Step 4: Test Again

1. Open your app in **Incognito/Private window**
2. Go to login page
3. Click "Sign in with Google"
4. It should work now!

## Alternative: Add Test Users (If You Can't Publish)

If you can't publish the app yet (e.g., verification pending), you can add test users:

1. Go to **OAuth consent screen**
2. Scroll to **Test users** section
3. Click **+ ADD USERS**
4. Add the Gmail addresses you want to test with
5. Click **ADD**
6. Wait 1-2 minutes
7. Try signing in again

**Note**: Only added test users can sign in when app is in Testing mode.

## Common Issues

### Issue 1: Still Getting Error After Publishing
- **Solution**: Wait 3-5 minutes for Google's servers to update
- Clear browser cache completely
- Try incognito mode

### Issue 2: "Invalid Client" Error
- **Solution**: Check that Client ID in `.env` matches Google Cloud Console exactly
- No extra spaces or characters
- Restart frontend server after changing `.env`

### Issue 3: Popup Blocked
- **Solution**: Allow popups for `localhost:5173`
- Check browser settings → Site permissions → Pop-ups

### Issue 4: Origin Mismatch
- **Solution**: Verify authorized origins match exactly:
  - Current URL: `http://localhost:5173`
  - In Console: `http://localhost:5173` (no trailing slash)

## Verification Checklist

- [ ] OAuth app is **Published** (not Testing)
- [ ] Authorized JavaScript origins includes `http://localhost:5173`
- [ ] Authorized redirect URIs includes `http://localhost:5173`
- [ ] Client ID in `.env` matches Google Cloud Console
- [ ] Frontend server restarted after `.env` changes
- [ ] Browser cache cleared or using incognito mode
- [ ] Waited 2-3 minutes after publishing

## Still Not Working?

1. **Check browser console** (F12) for specific errors
2. **Check Network tab** to see if requests are being made
3. **Verify Client ID** is correct in both places
4. **Try different browser** to rule out browser issues
5. **Check Google Cloud Console** for any error messages

## Debug Information

To get more details about the error:

1. Open browser console (F12)
2. Look for errors when clicking "Sign in with Google"
3. Check Network tab for failed requests
4. Share the error messages for further help

