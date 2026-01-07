# Google OAuth Implementation - Complete Guide

## Overview

This document describes the complete Google OAuth implementation with:
- ✅ Login events logging to `user_login_events` table
- ✅ Profile completion form for Google users
- ✅ Support for any Gmail account (not just test users)

## Features Implemented

### 1. Google OAuth Login
- Works with any Gmail account (after publishing the app)
- Logs all login events to `user_login_events` table in Supabase
- Stores user details in `users` table

### 2. Login Events Tracking
- **Table**: `user_login_events`
- **Fields**:
  - `user_id` - Reference to users table
  - `login_method` - 'google', 'email', 'wallet'
  - `ip_address` - User's IP address
  - `user_agent` - Browser user agent
  - `device_type` - Mobile, Desktop, Tablet
  - `browser` - Chrome, Firefox, Safari, etc.
  - `os` - Windows, macOS, Linux, Android, iOS
  - `success` - Boolean (true/false)
  - `error_message` - If login failed
  - `created_at` - Timestamp

### 3. Profile Completion for Google Users
- When a user logs in via Google for the first time, they see a profile completion form
- Required fields: Name, Date of Birth, Phone Number
- Once completed, the form doesn't show again
- Data is stored in `users` table

## Database Tables

### users Table
- `id` - Primary key
- `email` - User email
- `name` - User name
- `phone` - Phone number
- `date_of_birth` - Date of birth (DATE)
- `google_id` - Google user ID
- `google_picture` - Google profile picture URL
- `auth_method` - 'google', 'email', or 'wallet'
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login` - Last login timestamp

### user_login_events Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `login_method` - Authentication method used
- `ip_address` - User's IP address
- `user_agent` - Browser information
- `device_type` - Device category
- `browser` - Browser name
- `os` - Operating system
- `location` - User location (optional)
- `success` - Login success status
- `error_message` - Error details if failed
- `created_at` - Event timestamp

## API Endpoints

### POST `/api/users/login/google`
Login with Google OAuth

**Request:**
```json
{
  "idToken": "google-id-token",
  "role": "user" // optional
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "User Name",
    "role": "user",
    "phone": null,
    "dateOfBirth": null,
    "picture": "https://...",
    "authMethod": "google",
    "profileIncomplete": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token",
  "message": "Google login successful",
  "isNewUser": true
}
```

### POST `/api/users/profile/complete-google`
Complete profile for Google OAuth users

**Request:**
```json
{
  "name": "Full Name",
  "dateOfBirth": "1990-01-01",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "Full Name",
    "role": "user",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Profile completed successfully"
}
```

## Frontend Implementation

### Profile Component
- Shows profile completion form for Google users with incomplete profiles
- Form appears automatically when `profileIncomplete: true` and `authMethod: 'google'`
- Once completed, form is hidden and profile shows all details

### User Service
- `loginWithGoogle(googleData)` - Handles Google login
- `completeGoogleProfile(profileData)` - Completes Google user profile

## Setup Instructions

### 1. Publish Google OAuth App (For Any Gmail Account)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Click **PUBLISH APP** button
4. Confirm the warning
5. **Note**: For production, you may need to verify your app

### 2. Initialize Database Tables

Run the initialization script:
```bash
cd backend/authentication
node scripts/init-login-events-table.js
```

Or the server will auto-initialize on startup.

### 3. Test Google Login

1. Start backend server: `npm run dev`
2. Start frontend: `npm run dev`
3. Go to login page
4. Click "Sign in with Google"
5. Select any Gmail account
6. Complete profile if prompted

## Viewing Login Events

### In Supabase Dashboard
1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → **user_login_events**
3. See all login events with timestamps

### Via Script
```bash
cd backend/authentication
node scripts/check-users-in-supabase.js
```

## Testing

### Test Google Login
1. Use any Gmail account
2. Sign in via Google
3. Check `user_login_events` table for the event
4. Check `users` table for user data

### Test Profile Completion
1. Sign in with Google (new user)
2. You should see profile completion form
3. Fill in name, DOB, and phone
4. Submit form
5. Form should disappear
6. Profile should show all details

## Troubleshooting

### "Can't continue with google.com" Error
- **Solution**: Publish your OAuth app in Google Cloud Console
- Go to OAuth consent screen → Click "PUBLISH APP"

### Profile Form Not Showing
- Check if `profileIncomplete: true` in user object
- Check if `authMethod: 'google'` in user object
- Check browser console for errors

### Login Events Not Logging
- Check database connection
- Verify `user_login_events` table exists
- Check server logs for errors

## Security Notes

1. **IP Address Logging**: IP addresses are logged for security auditing
2. **User Agent**: Browser information is logged for device tracking
3. **Data Privacy**: Ensure compliance with privacy regulations
4. **Token Security**: JWT tokens are used for authentication

## Next Steps

- [ ] Add location detection for login events
- [ ] Add admin dashboard to view login events
- [ ] Add email notifications for suspicious login attempts
- [ ] Add 2FA for Google OAuth users

