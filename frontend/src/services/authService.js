/**
 * Authentication Service
 * 
 * Centralized service for token validation, expiration checking, and authentication state management.
 * Provides enterprise-standard authentication utilities.
 */

/**
 * Decode JWT token without verification (client-side check only)
 * Server-side verification is still required for security
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function decodeToken(token) {
  if (!token) return null;
  
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (base64url)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} True if token is expired or invalid
 */
function isTokenExpired(token) {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
}

/**
 * Validate token expiration and structure
 * @param {string} token - JWT token string
 * @returns {Object} Validation result with isValid and reason
 */
function validateToken(token) {
  if (!token) {
    return {
      isValid: false,
      reason: 'NO_TOKEN',
      message: 'No token found'
    };
  }
  
  const decoded = decodeToken(token);
  if (!decoded) {
    return {
      isValid: false,
      reason: 'INVALID_FORMAT',
      message: 'Token format is invalid'
    };
  }
  
  if (!decoded.exp) {
    return {
      isValid: false,
      reason: 'NO_EXPIRATION',
      message: 'Token has no expiration claim'
    };
  }
  
  if (isTokenExpired(token)) {
    return {
      isValid: false,
      reason: 'EXPIRED',
      message: 'Token has expired'
    };
  }
  
  return {
    isValid: true,
    reason: null,
    message: 'Token is valid',
    decoded
  };
}

/**
 * Clear all authentication-related data from localStorage
 * This ensures a clean logout state
 */
function clearAuthData() {
  // Core auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('loginMethod');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('lastLoginTime');
  
  // Optional: Clear remember email (user preference, not auth data)
  // localStorage.removeItem('rememberEmail');
  
  // Note: walletData is cleared separately in disconnectWallet()
  // Note: appointments are kept (user data, not auth data)
}

/**
 * Logout handler - clears all authentication data
 * @param {Function} onLogout - Optional callback after logout
 */
function logout(onLogout) {
  clearAuthData();
  if (onLogout && typeof onLogout === 'function') {
    onLogout();
  }
}

/**
 * Get current authentication token from localStorage
 * @returns {string|null} Token string or null
 */
function getAuthToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('accessToken');
}

/**
 * Check if user is currently logged in (has valid token)
 * @returns {boolean} True if user has a valid, non-expired token
 */
function isLoggedIn() {
  const token = getAuthToken();
  if (!token) return false;
  
  return !isTokenExpired(token);
}

export {
  decodeToken,
  isTokenExpired,
  validateToken,
  clearAuthData,
  logout,
  getAuthToken,
  isLoggedIn
};


