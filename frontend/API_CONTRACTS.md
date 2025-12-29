# API Contracts Documentation

This document defines the API contracts for all microservices. The backend team should implement these endpoints to match the frontend expectations.

## Overview

The application uses a microservices architecture with the following services:

1. **User Service** (Port 3001)
2. **Appointment Service** (Port 3002)
3. **Provider Service** (Port 3003)
4. **Payment Service** (Port 3004)
5. **Admin Service** (Port 3005)
6. **Notification Service** (Port 3006)
7. **Analytics Service** (Port 3007)

## Authentication

All API requests (except login/register) require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Common Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "status": "success"
}
```

### Error Response
```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "status": 400
  }
}
```

## 1. User Service (`http://localhost:3001/api`)

### POST /users/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "user"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "token": "jwt_token_here"
}
```

### POST /users/login
User login.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "loginMethod": "email"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

### POST /users/logout
Logout user.

**Response:**
```json
{
  "message": "Logout successful"
}
```

### GET /users/profile
Get current user profile.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### PUT /users/profile
Update user profile.

**Request:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Updated",
  "phone": "+1234567890",
  "updatedAt": "2024-01-16T10:00:00Z"
}
```

### POST /users/forgot-password
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

### POST /users/reset-password
Reset password.

**Request:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

---

## 2. Appointment Service (`http://localhost:3002/api`)

### GET /appointments
Get all appointments with optional filters.

**Query Parameters:**
- `userId` - Filter by user ID
- `providerId` - Filter by provider ID
- `status` - Filter by status (pending, confirmed, completed, cancelled)
- `dateFrom` - Filter from date (ISO format)
- `dateTo` - Filter to date (ISO format)

**Response:**
```json
[
  {
    "id": "apt_123",
    "userId": "user_123",
    "providerId": "provider_456",
    "providerName": "Dr. Maya Patel",
    "userName": "John Doe",
    "dateTime": "2024-01-20T10:00:00Z",
    "serviceType": "Video",
    "duration": 60,
    "amount": 50,
    "status": "confirmed",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### GET /appointments/:id
Get appointment by ID.

**Response:**
```json
{
  "id": "apt_123",
  "userId": "user_123",
  "providerId": "provider_456",
  "dateTime": "2024-01-20T10:00:00Z",
  "status": "confirmed"
}
```

### POST /appointments
Create new appointment.

**Request:**
```json
{
  "providerId": "provider_456",
  "dateTime": "2024-01-20T10:00:00Z",
  "serviceType": "Video",
  "duration": 60,
  "amount": 50
}
```

**Response:**
```json
{
  "id": "apt_123",
  "providerId": "provider_456",
  "dateTime": "2024-01-20T10:00:00Z",
  "status": "confirmed",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### PUT /appointments/:id
Update appointment.

**Request:**
```json
{
  "status": "completed"
}
```

### DELETE /appointments/:id
Cancel appointment.

**Response:**
```json
{
  "message": "Appointment cancelled successfully"
}
```

### GET /appointments/user/:userId
Get user's appointments.

### GET /appointments/provider/:providerId
Get provider's appointments.

### GET /appointments/upcoming
Get upcoming appointments.

---

## 3. Provider Service (`http://localhost:3003/api`)

### GET /providers
Get all providers.

**Query Parameters:**
- `specialty` - Filter by specialty
- `verified` - Filter by verification status
- `status` - Filter by status

**Response:**
```json
[
  {
    "id": "provider_456",
    "name": "Dr. Maya Patel",
    "email": "maya.patel@example.com",
    "specialty": "Yoga Therapy",
    "verified": true,
    "status": "verified",
    "rating": 4.8,
    "sessionsCompleted": 45,
    "hourlyRate": 50,
    "bio": "Experienced yoga therapist"
  }
]
```

### GET /providers/:id
Get provider by ID.

### POST /providers
Create new provider.

### PUT /providers/:id
Update provider.

### GET /providers/:id/availability
Get provider availability.

**Response:**
```json
{
  "providerId": "provider_456",
  "schedule": {
    "monday": { "available": true, "hours": "9:00 AM - 5:00 PM" },
    "tuesday": { "available": true, "hours": "9:00 AM - 5:00 PM" }
  }
}
```

### PUT /providers/:id/availability
Update provider availability.

### POST /providers/:id/verify
Verify provider (admin only).

**Request:**
```json
{
  "verified": true
}
```

---

## 4. Payment Service (`http://localhost:3004/api`)

### POST /payments/process
Process payment.

**Request:**
```json
{
  "amount": 50,
  "currency": "USD",
  "method": "wallet",
  "appointmentId": "apt_123"
}
```

**Response:**
```json
{
  "id": "pay_123",
  "amount": 50,
  "currency": "USD",
  "status": "completed",
  "transactionId": "txn_123",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### GET /payments/:id
Get payment by ID.

### GET /payments/user/:userId
Get user's payment history.

### POST /payments/refund
Process refund.

**Request:**
```json
{
  "paymentId": "pay_123",
  "amount": 50,
  "reason": "Cancellation"
}
```

### POST /wallet/connect
Connect wallet.

**Request:**
```json
{
  "walletName": "Phantom",
  "address": "wallet_address",
  "network": "Solana"
}
```

### POST /wallet/disconnect
Disconnect wallet.

### GET /wallet/balance
Get wallet balance.

**Query Parameters:**
- `address` - Wallet address

**Response:**
```json
{
  "address": "wallet_address",
  "balance": "1.25",
  "currency": "SOL",
  "usdValue": 125.50
}
```

### GET /wallet/transactions
Get wallet transactions.

**Query Parameters:**
- `address` - Wallet address
- `fromDate` - From date
- `toDate` - To date

---

## 5. Admin Service (`http://localhost:3005/api`)

### GET /admin/users
Get all users (admin only).

**Query Parameters:**
- `status` - Filter by status
- `search` - Search term
- `sortBy` - Sort field

### GET /admin/users/:id
Get user by ID.

### PUT /admin/users/:id
Update user.

### DELETE /admin/users/:id
Delete user.

### GET /admin/providers
Get all providers.

### PUT /admin/providers/:id/verify
Verify provider.

### GET /admin/appointments
Get all appointments.

### GET /admin/sessions
Get active sessions.

**Response:**
```json
[
  {
    "id": "session_123",
    "providerName": "Dr. Maya Patel",
    "userName": "John Doe",
    "startTime": "2024-01-20T10:00:00Z",
    "duration": 45,
    "status": "active",
    "connectionQuality": "excellent"
  }
]
```

### GET /admin/analytics
Get analytics data.

**Query Parameters:**
- `timeRange` - 7d, 30d, 90d
- `metrics` - Comma-separated metrics

### GET /admin/audit-logs
Get audit logs.

**Query Parameters:**
- `type` - Log type
- `dateFrom` - From date
- `dateTo` - To date
- `search` - Search term

### GET /admin/settings
Get platform settings.

**Response:**
```json
{
  "platformName": "Aarohaa Wellness",
  "platformEmail": "admin@aarohaa.com",
  "sessionDuration": 60,
  "maintenanceMode": false,
  "allowNewRegistrations": true
}
```

### PUT /admin/settings
Update platform settings.

---

## 6. Notification Service (`http://localhost:3006/api`)

### POST /notifications/send
Send notification.

**Request:**
```json
{
  "userId": "user_123",
  "type": "appointment_reminder",
  "message": "Your appointment is in 1 hour",
  "priority": "high"
}
```

### GET /notifications/user/:userId
Get user notifications.

### PUT /notifications/:id/read
Mark notification as read.

### POST /notifications/email
Send email notification.

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Appointment Reminder",
  "body": "Your appointment is scheduled...",
  "template": "appointment_reminder"
}
```

---

## 7. Analytics Service (`http://localhost:3007/api`)

