# Enable Backend Registration - Quick Fix

## Problem
Registration was only saving to localStorage, not the database.

## Solution Applied
✅ Updated `Register.jsx` to call backend API
✅ Updated `userService.js` to handle backend responses
✅ Updated `config.js` to prefer backend when available

## What You Need to Do

### Option 1: Create .env file (Recommended)

Create `frontend/.env` file with:
```env
VITE_USE_MOCK_SERVICES=false
VITE_USER_SERVICE_URL=http://localhost:3001/api
```

### Option 2: Set Environment Variable

Before starting frontend:
```bash
# Windows PowerShell
$env:VITE_USE_MOCK_SERVICES="false"
npm run dev

# Or in Command Prompt
set VITE_USE_MOCK_SERVICES=false
npm run dev
```

### Option 3: The config now defaults to backend if available

The config has been updated to automatically use backend if `VITE_USER_SERVICE_URL` is set.

## Steps to Test

1. **Make sure backend is running:**
   ```bash
   cd backend/authentication
   npm run dev
   ```
   Should see: `✅ Database connection test successful`

2. **Restart frontend** (to load new config):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Register a new user:**
   - Fill in all fields
   - Phone must include country code (e.g., +1234567890)
   - Submit form

4. **Check browser console:**
   - Should see API call to: `POST http://localhost:3001/api/users/register`
   - No errors

5. **Verify in database:**
   ```sql
   psql -U postgres -d aarohaa_wellness
   SELECT * FROM users ORDER BY created_at DESC;
   ```

## Troubleshooting

### Still not saving to database?

1. **Check backend is running:**
   - Terminal should show: `Authentication service running on port 3001`
   - Check: `http://localhost:3001/health`

2. **Check browser console:**
   - Look for errors in Network tab
   - Check if request goes to `localhost:3001`

3. **Check database connection:**
   - Backend logs should show: `✅ Database connection test successful`
   - If not, check `.env` in `backend/authentication/`

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Expected Result

After registration, you should see your user in the database:
```sql
SELECT id, email, name, phone, date_of_birth, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 1;
```

