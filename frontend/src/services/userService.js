/**
 * User Service - Handles user authentication, registration, and profile management
 * 
 * This service abstracts user-related operations. Currently uses localStorage (mock),
 * but can be easily swapped with real API calls when backend is ready.
 * 
 * API Contract:
 * - POST /users/register - Register new user
 * - POST /users/login - User login
 * - POST /users/logout - User logout
 * - GET /users/profile - Get user profile
 * - PUT /users/profile - Update user profile
 * - POST /users/forgot-password - Request password reset
 * - POST /users/reset-password - Reset password
 */

import apiClient from './apiClient.js'
import API_CONFIG from './config.js'

class UserService {
  constructor() {
    this.baseUrl = `${API_CONFIG.USER_SERVICE}/users`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  /**
   * Register a new user
   * @param {Object} userData - { email, password, name, role }
   * @returns {Promise<Object>} User object with token
   */
  async register(userData) {
    if (this.useMock) {
      return this.mockRegister(userData)
    }

    try {
      const response = await apiClient.post(`${this.baseUrl}/register`, userData)
      // Only store auth token (standard practice for JWT)
      if (response.token) {
        localStorage.setItem('authToken', response.token)
      }
      return response
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Login user
   * @param {Object} credentials - { email, password, loginMethod }
   * @returns {Promise<Object>} User object with token
   */
  async login(credentials) {
    if (this.useMock) {
      return this.mockLogin(credentials)
    }

    try {
      const response = await apiClient.post(`${this.baseUrl}/login`, credentials)
      // Only store auth token (standard practice for JWT)
      if (response.token) {
        localStorage.setItem('authToken', response.token)
      }
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    if (this.useMock) {
      return this.mockLogout()
    }

    try {
      await apiClient.post(`${this.baseUrl}/logout`)
    } finally {
      // Only clear auth token
      localStorage.removeItem('authToken')
    }
  }

  /**
   * Check if user is logged in by verifying token with backend
   * @returns {Promise<Object|null>} User object if logged in, null otherwise
   */
  async checkAuthStatus() {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return null
    }

    try {
      // Verify token with backend
      const response = await apiClient.get(`${this.baseUrl}/profile`)
      return response.user || null
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('authToken')
      return null
    }
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getProfile() {
    if (this.useMock) {
      return this.mockGetProfile()
    }

    try {
      return await apiClient.get(`${this.baseUrl}/profile`)
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(profileData) {
    if (this.useMock) {
      return this.mockUpdateProfile(profileData)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/profile`, profileData)
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Success message
   */
  async forgotPassword(email) {
    if (this.useMock) {
      return this.mockForgotPassword(email)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/forgot-password`, { email })
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  /**
   * Reset password
   * @param {Object} resetData - { token, newPassword }
   * @returns {Promise<Object>} Success message
   */
  async resetPassword(resetData) {
    if (this.useMock) {
      return this.mockResetPassword(resetData)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/reset-password`, resetData)
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  // ========== MOCK IMPLEMENTATIONS (Current localStorage-based) ==========

  async mockRegister(userData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = {
      id: Date.now(),
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
    }

    // Store in localStorage
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userRole', user.role)
    localStorage.setItem('currentUser', JSON.stringify(user))

    return {
      user,
      token: 'mock-token-' + Date.now(),
      message: 'Registration successful',
    }
  }

  async mockLogin(credentials) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = {
      id: Date.now(),
      email: credentials.email,
      name: credentials.email.split('@')[0],
      role: credentials.loginMode || localStorage.getItem('userRole') || 'user',
    }

    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userRole', user.role)
    localStorage.setItem('loginMethod', credentials.loginMethod || 'email')
    localStorage.setItem('currentUser', JSON.stringify(user))

    if (credentials.rememberPassword) {
      localStorage.setItem('rememberEmail', credentials.email)
    }

    return {
      user,
      token: 'mock-token-' + Date.now(),
      message: 'Login successful',
    }
  }

  async mockLogout() {
    await new Promise(resolve => setTimeout(resolve, 200))
    localStorage.removeItem('authToken')
    return { message: 'Logout successful' }
  }

  async mockGetProfile() {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Mock: Return empty profile (should fetch from API)
    return {
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'User',
        role: 'user',
      }
    }
  }

  async mockUpdateProfile(profileData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const current = await this.mockGetProfile()
    const updated = { 
      user: { ...current.user, ...profileData, updatedAt: new Date().toISOString() }
    }
    return updated
  }

  async mockForgotPassword(email) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { message: 'Password reset email sent' }
  }

  async mockResetPassword(resetData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { message: 'Password reset successful' }
  }
}

// Export singleton instance
export default new UserService()




