# Backend Connection Guide

This document explains how the frontend connects to the backend services.

## Backend Location

**Backend Folder**: `E:\Work\Workspace\MASTERS\Aarohaa Webapp backend`

All backend development should be done in this folder. The frontend is configured to communicate with services running from this location.

## Architecture

The frontend uses a **microservices architecture** with the following services:

| Service | Port | Base URL | Purpose |
|---------|------|----------|---------|
| User Service | 3001 | `http://localhost:3001/api` | User authentication, profiles, registration |
| Appointment Service | 3002 | `http://localhost:3002/api` | Appointment booking, management, scheduling |
| Provider Service | 3003 | `http://localhost:3003/api` | Provider profiles, availability, management |
| Payment Service | 3004 | `http://localhost:3004/api` | Payments, transactions, wallet operations |
| Admin Service | 3005 | `http://localhost:3005/api` | Admin operations, platform management |
| Notification Service | 3006 | `http://localhost:3006/api` | Notifications, emails, alerts |
| Analytics Service | 3007 | `http://localhost:3007/api` | Analytics, reporting, statistics |

## Configuration

### Environment Variables

The frontend uses environment variables to configure backend connections. Create a `.env` file in the frontend root:

```env
# Backend Service URLs
VITE_USER_SERVICE_URL=http://localhost:3001/api
VITE_APPOINTMENT_SERVICE_URL=http://localhost:3002/api
VITE_PROVIDER_SERVICE_URL=http://localhost:3003/api
VITE_PAYMENT_SERVICE_URL=http://localhost:3004/api
VITE_ADMIN_SERVICE_URL=http://localhost:3005/api
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3006/api
VITE_ANALYTICS_SERVICE_URL=http://localhost:3007/api

# Use mock services (set to 'false' when backend is ready)
VITE_USE_MOCK_SERVICES=true
```

### Vite Proxy Configuration

The `vite.config.js` includes proxy configuration for development. This allows the frontend dev server to proxy API requests to backend services, avoiding CORS issues.

## Service Layer

The frontend uses a service layer located in `src/services/`:

- **config.js**: Contains all API endpoint configurations
- **apiClient.js**: Base HTTP client with authentication, error handling, retries
- **userService.js**: User-related API calls
- **appointmentService.js**: Appointment-related API calls
- **providerService.js**: Provider-related API calls
- **paymentService.js**: Payment-related API calls
- **adminService.js**: Admin-related API calls
- **notificationService.js**: Notification-related API calls
- **analyticsService.js**: Analytics-related API calls

## Mock Services (Development)

By default, the frontend uses **mock services** that:
- Store data in `localStorage`
- Simulate API delays
- Work without backend running
- Perfect for frontend development

To use real backend services:
1. Set `VITE_USE_MOCK_SERVICES=false` in `.env`
2. Ensure backend services are running
3. Verify service URLs are correct

## API Contracts

See `API_CONTRACTS.md` for detailed API specifications including:
- Request/response formats
- Endpoints
- Authentication requirements
- Error codes

## Development Workflow

### Frontend Development (No Backend)
1. Frontend uses mock services automatically
2. All data stored in localStorage
3. No backend required

### Backend Development
1. Implement services in `E:\Work\Workspace\MASTERS\Aarohaa Webapp backend`
2. Start services on configured ports (3001-3007)
3. Test with Postman/Thunder Client
4. Update frontend `.env` to connect

### Integration Testing
1. Start backend services
2. Set `VITE_USE_MOCK_SERVICES=false`
3. Test frontend with real backend
4. Verify all API calls work correctly

## Troubleshooting

### CORS Issues
- The Vite proxy should handle CORS in development
- Ensure backend services allow requests from `http://localhost:5173`

### Connection Refused
- Verify backend services are running
- Check service ports match configuration
- Verify service URLs in `.env`

### Mock Services Still Active
- Check `VITE_USE_MOCK_SERVICES` is set to `false`
- Restart the Vite dev server after changing `.env`
- Clear browser cache if needed

## Next Steps

1. **Backend Team**: Implement services in the backend folder
2. **Frontend Team**: Continue using mock services for development
3. **Integration**: Connect services one at a time for testing
4. **Production**: Update service URLs for production environment

## Related Documentation

- `MICROSERVICES_MIGRATION_GUIDE.md` - Detailed migration guide
- `API_CONTRACTS.md` - API specifications
- `README.md` - General project documentation


