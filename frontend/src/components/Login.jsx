import React, { useState, useEffect } from 'react'
import LoginSuccess from './LoginSuccess'
import userService from '../services/userService'
import './Login.css'

const Login = ({ onLogin, onNavigateToRegister, onForgotPassword, loginMode, onToggleMode, onNavigateToProviderLogin }) => {
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
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [availableWallets, setAvailableWallets] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Derive mode flags from loginMode prop
  const isProviderMode = loginMode === 'provider'
  const isAdminMode = loginMode === 'admin'

  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required'
    }
    if (email.length > 254) {
      return 'Email address is too long'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    // Additional validation for common email format issues
    if (email.includes('..') || email.startsWith('.') || email.startsWith('@')) {
      return 'Please enter a valid email address'
    }
    // Admin mode validation - only @aarohaa.io emails allowed
    if (isAdminMode && !email.toLowerCase().endsWith('@aarohaa.io')) {
      return 'Admin access requires an @aarohaa.io email address'
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
    if (password.length > 128) {
      return 'Password must be less than 128 characters'
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

    // Validate on blur
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setLoginError('')
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    })

    // Validate all fields
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)

    setErrors({
      email: emailError,
      password: passwordError,
    })

    // Check if there are any validation errors
    if (emailError || passwordError) {
      return
    }

    // Save remember password preference
    if (formData.rememberPassword) {
      localStorage.setItem('rememberEmail', formData.email)
    } else {
      localStorage.removeItem('rememberEmail')
    }

    // Set loading state
    setIsLoading(true)

    try {
      // Call the backend API to login
      const response = await userService.login({
        email: formData.email,
        password: formData.password,
        loginMethod: 'email'
      })

      // Login successful - userService already handles storing token and session
      if (response.user) {
        // Save current user for Header component
        localStorage.setItem('currentUser', JSON.stringify(response.user))
        localStorage.setItem('lastLoginTime', new Date().toLocaleString())
        
        // Show success animation - onLogin will be called after animation completes
        setShowSuccessAnimation(true)
        setIsLoading(false)
      }
    } catch (error) {
      // Handle login errors
      setIsLoading(false)
      console.error('Login failed:', error)
      
      // Extract error message from backend response
      let errorMessage = 'Login failed. Please try again.'
      
      if (error.data?.error?.message) {
        // Backend error format: { error: { message: "...", code: "...", status: 401 } }
        errorMessage = error.data.error.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.status === 401) {
        errorMessage = 'User not found or invalid email/password. Please check your credentials and try again.'
      } else if (error.status === 404) {
        errorMessage = 'User not found. Please check your email and try again.'
      } else if (error.status === 400) {
        errorMessage = 'Invalid email or password format. Please check your input.'
      }
      
      setLoginError(errorMessage)
      
      // Show error popup
      alert(errorMessage)
    }
  }

  const handleGoogleLogin = () => {
    // Simulate Google login
    alert('Google login will be integrated with Google OAuth')
    
    // Create user from Google (demo)
    const currentUser = {
      id: Date.now().toString(),
      name: 'Google User',
      email: 'user@gmail.com',
      role: loginMode || 'user',
    }
    
    // Google login - will be handled by backend API
    // For now, just show success (backend integration needed)
    alert('Google login will be integrated with backend OAuth')
    // Show success animation first
    setShowSuccessAnimation(true)
  }

  const handleWalletLogin = () => {
    // Always show wallet selection modal
    const wallets = []
    
    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      wallets.push({
        name: 'Phantom',
        icon: '👻',
        provider: window.solana,
      })
    }
    
    // Check for Solflare
    if (window.solflare) {
      wallets.push({
        name: 'Solflare',
        icon: '🔥',
        provider: window.solflare,
      })
    }
    
    // Check for Backpack
    if (window.backpack) {
      wallets.push({
        name: 'Backpack',
        icon: '🎒',
        provider: window.backpack,
      })
    }
    
    setAvailableWallets(wallets)
    setShowWalletModal(true)
  }

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail')
    if (rememberedEmail) {
      setFormData({
        ...formData,
        email: rememberedEmail,
        rememberPassword: true,
      })
    }
    checkAvailableWallets()
  }, [])

  const checkAvailableWallets = () => {
    const wallets = []
    
    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      wallets.push({
        name: 'Phantom',
        icon: '👻',
        provider: window.solana,
      })
    }
    
    // Check for Solflare
    if (window.solflare) {
      wallets.push({
        name: 'Solflare',
        icon: '🔥',
        provider: window.solflare,
      })
    }
    
    // Check for Backpack
    if (window.backpack) {
      wallets.push({
        name: 'Backpack',
        icon: '🎒',
        provider: window.backpack,
      })
    }
    
    setAvailableWallets(wallets)
  }

  const connectWallet = async (wallet) => {
    setIsConnecting(true)
    try {
      const provider = wallet.provider
      
      if (!provider) {
        throw new Error('Wallet provider not found')
      }
      
      // Always require a fresh connection - disconnect first if already connected
      // This ensures user must enter wallet passcode every time
      try {
        if (provider.isConnected && typeof provider.disconnect === 'function') {
          await provider.disconnect()
        }
      } catch (disconnectError) {
        // Ignore disconnect errors, proceed with connection
        console.log('Disconnect not needed or failed:', disconnectError)
      }
      
      // Always call connect() which will prompt for wallet passcode
      if (typeof provider.connect !== 'function') {
        throw new Error('Wallet does not support connection. Please try a different wallet.')
      }
      
      // Connect to wallet - this will prompt for passcode
      const response = await provider.connect()
      const publicKey = response.publicKey ? response.publicKey.toString() : response.toString()
      
      if (!publicKey) {
        throw new Error('Failed to get wallet address')
      }
      
      // Save wallet connection
      const walletData = {
        address: publicKey,
        network: 'Solana',
        isConnected: true,
        walletName: wallet.name,
      }
      
      // Get or create user data
      let currentUser = null
      try {
        const existingUserData = JSON.parse(localStorage.getItem('userData') || '{}')
        if (existingUserData.fullName) {
          // Use existing registered user data
          currentUser = {
            id: Date.now().toString(),
            name: existingUserData.fullName,
            email: existingUserData.email || `${publicKey.substring(0, 8)}@wallet`,
            role: loginMode || 'user',
          }
        } else {
          // Create user from wallet address
          const walletName = wallet.name || 'Wallet'
          currentUser = {
            id: Date.now().toString(),
            name: `${walletName} User`,
            email: `${publicKey.substring(0, 8)}@wallet`,
            role: loginMode || 'user',
          }
        }
      } catch (error) {
        // Fallback: create user from wallet
        const walletName = wallet.name || 'Wallet'
        currentUser = {
          id: Date.now().toString(),
          name: `${walletName} User`,
          email: `${publicKey.substring(0, 8)}@wallet`,
          role: loginMode || 'user',
        }
      }
      
      // Wallet login - store wallet connection info only (not user data)
      // User data should come from backend API after wallet authentication
      localStorage.setItem('walletData', JSON.stringify(walletData))
      
      // TODO: Call backend API to authenticate with wallet and get user data
      // For now, this is a placeholder - backend wallet auth needed
      
      setShowWalletModal(false)
      setIsConnecting(false)
      
      // Show success animation first
      setShowSuccessAnimation(true)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setIsConnecting(false)
      setShowWalletModal(false)
      
      if (error.code === 4001) {
        alert('Connection rejected. Please approve the connection request in your wallet.')
      } else if (error.message) {
        alert(`Failed to connect wallet: ${error.message}`)
      } else {
        alert('Failed to connect wallet. Please make sure your wallet extension is installed and unlocked.')
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-form-section">
          <div className="data-flow-animation"></div>
          <div className="login-form-wrapper">
            <div className="login-header">
              <h1 className="login-title">
                {isAdminMode ? 'Admin Portal' : isProviderMode ? 'Provider Portal' : 'Welcome back!'}
              </h1>
              <p className="login-subtitle">
                {isAdminMode 
                  ? 'Administrative access to platform control center' 
                  : isProviderMode 
                  ? 'Sign in to manage your wellness practice' 
                  : 'Enter your Credentials to access your account'}
              </p>
              <div className="login-mode-toggle-container">
                <button
                  type="button"
                  className={`mode-toggle-btn ${!isProviderMode && !isAdminMode ? 'active' : ''}`}
                  onClick={() => onToggleMode && onToggleMode('user')}
                >
                  👤 User
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${isProviderMode ? 'active' : ''}`}
                  onClick={() => {
                    if (onNavigateToProviderLogin) {
                      onNavigateToProviderLogin()
                    } else if (onToggleMode) {
                      onToggleMode('provider')
                    }
                  }}
                >
                  🏥 Provider
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${isAdminMode ? 'active' : ''}`}
                  onClick={() => onToggleMode && onToggleMode('admin')}
                >
                  🔐 Admin
                </button>
              </div>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {/* Email Input Field */}
              <div className="form-group">
                <div className="input-field-wrapper">
                  <div className={`email-icon-wrapper ${formData.email || focused.email ? 'hidden' : ''}`}>
                    <svg className="email-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <label className={`floating-label ${formData.email || focused.email ? 'active' : ''}`}>
                    Email
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

              {/* Password Input Field */}
              <div className="form-group">
                <div className="input-field-wrapper">
                  <div className={`password-icon-wrapper ${formData.password || focused.password ? 'hidden' : ''}`}>
                    <svg className="password-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <label className={`floating-label ${formData.password || focused.password ? 'active' : ''}`}>
                    Password
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
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={onForgotPassword}
                >
                  forgot password
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {loginError && (
              <div className="error-message-container" style={{
                marginBottom: '15px',
                padding: '12px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33'
              }}>
                <strong>⚠️ Login Failed:</strong> {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-button google-button"
                onClick={handleGoogleLogin}
              >
                <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>

              <button
                type="button"
                className="social-button wallet-button"
                onClick={handleWalletLogin}
              >
                <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
                Connect Wallet
              </button>
            </div>

            <p className="signup-text">
              Don't have an account? <button
                type="button"
                className="signup-link"
                onClick={onNavigateToRegister}
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        <div className="login-illustration-section">
          <div className="plant-decoration"></div>
        </div>
      </div>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="wallet-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h3>Connect Wallet</h3>
              <button className="close-modal-btn" onClick={() => setShowWalletModal(false)}>×</button>
            </div>
            <div className="wallet-list">
              {availableWallets.length === 0 ? (
                <div className="no-wallets-message">
                  <p>No Solana wallets detected.</p>
                  <p>Please install one of the following:</p>
                  <ul>
                    <li>Phantom Wallet</li>
                    <li>Solflare</li>
                    <li>Backpack</li>
                  </ul>
                </div>
              ) : (
                availableWallets.map((wallet, index) => (
                  <button
                    key={index}
                    className="wallet-option"
                    onClick={() => connectWallet(wallet)}
                    disabled={isConnecting}
                  >
                    <span className="wallet-icon">{wallet.icon}</span>
                    <span className="wallet-name">{wallet.name}</span>
                    {isConnecting && <span className="connecting-spinner">⏳</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showSuccessAnimation && (
        <LoginSuccess 
          onAnimationComplete={() => {
            setShowSuccessAnimation(false)
            // Call onLogin after animation completes to navigate to dashboard
            if (onLogin) {
              onLogin()
            }
          }}
        />
      )}
    </div>
  )
}

export default Login

