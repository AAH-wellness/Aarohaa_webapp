/**
 * Services Index - Central export for all microservices
 * 
 * This file provides a single import point for all services.
 * Backend team can easily see all available services and their contracts.
 */

export { default as userService } from './userService.js'
export { default as appointmentService } from './appointmentService.js'
export { default as providerService } from './providerService.js'
export { default as paymentService } from './paymentService.js'
export { default as adminService } from './adminService.js'
export { default as notificationService } from './notificationService.js'
export { default as analyticsService } from './analyticsService.js'
export { default as apiClient } from './apiClient.js'
export { default as API_CONFIG } from './config.js'




