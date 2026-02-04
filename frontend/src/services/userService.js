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
   * @param {string} role - User role ('user' or 'provider')
   * @returns {Promise<Object>} Success message
   */
  async forgotPassword(email, role = 'user') {
    if (this.useMock) {
      return this.mockForgotPassword(email)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/password/reset-request`, { email, role })
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
      return await apiClient.post(`${this.baseUrl}/password/reset`, resetData)
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  /**
   * Submit session review (rating + review text) - mandatory after session ends
   * @param {number} bookingId - Booking ID
   * @param {Object} reviewData - { rating: 1-5, reviewText: string (min 10 chars) }
   * @returns {Promise<Object>} Success message
   */
  async submitSessionReview(bookingId, reviewData) {
    if (this.useMock) {
      return this.mockSubmitSessionReview(bookingId, reviewData)
    }
    try {
      return await apiClient.post(`${this.baseUrl}/bookings/${bookingId}/review`, reviewData)
    } catch (error) {
      console.error('Submit session review error:', error)
      throw error
    }
  }

  /**
   * Submit support ticket
   * @param {Object} supportData - { name, email, subject, messageType, message }
   * @returns {Promise<Object>} Success message with ticket ID
   */
  async submitSupportTicket(supportData) {
    if (this.useMock) {
      return this.mockSubmitSupportTicket(supportData)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/support/submit`, supportData)
    } catch (error) {
      console.error('Submit support ticket error:', error)
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
   * Get available time slots for a provider
   * @param {number} providerId - Provider ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Object with slots array
   */
  async getProviderAvailableSlots(providerId, startDate, endDate) {
    if (this.useMock) {
      return this.mockGetProviderAvailableSlots(providerId, startDate, endDate)
    }

    try {
      // Use /api/providers/:providerId/available-slots endpoint
      // (direct route mounted in routes/index.js)
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      const queryParams = new URLSearchParams({ startDate, endDate }).toString()
      const url = `${apiBaseUrl}/providers/${providerId}/available-slots?${queryParams}`
      
      const response = await apiClient.get(url)
      return response
    } catch (error) {
      console.error('Get provider available slots error:', error)
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

  async mockSubmitSupportTicket(supportData) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { 
      message: 'Support ticket submitted successfully',
      ticketId: Date.now()
    }
  }

  async mockSubmitSessionReview(bookingId, reviewData) {
    await new Promise(resolve => setTimeout(resolve, 800))
    return {
      message: 'Thank you for your review!',
      review: { id: Date.now(), rating: reviewData.rating, reviewText: reviewData.reviewText }
    }
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
          profilePhoto: user.profilePhoto || null,
          gender: user.gender || null,
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
        gender: null,
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
      try {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          return { availability: parsed }
        }
      } catch (error) {
        console.error('Invalid providerAvailability in localStorage, resetting:', error)
      }
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

  async mockGetProviderAvailableSlots(providerId, startDate, endDate) {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Generate mock slots for demonstration
    const slots = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay()
      // Only generate slots for weekdays (Mon-Fri)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Generate slots from 9 AM to 5 PM, every 15 minutes
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            const slotDate = new Date(date)
            slotDate.setHours(hour, minute, 0, 0)
            if (slotDate > new Date()) {
              slots.push({
                date: date.toISOString().split('T')[0],
                time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
                datetime: slotDate.toISOString(),
                available: true
              })
            }
          }
        }
      }
    }
    
    return {
      providerId: parseInt(providerId),
      slots: slots
    }
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
        profilePhoto: null,
        gender: 'female',
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
        profilePhoto: null,
        gender: 'female',
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




