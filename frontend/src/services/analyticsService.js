/**
 * Analytics Service - Handles analytics, reports, and metrics
 * 
 * API Contract:
 * - GET /analytics/dashboard - Get dashboard analytics
 * - GET /analytics/usage - Get usage trends
 * - GET /analytics/revenue - Get revenue data
 * - GET /analytics/sessions - Get session analytics
 * - GET /analytics/wallet - Get wallet activity analytics
 * - GET /analytics/reports - Generate reports
 */

import apiClient from './apiClient.js'
import API_CONFIG from './config.js'

class AnalyticsService {
  constructor() {
    this.baseUrl = `${API_CONFIG.ANALYTICS_SERVICE}/analytics`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  /**
   * Get dashboard analytics
   * @param {Object} params - { timeRange, metrics }
   * @returns {Promise<Object>} Dashboard analytics data
   */
  async getDashboardAnalytics(params = {}) {
    if (this.useMock) {
      return this.mockGetDashboardAnalytics(params)
    }

    try {
      const queryParams = new URLSearchParams(params).toString()
      const url = queryParams ? `${this.baseUrl}/dashboard?${queryParams}` : `${this.baseUrl}/dashboard`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get dashboard analytics error:', error)
      throw error
    }
  }

  /**
   * Get usage trends
   * @param {Object} params - { timeRange, granularity }
   * @returns {Promise<Array>} Usage trend data
   */
  async getUsageTrends(params = {}) {
    if (this.useMock) {
      return this.mockGetUsageTrends(params)
    }

    try {
      const queryParams = new URLSearchParams(params).toString()
      const url = queryParams ? `${this.baseUrl}/usage?${queryParams}` : `${this.baseUrl}/usage`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get usage trends error:', error)
      throw error
    }
  }

  /**
   * Get revenue data
   * @param {Object} params - { timeRange, groupBy }
   * @returns {Promise<Array>} Revenue data
   */
  async getRevenueData(params = {}) {
    if (this.useMock) {
      return this.mockGetRevenueData(params)
    }

    try {
      const queryParams = new URLSearchParams(params).toString()
      const url = queryParams ? `${this.baseUrl}/revenue?${queryParams}` : `${this.baseUrl}/revenue`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get revenue data error:', error)
      throw error
    }
  }

  /**
   * Get session analytics
   * @param {Object} params - { timeRange }
   * @returns {Promise<Object>} Session analytics
   */
  async getSessionAnalytics(params = {}) {
    if (this.useMock) {
      return this.mockGetSessionAnalytics(params)
    }

    try {
      const queryParams = new URLSearchParams(params).toString()
      const url = queryParams ? `${this.baseUrl}/sessions?${queryParams}` : `${this.baseUrl}/sessions`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get session analytics error:', error)
      throw error
    }
  }

  /**
   * Get wallet activity analytics
   * @param {Object} params - { timeRange }
   * @returns {Promise<Object>} Wallet analytics
   */
  async getWalletAnalytics(params = {}) {
    if (this.useMock) {
      return this.mockGetWalletAnalytics(params)
    }

    try {
      const queryParams = new URLSearchParams(params).toString()
      const url = queryParams ? `${this.baseUrl}/wallet?${queryParams}` : `${this.baseUrl}/wallet`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get wallet analytics error:', error)
      throw error
    }
  }

  /**
   * Generate report
   * @param {Object} reportParams - { type, format, timeRange }
   * @returns {Promise<Object>} Report data or download URL
   */
  async generateReport(reportParams) {
    if (this.useMock) {
      return this.mockGenerateReport(reportParams)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/reports`, reportParams)
    } catch (error) {
      console.error('Generate report error:', error)
      throw error
    }
  }

  // ========== MOCK IMPLEMENTATIONS ==========

  async mockGetDashboardAnalytics(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      totalUsers: 1250,
      totalProviders: 3,
      activeSessions: 2,
      todayAppointments: 5,
      totalRevenue: 5000,
      platformHealth: 'healthy',
    }
  }

  async mockGetUsageTrends(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const days = params.timeRange === '7d' ? 7 : params.timeRange === '30d' ? 30 : 90
    const trends = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      trends.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 100,
        providers: Math.floor(Math.random() * 5) + 10,
      })
    }
    return trends
  }

  async mockGetRevenueData(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const days = params.timeRange === '7d' ? 7 : params.timeRange === '30d' ? 30 : 90
    const revenue = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      revenue.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 2000) + 3000,
      })
    }
    return revenue
  }

  async mockGetSessionAnalytics(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 400))
    return {
      totalSessions: 150,
      activeSessions: 2,
      averageDuration: 45,
      sessionVolumes: [],
    }
  }

  async mockGetWalletAnalytics(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 400))
    return {
      totalTransactions: 25,
      totalVolume: 5000,
      walletActivity: [],
    }
  }

  async mockGenerateReport(reportParams) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      reportId: 'report_' + Date.now(),
      downloadUrl: '#',
      message: 'Report generated successfully',
    }
  }
}

export default new AnalyticsService()




