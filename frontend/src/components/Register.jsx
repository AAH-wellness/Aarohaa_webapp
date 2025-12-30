import React, { useState, useEffect, useRef } from 'react'
import userService from '../services/userService'
import './Register.css'

const Register = ({ onRegister, onNavigateToLogin, role = 'user' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+1', // Default to US
    password: '',
    confirmPassword: '',
    rememberPassword: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [captchaError, setCaptchaError] = useState(false)
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const canvasRef = useRef(null)

  // Generate captcha code
  useEffect(() => {
    // Add a small delay to ensure canvas is mounted
    const timer = setTimeout(() => {
      generateCaptcha()
    }, 100)
    return () => clearTimeout(timer)
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
      return 'Full name must be at least 2 characters'
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
    // Remove spaces, dashes, and parentheses for validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    // Check if it's all digits
    if (!/^\d+$/.test(cleanPhone)) {
      return 'Phone number must contain only digits'
    }
    // Check length (minimum 7, maximum 15 digits)
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return 'Phone number must be between 7 and 15 digits'
    }
    return ''
  }

  // Common country codes
  const countryCodes = [
    { code: '+1', country: 'US/CA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  ]

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
      } else if (name === 'phone') {
        setErrors({
          ...errors,
          phone: validatePhone(value),
        })
      } else if (name === 'confirmPassword') {
        setErrors({
          ...errors,
          confirmPassword: validateConfirmPassword(value),
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
    } else if (name === 'phone') {
      setErrors({
        ...errors,
        phone: validatePhone(value),
      })
    } else if (name === 'confirmPassword') {
      setErrors({
        ...errors,
        confirmPassword: validateConfirmPassword(value),
      })
    }
  }

  const handleCaptchaChange = (e) => {
    setUserInput(e.target.value.toUpperCase())
    setCaptchaError(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setRegisterError('')
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    })

    // Validate all fields
    const fullNameError = validateFullName(formData.fullName)
    const emailError = validateEmail(formData.email)
    const phoneError = validatePhone(formData.phone)
    const passwordError = validatePassword(formData.password)
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword)

    setErrors({
      fullName: fullNameError,
      email: emailError,
      phone: phoneError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    })

    // Check if there are any validation errors
    if (fullNameError || emailError || phoneError || passwordError || confirmPasswordError) {
      console.log('Validation errors:', {
        fullNameError,
        emailError,
        phoneError,
        passwordError,
        confirmPasswordError
      })
      // Scroll to first error
      const firstErrorField = document.querySelector('.form-input.error')
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
        firstErrorField.focus()
      }
      return
    }
    
    // Validate captcha
    if (userInput.toUpperCase() !== captchaCode) {
      setCaptchaError(true)
      generateCaptcha()
      setUserInput('')
      alert('Invalid CAPTCHA. Please enter the correct code.')
      return
    }

    // Set loading state
    setIsLoading(true)
    console.log('Starting registration...', { email: formData.email, name: formData.fullName })

    try {
      // Prepare phone number with country code
      const fullPhoneNumber = `${formData.countryCode}${formData.phone}`

      console.log('Calling userService.register with:', {
        email: formData.email,
        name: formData.fullName,
        phone: fullPhoneNumber,
        role: role
      })

      // Call the backend API to register
      const response = await userService.register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        phone: fullPhoneNumber,
        role: role // Use the role prop (either 'user' or 'provider')
      })

      console.log('Registration response:', response)

      // Registration successful - userService already handles storing token
      if (response && response.user) {
        console.log('Registration successful!', response.user)
        
        // Save remember email preference only (not user data - that's in database)
        if (formData.rememberPassword) {
          localStorage.setItem('rememberEmail', formData.email)
        } else {
          localStorage.removeItem('rememberEmail')
        }
        
        // Reset loading state
        setIsLoading(false)
        
        // Call onRegister callback with user role
        if (onRegister) {
          // Pass the role to the callback so it can navigate correctly
          onRegister(response.user.role || role)
        }
      } else {
        console.error('Registration response missing user data:', response)
        setIsLoading(false)
        setRegisterError('Registration succeeded but received invalid response. Please try logging in.')
        alert('Registration succeeded but received invalid response. Please try logging in.')
      }
    } catch (error) {
      // Handle registration errors
      setIsLoading(false)
      console.error('Registration failed:', error)
      
      // Extract error message
      let errorMessage = 'Registration failed. Please try again.'
      
      // Check for network errors (backend not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 3001.'
      } else if (error.data?.error?.message) {
        // Backend error format: { error: { message: "...", code: "...", status: 400 } }
        errorMessage = error.data.error.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.status === 409) {
        errorMessage = 'Email already registered. Please use a different email or login.'
      } else if (error.status === 400) {
        errorMessage = 'Invalid registration data. Please check all fields and try again.'
      } else if (error.status === 0 || !error.status) {
        errorMessage = 'Network error: Cannot connect to backend server. Please ensure the backend is running on http://localhost:3001'
      }
      
      setRegisterError(errorMessage)
      alert(`Registration Error: ${errorMessage}`)
    }
  }

  // Debug: Log component render
  useEffect(() => {
    console.log('Register component rendered', { 
      showRegister: true,
      formData,
      errors,
      isLoading,
      registerError
    })
  }, [formData, errors, isLoading, registerError])

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
              <div className="input-wrapper">
                <label className="floating-label">
                  <span className="floating-label-icon">📱</span>
                  <span className="floating-label-text">Enter your phone number</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    style={{
                      width: '120px',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {countryCodes.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.flag} {item.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="📱 Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`form-input ${touched.phone && errors.phone ? 'error' : ''} ${formData.phone ? 'has-value' : ''}`}
                    style={{ flex: 1 }}
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

            {/* Error Message Display */}
            {registerError && (
              <div className="error-message-container" style={{
                marginBottom: '15px',
                padding: '12px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33'
              }}>
                <strong>⚠️ Registration Failed:</strong> {registerError}
              </div>
            )}

            <button 
              type="submit" 
              className="register-button"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer'
              }}
            >
              {isLoading ? '⏳ Registering...' : 'Sign Up'}
            </button>
            
            {isLoading && (
              <p style={{ 
                textAlign: 'center', 
                marginTop: '10px', 
                color: '#666',
                fontSize: '14px'
              }}>
                Please wait, creating your account...
              </p>
            )}
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

