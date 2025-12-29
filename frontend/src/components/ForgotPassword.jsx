import { useState } from 'react'
import API_CONFIG from '../services/config'
import './ForgotPassword.css'

const ForgotPassword = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1) // 1: Email, 2: Verify Code, 3: Reset Password
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Validation functions
  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const validateCode = (code) => {
    if (!code) {
      return 'Reset code is required'
    }
    if (!/^\d{6}$/.test(code)) {
      return 'Reset code must be exactly 6 digits'
    }
    return ''
  }

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmitEmail = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const emailError = validateEmail(formData.email)
    if (emailError) {
      setErrors({ email: emailError })
      setTouched({ email: true })
      setIsSubmitting(false)
      return
    }

    try {
      const API_URL = API_CONFIG.USER_SERVICE.replace('/api', '')
      const response = await fetch(`${API_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password reset code has been sent to your email. Please check your inbox and spam folder.')
        setStep(2)
      } else {
        setErrors({ email: data.error?.message || 'Failed to send reset code' })
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setErrors({ email: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const codeError = validateCode(formData.code)
    if (codeError) {
      setErrors({ code: codeError })
      setTouched({ code: true })
      setIsSubmitting(false)
      return
    }

    try {
      const API_URL = API_CONFIG.USER_SERVICE.replace('/api', '')
      const response = await fetch(`${API_URL}/api/users/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          code: formData.code
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Code verified successfully. Please enter your new password.')
        setStep(3)
      } else {
        setErrors({ code: data.error?.message || 'Invalid or expired code' })
      }
    } catch (error) {
      console.error('Verify code error:', error)
      setErrors({ code: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    // Validate all fields
    const currentPasswordError = validatePassword(formData.currentPassword)
    const newPasswordError = validatePassword(formData.newPassword)
    const confirmPasswordError = formData.newPassword !== formData.confirmPassword 
      ? 'Passwords do not match' 
      : ''

    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      setErrors({
        currentPassword: currentPasswordError,
        newPassword: newPasswordError,
        confirmPassword: confirmPasswordError
      })
      setTouched({
        currentPassword: true,
        newPassword: true,
        confirmPassword: true
      })
      setIsSubmitting(false)
      return
    }

    // Check if new password is same as current
    if (formData.currentPassword === formData.newPassword) {
      setErrors({
        newPassword: 'New password must be different from current password'
      })
      setIsSubmitting(false)
      return
    }

    try {
      const API_URL = API_CONFIG.USER_SERVICE.replace('/api', '')
      const response = await fetch(`${API_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password has been reset successfully. A confirmation email has been sent to your registered email.')
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else if (onBack) {
            onBack()
          }
        }, 2000)
      } else {
        setErrors({ 
          submit: data.error?.message || 'Failed to reset password',
          ...(data.error?.code === 'INVALID_CURRENT_PASSWORD' && { currentPassword: 'Current password is incorrect' })
        })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h2>Reset Password</h2>
          {onBack && (
            <button 
              type="button" 
              className="back-button"
              onClick={onBack}
            >
              ← Back to Login
            </button>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'info'}`}>
            {message}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSubmitEmail} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={() => handleBlur('email')}
                className={`form-input ${touched.email && errors.email ? 'error' : ''}`}
                placeholder="Enter your email address"
                required
              />
              {touched.email && errors.email && (
                <p className="error-message">{errors.email}</p>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="code">Enter 6-Digit Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                onBlur={() => handleBlur('code')}
                className={`form-input code-input ${touched.code && errors.code ? 'error' : ''}`}
                placeholder="000000"
                maxLength="6"
                required
              />
              {touched.code && errors.code && (
                <p className="error-message">{errors.code}</p>
              )}
              <p className="help-text">
                We've sent a 6-digit code to <strong>{formData.email}</strong>. 
                Please check your email and enter the code here.
              </p>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              className="resend-button"
              onClick={() => setStep(1)}
            >
              Resend Code
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                onBlur={() => handleBlur('currentPassword')}
                className={`form-input ${touched.currentPassword && errors.currentPassword ? 'error' : ''}`}
                placeholder="Enter your current password"
                required
              />
              {touched.currentPassword && errors.currentPassword && (
                <p className="error-message">{errors.currentPassword}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                onBlur={() => handleBlur('newPassword')}
                className={`form-input ${touched.newPassword && errors.newPassword ? 'error' : ''}`}
                placeholder="Enter your new password"
                required
              />
              {touched.newPassword && errors.newPassword && (
                <p className="error-message">{errors.newPassword}</p>
              )}
              <p className="help-text">
                Password must be at least 6 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={() => handleBlur('confirmPassword')}
                className={`form-input ${touched.confirmPassword && errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your new password"
                required
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="error-message">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword

