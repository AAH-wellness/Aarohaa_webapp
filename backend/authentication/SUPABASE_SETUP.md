# Supabase Database Connection Guide

This guide explains how to connect your authentication service to Supabase so that team members can access the database.

## What is Supabase?

Supabase is a PostgreSQL-based backend-as-a-service that provides:
- Managed PostgreSQL database
- Connection pooling
- Web dashboard for database management
- Team collaboration features
- Automatic backups

## Getting Supabase Credentials

### Step 1: Create/Login to Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project (or use existing one)

### Step 2: Get Database Connection Details

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. You'll see two connection strings:
   - **Connection pooling** (recommended for server applications)
   - **Direct connection** (for migrations/admin tools)

### Step 3: Copy Connection String

Copy the **Connection pooling** string. It looks like:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Or the direct connection string:
```
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

## Configuration Options

You have two ways to configure the database connection:

### Option 1: Connection String (Recommended for Supabase)

Use the `DATABASE_URL` environment variable with your Supabase connection string.

**In your `.env` file:**
```env
# Supabase Connection (Recommended)
DATABASE_URL=postgresql://postgres.[project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Optional: Enable SSL (usually required for Supabase)
DB_SSL=true
```

### Option 2: Individual Parameters (For Local PostgreSQL)

Use individual database parameters (works with local PostgreSQL or Supabase).

**In your `.env` file:**
```env
# Database Configuration
DB_HOST=db.[project-ref].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.[project-ref]
DB_PASSWORD=your_password_here
DB_SSL=true
```

## Setting Up Your .env File

1. Create or update `.env` file in `backend/authentication/` directory
2. Add your Supabase credentials using one of the options above

**Example `.env` file for Supabase:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Database Connection (Option 1 - Recommended)
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
DB_SSL=true

# OR use individual parameters (Option 2)
# DB_HOST=db.abcdefghijklmnop.supabase.co
# DB_PORT=5432
# DB_NAME=postgres
# DB_USER=postgres.abcdefghijklmnop
# DB_PASSWORD=your_password_here
# DB_SSL=true

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this
JWT_EXPIRES_IN=24h

# Session Configuration
SESSION_SECRET=your_session_secret_here_change_this

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Finding Your Password

If you forgot your database password:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Database password** section
3. Click **Reset database password**
4. Copy the new password (you won't be able to see it again!)

## Team Member Setup

To allow team members to access the database:

### Step 1: Share Project Access

1. Go to Supabase Dashboard → **Settings** → **Team**
2. Click **Invite team member**
3. Enter their email address
4. Select their role (Developer, Admin, etc.)
5. Send invitation

### Step 2: Share Database Credentials (Secure Method)

**Option A: Use Environment Variables (Recommended)**
- Share the `.env` file content securely (via password manager, encrypted message, etc.)
- Each team member adds it to their local `.env` file
- **Never commit `.env` to git!**

**Option B: Use Supabase Dashboard**
- Team members can view connection strings in Supabase Dashboard
- Go to **Settings** → **Database** → **Connection string**
- Copy and paste into their `.env` file

### Step 3: Team Members Setup

Each team member should:

1. Clone the repository
2. Create `.env` file in `backend/authentication/` directory
3. Add database credentials (from Step 2)
4. Install dependencies: `npm install`
5. Test connection: `node check-db.js`
6. Start server: `npm run dev`

## Testing the Connection

### Test 1: Quick Connection Test
```bash
cd backend/authentication
node check-db.js
```

### Test 2: Full Server Test
```bash
cd backend/authentication
npm run dev
```

You should see:
```
✅ Database connection test successful
✅ All database tables initialized
🚀 Authentication service running on port 3001
```

### Test 3: Using Test Script
```bash
cd backend/authentication
node scripts/test-db.js
```

## Connection Pooling vs Direct Connection

### Connection Pooling (Recommended)
- **Port:** 6543
- **URL Format:** `aws-0-[region].pooler.supabase.com:6543`
- **Benefits:** Better for server applications, handles many connections
- **Use for:** Production, development servers

### Direct Connection
- **Port:** 5432
- **URL Format:** `db.[project-ref].supabase.co:5432`
- **Benefits:** Direct database access
- **Use for:** Migrations, admin tools, one-off scripts

## Security Best Practices

1. **Never commit `.env` file to git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as a template

2. **Use connection pooling in production**
   - Better performance
   - Handles connection limits better

3. **Rotate passwords regularly**
   - Change database password periodically
   - Update `.env` files for all team members

4. **Use environment-specific credentials**
   - Different credentials for dev/staging/production
   - Use Supabase projects for each environment

## Troubleshooting

### Connection Timeout
- Check if `DB_SSL=true` is set (required for Supabase)
- Verify connection string is correct
- Check Supabase project is active (not paused)

### Authentication Failed
- Verify password is correct
- Check username format: `postgres.[project-ref]`
- Reset password in Supabase dashboard if needed

### SSL Error
- Ensure `DB_SSL=true` in `.env`
- Or use connection string with SSL configured

### Connection Refused
- Verify Supabase project is active
- Check firewall/network settings
- Verify host and port are correct

## Database Tables

The service will automatically create these tables on first run:
- `users` - User accounts
- `providers` - Provider accounts
- `bookings` - Appointments/bookings

You can also view and manage tables in Supabase Dashboard → **Table Editor**.

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## Need Help?

1. Check Supabase Dashboard for connection details
2. Verify `.env` file configuration
3. Test connection using `check-db.js`
4. Check server logs for error messages
5. Review Supabase documentation

