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
 * - GET /users/providers - Get all providers (with optional filters)
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
      // Store token if provided
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', response.user.role || 'user')
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
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', response.user.role || 'user')
        localStorage.setItem('loginMethod', credentials.loginMethod || 'email')
      }
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Login with Google OAuth
   * @param {Object} googleData - { idToken, role }
   * @returns {Promise<Object>} User object with token
   */
  async loginWithGoogle(googleData) {
    if (this.useMock) {
      return this.mockGoogleLogin(googleData)
    }

    try {
      const response = await apiClient.post(`${this.baseUrl}/login/google`, googleData)
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', response.user.role || 'user')
        localStorage.setItem('loginMethod', 'google')
        // Store profile incomplete status
        if (response.user.profileIncomplete) {
          localStorage.setItem('profileIncomplete', 'true')
        } else {
          localStorage.removeItem('profileIncomplete')
        }
      }
      return response
    } catch (error) {
      console.error('Google login error:', error)
      throw error
    }
  }

  /**
   * Complete Google profile (for Google OAuth users)
   * @param {Object} profileData - { name, dateOfBirth, phone }
   * @returns {Promise<Object>} Updated user profile
   */
  async completeGoogleProfile(profileData) {
    if (this.useMock) {
      return this.mockCompleteGoogleProfile(profileData)
    }

    try {
      const response = await apiClient.post(`${this.baseUrl}/profile/complete-google`, profileData)
      if (response.user) {
        localStorage.removeItem('profileIncomplete')
      }
      return response
    } catch (error) {
      console.error('Complete Google profile error:', error)
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
      // Clear local storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userRole')
      localStorage.removeItem('loginMethod')
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

  /**
   * Get all providers (for user dashboard)
   * @param {Object} filters - { status, verified, specialty }
   * @returns {Promise<Array>} Array of provider objects
   */
  async getAllProviders(filters = {}) {
    if (this.useMock) {
      return this.mockGetAllProviders(filters)
    }

    try {
      // Build query string from filters object
      const queryParams = new URLSearchParams()
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.verified !== undefined) queryParams.append('verified', filters.verified)
      if (filters.specialty) queryParams.append('specialty', filters.specialty)
      if (filters.search) queryParams.append('search', filters.search)
      
      const queryString = queryParams.toString()
      const url = queryString 
        ? `${this.baseUrl}/providers?${queryString}` 
        : `${this.baseUrl}/providers`
      
      // Backend returns { providers: [...] }, extract the array
      const response = await apiClient.get(url)
      return response.providers || []
    } catch (error) {
      console.error('Get all providers error:', error)
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
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userRole')
    localStorage.removeItem('loginMethod')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    return { message: 'Logout successful' }
  }

  async mockGetProfile() {
    await new Promise(resolve => setTimeout(resolve, 300))
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      return JSON.parse(stored)
    }
    return {
      id: 1,
      email: 'user@example.com',
      name: 'User',
      role: 'user',
    }
  }

  async mockUpdateProfile(profileData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const current = await this.mockGetProfile()
    const updated = { ...current, ...profileData, updatedAt: new Date().toISOString() }
    localStorage.setItem('currentUser', JSON.stringify(updated))
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

  async mockGoogleLogin(googleData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = {
      id: Date.now(),
      email: 'user@gmail.com',
      name: 'Google User',
      role: googleData.role || 'user',
      picture: null,
      profileIncomplete: true,
    }

    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userRole', user.role)
    localStorage.setItem('loginMethod', 'google')
    localStorage.setItem('profileIncomplete', 'true')
    localStorage.setItem('currentUser', JSON.stringify(user))

    return {
      user,
      token: 'mock-google-token-' + Date.now(),
      message: 'Google login successful',
    }
  }

  async mockCompleteGoogleProfile(profileData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const current = await this.mockGetProfile()
    const updated = { 
      ...current, 
      ...profileData, 
      updatedAt: new Date().toISOString(),
      profileIncomplete: false
    }
    localStorage.setItem('currentUser', JSON.stringify(updated))
    localStorage.removeItem('profileIncomplete')
    return { user: updated, message: 'Profile completed successfully' }
  }

  async mockGetAllProviders(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock providers matching backend response format
    const mockProviders = [
      {
        id: 1,
        name: 'Dr. Maya Patel',
        email: 'maya.patel@example.com',
        specialty: 'Yoga Therapy',
        title: 'Certified Yoga Therapist',
        status: 'ready',
        verified: true,
        rating: 4.8,
        reviewsCount: 45,
        hourlyRate: 50,
        bio: 'Experienced yoga therapist specializing in stress management',
      },
      {
        id: 2,
        name: 'Sarah Rodriguez',
        email: 'sarah.rodriguez@example.com',
        specialty: 'Meditation',
        title: 'Meditation Instructor',
        status: 'ready',
        verified: true,
        rating: 4.9,
        reviewsCount: 38,
        hourlyRate: 60,
        bio: 'Certified meditation instructor with 10+ years of experience',
      },
    ]
    
    // Apply filters (matching backend behavior)
    let filtered = [...mockProviders]
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }
    if (filters.verified !== undefined) {
      filtered = filtered.filter(p => p.verified === filters.verified)
    }
    if (filters.specialty) {
      filtered = filtered.filter(p => 
        p.specialty.toLowerCase().includes(filters.specialty.toLowerCase())
      )
    }
    
    return filtered
  }
}

// Export singleton instance
export default new UserService()




