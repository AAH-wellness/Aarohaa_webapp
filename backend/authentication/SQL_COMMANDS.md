# SQL Commands Reference - Aarohaa Wellness Database

This document contains SQL commands to query and inspect the database.

## Database Connection

The database is PostgreSQL. You can connect using:
- **psql** command line tool
- **pgAdmin** (GUI tool)
- **DBeaver** (GUI tool)
- **Supabase Dashboard** (if using Supabase)

Connection details are in `.env` file:
- `DATABASE_URL` (for Supabase) or
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (for local PostgreSQL)

---

## 1. List All Tables in Database

```sql
-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Output:**
- `users`
- `providers`
- `bookings`

**Count total tables:**
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 2. View User Details (Registered Users)

### View All Users
```sql
SELECT 
    id,
    email,
    name,
    role,
    phone,
    address,
    auth_method,
    email_verified,
    created_at,
    updated_at,
    last_login
FROM users
ORDER BY created_at DESC;
```

### View Specific User by Email
```sql
SELECT 
    id,
    email,
    name,
    role,
    phone,
    address,
    auth_method,
    email_verified,
    created_at,
    updated_at
FROM users
WHERE email = 'your-email@example.com';
```

### View Specific User by ID
```sql
SELECT 
    id,
    email,
    name,
    role,
    phone,
    address,
    auth_method,
    email_verified,
    created_at,
    updated_at
FROM users
WHERE id = 1;
```

### Count Total Users
```sql
SELECT COUNT(*) as total_users FROM users;
```

### Count Users by Role
```sql
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;
```

### View Recently Registered Users
```sql
SELECT 
    id,
    email,
    name,
    role,
    phone,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

---

## 3. View Table Structure (Schema)

### Users Table Structure
```sql
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
```

### Providers Table Structure
```sql
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'providers'
ORDER BY ordinal_position;
```

### Bookings Table Structure
```sql
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
ORDER BY ordinal_position;
```

---

## 4. View Providers Data

### View All Providers
```sql
SELECT 
    id,
    user_id,
    name,
    email,
    phone,
    specialty,
    title,
    bio,
    hourly_rate,
    rating,
    sessions_completed,
    reviews_count,
    verified,
    status,
    created_at,
    updated_at
FROM providers
ORDER BY created_at DESC;
```

### View Verified Providers Only
```sql
SELECT 
    id,
    name,
    email,
    specialty,
    title,
    hourly_rate,
    rating,
    verified,
    status
FROM providers
WHERE verified = true
  AND status = 'ready'
ORDER BY rating DESC;
```

### Count Providers by Status
```sql
SELECT 
    status,
    COUNT(*) as count
FROM providers
GROUP BY status;
```

---

## 5. View Bookings Data

### View All Bookings
```sql
SELECT 
    id,
    user_id,
    provider_id,
    appointment_date,
    session_type,
    status,
    created_at,
    updated_at
FROM bookings
ORDER BY appointment_date DESC;
```

### View Bookings with User and Provider Names
```sql
SELECT 
    b.id,
    b.appointment_date,
    b.session_type,
    b.status,
    u.name as user_name,
    u.email as user_email,
    p.name as provider_name,
    p.specialty as provider_specialty
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN providers p ON b.provider_id = p.id
ORDER BY b.appointment_date DESC;
```

---

## 6. Complete User Registration Details

### View User with All Related Data
```sql
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    u.phone,
    u.address,
    u.auth_method,
    u.email_verified,
    u.created_at as user_created_at,
    p.id as provider_id,
    p.specialty,
    p.title,
    p.verified as provider_verified,
    p.status as provider_status,
    COUNT(b.id) as total_bookings
FROM users u
LEFT JOIN providers p ON u.id = p.user_id
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.email = 'your-email@example.com'
GROUP BY u.id, p.id;
```

---

## 7. Database Statistics

### Get All Table Row Counts
```sql
SELECT 
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
    'providers' as table_name,
    COUNT(*) as row_count
FROM providers
UNION ALL
SELECT 
    'bookings' as table_name,
    COUNT(*) as row_count
FROM bookings;
```

### Get Database Size
```sql
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;
```

### Get Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 8. Useful Queries for Debugging

### Check if User Exists
```sql
SELECT EXISTS(
    SELECT 1 FROM users WHERE email = 'your-email@example.com'
) as user_exists;
```

### View User Registration Date
```sql
SELECT 
    email,
    name,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as days_since_registration
FROM users
WHERE email = 'your-email@example.com';
```

### View All Indexes
```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### View Foreign Key Relationships
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public';
```

---

## 9. Quick Reference - Most Common Queries

### Find Your Registered User
```sql
-- Replace with your email
SELECT * FROM users WHERE email = 'your-email@example.com';
```

### See All Your Data
```sql
-- Replace with your email
SELECT 
    u.*,
    p.*,
    COUNT(b.id) as booking_count
FROM users u
LEFT JOIN providers p ON u.id = p.user_id
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.email = 'your-email@example.com'
GROUP BY u.id, p.id;
```

### List All Tables and Row Counts
```sql
SELECT 
    'users' as table_name, COUNT(*) as rows FROM users
UNION ALL
SELECT 
    'providers' as table_name, COUNT(*) as rows FROM providers
UNION ALL
SELECT 
    'bookings' as table_name, COUNT(*) as rows FROM bookings;
```

---

## Notes

- **Password field**: The `password` field in the `users` table contains hashed passwords (bcrypt), so you cannot see the actual password.
- **Sensitive data**: Be careful when sharing query results that contain email addresses or other personal information.
- **Timestamps**: All timestamps are stored in UTC format.
- **JSON fields**: The `availability` field in `providers` table is stored as JSONB (JSON Binary format).

---

## Example: Complete User Registration Check

After registering a user, run this to see all their data:

```sql
-- Step 1: Find your user
SELECT id, email, name, role, phone, created_at 
FROM users 
WHERE email = 'your-email@example.com';

-- Step 2: Check if provider record exists (if registered as provider)
SELECT * FROM providers 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');

-- Step 3: Check bookings (if any)
SELECT * FROM bookings 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');
```

