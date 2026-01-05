import React, { useState, useEffect } from 'react'
import LoginSuccess from './LoginSuccess'
import './ProviderLogin.css'

const ProviderLogin = ({ onLogin, onNavigateToUserLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberPassword: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  })
  const [focused, setFocused] = useState({
    email: false,
    password: false,
  })
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

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

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })

    if (touched[name]) {
      if (name === 'email') {
        setErrors({
          ...errors,
          email: validateEmail(value),
        })
      } else if (name === 'password') {
        setErrors({
          ...errors,
          password: validatePassword(value),
        })
      }
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched({
      ...touched,
      [name]: true,
    })

    if (name === 'email') {
      setErrors({
        ...errors,
        email: validateEmail(value),
      })
    } else if (name === 'password') {
      setErrors({
        ...errors,
        password: validatePassword(value),
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    setTouched({
      email: true,
      password: true,
    })

    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)

    setErrors({
      email: emailError,
      password: passwordError,
    })

    if (emailError || passwordError) {
      return
    }

    // Save remember password preference
    if (formData.rememberPassword) {
      localStorage.setItem('providerRememberEmail', formData.email)
    } else {
      localStorage.removeItem('providerRememberEmail')
    }

    // Save login status and role
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userRole', 'provider')
    
    setShowSuccessAnimation(true)
  }

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('providerRememberEmail')
    if (rememberedEmail) {
      setFormData({
        ...formData,
        email: rememberedEmail,
        rememberPassword: true,
      })
    }
  }, [])

  return (
    <div className="provider-login-container">
      <div className="provider-login-wrapper">
        <div className="provider-login-form-section">
          <div className="data-flow-animation"></div>
          <div className="provider-login-form-wrapper">
            <div className="provider-login-header">
              <h1 className="provider-login-title">Provider Portal</h1>
              <p className="provider-login-subtitle">Sign in to manage your wellness practice</p>
            </div>

            <form className="provider-login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <div className="input-container">
                  <input
                    type="email"
                    name="email"
                    placeholder=""
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      handleBlur(e)
                      setFocused({ ...focused, email: false })
                    }}
                    onFocus={() => {
                      setTouched({ ...touched, email: true })
                      setFocused({ ...focused, email: true })
                    }}
                    className={`form-input ${touched.email && errors.email ? 'error' : ''}`}
                    required
                  />
                  <div className={`input-icon-wrapper ${formData.email || focused.email ? 'focused' : ''}`}>
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </span>
                    <span className="floating-label">Email</span>
                  </div>
                </div>
                {touched.email && errors.email && (
                  <p className="error-message">{errors.email}</p>
                )}
              </div>

              <div className="form-group">
                <div className="input-container">
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder=""
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        handleBlur(e)
                        setFocused({ ...focused, password: false })
                      }}
                      onFocus={() => {
                        setTouched({ ...touched, password: true })
                        setFocused({ ...focused, password: true })
                      }}
                      className={`form-input ${touched.password && errors.password ? 'error' : ''}`}
                      required
                    />
                    <div className={`input-icon-wrapper password-icon-wrapper ${formData.password || focused.password ? 'focused' : ''}`}>
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </span>
                      <span className="floating-label">Password</span>
                    </div>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                {touched.password && errors.password && (
                  <p className="error-message">{errors.password}</p>
                )}
              </div>

              <div className="form-group">
                <div className="remember-forgot-container">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberPassword"
                      checked={formData.rememberPassword}
                      onChange={handleInputChange}
                      className="checkbox-input"
                    />
                    <span>Remember for 30 days</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="provider-login-button">
                Sign In
              </button>
            </form>

            <div className="provider-divider">
              <span>or</span>
            </div>

            <p className="provider-switch-text">
              Are you a patient? <button
                type="button"
                className="provider-switch-link"
                onClick={onNavigateToUserLogin}
              >
                User Login
              </button>
            </p>
          </div>
        </div>

        <div className="provider-login-illustration-section">
          <div className="provider-plant-decoration"></div>
        </div>
      </div>

      {showSuccessAnimation && (
        <LoginSuccess 
          onAnimationComplete={() => {
            setShowSuccessAnimation(false)
            if (onLogin) {
              onLogin()
            }
          }}
        />
      )}
    </div>
  )
}

export default ProviderLogin

