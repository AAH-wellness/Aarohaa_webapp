-- ============================================
-- SQL COMMANDS TO VIEW REGISTERED USERS
-- ============================================

-- Step 1: Connect to database (if not already connected)
-- psql -U postgres -d aarohaa_wellness

-- ============================================
-- VIEW ALL USERS (Basic Info)
-- ============================================
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
ORDER BY created_at DESC;

-- ============================================
-- VIEW ALL USERS (Full Details)
-- ============================================
SELECT * FROM users ORDER BY created_at DESC;

-- ============================================
-- VIEW YOUR SPECIFIC USER (Replace with your email)
-- ============================================
SELECT * FROM users WHERE email = 'your-email@example.com';

-- ============================================
-- COUNT TOTAL USERS
-- ============================================
SELECT COUNT(*) AS total_users FROM users;

-- ============================================
-- VIEW USERS BY ROLE
-- ============================================
SELECT 
    role,
    COUNT(*) AS count
FROM users 
GROUP BY role;

-- ============================================
-- VIEW USERS BY AUTHENTICATION METHOD
-- ============================================
SELECT 
    auth_method,
    COUNT(*) AS count
FROM users 
GROUP BY auth_method;

-- ============================================
-- VIEW RECENT REGISTRATIONS (Last 5)
-- ============================================
SELECT 
    id,
    email,
    name,
    role,
    phone,
    date_of_birth,
    auth_method,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- VIEW USERS WITH PHONE NUMBERS
-- ============================================
SELECT 
    id,
    email,
    name,
    phone,
    country_code = SUBSTRING(phone FROM '^\+(\d{1,4})') AS country_code,
    phone_number = SUBSTRING(phone FROM '\+(\d{1,4})(.+)') AS phone_number,
    created_at
FROM users 
WHERE phone IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- VIEW USERS WITH PROFILE INFORMATION
-- ============================================
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
    updated_at,
    last_login
FROM users
ORDER BY created_at DESC;

-- ============================================
-- VIEW USERS REGISTERED TODAY
-- ============================================
SELECT 
    id,
    email,
    name,
    role,
    phone,
    created_at
FROM users 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- ============================================
-- VIEW TABLE STRUCTURE
-- ============================================
\d users

-- Or:
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- QUICK SUMMARY
-- ============================================
SELECT 
    'Total Users' AS metric,
    COUNT(*)::text AS value
FROM users
UNION ALL
SELECT 
    'Users with Phone',
    COUNT(*)::text
FROM users
WHERE phone IS NOT NULL
UNION ALL
SELECT 
    'Users with DOB',
    COUNT(*)::text
FROM users
WHERE date_of_birth IS NOT NULL
UNION ALL
SELECT 
    'Email Auth Users',
    COUNT(*)::text
FROM users
WHERE auth_method = 'email'
UNION ALL
SELECT 
    'Google Auth Users',
    COUNT(*)::text
FROM users
WHERE auth_method = 'google';

