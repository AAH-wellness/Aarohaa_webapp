import React, { useEffect, useState } from 'react'
import { userService } from '../services'
import './ForgotPasswordModal.css'

const ForgotPasswordModal = ({ onClose, role = 'user' }) => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
    
    // Add class to body when modal is visible to lower header z-index
    document.body.classList.add('modal-open')
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate email
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      await userService.forgotPassword(email, role)
      setShowSuccess(true)
    } catch (err) {
      console.error('Forgot password error:', err)
      // Extract error message from API response
      let errorMessage = 'Failed to send reset email. Please try again.'
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  if (showSuccess) {
    return (
      <div className={`forgot-password-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
        <div className={`forgot-password-content success ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="forgot-password-icon-wrapper">
            <div className="forgot-password-success-icon">
              <div className="checkmark-circle">
                <svg className="checkmark-svg" viewBox="0 0 52 52">
                  <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none" />
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="forgot-password-title">Email Sent! 📧</h2>
          <p className="forgot-password-message">
            If an account with <strong>{email}</strong> exists, we've sent you a password reset link.
            <br />
            <span className="forgot-password-sub-message">Please check your email inbox and follow the instructions.</span>
          </p>
          <div className="forgot-password-details">
            <div className="forgot-password-detail-item">
              <span className="detail-icon">📬</span>
              <span className="detail-text">Check your inbox (and spam folder)</span>
            </div>
            <div className="forgot-password-detail-item">
              <span className="detail-icon">⏰</span>
              <span className="detail-text">Link expires in 1 hour</span>
            </div>
          </div>
          <div className="forgot-password-buttons">
            <button className="forgot-password-btn primary" onClick={handleClose}>
              Got It
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`forgot-password-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`forgot-password-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="forgot-password-close" onClick={handleClose}>×</button>
        <div className="forgot-password-header">
          <div className="forgot-password-icon-wrapper">
            <div className="forgot-password-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>
          <h2 className="forgot-password-title">Forgot Password? 🔐</h2>
          <p className="forgot-password-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && (
            <div className="forgot-password-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="forgot-password-input-group">
            <label htmlFor="forgot-email">Email Address</label>
            <input
              type="email"
              id="forgot-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="Enter your email"
              className={error ? 'error' : ''}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="forgot-password-buttons">
            <button
              type="button"
              className="forgot-password-btn secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="forgot-password-btn primary"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordModal
