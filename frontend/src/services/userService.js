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
      console.log('Registering user with backend API:', `${this.baseUrl}/register`)
      console.log('User data:', { ...userData, password: '***' })
      
      const response = await apiClient.post(`${this.baseUrl}/register`, userData)
      
      // Store authentication token and user role
      // All user data is saved to database (users table) by the backend
      // User data will be fetched from backend when needed using getProfile API
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
      }
      // Save user role from response
      if (response.user && response.user.role) {
        localStorage.setItem('userRole', response.user.role)
        localStorage.setItem('currentUser', JSON.stringify(response.user))
      }
      return response
    } catch (error) {
      console.error('Registration error:', error)
      console.error('Error status:', error.status)
      console.error('Error message:', error.message)
      console.error('Error data:', error.data)
      
      // Provide more helpful error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - server not reachable
        throw new Error('Cannot connect to backend server. Please ensure the authentication service is running on port 3001.')
      } else if (error.status === 501) {
        throw new Error('Backend server is not responding. Please ensure the authentication service is running on port 3001.')
      } else if (error.status === 0 || !error.status) {
        // CORS or network error
        throw new Error('Cannot connect to backend server. Please check if the server is running and CORS is configured correctly.')
      }
      throw error
    }
  }

  /**
   * Register a new provider
   * @param {Object} providerData - { email, password, name, phone, specialty, title, bio, hourlyRate }
   * @returns {Promise<Object>} Provider user object with token
   */
  async registerProvider(providerData) {
    if (this.useMock) {
      return this.mockRegisterProvider(providerData)
    }

    try {
      console.log('Registering provider with backend API:', `${this.baseUrl}/register/provider`)
      console.log('Provider data:', { ...providerData, password: '***' })
      
      const response = await apiClient.post(`${this.baseUrl}/register/provider`, providerData)
      
      // Store authentication token and user role
      // All provider data is saved to database (users + providers tables) by the backend
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
      }
      // Save user role from response
      if (response.user && response.user.role) {
        localStorage.setItem('userRole', response.user.role)
        localStorage.setItem('currentUser', JSON.stringify(response.user))
      }
      return response
    } catch (error) {
      console.error('Provider registration error:', error)
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
      // Store authentication token and user role
      // User data is stored in database, fetch from backend when needed using getProfile API
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('loginMethod', credentials.loginMethod || 'email')
      }
      // Save user role from response
      if (response.user && response.user.role) {
        localStorage.setItem('userRole', response.user.role)
        localStorage.setItem('currentUser', JSON.stringify(response.user))
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
      // Clear local storage (only authentication data)
      // User data remains in database
      localStorage.removeItem('authToken')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('loginMethod')
      localStorage.removeItem('currentUser') // Remove if exists from old implementation
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
   * Get provider profile (for provider dashboard)
   * @returns {Promise<Object>} Provider profile
   */
  async getProviderProfile() {
    if (this.useMock) {
      return this.mockGetProviderProfile()
    }

    try {
      return await apiClient.get(`${this.baseUrl}/provider/profile`)
    } catch (error) {
      console.error('Get provider profile error:', error)
      throw error
    }
  }

  /**
   * Update provider profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated provider profile
   */
  async updateProviderProfile(profileData) {
    if (this.useMock) {
      return this.mockUpdateProviderProfile(profileData)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/provider/profile`, profileData)
    } catch (error) {
      console.error('Update provider profile error:', error)
      throw error
    }
  }

  /**
   * Get provider availability
   * @returns {Promise<Object>} Provider availability schedule
   */
  async getProviderAvailability() {
    if (this.useMock) {
      return this.mockGetProviderAvailability()
    }

    try {
      return await apiClient.get(`${this.baseUrl}/provider/availability`)
    } catch (error) {
      console.error('Get provider availability error:', error)
      throw error
    }
  }

  /**
   * Update provider availability
   * @param {Object} availabilityData - Availability schedule
   * @returns {Promise<Object>} Updated availability
   */
  async updateProviderAvailability(availabilityData) {
    if (this.useMock) {
      return this.mockUpdateProviderAvailability(availabilityData)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/provider/availability`, { availability: availabilityData })
    } catch (error) {
      console.error('Update provider availability error:', error)
      throw error
    }
  }

  /**
   * Get all providers (for user dashboard)
   * @param {Object} filters - { verified, status, specialty }
   * @returns {Promise<Array>} List of providers
   */
  async getAllProviders(filters = {}) {
    if (this.useMock) {
      return this.mockGetAllProviders(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.baseUrl}/providers?${queryParams}` : `${this.baseUrl}/providers`
      const response = await apiClient.get(url)
      return response.providers || []
    } catch (error) {
      console.error('Get all providers error:', error)
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

  async mockRegisterProvider(providerData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = {
      id: Date.now(),
      email: providerData.email,
      name: providerData.name || providerData.email.split('@')[0],
      role: 'provider',
      createdAt: new Date().toISOString(),
    }

    // Store in localStorage
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userRole', 'provider')
    localStorage.setItem('currentUser', JSON.stringify(user))

    return {
      user,
      token: 'mock-token-' + Date.now(),
      message: 'Provider registration successful',
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

  async mockGetProviderProfile() {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      provider: {
        id: 1,
        name: 'Dr. Maya Patel',
        email: 'maya.patel@aarohaa.com',
        phone: '+1 234 567 8900',
        title: 'Licensed Therapist',
        specialty: 'Anxiety, Stress Management, Mindfulness',
        bio: 'Experienced therapist specializing in anxiety, stress management, and mindfulness practices.',
        hourlyRate: 180,
      }
    }
  }

  async mockUpdateProviderProfile(profileData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const current = await this.mockGetProviderProfile()
    const updated = { 
      provider: { 
        ...current.provider, 
        ...profileData, 
        updatedAt: new Date().toISOString() 
      } 
    }
    return updated
  }

  async mockGetProviderAvailability() {
    await new Promise(resolve => setTimeout(resolve, 300))
    const stored = localStorage.getItem('providerAvailability')
    if (stored) {
      return { availability: JSON.parse(stored) }
    }
    return {
      availability: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '10:00', end: '14:00' },
        sunday: { enabled: false, start: '10:00', end: '14:00' },
      }
    }
  }

  async mockUpdateProviderAvailability(availabilityData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    localStorage.setItem('providerAvailability', JSON.stringify(availabilityData))
    return {
      provider: {
        availability: availabilityData
      },
      message: 'Availability updated successfully'
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

  async mockGetAllProviders(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Return empty array for mock - real data should come from backend
    return []
  }
}

// Export singleton instance
export default new UserService()




