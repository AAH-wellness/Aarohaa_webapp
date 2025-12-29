# PostgreSQL Database Setup Guide

Complete guide to set up PostgreSQL database for the authentication service.

## Step 1: Install PostgreSQL

### Windows

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the installer (latest version recommended)
   - Run the installer

2. **Installation Steps:**
   - Click "Next" through the setup wizard
   - **Port:** Keep default `5432` (or choose another)
   - **Superuser password:** Set a strong password (remember this!)
   - **Locale:** Default is fine
   - Click "Next" → "Next" → "Install"
   - Wait for installation to complete
   - **Uncheck** "Launch Stack Builder" (optional)
   - Click "Finish"

3. **Verify Installation:**
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - Should show PostgreSQL version

### macOS

```bash
# Using Homebrew (recommended)
brew install postgresql@15
brew services start postgresql@15

# Or download from: https://www.postgresql.org/download/macosx/
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database and User

### Windows (Using pgAdmin or Command Line)

**Option A: Using pgAdmin (GUI - Recommended for beginners)**
1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Connect to PostgreSQL server (use the password you set)
3. Right-click "Databases" → "Create" → "Database"
4. Database name: `aarohaa_wellness`
5. Owner: `postgres` (or create a new user)
6. Click "Save"

**Option B: Using Command Line (psql)**
1. Open Command Prompt
2. Navigate to PostgreSQL bin folder (usually `C:\Program Files\PostgreSQL\15\bin`)
3. Run:
```bash
psql -U postgres
```
4. Enter your password when prompted
5. Run these SQL commands:
```sql
-- Create database
CREATE DATABASE aarohaa_wellness;

-- Create user (optional, for better security)
CREATE USER aarohaa_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aarohaa_wellness TO aarohaa_user;

-- Connect to the database
\c aarohaa_wellness

-- Exit
\q
```

### macOS/Linux

```bash
# Switch to postgres user
sudo -u postgres psql

# Or directly:
psql -U postgres
```

Then run the same SQL commands as above.

## Step 3: Database Schema Design

Here's the schema we'll use for the authentication service:

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- NULL for OAuth users
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'provider', 'admin')),
    
    -- Google OAuth fields
    google_id VARCHAR(255) UNIQUE,
    google_picture TEXT,
    
    -- Wallet fields (for future use)
    wallet_address VARCHAR(255),
    
    -- Authentication method
    auth_method VARCHAR(50) DEFAULT 'email' CHECK (auth_method IN ('email', 'google', 'wallet')),
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    
    -- Profile fields
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_google_id_unique UNIQUE (google_id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth_method ON users(auth_method);
```

### Password Reset Codes Table

```sql
CREATE TABLE password_reset_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key (optional, for referential integrity)
    CONSTRAINT fk_user_email FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX idx_reset_codes_email ON password_reset_codes(email);
CREATE INDEX idx_reset_codes_code ON password_reset_codes(code);
```

### Sessions Table (Optional - for advanced session management)

```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    CONSTRAINT fk_user_session FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
```

## Step 4: Install Node.js PostgreSQL Driver

We'll use `pg` (node-postgres) - the most popular PostgreSQL client for Node.js.

**Add to `package.json`:**
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4"
  }
}
```

Or install directly:
```bash
npm install pg
```

## Step 5: Database Connection Configuration

### Environment Variables (.env)

Add to `backend/authentication/.env`:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aarohaa_wellness
DB_USER=postgres
# Or use the user you created:
# DB_USER=aarohaa_user
DB_PASSWORD=your_postgres_password
DB_SSL=false  # Set to true for production/cloud databases

# Connection Pool Settings (optional)
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

## Step 6: Database Connection File Structure

We'll create:
- `config/database.js` - Database connection pool
- `models/user.model.js` - User model with PostgreSQL queries
- `models/passwordReset.model.js` - Password reset model
- `migrations/` - Database migration scripts (optional)

## Step 7: Create Database Tables

### Quick Setup Script

Create a file `backend/authentication/scripts/create-tables.sql`:

```sql
-- Run this script to create all tables
-- psql -U postgres -d aarohaa_wellness -f scripts/create-tables.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'provider', 'admin')),
    google_id VARCHAR(255) UNIQUE,
    google_picture TEXT,
    wallet_address VARCHAR(255),
    auth_method VARCHAR(50) DEFAULT 'email' CHECK (auth_method IN ('email', 'google', 'wallet')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Password reset codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_reset_codes_code ON password_reset_codes(code);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 8: Verify Setup

### Test Database Connection

1. **Test with psql:**
```bash
psql -U postgres -d aarohaa_wellness
```

2. **Check tables:**
```sql
\dt  -- List all tables
\d users  -- Describe users table
SELECT * FROM users;  -- View users (should be empty initially)
\q  -- Exit
```

## Step 9: Production Considerations

### For Production/Cloud Databases:

1. **Use Connection Pooling:**
   - Configure max connections
   - Set idle timeout
   - Use SSL connections

2. **Environment Variables:**
   - Never hardcode credentials
   - Use secure secret management
   - Different credentials for dev/staging/prod

3. **Backup Strategy:**
   - Regular automated backups
   - Point-in-time recovery
   - Test restore procedures

4. **Security:**
   - Use least privilege principle
   - Enable SSL/TLS
   - Regular security updates
   - Monitor connection logs

## Quick Reference Commands

### PostgreSQL Common Commands

```bash
# Connect to database
psql -U postgres -d aarohaa_wellness

# List all databases
psql -U postgres -l

# Run SQL file
psql -U postgres -d aarohaa_wellness -f script.sql

# Backup database
pg_dump -U postgres aarohaa_wellness > backup.sql

# Restore database
psql -U postgres -d aarohaa_wellness < backup.sql
```

### Inside psql:

```sql
-- List all tables
\dt

-- Describe table structure
\d users

-- List all databases
\l

-- Connect to different database
\c database_name

-- Show current user
SELECT current_user;

-- Exit
\q
```

## Troubleshooting

### "Connection refused"
- ✅ Check PostgreSQL is running: `pg_isready`
- ✅ Check port 5432 is not blocked
- ✅ Verify firewall settings

### "Authentication failed"
- ✅ Check username and password
- ✅ Verify pg_hba.conf settings
- ✅ Check user has proper permissions

### "Database does not exist"
- ✅ Create database first
- ✅ Check database name spelling
- ✅ Verify user has access

### "Permission denied"
- ✅ Grant proper privileges to user
- ✅ Check user role (superuser vs regular user)

## Next Steps

After setup is complete, you'll need to:

1. ✅ Install `pg` package: `npm install pg`
2. ✅ Create database connection file
3. ✅ Update user model to use PostgreSQL
4. ✅ Update password reset model
5. ✅ Test all CRUD operations
6. ✅ Migrate existing in-memory data (if any)

---

**Ready to proceed?** Once you've completed the setup, let me know and I'll implement the database integration code!

