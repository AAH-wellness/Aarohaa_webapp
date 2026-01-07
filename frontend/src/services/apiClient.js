/**
 * API Client - Base HTTP client for all microservice calls
 * 
 * This provides a centralized way to make API calls with:
 * - Authentication headers
 * - Error handling
 * - Retry logic
 * - Request/response interceptors
 */

import API_CONFIG from './config.js'

class ApiClient {
  constructor() {
    this.baseConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: API_CONFIG.TIMEOUT,
    }
  }

  /**
   * Get authentication token from localStorage or context
   */
  getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('accessToken')
  }

  /**
   * Get common headers including auth token
   */
  getHeaders(customHeaders = {}) {
    const token = this.getAuthToken()
    return {
      ...this.baseConfig.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(url, options = {}, retryCount = 0) {
    const config = {
      ...this.baseConfig,
      ...options,
      headers: this.getHeaders(options.headers),
    }

    try {
      const response = await fetch(url, config)
      
      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        )
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text()
    } catch (error) {
      // Retry on network errors or 5xx errors
      if (
        retryCount < API_CONFIG.MAX_RETRIES &&
        (error instanceof TypeError || (error.status >= 500 && error.status < 600))
      ) {
        await this.delay(API_CONFIG.RETRY_DELAY * (retryCount + 1))
        return this.request(url, options, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * Delay helper for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * PATCH request
   */
  async patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' })
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Export singleton instance
export default new ApiClient()




