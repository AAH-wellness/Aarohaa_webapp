# Login Validations - Complete Guide

## Overview
Login validations are applied at both **Frontend** (client-side) and **Backend** (server-side) levels to ensure security and data integrity.

---

## Frontend Validations (Client-Side)

### 1. Email Validation
**Location:** `frontend/src/components/Login.jsx`

**Validations:**
- ✅ **Required**: Email field cannot be empty
- ✅ **Format**: Must be a valid email format (e.g., `user@example.com`)
- ✅ **Length**: Maximum 254 characters (RFC 5321 standard)
- ✅ **Format Checks**:
  - Cannot contain consecutive dots (`..`)
  - Cannot start with dot (`.`)
  - Cannot start with `@`
- ✅ **Admin Mode**: If admin login, email must end with `@aarohaa.io`

**Error Messages:**
- "Email is required"
- "Please enter a valid email address"
- "Email address is too long"
- "Admin access requires an @aarohaa.io email address" (admin mode only)

### 2. Password Validation
**Location:** `frontend/src/components/Login.jsx`

**Validations:**
- ✅ **Required**: Password field cannot be empty
- ✅ **Minimum Length**: At least 6 characters
- ✅ **Maximum Length**: Maximum 128 characters

**Error Messages:**
- "Password is required"
- "Password must be at least 6 characters long"
- "Password must be less than 128 characters"

### 3. Form Submission Validation
- ✅ Both email and password must pass validation before submission
- ✅ Form cannot be submitted if any validation errors exist

---

## Backend Validations (Server-Side)

### 1. Email Validation
**Location:** `backend/authentication/validators/auth.validators.js`

**Validations:**
- ✅ **Required**: Email must be provided
- ✅ **Format**: Must be a valid email address
- ✅ **Normalization**: Email is normalized (lowercased, trimmed)

**Error Message:**
- "Please provide a valid email address"

### 2. Password Validation
**Location:** `backend/authentication/validators/auth.validators.js`

**Validations:**
- ✅ **Required**: Password must be provided
- ✅ **Minimum Length**: At least 6 characters

**Error Message:**
- "Password is required"
- "Password must be at least 6 characters long"

### 3. Login Method Validation
**Location:** `backend/authentication/validators/auth.validators.js`

**Validations:**
- ✅ **Optional**: `loginMethod` is optional
- ✅ **Allowed Values**: Must be one of: `'email'`, `'google'`, or `'wallet'`
- ✅ **Default**: If not provided, defaults to `'email'`

**Error Message:**
- "Login method must be email, google, or wallet"

---

## Database Validations (Authentication)

### 1. User Existence Check
**Location:** `backend/authentication/controllers/auth.controller.js`

**Validation:**
- ✅ **User Must Exist**: Email must be registered in database
- ✅ **Database Query**: Checks `users` table for matching email

**Error Response:**
```json
{
  "error": {
    "message": "User not found. Please check your email or sign up for a new account.",
    "code": "USER_NOT_FOUND",
    "status": 404
  }
}
```

### 2. Password Verification
**Location:** `backend/authentication/controllers/auth.controller.js`

**Validation:**
- ✅ **Password Match**: Provided password must match stored hashed password
- ✅ **Bcrypt Comparison**: Uses secure bcrypt comparison
- ✅ **Case Sensitive**: Passwords are case-sensitive

**Error Response:**
```json
{
  "error": {
    "message": "Invalid password. Please check your password and try again.",
    "code": "INVALID_PASSWORD",
    "status": 401
  }
}
```

---

## Complete Validation Flow

### Step 1: Frontend Client-Side Validation
```
User enters email/password
    ↓
Email format validation
    ↓
Password length validation
    ↓
If errors → Show error messages, stop
    ↓
If valid → Send to backend
```

