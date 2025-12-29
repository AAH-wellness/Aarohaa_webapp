import React, { useState, useEffect } from 'react'
import LoginSuccess from './LoginSuccess'
import './Login.css'
import userService from '../services/userService.js'

const Login = ({ onLogin, onNavigateToRegister, onForgotPassword, loginMode, onToggleMode }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

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

    setIsSubmitting(true)
    setLoginError('')

    try {
      // Send login credentials to backend API
      const credentials = {
        email: formData.email,
        password: formData.password,
        loginMethod: 'email'
      }

      const response = await userService.login(credentials)

      // Login successful - backend validates user exists and password matches
      if (response.data && response.data.user) {
        const user = response.data.user

        // Save remember password preference
        if (formData.rememberPassword) {
          localStorage.setItem('rememberEmail', formData.email)
        } else {
          localStorage.removeItem('rememberEmail')
        }

        // Save current user for Header component
        const currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || loginMode || 'user',
        }
        localStorage.setItem('currentUser', JSON.stringify(currentUser))

        // Save login status and role
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', user.role || loginMode || 'user')
        localStorage.setItem('loginMethod', 'email')
        
        // Save last login time
        localStorage.setItem('lastLoginTime', new Date().toLocaleString())

        // Show success animation first
        setShowSuccessAnimation(true)
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle specific error messages from backend
      let errorMessage = 'Login failed. Please check your credentials and try again.'
      
      if (error.response?.data?.error) {
        const backendError = error.response.data.error
        errorMessage = backendError.message || errorMessage
        
        // Show specific messages based on error code
        if (backendError.code === 'USER_NOT_FOUND') {
          errorMessage = 'User not found. Please check your email or sign up for a new account.'
        } else if (backendError.code === 'INVALID_PASSWORD') {
          errorMessage = 'Invalid password. Please check your password and try again.'
        } else if (backendError.code === 'INVALID_CREDENTIALS') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setLoginError(errorMessage)
      setIsSubmitting(false)
      
      // Clear password field on error
      setFormData({
        ...formData,
        password: ''
      })
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsConnecting(true)
      
      // Get OAuth URL from backend
      const API_URL = (import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001').replace('/api', '')
      const response = await fetch(`${API_URL}/api/auth/google?role=${loginMode || 'user'}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        // Check if it's a configuration error
        if (data.error?.code === 'GOOGLE_OAUTH_NOT_CONFIGURED' || data.error?.setupRequired) {
          alert(`Google Sign-In is not configured.\n\nPlease:\n1. Set up Google OAuth in Google Cloud Console\n2. Add credentials to backend/authentication/.env file\n3. See GOOGLE_OAUTH_SETUP.md for detailed instructions\n\nError: ${data.error?.message}`)
        } else {
          throw new Error(data.error?.message || 'Failed to initiate Google login')
        }
      }
    } catch (error) {
      console.error('Google login error:', error)
      
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert(`Cannot connect to backend server.\n\nPlease ensure:\n1. Backend server is running on port 3001\n2. Backend URL is correct\n3. No firewall blocking the connection\n\nError: ${error.message}`)
      } else {
        alert(`Google login failed: ${error.message}`)
      }
      setIsConnecting(false)
    }
  }

  const handleWalletLogin = () => {
    console.log('Wallet login button clicked')
    console.log('Checking for available wallets...')
    console.log('window.solana:', window.solana)
    console.log('window.solflare:', window.solflare)
    console.log('window.backpack:', window.backpack)
    
    // Always show wallet selection modal
    const wallets = []
    
    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      console.log('Phantom wallet detected')
      wallets.push({
        name: 'Phantom',
        icon: '👻',
        provider: window.solana,
      })
    } else {
      console.log('Phantom wallet not detected')
      if (window.solana) {
        console.log('window.solana exists but isPhantom is false:', window.solana)
      }
    }
    
    // Check for Solflare
    if (window.solflare) {
      console.log('Solflare wallet detected')
      wallets.push({
        name: 'Solflare',
        icon: '🔥',
        provider: window.solflare,
      })
    } else {
      console.log('Solflare wallet not detected')
    }
    
    // Check for Backpack
    if (window.backpack) {
      console.log('Backpack wallet detected')
      wallets.push({
        name: 'Backpack',
        icon: '🎒',
        provider: window.backpack,
      })
    } else {
      console.log('Backpack wallet not detected')
    }
    
    console.log('Available wallets:', wallets.length, wallets.map(w => w.name))
    
    if (wallets.length === 0) {
      const installMessage = 'No Solana wallets detected.\n\n' +
        'Please install one of the following wallet extensions:\n' +
        '• Phantom: https://phantom.app/\n' +
        '• Solflare: https://solflare.com/\n' +
        '• Backpack: https://www.backpack.app/\n\n' +
        'After installing, refresh this page and try again.'
      alert(installMessage)
      return
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
    console.log('Wallets checked on mount:', wallets.length)
  }

  const connectWallet = async (wallet) => {
    setIsConnecting(true)
    console.log('Attempting to connect wallet:', wallet.name)
    
    try {
      const provider = wallet.provider
      
      if (!provider) {
        throw new Error('Wallet provider not found. Please make sure your wallet extension is installed and enabled.')
      }
      
      console.log('Wallet provider found:', provider)
      console.log('Provider methods:', Object.keys(provider))
      
      // Check if wallet is available
      if (!provider.isPhantom && !provider.connect && wallet.name === 'Phantom') {
        throw new Error('Phantom wallet not properly initialized. Please refresh the page.')
      }
      
      let publicKey = null
      
      // Handle Phantom wallet specifically
      if (wallet.name === 'Phantom' && window.solana && window.solana.isPhantom) {
        console.log('Connecting to Phantom wallet...')
        console.log('Phantom wallet state:', {
          isPhantom: window.solana.isPhantom,
          isConnected: window.solana.isConnected,
          publicKey: window.solana.publicKey ? window.solana.publicKey.toString() : null
        })
        
        try {
          // Check if already connected
          if (window.solana.isConnected && window.solana.publicKey) {
            console.log('Phantom already connected, using existing connection...')
            publicKey = window.solana.publicKey.toString()
          } else {
            // Disconnect first if needed (some wallets require this)
            if (window.solana.isConnected) {
              try {
                await window.solana.disconnect()
                console.log('Disconnected existing Phantom connection')
              } catch (disconnectErr) {
                console.log('Disconnect not needed or failed:', disconnectErr)
              }
            }
            
            // Connect to Phantom wallet
            console.log('Calling window.solana.connect()...')
            const response = await window.solana.connect({ onlyIfTrusted: false })
            console.log('Phantom connection response:', response)
            
            // Get public key from response or provider
            if (response && response.publicKey) {
              publicKey = response.publicKey.toString()
            } else if (window.solana.publicKey) {
              publicKey = window.solana.publicKey.toString()
            } else {
              throw new Error('Could not retrieve public key from Phantom wallet')
            }
          }
        } catch (phantomError) {
          console.error('Phantom connection error:', phantomError)
          const errorMsg = phantomError.message || phantomError.toString() || 'Unknown error'
          throw new Error(`Phantom wallet connection failed: ${errorMsg}. Please make sure your wallet is unlocked and approve the connection request.`)
        }
      }
      // Handle Solflare wallet
      else if (wallet.name === 'Solflare' && window.solflare) {
        console.log('Connecting to Solflare wallet...')
        try {
          if (typeof window.solflare.connect === 'function') {
            const response = await window.solflare.connect()
            console.log('Solflare connection response:', response)
            
            if (response && response.publicKey) {
              publicKey = response.publicKey.toString()
            } else if (window.solflare.publicKey) {
              publicKey = window.solflare.publicKey.toString()
            }
          } else {
            // Try alternative method
            publicKey = window.solflare.publicKey ? window.solflare.publicKey.toString() : null
          }
        } catch (solflareError) {
          console.error('Solflare connection error:', solflareError)
          throw new Error(`Solflare wallet connection failed: ${solflareError.message || 'Please approve the connection in your wallet'}`)
        }
      }
      // Handle Backpack wallet
      else if (wallet.name === 'Backpack' && window.backpack) {
        console.log('Connecting to Backpack wallet...')
        try {
          if (typeof window.backpack.connect === 'function') {
            const response = await window.backpack.connect()
            console.log('Backpack connection response:', response)
            
            if (response && response.publicKey) {
              publicKey = response.publicKey.toString()
            } else if (window.backpack.publicKey) {
              publicKey = window.backpack.publicKey.toString()
            }
          } else {
            // Try alternative method
            publicKey = window.backpack.publicKey ? window.backpack.publicKey.toString() : null
          }
        } catch (backpackError) {
          console.error('Backpack connection error:', backpackError)
          throw new Error(`Backpack wallet connection failed: ${backpackError.message || 'Please approve the connection in your wallet'}`)
        }
      }
      // Generic fallback
      else {
        console.log('Using generic connection method...')
        if (provider.isConnected && provider.publicKey) {
          publicKey = provider.publicKey.toString()
        } else if (typeof provider.connect === 'function') {
          const response = await provider.connect()
          if (response && response.publicKey) {
            publicKey = response.publicKey.toString()
          } else if (provider.publicKey) {
            publicKey = provider.publicKey.toString()
          }
        } else {
          throw new Error('Wallet connection method not supported for this wallet type.')
        }
      }
      
      if (!publicKey) {
        throw new Error('Failed to get wallet address. Please make sure your wallet is unlocked and try again.')
      }
      
      console.log('Wallet connected successfully. Public key:', publicKey)
      
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
      
      console.log('Saving user data:', currentUser)
      
      // Save all login data
      localStorage.setItem('walletData', JSON.stringify(walletData))
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('loginMethod', 'wallet')
      localStorage.setItem('userRole', loginMode || 'user')
      localStorage.setItem('lastLoginTime', new Date().toLocaleString())
      
      console.log('Login data saved to localStorage')
      console.log('isLoggedIn:', localStorage.getItem('isLoggedIn'))
      console.log('userRole:', localStorage.getItem('userRole'))
      
      setShowWalletModal(false)
      setIsConnecting(false)
      
      // Show success animation first, which will trigger login
      console.log('Showing success animation...')
      setShowSuccessAnimation(true)
      
      // Fallback: Ensure login happens even if animation fails
      // This is a safety mechanism in case the animation callback doesn't fire
      setTimeout(() => {
        const shouldBeLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        if (shouldBeLoggedIn && onLogin) {
          console.log('Fallback: Triggering login directly after timeout')
          onLogin()
        }
      }, 3000) // Wait 3 seconds (after animation completes) before fallback
    } catch (error) {
      console.error('Error connecting wallet:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      
      setIsConnecting(false)
      setShowWalletModal(false)
      
      let errorMessage = 'Failed to connect wallet.'
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection request in your wallet popup.'
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending. Please check your wallet extension and approve the pending request.'
      } else if (error.message) {
        errorMessage = `Failed to connect wallet: ${error.message}`
      } else if (error.toString && error.toString().includes('User rejected')) {
        errorMessage = 'Connection was rejected. Please try again and approve the connection in your wallet.'
      } else {
        errorMessage = 'Failed to connect wallet. Please ensure:\n' +
          '1. Your wallet extension is installed and enabled\n' +
          '2. Your wallet is unlocked\n' +
          '3. You approve the connection request in the wallet popup\n' +
          '4. Try refreshing the page if the issue persists'
      }
      
      alert(errorMessage)
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
                  onClick={() => onToggleMode && onToggleMode('provider')}
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

            {loginError && (
              <div className="error-message" style={{ 
                marginBottom: '12px', 
                textAlign: 'center',
                padding: '10px',
                backgroundColor: '#fff5f5',
                border: '1px solid #e74c3c',
                borderRadius: '8px',
                color: '#e74c3c'
              }}>
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
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

