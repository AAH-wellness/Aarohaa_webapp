import React, { useState, useEffect, useRef } from 'react'
import './Register.css'
import { countryCodes, getDefaultCountry } from '../utils/countryCodes.js'
import userService from '../services/userService.js'

const Register = ({ onRegister, onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberPassword: false,
    phone: '',
    countryCode: getDefaultCountry().dialCode,
    dateOfBirth: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [captchaError, setCaptchaError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
  })
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
    dateOfBirth: false,
  })
  const canvasRef = useRef(null)

  // Generate captcha code
  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Generate random code
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    setCaptchaCode(code)
    
    // Draw background
    ctx.fillStyle = '#ede9d0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw text
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Draw each character with slight rotation and offset
    const charWidth = canvas.width / 5
    for (let i = 0; i < code.length; i++) {
      ctx.save()
      ctx.translate(charWidth * i + charWidth / 2, canvas.height / 2)
      ctx.rotate((Math.random() - 0.5) * 0.3)
      ctx.fillStyle = `#0e4826`
      ctx.fillText(code[i], 0, 0)
      ctx.restore()
    }
    
    // Add some noise lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(14, 72, 38, ${Math.random() * 0.3})`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }
  }

  const validateFullName = (name) => {
    if (!name) {
      return 'Full name is required'
    }
    if (name.trim().length < 2) {
      return 'Full name must be at least 2 characters long'
    }
    if (name.trim().length > 100) {
      return 'Full name must be less than 100 characters'
    }
    return ''
  }

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
    // Check for uppercase, lowercase, and number
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    return ''
  }

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      return 'Please confirm your password'
    }
    if (confirmPassword !== formData.password) {
      return 'Passwords do not match'
    }
    return ''
  }

  const validatePhone = (phone) => {
    if (!phone) {
      return 'Phone number is required'
    }
    // Basic phone validation - allows digits, spaces, hyphens
    const phoneRegex = /^[\d\s\-]+$/
    if (!phoneRegex.test(phone)) {
      return 'Please enter a valid phone number (digits only)'
    }
    // Remove spaces and hyphens for digit count
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length < 7) {
      return 'Phone number must be at least 7 digits'
    }
    if (digitsOnly.length > 15) {
      return 'Phone number must be less than 15 digits'
    }
    return ''
  }

  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) {
      return 'Date of birth is required'
    }
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    if (age < 13) {
      return 'You must be at least 13 years old'
    }
    if (age > 120) {
      return 'Please enter a valid date of birth'
    }
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })

    // Validate on change if field has been touched
    if (touched[name]) {
      if (name === 'fullName') {
        setErrors({
          ...errors,
          fullName: validateFullName(value),
        })
      } else if (name === 'email') {
        setErrors({
          ...errors,
          email: validateEmail(value),
        })
      } else if (name === 'password') {
        setErrors({
          ...errors,
          password: validatePassword(value),
          confirmPassword: formData.confirmPassword ? validateConfirmPassword(formData.confirmPassword) : '',
        })
      } else if (name === 'confirmPassword') {
        setErrors({
          ...errors,
          confirmPassword: validateConfirmPassword(value),
        })
      } else if (name === 'phone') {
        setErrors({
          ...errors,
          phone: validatePhone(value),
        })
      } else if (name === 'dateOfBirth') {
        setErrors({
          ...errors,
          dateOfBirth: validateDateOfBirth(value),
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

    // Validate on blur
    if (name === 'fullName') {
      setErrors({
        ...errors,
        fullName: validateFullName(value),
      })
    } else if (name === 'email') {
      setErrors({
        ...errors,
        email: validateEmail(value),
      })
    } else if (name === 'password') {
      setErrors({
        ...errors,
        password: validatePassword(value),
      })
    } else if (name === 'confirmPassword') {
      setErrors({
        ...errors,
        confirmPassword: validateConfirmPassword(value),
      })
    } else if (name === 'phone') {
      setErrors({
        ...errors,
        phone: validatePhone(value),
      })
    } else if (name === 'dateOfBirth') {
      setErrors({
        ...errors,
        dateOfBirth: validateDateOfBirth(value),
      })
    }
  }

  const handleCaptchaChange = (e) => {
    setUserInput(e.target.value.toUpperCase())
    setCaptchaError(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
      dateOfBirth: true,
    })

    // Validate all fields
    const fullNameError = validateFullName(formData.fullName)
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword)
    const phoneError = validatePhone(formData.phone)
    const dateOfBirthError = validateDateOfBirth(formData.dateOfBirth)

    setErrors({
      fullName: fullNameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      phone: phoneError,
      dateOfBirth: dateOfBirthError,
    })

    // Check if there are any validation errors
    if (fullNameError || emailError || passwordError || confirmPasswordError || phoneError || dateOfBirthError) {
      return
    }
    
    // Validate captcha
    if (userInput !== captchaCode) {
      setCaptchaError(true)
      generateCaptcha()
      setUserInput('')
      return
    }

    // Combine country code with phone number
    const fullPhoneNumber = `${formData.countryCode}${formData.phone.replace(/\D/g, '')}`
    
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      // Send registration data to backend API
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        role: 'user',
        phone: fullPhoneNumber,
        dateOfBirth: formData.dateOfBirth
      }
      
      const response = await userService.register(registrationData)
      
      // Registration successful - backend returns user data and token
      if (response.data && response.data.user) {
        const user = response.data.user
        
        // Save user data to localStorage for frontend use
        const userData = {
          fullName: user.name,
          email: user.email,
          phone: fullPhoneNumber,
          countryCode: formData.countryCode,
          dateOfBirth: formData.dateOfBirth,
        }
        localStorage.setItem('userData', JSON.stringify(userData))
        
        // Also save to userProfileData for Profile component
        const userProfileData = {
          fullName: user.name,
          email: user.email,
          phone: fullPhoneNumber,
          countryCode: formData.countryCode,
          dateOfBirth: formData.dateOfBirth,
          address: '', // Will be set later in profile
        }
        localStorage.setItem('userProfileData', JSON.stringify(userProfileData))
        
        // Save current user
        const currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        }
        localStorage.setItem('currentUser', JSON.stringify(currentUser))
        
        // Save token if provided
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token)
        }
        
        // Save remember password preference
        if (formData.rememberPassword) {
          localStorage.setItem('rememberEmail', formData.email)
        }
        
        // Save login status
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', user.role || 'user')
        
        // Call onRegister callback
        if (onRegister) {
          onRegister()
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setSubmitError(
        error.response?.data?.error?.message || 
        error.message || 
        'Registration failed. Please try again.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-modal-form">
      <button 
        className="register-modal-close" 
        onClick={onNavigateToLogin}
        aria-label="Close"
      >
        ×
      </button>
      <div className="register-header">
        <h1 className="register-title">Sign Up</h1>
        <p className="register-subtitle">Create your Aarohaa Wellness account</p>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-wrapper">
                <label className="floating-label">
                  <span className="floating-label-icon">👤</span>
                  <span className="floating-label-text">Enter your full name</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="👤 Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.fullName && errors.fullName ? 'error' : ''} ${formData.fullName ? 'has-value' : ''}`}
                  required
                />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="error-message">{errors.fullName}</p>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <label className="floating-label">
                  <span className="floating-label-icon">📧</span>
                  <span className="floating-label-text">Enter your email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="📧 Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.email && errors.email ? 'error' : ''} ${formData.email ? 'has-value' : ''}`}
                  required
                />
              </div>
              {touched.email && errors.email && (
                <p className="error-message">{errors.email}</p>
              )}
            </div>

            <div className="form-group">
              <div className="phone-input-wrapper">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="country-code-select"
                  title="Select country code"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.dialCode}>
                      {country.flag} {country.dialCode}
                    </option>
                  ))}
                </select>
                <div className="input-wrapper phone-input-container">
                  <label className="floating-label">
                    <span className="floating-label-icon">📱</span>
                    <span className="floating-label-text">Enter your phone number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`form-input phone-input ${touched.phone && errors.phone ? 'error' : ''} ${formData.phone ? 'has-value' : ''}`}
                    required
                  />
                </div>
              </div>
              {touched.phone && errors.phone && (
                <p className="error-message">{errors.phone}</p>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <label className="floating-label">
                  <span className="floating-label-icon">🎂</span>
                  <span className="floating-label-text">Select your date of birth</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="🎂 Select your date of birth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.dateOfBirth && errors.dateOfBirth ? 'error' : ''} ${formData.dateOfBirth ? 'has-value' : ''}`}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                  required
                />
              </div>
              {touched.dateOfBirth && errors.dateOfBirth && (
                <p className="error-message">{errors.dateOfBirth}</p>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <label className="floating-label">
                  <span className="floating-label-icon">🔒</span>
                  <span className="floating-label-text">Enter your password</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="🔒 Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.password && errors.password ? 'error' : ''} ${formData.password ? 'has-value' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <label className="floating-label">
                  <span className="floating-label-icon">🔒</span>
                  <span className="floating-label-text">Confirm your password</span>
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="🔒 Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.confirmPassword && errors.confirmPassword ? 'error' : ''} ${formData.confirmPassword ? 'has-value' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="error-message">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberPassword"
                  checked={formData.rememberPassword}
                  onChange={handleInputChange}
                  className="checkbox-input"
                />
                <span>Remember password</span>
              </label>
            </div>

            <div className="form-group">
              <div className="captcha-container">
                <canvas
                  ref={canvasRef}
                  width={130}
                  height={45}
                  className="captcha-canvas"
                  onClick={generateCaptcha}
                  title="Click to refresh"
                />
                <input
                  type="text"
                  placeholder="Enter CAPTCHA"
                  value={userInput}
                  onChange={handleCaptchaChange}
                  className={`captcha-input ${captchaError ? 'error' : ''}`}
                  maxLength={5}
                />
              </div>
              {captchaError && (
                <p className="captcha-error">Invalid CAPTCHA. Please try again.</p>
              )}
              <p className="captcha-hint">Click on CAPTCHA to refresh</p>
            </div>

            {submitError && (
              <p className="error-message" style={{ marginTop: '8px', textAlign: 'center' }}>
                {submitError}
              </p>
            )}
            <button 
              type="submit" 
              className="register-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>

      <p className="login-link-text">
        Already have an account? <button
          type="button"
          className="login-link"
          onClick={onNavigateToLogin}
        >
          Login
        </button>
      </p>
    </div>
  )
}

export default Register

