import React, { useEffect, useState } from 'react'
import { userService } from '../services'
import PasswordResetSuccessModal from './PasswordResetSuccessModal'
import './ResetPassword.css'

const ResetPassword = ({ onClose, onSuccess, token }) => {
  // Get token from URL if not provided as prop
  const getTokenFromURL = () => {
    if (token) return token
    const params = new URLSearchParams(window.location.search)
    return params.get('token')
  }
  
  const resetToken = getTokenFromURL()
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
    
    // Add class to body when modal is visible to lower header z-index
    document.body.classList.add('modal-open')
    
    // Check if token exists
    if (!resetToken) {
      setError('Invalid or missing reset token. Please request a new password reset link.')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [resetToken])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const isPasswordValid = () => {
    return formData.newPassword && !validatePassword(formData.newPassword)
  }

  const checkRequirement = (testFn) => {
    if (!formData.newPassword) return false
    return testFn(formData.newPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate token
    if (!resetToken) {
      setError('Invalid or missing reset token. Please request a new password reset link.')
      return
    }

    // Validate passwords
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      await userService.resetPassword({
        token: resetToken,
        newPassword: formData.newPassword
      })
      setShowSuccess(true)
    } catch (err) {
      console.error('Reset password error:', err)
      const errorMessage = err.message || err.response?.data?.error?.message || 'Failed to reset password. The link may have expired.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    
    // Clear URL token after success
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Navigate to login page after a short delay to allow modal animation to complete
    setTimeout(() => {
      if (onSuccess) {
        onSuccess()
      } else if (onClose) {
        onClose()
      } else {
        // Fallback: reload to show login page
        window.location.href = window.location.origin
      }
    }, 300)
  }

  if (showSuccess) {
    return (
      <PasswordResetSuccessModal onClose={handleSuccessClose} />
    )
  }

  return (
    <div className={`reset-password-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`reset-password-content ${isVisible ? 'visible' : ''}`}>
        <button className="reset-password-close" onClick={onClose || (() => window.location.href = '/')}>×</button>
        
        <div className="reset-password-header">
          <div className="reset-password-icon-wrapper">
            <div className={`lock-animation-container ${isPasswordValid() ? 'unlocked' : 'locked'}`}>
              <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Lock body */}
                <rect className="lock-body" x="3" y="11" width="18" height="11" rx="2" ry="2" />
                {/* Lock shackle - animated */}
                <path className="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
          <h2 className="reset-password-title">Reset Your Password 🔐</h2>
          <p className="reset-password-subtitle">
            Enter your new password below. Make sure it's strong and secure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && (
            <div className="reset-password-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="reset-password-input-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter your new password"
              className={error ? 'error' : ''}
              disabled={isSubmitting || !resetToken}
              autoFocus
              minLength={8}
            />
            <div className="password-requirements">
              <div className="requirement-item">
                <span className={`requirement-check ${checkRequirement((p) => p.length >= 8) ? 'requirement-met' : ''}`}>
                  {checkRequirement((p) => p.length >= 8) ? '✓' : '○'}
                </span>
                <span className={checkRequirement((p) => p.length >= 8) ? 'requirement-text-met' : ''}>At least 8 characters</span>
              </div>
              <div className="requirement-item">
                <span className={`requirement-check ${checkRequirement((p) => /(?=.*[a-z])/.test(p)) ? 'requirement-met' : ''}`}>
                  {checkRequirement((p) => /(?=.*[a-z])/.test(p)) ? '✓' : '○'}
                </span>
                <span className={checkRequirement((p) => /(?=.*[a-z])/.test(p)) ? 'requirement-text-met' : ''}>One lowercase letter</span>
              </div>
              <div className="requirement-item">
                <span className={`requirement-check ${checkRequirement((p) => /(?=.*[A-Z])/.test(p)) ? 'requirement-met' : ''}`}>
                  {checkRequirement((p) => /(?=.*[A-Z])/.test(p)) ? '✓' : '○'}
                </span>
                <span className={checkRequirement((p) => /(?=.*[A-Z])/.test(p)) ? 'requirement-text-met' : ''}>One uppercase letter</span>
              </div>
              <div className="requirement-item">
                <span className={`requirement-check ${checkRequirement((p) => /(?=.*\d)/.test(p)) ? 'requirement-met' : ''}`}>
                  {checkRequirement((p) => /(?=.*\d)/.test(p)) ? '✓' : '○'}
                </span>
                <span className={checkRequirement((p) => /(?=.*\d)/.test(p)) ? 'requirement-text-met' : ''}>One number</span>
              </div>
            </div>
          </div>

          <div className="reset-password-input-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              className={error ? 'error' : ''}
              disabled={isSubmitting || !resetToken}
              minLength={8}
            />
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <div className="password-match-indicator">
                <span className="match-icon">✓</span>
                <span>Passwords match</span>
              </div>
            )}
          </div>

          <div className="reset-password-buttons">
            <button
              type="button"
              className="reset-password-btn secondary"
              onClick={onClose || (() => window.location.href = '/')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="reset-password-btn primary"
              disabled={isSubmitting || !resetToken || !formData.newPassword || !formData.confirmPassword}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
