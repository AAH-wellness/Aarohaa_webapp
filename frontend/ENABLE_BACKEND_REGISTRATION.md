# Enable Backend Registration

## Issue
Registration was only saving to localStorage, not the database.

## Fix Applied
✅ Updated `Register.jsx` to call backend API
✅ Added error handling and loading states
✅ Updated `userService.js` to handle backend response correctly

## Steps to Verify

### 1. Check Backend is Running
```bash
cd backend/authentication
npm run dev
```

Should see:
```
✅ Database connection test successful
Authentication service running on port 3001
```

### 2. Check Frontend Configuration

Make sure `frontend/.env` or environment variables are set:
```env
VITE_USER_SERVICE_URL=http://localhost:3001/api
VITE_USE_MOCK_SERVICES=false
```

Or check `frontend/src/services/config.js`:
- `USE_MOCK_SERVICES` should be `false` or not set

### 3. Test Registration

1. Go to registration page
2. Fill in all fields (including phone with country code)
3. Submit form
4. Check browser console for any errors
5. Check backend terminal for registration logs

### 4. Verify in Database

```sql
-- Connect to database
psql -U postgres -d aarohaa_wellness

-- View all users
SELECT * FROM users ORDER BY created_at DESC;
```

## Troubleshooting

### "Network Error" or "Failed to fetch"
- Backend not running? Start it: `cd backend/authentication && npm run dev`
- CORS issue? Check backend `server.js` has correct `FRONTEND_URL`
- Wrong URL? Check `VITE_USER_SERVICE_URL` in frontend

### "Validation failed"
- Check browser console for specific validation errors
- Ensure phone number includes country code (e.g., +1234567890)
- Ensure date of birth is in YYYY-MM-DD format

### "User already exists"
- User with that email already registered
- Try different email or check existing users in database

### Still using localStorage?
- Check browser console for "Registration error"
- Verify `VITE_USE_MOCK_SERVICES=false` in frontend
- Clear browser cache and reload

## Expected Behavior

✅ Registration sends data to: `POST http://localhost:3001/api/users/register`
✅ Backend validates and stores in PostgreSQL
✅ Returns user data and JWT token
✅ Frontend stores token and user info
✅ User is logged in automatically