### GET /analytics/dashboard
Get dashboard analytics.

**Query Parameters:**
- `timeRange` - 7d, 30d, 90d

**Response:**
```json
{
  "totalUsers": 1250,
  "totalProviders": 3,
  "activeSessions": 2,
  "todayAppointments": 5,
  "totalRevenue": 5000
}
```

### GET /analytics/usage
Get usage trends.

### GET /analytics/revenue
Get revenue data.

### GET /analytics/sessions
Get session analytics.

### GET /analytics/wallet
Get wallet activity analytics.

### POST /analytics/reports
Generate report.

**Request:**
```json
{
  "type": "user_activity",
  "format": "csv",
  "timeRange": "30d"
}
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Service URLs (update when backend is ready)
VITE_USER_SERVICE_URL=http://localhost:3001/api
VITE_APPOINTMENT_SERVICE_URL=http://localhost:3002/api
VITE_PROVIDER_SERVICE_URL=http://localhost:3003/api
VITE_PAYMENT_SERVICE_URL=http://localhost:3004/api
VITE_ADMIN_SERVICE_URL=http://localhost:3005/api
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3006/api
VITE_ANALYTICS_SERVICE_URL=http://localhost:3007/api

# Use mock services (set to false when backend is ready)
VITE_USE_MOCK_SERVICES=true
```

---

## Migration Guide for Backend Team

1. **Start with one service** - Begin with User Service
2. **Update environment variables** - Set `VITE_USE_MOCK_SERVICES=false` and update service URLs
3. **Test integration** - Verify API calls work correctly
4. **Gradually migrate** - Move to other services one by one
5. **Update API client** - Adjust error handling, retries, etc. as needed

The frontend is already structured to work with real APIs - just swap the mock implementations!




