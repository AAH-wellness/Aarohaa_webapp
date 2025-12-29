/**
 * Payment Service - Handles payments, wallet transactions, and blockchain operations
 * 
 * API Contract:
 * - POST /payments/process - Process payment
 * - GET /payments/:id - Get payment by ID
 * - GET /payments/user/:userId - Get user's payment history
 * - POST /payments/refund - Process refund
 * - POST /wallet/connect - Connect wallet
 * - POST /wallet/disconnect - Disconnect wallet
 * - GET /wallet/balance - Get wallet balance
 * - GET /wallet/transactions - Get wallet transactions
 */

import apiClient from './apiClient.js'
import API_CONFIG from './config.js'

class PaymentService {
  constructor() {
    this.baseUrl = `${API_CONFIG.PAYMENT_SERVICE}/payments`
    this.walletUrl = `${API_CONFIG.PAYMENT_SERVICE}/wallet`
    this.useMock = API_CONFIG.USE_MOCK_SERVICES
  }

  /**
   * Process payment
   * @param {Object} paymentData - { amount, currency, method, appointmentId }
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentData) {
    if (this.useMock) {
      return this.mockProcessPayment(paymentData)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/process`, paymentData)
    } catch (error) {
      console.error('Process payment error:', error)
      throw error
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment object
   */
  async getPaymentById(paymentId) {
    if (this.useMock) {
      return this.mockGetPaymentById(paymentId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/${paymentId}`)
    } catch (error) {
      console.error('Get payment error:', error)
      throw error
    }
  }

  /**
   * Get user's payment history
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Payment history
   */
  async getUserPayments(userId) {
    if (this.useMock) {
      return this.mockGetUserPayments(userId)
    }

    try {
      return await apiClient.get(`${this.baseUrl}/user/${userId}`)
    } catch (error) {
      console.error('Get user payments error:', error)
      throw error
    }
  }

  /**
   * Process refund
   * @param {Object} refundData - { paymentId, amount, reason }
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(refundData) {
    if (this.useMock) {
      return this.mockProcessRefund(refundData)
    }

    try {
      return await apiClient.post(`${this.baseUrl}/refund`, refundData)
    } catch (error) {
      console.error('Process refund error:', error)
      throw error
    }
  }

  /**
   * Connect wallet
   * @param {Object} walletData - { walletName, address, network }
   * @returns {Promise<Object>} Connection result
   */
  async connectWallet(walletData) {
    if (this.useMock) {
      return this.mockConnectWallet(walletData)
    }

    try {
      return await apiClient.post(`${this.walletUrl}/connect`, walletData)
    } catch (error) {
      console.error('Connect wallet error:', error)
      throw error
    }
  }

  /**
   * Disconnect wallet
   * @returns {Promise<Object>} Disconnection result
   */
  async disconnectWallet() {
    if (this.useMock) {
      return this.mockDisconnectWallet()
    }

    try {
      return await apiClient.post(`${this.walletUrl}/disconnect`)
    } catch (error) {
      console.error('Disconnect wallet error:', error)
      throw error
    }
  }

  /**
   * Get wallet balance
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} Balance information
   */
  async getWalletBalance(address) {
    if (this.useMock) {
      return this.mockGetWalletBalance(address)
    }

    try {
      return await apiClient.get(`${this.walletUrl}/balance`, { address })
    } catch (error) {
      console.error('Get wallet balance error:', error)
      throw error
    }
  }

  /**
   * Get wallet transactions
   * @param {Object} filters - { address, fromDate, toDate }
   * @returns {Promise<Array>} Transaction history
   */
  async getWalletTransactions(filters = {}) {
    if (this.useMock) {
      return this.mockGetWalletTransactions(filters)
    }

    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = queryParams ? `${this.walletUrl}/transactions?${queryParams}` : `${this.walletUrl}/transactions`
      return await apiClient.get(url)
    } catch (error) {
      console.error('Get wallet transactions error:', error)
      throw error
    }
  }

  // ========== MOCK IMPLEMENTATIONS ==========

  async mockProcessPayment(paymentData) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const payment = {
      id: 'pay_' + Date.now(),
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      method: paymentData.method || 'wallet',
      status: 'completed',
      transactionId: 'txn_' + Date.now(),
      createdAt: new Date().toISOString(),
    }

    return payment
  }

  async mockGetPaymentById(paymentId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      id: paymentId,
      amount: 50,
      currency: 'USD',
      status: 'completed',
    }
  }

  async mockGetUserPayments(userId) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return []
  }

  async mockProcessRefund(refundData) {
    await new Promise(resolve => setTimeout(resolve, 800))
    return {
      refundId: 'ref_' + Date.now(),
      amount: refundData.amount,
      status: 'processed',
      message: 'Refund processed successfully',
    }
  }

  async mockConnectWallet(walletData) {
    await new Promise(resolve => setTimeout(resolve, 500))
    localStorage.setItem('walletData', JSON.stringify(walletData))
    return {
      connected: true,
      wallet: walletData,
      message: 'Wallet connected successfully',
    }
  }

  async mockDisconnectWallet() {
    await new Promise(resolve => setTimeout(resolve, 300))
    localStorage.removeItem('walletData')
    return { message: 'Wallet disconnected successfully' }
  }

  async mockGetWalletBalance(address) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      address,
      balance: '1.25',
      currency: 'SOL',
      usdValue: 125.50,
    }
  }

  async mockGetWalletTransactions(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 400))
    return [
      {
        id: '1',
        type: 'Payment',
        amount: 50,
        wallet: 'Phantom',
        time: '5 min ago',
        status: 'completed',
      },
      {
        id: '2',
        type: 'Payment',
        amount: 75,
        wallet: 'Solflare',
        time: '12 min ago',
        status: 'completed',
      },
    ]
  }
}

export default new PaymentService()




