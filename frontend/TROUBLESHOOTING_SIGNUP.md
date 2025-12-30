# Sign Up Troubleshooting Guide

## Issue: "When I click Sign Up, I can't see anything"

### Possible Causes & Solutions

#### 1. **Backend Not Running**
**Symptom:** Form submits but nothing happens, no error shown

**Solution:**
```bash
# Start the backend server
cd backend
npm run dev
```

**Check:** Open browser console (F12) and look for:
- `Network error: Cannot connect to backend server`
- `Failed to fetch` errors

#### 2. **Form Validation Errors (Silent)**
**Symptom:** Button click does nothing, no feedback

**Check:**
- Open browser console (F12)
- Look for validation error messages
- Make sure ALL fields are filled:
  - ✅ Full Name
  - ✅ Email
  - ✅ Phone Number (with country code)
  - ✅ Password (min 6 characters)
  - ✅ Confirm Password (must match)
  - ✅ CAPTCHA code

#### 3. **CAPTCHA Not Matching**
**Symptom:** Form doesn't submit, CAPTCHA error appears

**Solution:**
- Enter the CAPTCHA code exactly as shown
- Click on CAPTCHA to refresh if unclear
- Code is case-insensitive

#### 4. **JavaScript Errors**
**Symptom:** Nothing happens, console shows errors

**Check:**
1. Open browser console (F12 → Console tab)
2. Look for red error messages
3. Check if `userService` is imported correctly
4. Check if backend URL is correct

#### 5. **Network/CORS Issues**
**Symptom:** Request fails silently

**Check:**
- Backend is running on `http://localhost:3001`
- Frontend is trying to connect to `http://localhost:3001/api/users/register`
- Check browser Network tab (F12 → Network) for failed requests

### Debugging Steps

1. **Open Browser Console (F12)**
   - Look for any error messages
   - Check for "Starting registration..." log
   - Check for "Registration response:" log

2. **Check Network Tab (F12 → Network)**
   - Look for request to `/api/users/register`
   - Check if request is sent
   - Check response status (200 = success, 400/500 = error)

3. **Verify Backend is Running**
   ```bash
   # In backend directory
   npm run dev
   # Should see: "🚀 Authentication service running on port 3001"
   ```

4. **Test Backend Directly**
   ```bash
   # Test if backend is accessible
   curl http://localhost:3001/health
   # Should return: {"status":"ok","service":"authentication-service",...}
   ```

5. **Check Form Fields**
   - All required fields must be filled
   - Phone number must be 7-15 digits
   - Password must be at least 6 characters
   - Passwords must match
   - CAPTCHA must be entered correctly

### What Should Happen When You Click Sign Up

1. ✅ Button shows "⏳ Registering..." (loading state)
2. ✅ "Please wait, creating your account..." message appears
3. ✅ Request sent to backend
4. ✅ On success: User logged in automatically
5. ✅ On error: Red error message appears + alert popup

### Quick Fix Checklist

- [ ] Backend server is running (`cd backend && npm run dev`)
- [ ] Frontend server is running (`cd frontend && npm run dev`)
- [ ] All form fields are filled correctly
- [ ] CAPTCHA code is entered correctly
- [ ] Browser console shows no errors
- [ ] Network tab shows the registration request
- [ ] Check `.env` file has `VITE_USE_MOCK_SERVICES=false`

### Still Not Working?

1. **Clear browser cache and reload**
2. **Check browser console for specific errors**
3. **Try in a different browser**
4. **Restart both frontend and backend servers**

