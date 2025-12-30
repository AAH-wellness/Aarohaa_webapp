# Remove localStorage Migration Guide

## Overview
This document tracks the migration from localStorage to database-backed APIs. All data storage and retrieval must happen through backend APIs, with only the JWT auth token stored in localStorage (standard practice).

## Completed Changes

### ✅ Services Updated
- `userService.js` - Only stores `authToken` in localStorage
- Added `checkAuthStatus()` method to verify login from API

### ✅ Components Updated
- `App.jsx` - Checks auth status from API instead of localStorage
- `Register.jsx` - Removed user data storage, only keeps `rememberEmail` preference

## Remaining Work

### 🔄 Components Needing Updates

1. **Login.jsx**
   - Remove: `localStorage.setItem('currentUser')`
   - Remove: `localStorage.setItem('isLoggedIn')`
   - Remove: `localStorage.setItem('userRole')`
   - Remove: `localStorage.setItem('loginMethod')`
   - Keep: `localStorage.setItem('rememberEmail')` (user preference only)
   - Keep: `localStorage.setItem('authToken')` (handled by userService)

2. **Profile.jsx**
   - Remove: All localStorage reads for user data
   - Use: `userService.getProfile()` to fetch from API
   - Use: `userService.updateProfile()` to save to API

3. **BookAppointment.jsx**
   - Remove: `localStorage.setItem('appointments')`
   - Use: `appointmentService.createAppointment()` to save to API

4. **MyAppointments.jsx**
   - Remove: `localStorage.getItem('appointments')`
   - Use: `appointmentService.getUpcomingAppointments()` to fetch from API

5. **All Dashboard Components**
   - Remove: All `localStorage.getItem()` calls
   - Use: Appropriate service methods to fetch from APIs
   - Show empty states when no data available

6. **Header.jsx**
   - Remove: `localStorage.getItem('currentUser')`
   - Use: `userService.getProfile()` or pass user data as props

### 🔄 Services Needing Updates

1. **appointmentService.js**
   - Remove: All mock implementations that use localStorage
   - Ensure: All methods call backend APIs

2. **paymentService.js**
   - Remove: localStorage usage
   - Use: Backend API for all payment operations

3. **adminService.js**
   - Remove: localStorage usage
   - Use: Backend API for all admin operations

4. **analyticsService.js**
   - Remove: localStorage usage
   - Use: Backend API for all analytics data

### 🔄 Backend Endpoints Needed

The following backend endpoints must be implemented:

1. **Appointments**
   - `GET /api/appointments` - Get all appointments
   - `GET /api/appointments/:id` - Get appointment by ID
   - `POST /api/appointments` - Create appointment
   - `PUT /api/appointments/:id` - Update appointment
   - `DELETE /api/appointments/:id` - Cancel appointment
   - `GET /api/appointments/upcoming` - Get upcoming appointments
   - `GET /api/appointments/user/:userId` - Get user's appointments
   - `GET /api/appointments/provider/:providerId` - Get provider's appointments

2. **Payments**
   - `GET /api/payments` - Get all payments
   - `POST /api/payments` - Create payment
   - `GET /api/payments/user/:userId` - Get user's payments
   - `GET /api/payments/provider/:providerId` - Get provider's payments

3. **Analytics**
   - `GET /api/analytics/stats` - Get platform statistics
   - `GET /api/analytics/trends` - Get usage trends
   - `GET /api/analytics/revenue` - Get revenue data

4. **Admin**
   - `GET /api/admin/users` - Get all users
   - `GET /api/admin/providers` - Get all providers
   - `GET /api/admin/sessions` - Get active sessions
   - `GET /api/admin/audit-logs` - Get audit logs

## localStorage Usage Rules

### ✅ ALLOWED
- `authToken` - JWT token for authentication (standard practice)
- `rememberEmail` - User preference for remembering email (optional, can be removed)

### ❌ NOT ALLOWED
- User data (name, email, role, etc.) - Must come from API
- Appointments - Must come from API
- Payments - Must come from API
- Analytics data - Must come from API
- Admin data - Must come from API
- Any other application data - Must come from API

## Migration Strategy

1. **Phase 1: Services** ✅ (Completed)
   - Update all services to use APIs
   - Remove localStorage from service layer

2. **Phase 2: Components** 🔄 (In Progress)
   - Update components to use services
   - Remove direct localStorage access
   - Add loading states for API calls

3. **Phase 3: Backend** ⏳ (Pending)
   - Implement all required endpoints
   - Add database models and controllers
   - Add authentication middleware

4. **Phase 4: Testing** ⏳ (Pending)
   - Test all data flows
   - Verify no localStorage usage (except authToken)
   - Test error handling

## Testing Checklist

- [ ] No localStorage.getItem() calls (except authToken and rememberEmail)
- [ ] No localStorage.setItem() calls (except authToken and rememberEmail)
- [ ] All data fetched from APIs
- [ ] All data saved to APIs
- [ ] Error handling for API failures
- [ ] Loading states for async operations
- [ ] Empty states when no data available

