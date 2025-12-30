/**
 * Provider Service - Handles provider management, profiles, and availability
 * 
 * API Contract:
 * - GET /providers - Get all providers (with filters)
 * - GET /providers/:id - Get provider by ID
 * - POST /providers - Create new provider
 * - PUT /providers/:id - Update provider
 * - GET /providers/:id/availability - Get provider availability
 * - PUT /providers/:id/availability - Update provider availability
 * - GET /providers/:id/schedule - Get provider schedule
 * - POST /providers/:id/verify - Verify provider (admin only)
 */

import apiClient from './apiClient.js'
import API_CONFIG from './config.js'

class ProviderService {
  constructor() {
    // Use authentication service for providers (since it's in the same backend for now)
    this.baseUrl = `${API_CONFIG.USER_SERVICE}/users/providers`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  /**
   * Get all providers with optional filters
   * @param {Object} filters - { specialty, verified, status }
   * @returns {Promise<Array>} List of providers
   */
  async getProviders(filters = {}) {
    if (this.useMock) {
      return this.mockGetProviders(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.baseUrl}?${queryParams}` : this.baseUrl
      const response = await apiClient.get(url)
      // Backend returns { providers: [...] }, so return the providers array directly
      return response.providers || response || []
    } catch (error) {
      console.error('Get providers error:', error)
      throw error
    }
  }

  /**
   * Get provider by ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Provider object
   */
  async getProviderById(providerId) {
    if (this.useMock) {
      return this.mockGetProviderById(providerId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/${providerId}`)
    } catch (error) {
      console.error('Get provider error:', error)
      throw error
    }
  }

  /**
   * Create new provider
   * @param {Object} providerData - Provider data
   * @returns {Promise<Object>} Created provider
   */
  async createProvider(providerData) {
    if (this.useMock) {
      return this.mockCreateProvider(providerData)
    }

    try {
      return await apiClient.post(this.baseUrl, providerData)
    } catch (error) {
      console.error('Create provider error:', error)
      throw error
    }
  }

