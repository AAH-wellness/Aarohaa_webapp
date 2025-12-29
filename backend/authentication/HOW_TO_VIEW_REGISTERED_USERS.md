# How to View Registered Users in Database

## Method 1: Using SQL Queries (psql or pgAdmin)

### Step 1: Connect to Database

**Using Command Line:**
```bash
psql -U postgres -d aarohaa_wellness
```

**Using pgAdmin:**
1. Open pgAdmin
2. Connect to PostgreSQL server
3. Expand: **Servers** → **PostgreSQL** → **Databases** → **aarohaa_wellness**
4. Right-click **aarohaa_wellness** → **Query Tool**

---

### Step 2: View All Registered Users

**Query 1: See all users (basic info)**
```sql
SELECT id, email, name, role, auth_method, created_at 
FROM users 
ORDER BY created_at DESC;
```

**Query 2: See all users with full details**
```sql
SELECT * FROM users ORDER BY created_at DESC;
```

**Query 3: Count total users**
```sql
SELECT COUNT(*) AS total_users FROM users;
```

**Query 4: See users by role**
```sql
SELECT role, COUNT(*) AS count 
FROM users 
GROUP BY role;
```

**Query 5: See users by authentication method**
```sql
SELECT auth_method, COUNT(*) AS count 
FROM users 
GROUP BY auth_method;
```

**Query 6: See recent registrations (last 10)**
```sql
SELECT 
    id,
    email,
    name,
    role,
    auth_method,
    phone,
    date_of_birth,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### Step 3: View Specific User

**Find user by email:**
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

**Find user by ID:**
```sql
SELECT * FROM users WHERE id = 1;
```

**Find users registered today:**
```sql
SELECT * FROM users 
WHERE DATE(created_at) = CURRENT_DATE;
```

---

### Step 4: View User Profile Information

**See users with profile data:**
```sql
SELECT 
    id,
    email,
    name,
    role,
    phone,
    date_of_birth,
    address,
    auth_method,
    email_verified,
    created_at,
    last_login
FROM users
ORDER BY created_at DESC;
```

---

## Method 2: Using Backend API

### Option A: Create a Test Endpoint

Add this to your routes for testing (remove in production):

**File: `backend/authentication/routes/test.routes.js`**
```javascript
import express from 'express'
import { getAllUsers } from '../models/user.model.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = express.Router()

// Get all users (for testing - protect this in production!)
router.get('/test/users', authenticateToken, async (req, res) => {
  try {
    const users = await getAllUsers()
    res.json({ 
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        authMethod: user.authMethod,
        createdAt: user.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
```

**Then call:**
```bash
# Get your JWT token from login, then:
curl http://localhost:3001/api/test/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Method 3: Quick Verification Steps

### 1. Register a New User
- Go to your frontend registration page
- Register a new user with email: `test@example.com`
- Complete the registration

### 2. Check Database Immediately
```sql
-- In psql or pgAdmin Query Tool
SELECT * FROM users WHERE email = 'test@example.com';
```

**Expected Output:**
```
 id |      email       |    name    | role | auth_method | created_at
----+------------------+------------+------+-------------+-------------------
  1 | test@example.com | Test User  | user | email      | 2025-01-XX XX:XX:XX
```

### 3. Verify All Fields
```sql
SELECT 
    id,
    email,
    name,
    password IS NOT NULL AS has_password,
    role,
    phone,
    date_of_birth,
    address,
    auth_method,
    created_at
FROM users 
WHERE email = 'test@example.com';
```

---

## Method 4: Monitor Real-Time Registration

### Watch for New Users (PostgreSQL)

**In psql, run this to see new registrations:**
```sql
-- This will show new users as they register
SELECT 
    id,
    email,
    name,
    role,
    auth_method,
    created_at
FROM users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## Common Queries for Testing

### Check if Google OAuth users are stored:
```sql
SELECT * FROM users WHERE auth_method = 'google';
```

### Check if email/password users are stored:
```sql
SELECT * FROM users WHERE auth_method = 'email';
```

### See users with profile information:
```sql
SELECT 
    email,
    name,
    phone,
    date_of_birth,
    address
FROM users 
WHERE phone IS NOT NULL OR date_of_birth IS NOT NULL OR address IS NOT NULL;
```

### Check password reset codes (if any):
```sql
SELECT * FROM password_reset_codes ORDER BY created_at DESC LIMIT 10;
```

---

## Troubleshooting

### "No users found"
1. **Check if tables exist:**
   ```sql
   \dt  -- List tables
   ```

2. **Check if database is correct:**
   ```sql
   SELECT current_database();
   ```

3. **Verify backend is using database:**
   - Check server logs for: `✅ Database connection test successful`
   - If you see `⚠️ Database not configured`, check `.env` file

### "Table does not exist"
Run the SQL creation script:
```bash
psql -U postgres -d aarohaa_wellness -f scripts\create-tables.sql
```

### "Users not appearing after registration"
1. Check backend logs for errors
2. Verify database connection in server logs
3. Check if registration API returned success
4. Verify `.env` database configuration

---

## Quick Test Script

**Save as `check-users.sql` and run:**
```sql
-- Quick check script
\echo '=== Database Information ==='
SELECT current_database() AS database_name;

\echo '\n=== Total Users ==='
SELECT COUNT(*) AS total_users FROM users;

\echo '\n=== Recent Users (Last 5) ==='
SELECT 
    id,
    email,
    name,
    role,
    auth_method,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

\echo '\n=== Users by Role ==='
SELECT role, COUNT(*) AS count 
FROM users 
GROUP BY role;

\echo '\n=== Users by Auth Method ==='
SELECT auth_method, COUNT(*) AS count 
FROM users 
GROUP BY auth_method;
```

**Run it:**
```bash
psql -U postgres -d aarohaa_wellness -f check-users.sql
```

---

**After registering a user, immediately run:**
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
```

This will show your most recently registered user! 🎉

