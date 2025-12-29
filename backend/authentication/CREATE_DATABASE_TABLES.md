# How to Create Database Tables

## Step 1: Connect to PostgreSQL

### Windows (Using Command Prompt or PowerShell)

1. **Find PostgreSQL bin folder:**
   - Usually: `C:\Program Files\PostgreSQL\15\bin`
   - Or: `C:\Program Files\PostgreSQL\16\bin`

2. **Open Command Prompt or PowerShell**

3. **Connect to PostgreSQL:**
   ```bash
   # Navigate to PostgreSQL bin folder
   cd "C:\Program Files\PostgreSQL\15\bin"
   
   # Connect to PostgreSQL (replace 'postgres' with your username if different)
   psql -U postgres
   ```

4. **Enter your PostgreSQL password** when prompted

### Alternative: Using pgAdmin (GUI - Easier)

1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Connect to PostgreSQL server
3. Expand: **Servers** → **PostgreSQL** → **Databases**
4. Right-click on **aarohaa_wellness** → **Query Tool**

## Step 2: Create Database (If Not Created)

If you haven't created the database yet:

```sql
-- Connect to PostgreSQL first
psql -U postgres

-- Create database
CREATE DATABASE aarohaa_wellness;

-- Connect to the database
\c aarohaa_wellness

-- Exit
\q
```

## Step 3: Create Tables

### Option A: Using SQL Script File (Recommended)

1. **Open Command Prompt/PowerShell**

2. **Navigate to your project:**
   ```bash
   cd "E:\Work\Workspace\MASTERS\Aarohaa Webapp\backend\authentication"
   ```

3. **Run the SQL script:**
   ```bash
   # Replace 'postgres' with your username and 'your_password' with your password
   psql -U postgres -d aarohaa_wellness -f scripts\create-tables.sql
   ```

   Or if psql is not in PATH:
   ```bash
   "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d aarohaa_wellness -f scripts\create-tables.sql
   ```

4. **Enter password** when prompted

5. **Verify tables were created:**
   ```bash
   psql -U postgres -d aarohaa_wellness -c "\dt"
   ```

   Should show:
   ```
   users
   password_reset_codes
   ```

### Option B: Using pgAdmin Query Tool

1. Open pgAdmin
2. Connect to PostgreSQL
3. Right-click **aarohaa_wellness** database → **Query Tool**
4. Open the file: `backend/authentication/scripts/create-tables.sql`
5. Copy all SQL code
6. Paste into Query Tool
7. Click **Execute** (F5)
8. Should see: "Tables created successfully!"

### Option C: Manual SQL Commands

1. **Connect to database:**
   ```bash
   psql -U postgres -d aarohaa_wellness
   ```

2. **Run these commands one by one:**

```sql
-- Create users table
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

-- Create password reset codes table
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

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

3. **Verify:**
   ```sql
   \dt  -- List tables
   \d users  -- Describe users table
   \q  -- Exit
   ```

## Step 4: Verify Tables Were Created

### Check Tables Exist:
```sql
-- Connect to database
psql -U postgres -d aarohaa_wellness

-- List all tables
\dt

-- Should show:
-- users
-- password_reset_codes
```

### Check Table Structure:
```sql
-- Describe users table
\d users

-- Should show all columns:
-- id, email, password, name, role, google_id, etc.
```

### Test Insert (Optional):
```sql
-- Test insert a user
INSERT INTO users (email, name, password, role) 
VALUES ('test@example.com', 'Test User', 'hashed_password', 'user');

-- Check if inserted
SELECT * FROM users WHERE email = 'test@example.com';

-- Delete test user
DELETE FROM users WHERE email = 'test@example.com';
```

## Troubleshooting

### "Database does not exist"
```sql
CREATE DATABASE aarohaa_wellness;
```

### "Permission denied"
- Make sure you're using the correct user (usually `postgres`)
- Or grant permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE aarohaa_wellness TO your_username;
```

### "Table already exists"
- That's fine! The `CREATE TABLE IF NOT EXISTS` will skip if table exists
- Or drop and recreate:
```sql
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS password_reset_codes CASCADE;
-- Then run create script again
```

### "psql: command not found"
- Use full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe"`
- Or add PostgreSQL bin to PATH environment variable

## Next Steps

After tables are created:
1. ✅ Install `pg` package: `npm install pg`
2. ✅ Create database connection file
3. ✅ Update models to use PostgreSQL
4. ✅ Test user registration

---

**Ready to proceed?** Once tables are created, I'll implement the database integration code!

