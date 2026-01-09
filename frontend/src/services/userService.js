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
import { clearAuthData } from './authService.js'

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
   * Register a new provider
   * @param {Object} providerData - { email, password, name, phone, specialty, title, bio, hourlyRate }
   * @returns {Promise<Object>} Provider object with token
   */
  async registerProvider(providerData) {
    if (this.useMock) {
      return this.mockRegisterProvider(providerData)
    }

    try {
      const response = await apiClient.post(`${this.baseUrl}/register/provider`, providerData)
      // Store token if provided
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', response.user.role || 'provider')
      }
      return response
    } catch (error) {
      console.error('Provider registration error:', error)
      throw error
    }
  }

  /**
   * Login user (ONLY checks users table)
   * @param {Object} credentials - { email, password, loginMethod }
   * @returns {Promise<Object>} User object with token
   */
  async login(credentials) {
    if (this.useMock) {
      return this.mockLogin(credentials)
    }

    try {
      // Use /api/users/login endpoint (user login only)
      // Routes are mounted at /api/users, so login is at /api/users/login
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
   * Login provider (ONLY checks providers table)
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} Provider object with token
   */
  async loginProvider(credentials) {
    if (this.useMock) {
      return this.mockLogin(credentials)
    }

    try {
      // Use /api/users/login/provider endpoint (provider login only)
      // Routes are mounted at /api/users, so provider login is at /api/users/login/provider
      const response = await apiClient.post(`${this.baseUrl}/login/provider`, credentials)
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', response.user.role || 'provider')
        localStorage.setItem('loginMethod', 'email')
      }
      return response
    } catch (error) {
      console.error('Provider login error:', error)
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
      // Clear auth data using centralized service
      clearAuthData()
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

  /**
   * Get provider profile (for logged-in provider)
   * @returns {Promise<Object>} Provider profile object
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
   * @returns {Promise<Object>} Provider availability object
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
   * @param {Object} availability - Availability data
   * @returns {Promise<Object>} Updated provider with availability
   */
  async updateProviderAvailability(availability) {
    if (this.useMock) {
      return this.mockUpdateProviderAvailability(availability)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/provider/availability`, { availability })
    } catch (error) {
      console.error('Update provider availability error:', error)
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
    
    const provider = {
      id: Date.now(),
      email: providerData.email,
      name: providerData.name || providerData.email.split('@')[0],
      role: 'provider',
      phone: providerData.phone || null,
      specialty: providerData.specialty || null,
      title: providerData.title || null,
      bio: providerData.bio || null,
      hourlyRate: providerData.hourlyRate || 0,
      createdAt: new Date().toISOString(),
    }

    // Store in localStorage
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userRole', 'provider')
    localStorage.setItem('currentUser', JSON.stringify(provider))

    return {
      user: provider,
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
    // Clear auth data using centralized service
    clearAuthData()
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

  async mockGetProviderProfile() {
    await new Promise(resolve => setTimeout(resolve, 300))
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      const user = JSON.parse(stored)
      return {
        provider: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          specialty: user.specialty || '',
          title: user.title || '',
          bio: user.bio || '',
          hourlyRate: user.hourlyRate || 0,
          rating: user.rating || 0,
          sessionsCompleted: user.sessionsCompleted || 0,
          reviewsCount: user.reviewsCount || 0,
          verified: user.verified || false,
          status: user.status || 'pending',
          availability: user.availability || {},
        }
      }
    }
    return {
      provider: {
        id: 1,
        name: 'Provider',
        email: 'provider@example.com',
        phone: '',
        specialty: '',
        title: '',
        bio: '',
        hourlyRate: 0,
        rating: 0,
        sessionsCompleted: 0,
        reviewsCount: 0,
        verified: false,
        status: 'pending',
        availability: {},
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
    localStorage.setItem('currentUser', JSON.stringify(updated.provider))
    return updated
  }

  async mockGetProviderAvailability() {
    await new Promise(resolve => setTimeout(resolve, 300))
    const stored = localStorage.getItem('providerAvailability')
    if (stored) {
      return { availability: JSON.parse(stored) }
    }
    return { availability: {} }
  }

  async mockUpdateProviderAvailability(availability) {
    await new Promise(resolve => setTimeout(resolve, 500))
    localStorage.setItem('providerAvailability', JSON.stringify(availability))
    const current = await this.mockGetProviderProfile()
    const updated = {
      provider: {
        ...current.provider,
        availability: availability,
        status: 'ready',
        verified: true
      },
      message: 'Availability updated successfully'
    }
    localStorage.setItem('currentUser', JSON.stringify(updated.provider))
    return updated
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




