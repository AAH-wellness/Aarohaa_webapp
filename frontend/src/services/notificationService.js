/**
 * Notification Service - Handles notifications, emails, and alerts
 * 
 * API Contract:
 * - POST /notifications/send - Send notification
 * - GET /notifications/user/:userId - Get user notifications
 * - PUT /notifications/:id/read - Mark notification as read
 * - POST /notifications/email - Send email notification
 * - POST /notifications/push - Send push notification
 */

import apiClient from './apiClient.js'
import API_CONFIG from './config.js'

class NotificationService {
  constructor() {
    this.baseUrl = `${API_CONFIG.NOTIFICATION_SERVICE}/notifications`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  /**
   * Send notification
   * @param {Object} notificationData - { userId, type, message, priority }
   * @returns {Promise<Object>} Notification result
   */
  async sendNotification(notificationData) {
    if (this.useMock) {
      return this.mockSendNotification(notificationData)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/send`, notificationData)
    } catch (error) {
      console.error('Send notification error:', error)
      throw error
    }
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of notifications
   */
  async getUserNotifications(userId) {
    if (this.useMock) {
      return this.mockGetUserNotifications(userId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/user/${userId}`)
    } catch (error) {
      console.error('Get user notifications error:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId) {
    if (this.useMock) {
      return this.mockMarkAsRead(notificationId)
    }

    try {
      return await apiClient.put(`${this.baseUrl}/${notificationId}/read`)
    } catch (error) {
      console.error('Mark as read error:', error)
      throw error
    }
  }

  /**
   * Send email notification
   * @param {Object} emailData - { to, subject, body, template }
   * @returns {Promise<Object>} Email result
   */
  async sendEmail(emailData) {
    if (this.useMock) {
      return this.mockSendEmail(emailData)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/email`, emailData)
    } catch (error) {
      console.error('Send email error:', error)
      throw error
    }
  }

  // ========== MOCK IMPLEMENTATIONS ==========

  async mockSendNotification(notificationData) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      id: 'notif_' + Date.now(),
      ...notificationData,
      sentAt: new Date().toISOString(),
      status: 'sent',
    }
  }

  async mockGetUserNotifications(userId) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return []
  }

  async mockMarkAsRead(notificationId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { id: notificationId, read: true }
  }

  async mockSendEmail(emailData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      messageId: 'email_' + Date.now(),
      status: 'sent',
      message: 'Email sent successfully',
    }
  }
}

export default new NotificationService()




