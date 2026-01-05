/**
 * API Configuration for Microservices Architecture
 * 
 * This file contains all API endpoint configurations.
 * When backend services are ready, update these URLs to point to actual microservices.
 */

const API_CONFIG = {
  // Base URLs for each microservice
  USER_SERVICE: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001/api',
  APPOINTMENT_SERVICE: import.meta.env.VITE_APPOINTMENT_SERVICE_URL || 'http://localhost:3002/api',
  PROVIDER_SERVICE: import.meta.env.VITE_PROVIDER_SERVICE_URL || 'http://localhost:3003/api',
  PAYMENT_SERVICE: import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:3004/api',
  ADMIN_SERVICE: import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:3005/api',
  NOTIFICATION_SERVICE: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3006/api',
  ANALYTICS_SERVICE: import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3007/api',
  
  // Use mock services in development (set to false when backend is ready)
  // Default to false to use real backend API
  USE_MOCK_SERVICES: import.meta.env.VITE_USE_MOCK_SERVICES === 'true',
  
  // API timeout
  TIMEOUT: 30000, // 30 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
}

export default API_CONFIG