  /**
   * Update provider
   * @param {string} providerId - Provider ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated provider
   */
  async updateProvider(providerId, updateData) {
    if (this.useMock) {
      return this.mockUpdateProvider(providerId, updateData)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/${providerId}`, updateData)
    } catch (error) {
      console.error('Update provider error:', error)
      throw error
    }
  }

  /**
   * Get provider availability
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Availability schedule
   */
  async getProviderAvailability(providerId) {
    if (this.useMock) {
      return this.mockGetProviderAvailability(providerId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/${providerId}/availability`)
    } catch (error) {
      console.error('Get provider availability error:', error)
      throw error
    }
  }

  /**
   * Update provider availability
   * @param {string} providerId - Provider ID
   * @param {Object} availabilityData - Availability schedule
   * @returns {Promise<Object>} Updated availability
   */
  async updateProviderAvailability(providerId, availabilityData) {
    if (this.useMock) {
      return this.mockUpdateProviderAvailability(providerId, availabilityData)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/${providerId}/availability`, availabilityData)
    } catch (error) {
      console.error('Update provider availability error:', error)
      throw error
    }
  }

  /**
   * Verify provider (admin only)
   * @param {string} providerId - Provider ID
   * @param {boolean} verified - Verification status
   * @returns {Promise<Object>} Updated provider
   */
  async verifyProvider(providerId, verified) {
    if (this.useMock) {
      return this.mockVerifyProvider(providerId, verified)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/${providerId}/verify`, { verified })
    } catch (error) {
      console.error('Verify provider error:', error)
      throw error
    }
  }

  /**
   * Get provider profile (for logged-in provider)
   */
  async getProviderProfile() {
    if (this.useMock) {
      return this.mockGetProviderById('current')
    }

    try {
      const response = await apiClient.get(`${API_CONFIG.USER_SERVICE}/users/provider/profile`)
      console.log('getProviderProfile response:', response)
      return response
    } catch (error) {
      console.error('Get provider profile error:', error)
      // If provider not found, it might be because they just registered
      if (error.status === 404 || error.data?.error?.code === 'PROVIDER_NOT_FOUND') {
        throw new Error('Provider profile not found. Please ensure you have registered as a provider.')
      }
      throw error
    }
  }

  /**
   * Update provider profile (for logged-in provider)
   */
  async updateProviderProfile(updateData) {
    if (this.useMock) {
      return this.mockUpdateProvider('current', updateData)
    }

    try {
      return await apiClient.put(`${API_CONFIG.USER_SERVICE}/users/provider/profile`, updateData)
    } catch (error) {
      console.error('Update provider profile error:', error)
      throw error
    }
  }

  /**
   * Get provider availability (for logged-in provider)
   */
  async getProviderAvailability() {
    if (this.useMock) {
      return this.mockGetProviderAvailability('current')
    }

    try {
      const response = await apiClient.get(`${API_CONFIG.USER_SERVICE}/users/provider/availability`)
      return response.availability || {}
    } catch (error) {
      console.error('Get provider availability error:', error)
      throw error
    }
  }

  /**
   * Update provider availability (for logged-in provider)
   */
  async updateProviderAvailability(availabilityData) {
    if (this.useMock) {
      return this.mockUpdateProviderAvailability('current', availabilityData)
    }

    try {
      return await apiClient.put(`${API_CONFIG.USER_SERVICE}/users/provider/availability`, { availability: availabilityData })
    } catch (error) {
      console.error('Update provider availability error:', error)
      throw error
    }
  }

  // ========== MOCK IMPLEMENTATIONS ==========

  async mockGetProviders(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock providers data
    const mockProviders = [
      {
        id: '1',
        name: 'Dr. Maya Patel',
        email: 'maya.patel@example.com',
        specialty: 'Yoga Therapy',
        status: 'verified',
        verified: true,
        rating: 4.8,
        sessionsCompleted: 45,
        hourlyRate: 50,
        bio: 'Experienced yoga therapist specializing in stress management',
      },
      {
        id: '2',
        name: 'Sarah Rodriguez',
        email: 'sarah.rodriguez@example.com',
        specialty: 'Meditation',
        status: 'verified',
        verified: true,
        rating: 4.9,
        sessionsCompleted: 38,
        hourlyRate: 60,
        bio: 'Certified meditation instructor with 10+ years of experience',
      },
      {
        id: '3',
        name: 'James Chen',
        email: 'james.chen@example.com',
        specialty: 'Mindfulness',
        status: 'pending',
        verified: false,
        rating: 0,
        sessionsCompleted: 0,
        hourlyRate: 45,
        bio: 'Mindfulness coach focusing on work-life balance',
      },
    ]

    // Apply filters
    let filtered = mockProviders
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

  async mockGetProviderById(providerId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const providers = await this.mockGetProviders()
    return providers.find(p => p.id === providerId) || null
  }

  async mockCreateProvider(providerData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const provider = {
      id: Date.now().toString(),
      ...providerData,
      createdAt: new Date().toISOString(),
    }
    return provider
  }

  async mockUpdateProvider(providerId, updateData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const provider = await this.mockGetProviderById(providerId)
    if (!provider) throw new Error('Provider not found')
    return { ...provider, ...updateData, updatedAt: new Date().toISOString() }
  }

  async mockGetProviderAvailability(providerId) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      providerId,
      schedule: {
        monday: { available: true, hours: '9:00 AM - 5:00 PM' },
        tuesday: { available: true, hours: '9:00 AM - 5:00 PM' },
        wednesday: { available: true, hours: '9:00 AM - 5:00 PM' },
        thursday: { available: true, hours: '9:00 AM - 5:00 PM' },
        friday: { available: true, hours: '9:00 AM - 5:00 PM' },
        saturday: { available: false },
        sunday: { available: false },
      },
    }
  }

  async mockUpdateProviderAvailability(providerId, availabilityData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    return {
      providerId,
      ...availabilityData,
      updatedAt: new Date().toISOString(),
    }
  }

  async mockVerifyProvider(providerId, verified) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const provider = await this.mockGetProviderById(providerId)
    if (!provider) throw new Error('Provider not found')
    return {
      ...provider,
      verified,
      status: verified ? 'verified' : 'pending',
      verifiedAt: verified ? new Date().toISOString() : null,
    }
  }
}

export default new ProviderService()




