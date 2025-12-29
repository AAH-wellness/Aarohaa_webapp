/**
 * Admin Service - Handles admin operations, user/provider management, and platform settings
 * 
 * API Contract:
 * - GET /admin/users - Get all users
 * - GET /admin/users/:id - Get user by ID
 * - PUT /admin/users/:id - Update user
 * - DELETE /admin/users/:id - Delete user
 * - GET /admin/providers - Get all providers
 * - PUT /admin/providers/:id/verify - Verify provider
 * - GET /admin/appointments - Get all appointments
 * - GET /admin/sessions - Get active sessions
 * - GET /admin/analytics - Get analytics data
 * - GET /admin/audit-logs - Get audit logs
 * - GET /admin/settings - Get platform settings
 * - PUT /admin/settings - Update platform settings
 */

import apiClient from './apiClient.js'
import API_CONFIG from './config.js'

class AdminService {
  constructor() {
    this.baseUrl = `${API_CONFIG.ADMIN_SERVICE}/admin`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  /**
   * Get all users
   * @param {Object} filters - { status, search, sortBy }
   * @returns {Promise<Array>} List of users
   */
  async getUsers(filters = {}) {
    if (this.useMock) {
      return this.mockGetUsers(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.baseUrl}/users?${queryParams}` : `${this.baseUrl}/users`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get users error:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    if (this.useMock) {
      return this.mockGetUserById(userId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/users/${userId}`)
    } catch (error) {
      console.error('Get user error:', error)
      throw error
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    if (this.useMock) {
      return this.mockUpdateUser(userId, updateData)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/users/${userId}`, updateData)
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success message
   */
  async deleteUser(userId) {
    if (this.useMock) {
      return this.mockDeleteUser(userId)
    }

    try {
      return await apiClient.delete(`${this.baseUrl}/users/${userId}`)
    } catch (error) {
      console.error('Delete user error:', error)
      throw error
    }
  }

  /**
   * Get all providers
   * @param {Object} filters - { verified, search }
   * @returns {Promise<Array>} List of providers
   */
  async getProviders(filters = {}) {
    if (this.useMock) {
      return this.mockGetProviders(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.baseUrl}/providers?${queryParams}` : `${this.baseUrl}/providers`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get providers error:', error)
      throw error
    }
  }

  /**
   * Verify provider
   * @param {string} providerId - Provider ID
   * @param {boolean} verified - Verification status
   * @returns {Promise<Object>} Updated provider
   */
  async verifyProvider(providerId, verified) {
    if (this.useMock) {
      return this.mockVerifyProvider(providerId, verified)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/providers/${providerId}/verify`, { verified })
    } catch (error) {
      console.error('Verify provider error:', error)
      throw error
    }
  }

  /**
   * Get all appointments
   * @param {Object} filters - { status, dateFrom, dateTo }
   * @returns {Promise<Array>} List of appointments
   */
  async getAppointments(filters = {}) {
    if (this.useMock) {
      return this.mockGetAppointments(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.baseUrl}/appointments?${queryParams}` : `${this.baseUrl}/appointments`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get appointments error:', error)
      throw error
    }
  }

  /**
   * Get active sessions
   * @returns {Promise<Array>} List of active sessions
   */
  async getActiveSessions() {
    if (this.useMock) {
      return this.mockGetActiveSessions()
    }

    try {
      return await apiClient.get(`${this.baseUrl}/sessions`)
    } catch (error) {
      console.error('Get active sessions error:', error)
      throw error
    }
  }

  /**
   * Get analytics data
   * @param {Object} params - { timeRange, metrics }
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(params = {}) {
    if (this.useMock) {
      return this.mockGetAnalytics(params)
    }

    try {
      const queryParams = new URLSearchParams(params).toString()
      const url = queryParams ? `${this.baseUrl}/analytics?${queryParams}` : `${this.baseUrl}/analytics`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get analytics error:', error)
      throw error
    }
  }

  /**
   * Get audit logs
   * @param {Object} filters - { type, dateFrom, dateTo, search }
   * @returns {Promise<Array>} List of audit logs
   */
  async getAuditLogs(filters = {}) {
    if (this.useMock) {
      return this.mockGetAuditLogs(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.baseUrl}/audit-logs?${queryParams}` : `${this.baseUrl}/audit-logs`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get audit logs error:', error)
      throw error
    }
  }

  /**
   * Get platform settings
   * @returns {Promise<Object>} Platform settings
   */
  async getSettings() {
    if (this.useMock) {
      return this.mockGetSettings()
    }

    try {
      return await apiClient.get(`${this.baseUrl}/settings`)
    } catch (error) {
      console.error('Get settings error:', error)
      throw error
    }
  }

  /**
   * Update platform settings
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(settings) {
    if (this.useMock) {
      return this.mockUpdateSettings(settings)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/settings`, settings)
    } catch (error) {
      console.error('Update settings error:', error)
      throw error
    }
  }

