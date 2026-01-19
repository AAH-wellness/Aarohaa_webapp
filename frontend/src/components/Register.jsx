import React, { useState, useEffect, useRef } from 'react'
import { userService } from '../services'
import LoginSuccess from './LoginSuccess'
import './Register.css'

const Register = ({ onRegister, onNavigateToLogin, registrationMode = 'user' }) => {
  const isProviderMode = registrationMode === 'provider'
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: '+1', // Default to US
    phone: '',
    rememberPassword: false,
    // Provider-specific fields
    specialty: '',
    title: '',
    bio: '',
    hourlyRate: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [captchaError, setCaptchaError] = useState(false)
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialty: '',
    title: '',
    bio: '',
    hourlyRate: '',
  })
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
    specialty: false,
    title: false,
    bio: false,
    hourlyRate: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [focused, setFocused] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
    specialty: false,
    title: false,
    bio: false,
    hourlyRate: false,
  })
  const canvasRef = useRef(null)

  // Country codes list
  const countryCodes = [
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+39', country: 'IT', flag: '🇮🇹' },
    { code: '+34', country: 'ES', flag: '🇪🇸' },
    { code: '+61', country: 'AU', flag: '🇦🇺' },
    { code: '+55', country: 'BR', flag: '🇧🇷' },
    { code: '+7', country: 'RU', flag: '🇷🇺' },
    { code: '+82', country: 'KR', flag: '🇰🇷' },
    { code: '+65', country: 'SG', flag: '🇸🇬' },
    { code: '+971', country: 'AE', flag: '🇦🇪' },
    { code: '+966', country: 'SA', flag: '🇸🇦' },
    { code: '+27', country: 'ZA', flag: '🇿🇦' },
    { code: '+52', country: 'MX', flag: '🇲🇽' },
    { code: '+31', country: 'NL', flag: '🇳🇱' },
    { code: '+46', country: 'SE', flag: '🇸🇪' },
    { code: '+47', country: 'NO', flag: '🇳🇴' },
    { code: '+45', country: 'DK', flag: '🇩🇰' },
    { code: '+41', country: 'CH', flag: '🇨🇭' },
    { code: '+32', country: 'BE', flag: '🇧🇪' },
    { code: '+351', country: 'PT', flag: '🇵🇹' },
    { code: '+353', country: 'IE', flag: '🇮🇪' },
    { code: '+358', country: 'FI', flag: '🇫🇮' },
    { code: '+48', country: 'PL', flag: '🇵🇱' },
    { code: '+90', country: 'TR', flag: '🇹🇷' },
    { code: '+20', country: 'EG', flag: '🇪🇬' },
    { code: '+234', country: 'NG', flag: '🇳🇬' },
    { code: '+254', country: 'KE', flag: '🇰🇪' },
    { code: '+92', country: 'PK', flag: '🇵🇰' },
    { code: '+880', country: 'BD', flag: '🇧🇩' },
    { code: '+62', country: 'ID', flag: '🇮🇩' },
    { code: '+60', country: 'MY', flag: '🇲🇾' },
    { code: '+66', country: 'TH', flag: '🇹🇭' },
    { code: '+84', country: 'VN', flag: '🇻🇳' },
    { code: '+63', country: 'PH', flag: '🇵🇭' },
    { code: '+64', country: 'NZ', flag: '🇳🇿' },
    { code: '+1', country: 'CA', flag: '🇨🇦' },
  ]

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
    // Basic phone validation - allows numbers, spaces, dashes, parentheses, and +
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
    if (!phoneRegex.test(phone)) {
      return 'Please enter a valid phone number'
    }
    return ''
  }

  const validateHourlyRate = (rate) => {
    if (isProviderMode && !rate) {
      return 'Hourly rate is required'
    }
    if (rate && (isNaN(parseFloat(rate)) || parseFloat(rate) < 0)) {
      return 'Please enter a valid hourly rate'
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
      } else if (name === 'hourlyRate') {
        setErrors({
          ...errors,
          hourlyRate: validateHourlyRate(value),
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
    } else if (name === 'hourlyRate') {
      setErrors({
        ...errors,
        hourlyRate: validateHourlyRate(value),
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
    const touchedFields = {
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
    }
    if (isProviderMode) {
      touchedFields.specialty = true
      touchedFields.title = true
      touchedFields.hourlyRate = true
    }
    setTouched(touchedFields)

    // Validate all fields
    const fullNameError = validateFullName(formData.fullName)
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword)
    const phoneError = validatePhone(formData.phone)
    const hourlyRateError = isProviderMode ? validateHourlyRate(formData.hourlyRate) : ''

    const errorObj = {
      fullName: fullNameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      phone: phoneError,
      specialty: '',
      title: '',
      bio: '',
      hourlyRate: hourlyRateError,
    }
    setErrors(errorObj)

    // Check if there are any validation errors
    if (fullNameError || emailError || passwordError || confirmPasswordError || phoneError || hourlyRateError) {
      return
    }
    
    // Validate captcha
    if (userInput !== captchaCode) {
      setCaptchaError(true)
      generateCaptcha()
      setUserInput('')
      return
    }

    setIsLoading(true)

    try {
      // Combine country code with phone number (phone is required)
      const fullPhoneNumber = `${formData.countryCode}${formData.phone.replace(/^\+/, '')}`
      
      if (isProviderMode) {
        // Register as provider - stores ONLY in providers table (NOT in users table)
        const response = await userService.registerProvider({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: fullPhoneNumber,
          specialty: formData.specialty || null,
          title: formData.title || null,
          bio: formData.bio || null,
          hourlyRate: parseFloat(formData.hourlyRate) || 0
        })

        // Save remember password preference
        if (formData.rememberPassword) {
          localStorage.setItem('rememberEmail', formData.email)
        }

        // Show success animation before navigating
        setShowSuccessAnimation(true)
      } else {
        // Register as user - stores in users table only
        const response = await userService.register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: fullPhoneNumber,
          role: 'user'
        })

        // Save remember password preference
        if (formData.rememberPassword) {
          localStorage.setItem('rememberEmail', formData.email)
        }

        // Show success animation before navigating
        setShowSuccessAnimation(true)
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      // Extract error message with more context
      let errorMsg = 'Registration failed. Please try again.'
      
      if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message
        
        // Add helpful suggestions for common errors
        if (error.response.status === 409) {
          if (errorMsg.includes('already registered as user')) {
            errorMsg += '\n\nThis email is already registered as a regular user. Please use the user login page instead, or use a different email address.'
          } else if (errorMsg.includes('already registered as provider')) {
            errorMsg += '\n\nThis email is already registered as a provider. Please use the provider login page instead, or use a different email address.'
          } else if (errorMsg.includes('already registered')) {
            errorMsg += '\n\nThis email is already in use. Please try logging in instead, or use a different email address.'
          }
        }
      } else if (error.message) {
        errorMsg = error.message
      }

      // Show error alert (you can replace this with a modal if needed)
      alert(errorMsg)
    } finally {
      setIsLoading(false)
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
        <p className="register-subtitle">
          {isProviderMode 
            ? 'Create your provider account on Aarohaa Wellness' 
            : 'Create your Aarohaa Wellness account'}
        </p>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-field-wrapper">
                <div className={`name-icon-wrapper ${formData.fullName || focused.fullName ? 'hidden' : ''}`}>
                  <svg className="name-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <label className={`floating-label ${formData.fullName || focused.fullName ? 'active' : ''}`}>
                  Enter your full name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={(e) => {
                    handleBlur(e)
                    setFocused({ ...focused, fullName: false })
                  }}
                  onFocus={() => {
                    setTouched({ ...touched, fullName: true })
                    setFocused({ ...focused, fullName: true })
                  }}
                  className={`form-input name-input ${touched.fullName && errors.fullName ? 'error' : ''} ${formData.fullName || focused.fullName ? 'has-value' : ''}`}
                  required
                />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="error-message">{errors.fullName}</p>
              )}
            </div>

            <div className="form-group">
              <div className="input-field-wrapper">
                <div className={`email-icon-wrapper ${formData.email || focused.email ? 'hidden' : ''}`}>
                  <svg className="email-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <label className={`floating-label ${formData.email || focused.email ? 'active' : ''}`}>
                  Enter your email
                </label>
                <input
                  type="email"
                  name="email"
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
                  className={`form-input email-input ${touched.email && errors.email ? 'error' : ''} ${formData.email || focused.email ? 'has-value' : ''}`}
                  required
                />
              </div>
              {touched.email && errors.email && (
                <p className="error-message">{errors.email}</p>
              )}
            </div>

            <div className="form-group">
              <div className="phone-input-container">
                <div className="country-code-selector">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    className="country-code-select"
                  >
                    {countryCodes.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-field-wrapper phone-field-wrapper">
                  <div className={`phone-icon-wrapper ${formData.phone || focused.phone ? 'hidden' : ''}`}>
                    <svg className="phone-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <label className={`floating-label ${formData.phone || focused.phone ? 'active' : ''}`}>
                    Enter your phone number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      handleBlur(e)
                      setFocused({ ...focused, phone: false })
                    }}
                    onFocus={() => {
                      setTouched({ ...touched, phone: true })
                      setFocused({ ...focused, phone: true })
                    }}
                    className={`form-input phone-input ${touched.phone && errors.phone ? 'error' : ''} ${formData.phone || focused.phone ? 'has-value' : ''}`}
                    placeholder=""
                    required
                  />
                </div>
              </div>
              {touched.phone && errors.phone && (
                <p className="error-message">{errors.phone}</p>
              )}
            </div>

            <div className="form-group">
              <div className="input-field-wrapper">
                <div className={`password-icon-wrapper ${formData.password || focused.password ? 'hidden' : ''}`}>
                  <svg className="password-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <label className={`floating-label ${formData.password || focused.password ? 'active' : ''}`}>
                  Enter your password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
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
                  className={`form-input password-input ${touched.password && errors.password ? 'error' : ''} ${formData.password || focused.password ? 'has-value' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            <div className="form-group">
              <div className="input-field-wrapper">
                <div className={`password-icon-wrapper ${formData.confirmPassword || focused.confirmPassword ? 'hidden' : ''}`}>
                  <svg className="password-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <label className={`floating-label ${formData.confirmPassword || focused.confirmPassword ? 'active' : ''}`}>
                  Confirm your password
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={(e) => {
                    handleBlur(e)
                    setFocused({ ...focused, confirmPassword: false })
                  }}
                  onFocus={() => {
                    setTouched({ ...touched, confirmPassword: true })
                    setFocused({ ...focused, confirmPassword: true })
                  }}
                  className={`form-input password-input ${touched.confirmPassword && errors.confirmPassword ? 'error' : ''} ${formData.confirmPassword || focused.confirmPassword ? 'has-value' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="error-message">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Provider-specific fields */}
            {isProviderMode && (
              <>
                <div className="form-group">
                  <div className="input-field-wrapper">
                    <label className={`floating-label ${formData.specialty || focused.specialty ? 'active' : ''}`}>
                      Specialty (e.g., Yoga Therapy, Mental Health)
                    </label>
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        handleBlur(e)
                        setFocused({ ...focused, specialty: false })
                      }}
                      onFocus={() => {
                        setTouched({ ...touched, specialty: true })
                        setFocused({ ...focused, specialty: true })
                      }}
                      className={`form-input ${touched.specialty && errors.specialty ? 'error' : ''} ${formData.specialty || focused.specialty ? 'has-value' : ''}`}
                    />
                  </div>
                  {touched.specialty && errors.specialty && (
                    <p className="error-message">{errors.specialty}</p>
                  )}
                </div>

                <div className="form-group">
                  <div className="input-field-wrapper">
                    <label className={`floating-label ${formData.title || focused.title ? 'active' : ''}`}>
                      Professional Title (e.g., Licensed Therapist, Certified Coach)
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        handleBlur(e)
                        setFocused({ ...focused, title: false })
                      }}
                      onFocus={() => {
                        setTouched({ ...touched, title: true })
                        setFocused({ ...focused, title: true })
                      }}
                      className={`form-input ${touched.title && errors.title ? 'error' : ''} ${formData.title || focused.title ? 'has-value' : ''}`}
                    />
                  </div>
                  {touched.title && errors.title && (
                    <p className="error-message">{errors.title}</p>
                  )}
                </div>

                <div className="form-group">
                  <div className="input-field-wrapper">
                    <label className={`floating-label ${formData.bio || focused.bio ? 'active' : ''}`}>
                      Bio (Brief description of your practice)
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        handleBlur(e)
                        setFocused({ ...focused, bio: false })
                      }}
                      onFocus={() => {
                        setTouched({ ...touched, bio: true })
                        setFocused({ ...focused, bio: true })
                      }}
                      className={`form-input ${touched.bio && errors.bio ? 'error' : ''} ${formData.bio || focused.bio ? 'has-value' : ''}`}
                      rows="3"
                    />
                  </div>
                  {touched.bio && errors.bio && (
                    <p className="error-message">{errors.bio}</p>
                  )}
                </div>

                <div className="form-group">
                  <div className="input-field-wrapper">
                    <label className={`floating-label ${formData.hourlyRate || focused.hourlyRate ? 'active' : ''}`}>
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        handleBlur(e)
                        setFocused({ ...focused, hourlyRate: false })
                      }}
                      onFocus={() => {
                        setTouched({ ...touched, hourlyRate: true })
                        setFocused({ ...focused, hourlyRate: true })
                      }}
                      className={`form-input ${touched.hourlyRate && errors.hourlyRate ? 'error' : ''} ${formData.hourlyRate || focused.hourlyRate ? 'has-value' : ''}`}
                      min="0"
                      step="0.01"
                      required={isProviderMode}
                    />
                  </div>
                  {touched.hourlyRate && errors.hourlyRate && (
                    <p className="error-message">{errors.hourlyRate}</p>
                  )}
                </div>
              </>
            )}

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

            <button type="submit" className="register-button" disabled={isLoading}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
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

      {/* Success Animation - Shows after successful registration */}
      {showSuccessAnimation && (
        <LoginSuccess 
          onAnimationComplete={() => {
            setShowSuccessAnimation(false)
            if (onRegister) {
              onRegister()
            }
          }}
        />
      )}
    </div>
  )
}

export default Register

