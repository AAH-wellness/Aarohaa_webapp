# Frontend-Backend Setup for Password Verification

## ✅ Configuration Complete

The frontend is now configured to use the real backend with password verification enabled.

## Environment Variables (.env)

The `.env` file in the `frontend` directory is configured as follows:

```env
VITE_USE_MOCK_SERVICES=false
VITE_USER_SERVICE_URL=http://localhost:3001/api
```

### What This Means:
- ✅ **Mock services are DISABLED** - Frontend will call the real backend API
- ✅ **Password verification is ENABLED** - Backend will verify passwords using bcrypt
- ✅ **User Service URL is set** - Points to authentication service on port 3001

## How It Works

1. **Frontend Login Request:**
   - User enters email and password
   - Frontend calls: `POST http://localhost:3001/api/users/login`
   - Request includes: `{ email, password, loginMethod }`

2. **Backend Password Verification:**
   - Backend receives login request
   - Finds user by email in database
   - Uses `bcrypt.compare(password, user.password)` to verify password
   - ✅ Correct password → Returns JWT token
   - ❌ Wrong password → Returns 401 error: "Invalid email or password"

3. **Frontend Response Handling:**
   - Success → Stores token, logs user in
   - Error → Shows error message to user

## Testing Password Verification

### Test with Correct Password:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login with: `kaushikkushik2001@gmail.com` / `Happy@123`
4. ✅ Should succeed

### Test with Wrong Password:
1. Login with: `kaushikkushik2001@gmail.com` / `WrongPassword`
2. ❌ Should show error: "Invalid email or password"

## Important Notes

- **Mock services do NOT verify passwords** - This is why `VITE_USE_MOCK_SERVICES=false` is critical
- **Backend must be running** - Frontend needs the authentication service on port 3001
- **Restart frontend after .env changes** - Vite needs to reload environment variables

## Troubleshooting

### Login still accepts wrong passwords?
1. Check `.env` file has `VITE_USE_MOCK_SERVICES=false`
2. Restart frontend dev server
3. Check browser console for API calls to `http://localhost:3001/api/users/login`
4. Verify backend is running and accessible

### Backend connection errors?
1. Ensure backend is running: `cd backend && npm run dev`
2. Check backend is on port 3001
3. Verify database connection is working
4. Check CORS settings in backend allow frontend origin

## Security

✅ Passwords are hashed with bcrypt (10 salt rounds)
✅ Passwords are never returned in API responses
✅ JWT tokens used for authentication
✅ Input validation prevents SQL injection
✅ Wrong passwords are properly rejected