### Step 2: Backend Server-Side Validation
```
Receive login request
    ↓
Express-validator checks:
  - Email format
  - Password required & length
  - Login method (if provided)
    ↓
If validation fails → Return 400 with errors
    ↓
If valid → Check database
```

### Step 3: Database Authentication
```
Query database for user by email
    ↓
If user not found → Return 404 "User not found"
    ↓
If user found → Compare password hash
    ↓
If password wrong → Return 401 "Invalid password"
    ↓
If password correct → Generate JWT token
    ↓
Return 200 with user data + token
```

---

## Validation Summary Table

| Validation | Frontend | Backend | Database |
|------------|----------|---------|----------|
| **Email Required** | ✅ | ✅ | - |
| **Email Format** | ✅ | ✅ | - |
| **Email Length** | ✅ (max 254) | - | - |
| **Email Normalization** | - | ✅ | - |
| **Admin Email Check** | ✅ (@aarohaa.io) | - | - |
| **Password Required** | ✅ | ✅ | - |
| **Password Min Length** | ✅ (6 chars) | ✅ (6 chars) | - |
| **Password Max Length** | ✅ (128 chars) | - | - |
| **User Exists** | - | - | ✅ |
| **Password Match** | - | - | ✅ (bcrypt) |
| **Login Method** | - | ✅ (optional) | - |

---

## Error Codes Reference

| Error Code | Status | Message | When It Occurs |
|------------|--------|---------|----------------|
| `USER_NOT_FOUND` | 404 | "User not found. Please check your email or sign up for a new account." | Email not registered |
| `INVALID_PASSWORD` | 401 | "Invalid password. Please check your password and try again." | Password doesn't match |
| `INVALID_CREDENTIALS` | 401 | "Invalid email or password" | Generic auth error |
| `VALIDATION_ERROR` | 400 | "Validation failed" | Frontend validation errors |
| `LOGIN_ERROR` | 500 | "Internal server error during login" | Server error |

---

## Security Features

### 1. Password Security
- ✅ Passwords are **hashed** using bcrypt (10 salt rounds)
- ✅ Passwords are **never** returned in API responses
- ✅ Password comparison uses **secure bcrypt.compare()**

### 2. Error Messages
- ✅ **Specific errors** for user not found vs wrong password
- ✅ **No information leakage** about whether email exists (in some cases, but user requested specific message)
- ✅ **Clear guidance** for users on what to do

### 3. Input Sanitization
- ✅ Email is **normalized** (lowercased, trimmed)
- ✅ SQL injection protection via parameterized queries
- ✅ XSS protection via input validation

---

## Testing Validations

### Test Cases

1. **Empty Email**
   - Frontend: "Email is required"
   - Backend: "Please provide a valid email address"

2. **Invalid Email Format**
   - Frontend: "Please enter a valid email address"
   - Backend: "Please provide a valid email address"

3. **Empty Password**
   - Frontend: "Password is required"
   - Backend: "Password is required"

4. **Short Password**
   - Frontend: "Password must be at least 6 characters long"
   - Backend: "Password must be at least 6 characters long"

5. **Unregistered Email**
   - Backend: "User not found. Please check your email or sign up for a new account."
   - Status: 404

6. **Wrong Password**
   - Backend: "Invalid password. Please check your password and try again."
   - Status: 401

7. **Correct Credentials**
   - Returns: User data + JWT token
   - Status: 200

---

## Code Locations

### Frontend
- **Login Component**: `frontend/src/components/Login.jsx`
- **Provider Login**: `frontend/src/components/ProviderLogin.jsx`
- **User Service**: `frontend/src/services/userService.js`

### Backend
- **Validators**: `backend/authentication/validators/auth.validators.js`
- **Controller**: `backend/authentication/controllers/auth.controller.js`
- **Routes**: `backend/authentication/routes/auth.routes.js`
- **Model**: `backend/authentication/models/user.model.js`

---

**All validations are working together to ensure secure and user-friendly login experience!** 🔒

