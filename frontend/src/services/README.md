# Services Directory

This directory contains all microservice abstractions for the frontend application.

## Overview

All backend communication is abstracted through service classes. Each service:
- Has a consistent API interface
- Supports both mock (localStorage) and real (HTTP) implementations
- Handles errors gracefully
- Follows the same pattern for easy maintenance

## Services

### Core Services

- **userService.js** - User authentication, registration, profile management
- **appointmentService.js** - Appointment booking, scheduling, management
- **providerService.js** - Provider profiles, availability, verification
- **paymentService.js** - Payments, wallet connections, transactions
- **adminService.js** - Admin operations, user/provider management, platform settings
- **notificationService.js** - Notifications, emails, alerts
- **analyticsService.js** - Analytics, reports, metrics

### Infrastructure

- **config.js** - API endpoint configuration and environment variables
- **apiClient.js** - Base HTTP client with authentication, retries, error handling
- **index.js** - Central export point for all services

## Usage

### Import Services

```javascript
// Import individual service
import { userService } from '../services'

// Or import multiple services
import { userService, appointmentService, paymentService } from '../services'
```

### Example: Using User Service

```javascript
import { userService } from '../services'

// Login
const result = await userService.login({
  email: 'user@example.com',
  password: 'password123',
  loginMethod: 'email'
})

// Get profile
const profile = await userService.getProfile()

// Update profile
const updated = await userService.updateProfile({
  name: 'New Name'
})
```

### Example: Using Appointment Service

```javascript
import { appointmentService } from '../services'

// Get upcoming appointments
const appointments = await appointmentService.getUpcomingAppointments()

// Create appointment
const newAppointment = await appointmentService.createAppointment({
  providerId: 'provider_123',
  dateTime: '2024-01-20T10:00:00Z',
  serviceType: 'Video',
  duration: 60,
  amount: 50
})

// Cancel appointment
await appointmentService.cancelAppointment('appointment_id')
```

## Configuration

Services are configured via environment variables (see `.env.example`):

- `VITE_USE_MOCK_SERVICES` - Set to `false` to use real APIs
- `VITE_*_SERVICE_URL` - Base URLs for each microservice

## Mock vs Real Services

### Mock Services (Current)
- Use `localStorage` for data persistence
- Simulate API delays
- Perfect for frontend-only development

### Real Services (Future)
- Make HTTP requests to backend
- Use authentication tokens
- Handle real errors and responses

The switch is automatic based on `VITE_USE_MOCK_SERVICES` environment variable.

## Error Handling

All services throw `ApiError` on failure:

```javascript
try {
  const result = await userService.login(credentials)
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.message)
  } else {
    console.error('Network Error:', error)
  }
}
```

## Adding New Services

1. Create a new service file (e.g., `newService.js`)
2. Follow the existing pattern:
   - Constructor with `baseUrl` and `useMock`
   - Methods that check `useMock` and call either mock or real implementation
   - Mock implementations using localStorage
3. Export from `index.js`
4. Document in `API_CONTRACTS.md`

## Testing

Services can be tested independently:
- Mock services work without backend
- Real services can be tested with backend running
- Use environment variables to switch between modes




