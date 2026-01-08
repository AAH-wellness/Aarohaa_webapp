/**
 * JWT Configuration Module
 * 
 * Centralized configuration for JWT token settings.
 * This makes it easy to change token expiration and other JWT settings.
 * 
 * Environment Variables:
 * - JWT_SECRET: Secret key for signing tokens (default: development key)
 * - JWT_EXPIRES_IN: Token expiration time (default: '5m' for 5 minutes)
 *   Examples: '5m', '1h', '30m', '1d', '7d'
 */

const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '10s', // 10 seconds for testing (change back to '5m' after testing)
};

module.exports = JWT_CONFIG;

