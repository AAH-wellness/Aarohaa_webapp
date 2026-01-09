# Supabase Database Setup Guide

This guide will help you set up and configure your Supabase database connection.

## Step 1: Get Your Supabase Connection String

1. **Go to your Supabase project**: https://app.supabase.com
2. **Navigate to Settings** → **Database**
3. **Find the "Connection string" section**
4. **Select "URI"** (not "Session mode")
5. **Copy the connection string** - it will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

## Step 2: Update Your .env File

Open `backend/authentication/.env` and update the database configuration:

### Option A: Using Connection String (Recommended for Supabase)

```env
# Comment out or remove the individual DB parameters
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=aarohaa_db
# DB_USER=postgres
# DB_PASSWORD=your-password

# Use Supabase connection string instead
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
DB_SSL=true
```

**Important**: Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

### Option B: Using Individual Parameters

If you prefer individual parameters, extract them from the connection string:

```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-actual-password
DB_SSL=true
```

## Step 3: Test Your Connection

Run the test script to verify your connection:

```bash
cd backend/authentication
node test-supabase-connection.js
```

You should see:
```
✅ SUCCESS: Connected to Supabase database!
```

## Step 4: Initialize Database Tables

When you start the server, it will automatically create the necessary tables:
- `users` table
- `user_login_events` table

Or you can manually initialize:

```bash
cd backend/authentication
npm start
```

The server will automatically create tables on startup.

## Troubleshooting

### Connection Failed?

1. **Check your password**: Make sure the password in the connection string is correct
2. **Verify project is active**: Supabase free tier projects pause after inactivity
3. **Check SSL**: Ensure `DB_SSL=true` is set for Supabase
4. **Test connection string**: Try connecting with a PostgreSQL client like pgAdmin or DBeaver
5. **Check firewall**: Ensure your IP is allowed (Supabase allows all by default)

### Password Contains Special Characters?

If your password contains special characters like `@`, `#`, `%`, etc., you need to URL-encode them in the connection string:
- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- etc.

Or use individual parameters instead of the connection string.

## Security Notes

- **Never commit your `.env` file to git** - it contains sensitive credentials
- **Use different passwords** for development and production
- **Rotate passwords regularly** for security
- The `.env.example` file is safe to commit (it has placeholder values)

