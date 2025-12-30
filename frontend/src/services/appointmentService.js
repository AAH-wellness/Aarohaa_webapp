/**
 * Appointment Service - Handles appointment booking, management, and scheduling
 * 
 * API Contract:
 * - GET /appointments - Get all appointments (with filters)
 * - GET /appointments/:id - Get appointment by ID
 * - POST /appointments - Create new appointment
 * - PUT /appointments/:id - Update appointment
 * - DELETE /appointments/:id - Cancel appointment
 * - GET /appointments/user/:userId - Get user's appointments
 * - GET /appointments/provider/:providerId - Get provider's appointments
 * - GET /appointments/upcoming - Get upcoming appointments
 */

import apiClient from './apiClient.js'
import API_CONFIG from './config.js'

class AppointmentService {
  constructor() {
    // Use authentication service for bookings (since it's in the same backend for now)
    this.baseUrl = `${API_CONFIG.USER_SERVICE}/users/bookings`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  /**
   * Get all appointments with optional filters
   * @param {Object} filters - { userId, providerId, status, dateFrom, dateTo }
   * @returns {Promise<Array>} List of appointments
   */
  async getAppointments(filters = {}) {
    if (this.useMock) {
      return this.mockGetAppointments(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.baseUrl}?${queryParams}` : this.baseUrl
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get appointments error:', error)
      throw error
    }
  }

  /**
   * Get appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} Appointment object
   */
  async getAppointmentById(appointmentId) {
    if (this.useMock) {
      return this.mockGetAppointmentById(appointmentId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/${appointmentId}`)
    } catch (error) {
      console.error('Get appointment error:', error)
      throw error
    }
  }

  /**
   * Create new appointment
   * @param {Object} appointmentData - { providerId, dateTime, serviceType, duration, amount }
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(appointmentData) {
    if (this.useMock) {
      return this.mockCreateAppointment(appointmentData)
    }

    try {
      // Map appointmentData to booking format
      const bookingData = {
        providerId: appointmentData.providerId,
        appointmentDate: appointmentData.dateTime || appointmentData.appointmentDate, // Support both field names
        sessionType: appointmentData.sessionType,
        notes: appointmentData.notes
      }
      const response = await apiClient.post(this.baseUrl, bookingData)
      console.log('appointmentService.createAppointment - Full response:', response)
      
      // Backend returns { booking: {...}, message: '...' }
      // Return the full response so frontend can access both booking and message
      return response
    } catch (error) {
      console.error('Create appointment error:', error)
      throw error
    }
  }

  /**
   * Update appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointment(appointmentId, updateData) {
    if (this.useMock) {
      return this.mockUpdateAppointment(appointmentId, updateData)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/${appointmentId}`, updateData)
    } catch (error) {
      console.error('Update appointment error:', error)
      throw error
    }
  }

  /**
   * Cancel appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} Success message
   */
  async cancelAppointment(appointmentId) {
    if (this.useMock) {
      return this.mockCancelAppointment(appointmentId)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/cancel`, { bookingId: appointmentId })
    } catch (error) {
      console.error('Cancel appointment error:', error)
      throw error
    }
  }

  /**
   * Get user's appointments
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's appointments
   */
  async getUserAppointments(userId) {
    if (this.useMock) {
      return this.mockGetUserAppointments(userId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/user/${userId}`)
    } catch (error) {
      console.error('Get user appointments error:', error)
      throw error
    }
  }

  /**
   * Get provider's appointments (for logged-in provider)
   * @returns {Promise<Array>} Provider's appointments
   */
  async getProviderAppointments() {
    if (this.useMock) {
      return this.mockGetProviderAppointments()
    }

    try {
      const response = await apiClient.get(`${API_CONFIG.USER_SERVICE}/users/provider/bookings`)
      return response.bookings || response || []
    } catch (error) {
      console.error('Get provider appointments error:', error)
      throw error
    }
  }

  /**
   * Get upcoming appointments
   * @returns {Promise<Array>} Upcoming appointments
   */
  async getUpcomingAppointments() {
    if (this.useMock) {
      return this.mockGetUpcomingAppointments()
    }

    try {
      const response = await apiClient.get(`${this.baseUrl}/upcoming`)
      return response.bookings || response || []
    } catch (error) {
      console.error('Get upcoming appointments error:', error)
      throw error
    }
  }

  // ========== MOCK IMPLEMENTATIONS ==========

  async mockGetAppointments(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    
    // Apply filters
    if (filters.userId) {
      appointments = appointments.filter(apt => apt.userId === filters.userId)
    }
    if (filters.providerId) {
      appointments = appointments.filter(apt => apt.providerId === filters.providerId)
    }
    if (filters.status) {
      appointments = appointments.filter(apt => apt.status === filters.status)
    }
    
    return appointments
  }

  async mockGetAppointmentById(appointmentId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    return appointments.find(apt => apt.id === appointmentId) || null
  }

  async mockCreateAppointment(appointmentData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const appointment = {
      id: Date.now().toString(),
      ...appointmentData,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      userName: appointmentData.userName || 'Current User',
      providerName: appointmentData.providerName || 'Provider',
    }

    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    appointments.push(appointment)
    localStorage.setItem('appointments', JSON.stringify(appointments))

    return appointment
  }

  async mockUpdateAppointment(appointmentId, updateData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    const index = appointments.findIndex(apt => apt.id === appointmentId)
    
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...updateData, updatedAt: new Date().toISOString() }
      localStorage.setItem('appointments', JSON.stringify(appointments))
      return appointments[index]
    }
    
    throw new Error('Appointment not found')
  }

  async mockCancelAppointment(appointmentId) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    const index = appointments.findIndex(apt => apt.id === appointmentId)
    
    if (index !== -1) {
      appointments[index].status = 'cancelled'
      appointments[index].cancelledAt = new Date().toISOString()
      localStorage.setItem('appointments', JSON.stringify(appointments))
      return { message: 'Appointment cancelled successfully' }
    }
    
    throw new Error('Appointment not found')
  }

  async mockGetUserAppointments(userId) {
    return this.mockGetAppointments({ userId })
  }

  async mockGetProviderAppointments(providerId) {
    return this.mockGetAppointments({ providerId })
  }

  async mockGetUpcomingAppointments() {
    await new Promise(resolve => setTimeout(resolve, 300))
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    const now = new Date()
    return appointments.filter(apt => new Date(apt.dateTime) > now && apt.status !== 'cancelled')
  }
}

export default new AppointmentService()




