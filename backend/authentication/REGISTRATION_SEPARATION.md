# User and Provider Registration Separation

## Overview

This document explains how user and provider registrations are properly separated to ensure data integrity.

## Registration Endpoints

### 1. User Registration
**Endpoint:** `POST /api/users/register`

**Purpose:** Register regular users (customers/patients)

**What it does:**
- Creates a record in `users` table
- Sets `role = 'user'` (ALWAYS, cannot be changed)
- Does NOT create a record in `providers` table
- Returns JWT token for user authentication

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token-here",
  "message": "Registration successful"
}
```

**Database Changes:**
- ✅ Creates 1 record in `users` table with `role = 'user'`
- ❌ Does NOT create record in `providers` table

---

### 2. Provider Registration
**Endpoint:** `POST /api/users/register/provider`

**Purpose:** Register wellness providers (doctors, therapists, coaches)

**What it does:**
- Creates a record in `users` table
- Sets `role = 'provider'` (ALWAYS)
- Creates a record in `providers` table (linked to user)
- Returns JWT token for provider authentication

**Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "specialty": "Yoga Therapy",
  "title": "Licensed Therapist",
  "bio": "10 years of experience...",
  "hourlyRate": 150.00
}
```

**Response:**
```json
{
  "user": {
    "id": 2,
    "email": "jane@example.com",
    "name": "Dr. Jane Smith",
    "role": "provider",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token-here",
  "message": "Provider registration successful"
}
```

**Database Changes:**
- ✅ Creates 1 record in `users` table with `role = 'provider'`
- ✅ Creates 1 record in `providers` table (linked via `user_id`)

**Error Handling:**
- If provider record creation fails, the user record is automatically deleted to maintain data integrity

---

## Data Integrity Rules

### Rule 1: User Registration
- **MUST** create user with `role = 'user'`
- **MUST NOT** create provider record
- **MUST NOT** accept `role = 'provider'` parameter (ignored)

### Rule 2: Provider Registration
- **MUST** create user with `role = 'provider'`
- **MUST** create provider record
- **MUST** link provider record to user via `user_id`
- **MUST** rollback user creation if provider creation fails

### Rule 3: Database Constraints
- Users with `role = 'user'` should NOT have records in `providers` table
- Users with `role = 'provider'` MUST have records in `providers` table
- Provider records are linked via foreign key: `providers.user_id → users.id`

---

## Frontend Implementation

### User Registration Form
**Component:** `Register.jsx`

**API Call:**
```javascript
await userService.register({
  name: formData.fullName,
  email: formData.email,
  password: formData.password,
  phone: fullPhoneNumber,
  role: 'user' // Explicitly set, but backend ignores and always uses 'user'
})
```

**Endpoint Used:** `POST /api/users/register`

---

### Provider Registration Form
**Component:** `ProviderRegister.jsx` (to be created)

**API Call:**
```javascript
await userService.registerProvider({
  name: formData.fullName,
  email: formData.email,
  password: formData.password,
  phone: fullPhoneNumber,
  specialty: formData.specialty,
  title: formData.title,
  bio: formData.bio,
  hourlyRate: formData.hourlyRate
})
```

**Endpoint Used:** `POST /api/users/register/provider`

---

## Verification Queries

### Check User Registration
```sql
-- Verify user was created correctly
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    CASE 
        WHEN p.id IS NOT NULL THEN 'ERROR: Has provider record!' 
        ELSE 'OK: No provider record' 
    END as status
FROM users u
LEFT JOIN providers p ON u.id = p.user_id
WHERE u.email = 'user@example.com';
```

**Expected Result:**
- `role = 'user'`
- `status = 'OK: No provider record'`

---

### Check Provider Registration
```sql
-- Verify provider was created correctly
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    p.id as provider_id,
    p.specialty,
    p.title,
    CASE 
        WHEN p.id IS NULL THEN 'ERROR: Missing provider record!' 
        ELSE 'OK: Has provider record' 
    END as status
FROM users u
LEFT JOIN providers p ON u.id = p.user_id
WHERE u.email = 'provider@example.com';
```

**Expected Result:**
- `role = 'provider'`
- `provider_id IS NOT NULL`
- `status = 'OK: Has provider record'`

---

## Common Issues and Fixes

### Issue 1: User has provider role
**Problem:** User registered through user form but has `role = 'provider'`

**Fix:**
```sql
UPDATE users 
SET role = 'user', updated_at = CURRENT_TIMESTAMP
WHERE email = 'user@example.com' AND role = 'provider';

-- Remove provider record if exists
DELETE FROM providers 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

---

### Issue 2: Provider missing provider record
**Problem:** User has `role = 'provider'` but no record in `providers` table

**Fix:**
```sql
-- Create missing provider record
INSERT INTO providers (user_id, name, email, phone, created_at, updated_at)
SELECT id, name, email, phone, created_at, updated_at
FROM users
WHERE email = 'provider@example.com' 
  AND role = 'provider'
  AND id NOT IN (SELECT user_id FROM providers);
```

---

### Issue 3: User has provider record but role is 'user'
**Problem:** User has `role = 'user'` but has a record in `providers` table

**Fix:**
```sql
-- Remove incorrect provider record
DELETE FROM providers 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com' AND role = 'user');
```

---

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "test123",
    "phone": "+1234567890"
  }'
```

**Verify:**
- User created with `role = 'user'`
- No provider record created

---

### Test Provider Registration
```bash
curl -X POST http://localhost:3001/api/users/register/provider \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Provider",
    "email": "testprovider@example.com",
    "password": "test123",
    "phone": "+1234567890",
    "specialty": "Yoga",
    "title": "Yoga Instructor",
    "bio": "Test bio",
    "hourlyRate": 100
  }'
```

**Verify:**
- User created with `role = 'provider'`
- Provider record created and linked

---

## Summary

✅ **User Registration:**
- Endpoint: `/api/users/register`
- Creates: `users` table record only
- Role: Always `'user'`
- Provider record: Never created

✅ **Provider Registration:**
- Endpoint: `/api/users/register/provider`
- Creates: `users` table record + `providers` table record
- Role: Always `'provider'`
- Provider record: Always created

✅ **Separation:**
- Two separate endpoints
- Two separate frontend forms
- Clear data integrity rules
- No mixing of roles or records