  // ========== MOCK IMPLEMENTATIONS ==========

  async mockGetUsers(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const mockUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]')
    if (mockUsers.length === 0) {
      return [
        { id: 1, name: 'John Doe', email: 'john.doe@example.com', joinDate: '2024-01-15', status: 'active', appointments: 5, wallet: 'Solana123...' },
        { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', joinDate: '2024-01-20', status: 'active', appointments: 3, wallet: 'Solana456...' },
      ]
    }
    return mockUsers
  }

  async mockGetUserById(userId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const users = await this.mockGetUsers()
    return users.find(u => u.id === userId) || null
  }

  async mockUpdateUser(userId, updateData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const users = await this.mockGetUsers()
    const index = users.findIndex(u => u.id === userId)
    if (index !== -1) {
      users[index] = { ...users[index], ...updateData }
      localStorage.setItem('adminUsers', JSON.stringify(users))
      return users[index]
    }
    throw new Error('User not found')
  }

  async mockDeleteUser(userId) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const users = await this.mockGetUsers()
    const filtered = users.filter(u => u.id !== userId)
    localStorage.setItem('adminUsers', JSON.stringify(filtered))
    return { message: 'User deleted successfully' }
  }

  async mockGetProviders(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return JSON.parse(localStorage.getItem('adminProviders') || '[]')
  }

  async mockVerifyProvider(providerId, verified) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const providers = await this.mockGetProviders()
    const index = providers.findIndex(p => p.id === providerId)
    if (index !== -1) {
      providers[index].status = verified ? 'verified' : 'pending'
      localStorage.setItem('adminProviders', JSON.stringify(providers))
      return providers[index]
    }
    throw new Error('Provider not found')
  }

  async mockGetAppointments(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return JSON.parse(localStorage.getItem('appointments') || '[]')
  }

  async mockGetActiveSessions() {
    await new Promise(resolve => setTimeout(resolve, 300))
    return JSON.parse(localStorage.getItem('activeSessions') || '[]')
  }

  async mockGetAnalytics(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      usageTrends: [],
      sessionVolumes: [],
      walletActivity: [],
      revenueData: [],
    }
  }

  async mockGetAuditLogs(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return JSON.parse(localStorage.getItem('auditLogs') || '[]')
  }

  async mockGetSettings() {
    await new Promise(resolve => setTimeout(resolve, 200))
    const stored = localStorage.getItem('platformSettings')
    if (stored) {
      return JSON.parse(stored)
    }
    return {
      platformName: 'Aarohaa Wellness',
      platformEmail: 'admin@aarohaa.com',
      sessionDuration: 60,
      maxConcurrentSessions: 100,
      requireProviderVerification: true,
      enableWalletPayments: true,
      enableGoogleAuth: true,
      maintenanceMode: false,
      allowNewRegistrations: true,
      emailNotifications: true,
      auditLogRetention: 90,
      maxFileUploadSize: 10,
      platformCurrency: 'USD',
    }
  }

  async mockUpdateSettings(settings) {
    await new Promise(resolve => setTimeout(resolve, 400))
    localStorage.setItem('platformSettings', JSON.stringify(settings))
    return settings
  }
}

export default new AdminService()




