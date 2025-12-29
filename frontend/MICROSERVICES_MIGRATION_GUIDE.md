# Microservices Migration Guide

This guide explains how the frontend is structured for microservices architecture and how the backend team can integrate their services.

## Architecture Overview

The frontend is now structured with a **Service Layer** that abstracts all backend communication. This allows:

1. **Easy Backend Integration** - Just swap mock services with real API calls
2. **Consistent API Interface** - All services follow the same pattern
3. **Environment-Based Configuration** - Switch between mock and real services via environment variables
4. **Type Safety** - Clear API contracts for each service

## Service Layer Structure

```
src/services/
├── config.js              # API configuration and endpoints
├── apiClient.js           # Base HTTP client with auth, retries, error handling
├── userService.js         # User authentication and profile management
├── appointmentService.js  # Appointment booking and management
├── providerService.js     # Provider management and availability
├── paymentService.js      # Payments and wallet operations
├── adminService.js        # Admin operations and platform management
├── notificationService.js # Notifications and emails
├── analyticsService.js    # Analytics and reporting
└── index.js               # Central export for all services
```

## How It Works

### Current State (Mock Services)
- All services use `localStorage` for data persistence
- Mock implementations simulate API delays
- Perfect for frontend development without backend

### Future State (Real Services)
- Services make HTTP requests to backend microservices
- Real authentication, error handling, and data persistence
- Backend team just needs to implement the API contracts

## Migration Steps for Backend Team

### Step 1: Set Up Environment Variables

Create a `.env` file in the project root:

```env
VITE_USER_SERVICE_URL=http://localhost:3001/api
VITE_APPOINTMENT_SERVICE_URL=http://localhost:3002/api
VITE_PROVIDER_SERVICE_URL=http://localhost:3003/api
VITE_PAYMENT_SERVICE_URL=http://localhost:3004/api
VITE_ADMIN_SERVICE_URL=http://localhost:3005/api
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3006/api
VITE_ANALYTICS_SERVICE_URL=http://localhost:3007/api
VITE_USE_MOCK_SERVICES=false
```

### Step 2: Implement One Service at a Time

Start with the **User Service** as it's the foundation:

1. Implement the User Service endpoints (see `API_CONTRACTS.md`)
2. Test with Postman/Thunder Client
3. Update `.env` to point to your service
4. Set `VITE_USE_MOCK_SERVICES=false`
5. Test the frontend - login/register should work with your backend

### Step 3: Gradually Migrate Other Services

Follow the same pattern for each service:
- Appointment Service
- Provider Service
- Payment Service
- Admin Service
- Notification Service
- Analytics Service

### Step 4: Update API Client (if needed)

The `apiClient.js` handles:
- Authentication headers
- Error handling
- Retry logic
- Request/response interceptors

You may need to adjust:
- Token storage/retrieval method
- Error response format
- Retry conditions
- Timeout values

## Service Implementation Pattern

Each service follows this pattern:

```javascript
class ServiceName {
  constructor() {
    this.baseUrl = `${API_CONFIG.SERVICE_NAME}/endpoint`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  async methodName(params) {
    if (this.useMock) {
      return this.mockMethodName(params)
    }

    try {
      return await apiClient.get/post/put/delete(url, data)
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

  // Mock implementation (current behavior)
  async mockMethodName(params) {
    // Uses localStorage
  }
}
```

## Component Usage Example

### Before (Direct localStorage):
```javascript
const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
```

### After (Service Layer):
```javascript
import { appointmentService } from '../services'

const appointments = await appointmentService.getUpcomingAppointments()
```

## API Contracts

See `API_CONTRACTS.md` for detailed API specifications including:
- Request/response formats
- Query parameters
- Error codes
- Authentication requirements

## Testing Strategy

1. **Development**: Use mock services (`VITE_USE_MOCK_SERVICES=true`)
2. **Integration Testing**: Connect to one service at a time
3. **Production**: All services connected (`VITE_USE_MOCK_SERVICES=false`)

## Benefits of This Architecture

✅ **Separation of Concerns** - Frontend logic separate from data access  
✅ **Easy Testing** - Mock services for frontend testing  
✅ **Parallel Development** - Frontend and backend can work independently  
✅ **Type Safety** - Clear contracts prevent integration issues  
✅ **Maintainability** - Centralized API logic  
✅ **Scalability** - Easy to add new services  

## Next Steps

1. Review `API_CONTRACTS.md` for API specifications
2. Implement User Service first
3. Test integration with frontend
4. Gradually migrate other services
5. Update error handling as needed
6. Add request/response logging if needed

## Support

If you need to modify the service layer:
- Update `apiClient.js` for common HTTP logic
- Update individual service files for service-specific logic
- All changes are backward compatible with mock services




