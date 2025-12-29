# Quick Start: Create Database Tables

## Step 1: Create Database (If Not Done)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE aarohaa_wellness;

# Connect to the database
\c aarohaa_wellness

# Exit
\q
```

## Step 2: Create Tables (Choose One Method)

### Method A: Using SQL Script File (Easiest)

```bash
# Navigate to authentication folder
cd "E:\Work\Workspace\MASTERS\Aarohaa Webapp\backend\authentication"

# Run the script (replace 'postgres' with your username)
psql -U postgres -d aarohaa_wellness -f scripts\create-tables.sql

# Enter your PostgreSQL password when prompted
```

### Method B: Using pgAdmin (GUI)

1. Open **pgAdmin 4**
2. Connect to PostgreSQL
3. Right-click **aarohaa_wellness** → **Query Tool**
4. Open file: `backend/authentication/scripts/create-tables.sql`
5. Copy all SQL code
6. Paste into Query Tool
7. Click **Execute** (F5)

### Method C: Manual Commands

```bash
# Connect to database
psql -U postgres -d aarohaa_wellness
```

Then copy and paste the SQL from `scripts/create-tables.sql`

## Step 3: Verify Tables

```sql
-- List all tables
\dt

-- Should show:
-- users
-- password_reset_codes

-- Check users table structure
\d users

-- Exit
\q
```

## Step 4: Configure .env File

Make sure your `.env` file has:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aarohaa_wellness
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false
```

## Next: Database Integration

After tables are created, I'll implement the code to:
- Connect to PostgreSQL
- Store users in database
- Update all models to use database

---

**Ready?** Once you've created the tables, let me know and I'll implement the database integration!

