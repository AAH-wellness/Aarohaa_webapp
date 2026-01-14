import React, { useState, useEffect, useRef } from 'react'
import LoginSuccess from './LoginSuccess'
import LoginErrorModal from './LoginErrorModal'
import { userService } from '../services'
import API_CONFIG from '../services/config.js'
import './Login.css'
import './ProviderLogin.css'

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
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const googleButtonRef = useRef(null)

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

    setIsLoading(true)

    try {
      // Call backend API to login
      // If provider mode, use provider login endpoint (ONLY checks providers table)
      // Otherwise, use user login endpoint (ONLY checks users table)
      const response = isProviderMode 
        ? await userService.loginProvider({
            email: formData.email,
            password: formData.password
          })
        : await userService.login({
            email: formData.email,
            password: formData.password,
            loginMethod: 'email'
          })

      // Save remember password preference
      if (formData.rememberPassword) {
        localStorage.setItem('rememberEmail', formData.email)
      } else {
        localStorage.removeItem('rememberEmail')
      }

      // Save user data from backend response
      if (response.user) {
        localStorage.setItem('currentUser', JSON.stringify(response.user))
        // Ensure role is saved - prioritize response role, then loginMode, then default to 'user'
        const userRole = response.user.role || loginMode || 'user'
        localStorage.setItem('userRole', userRole)
        console.log('Login successful - Role saved:', userRole)
      }

      // Save last login time
      localStorage.setItem('lastLoginTime', new Date().toLocaleString())
      
      // Show success animation for all modes (user, provider, admin)
      setShowSuccessAnimation(true)
    } catch (error) {
      console.error('Login error:', error)
      
      // Extract error message
      let errorMsg = 'Invalid email or password. Please try again.'
      
      if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message
      } else if (error.message) {
        errorMsg = error.message
      }

      // Show error modal
      setErrorMessage(errorMsg)
      setShowErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!API_CONFIG.GOOGLE_CLIENT_ID) {
      setErrorMessage('Google OAuth is not configured. Please contact support.')
      setShowErrorModal(true)
      return
    }

    setIsGoogleLoading(true)

    try {
      // Load Google Identity Services script if not already loaded
      if (!window.google) {
        await loadGoogleScript()
        // Wait for Google script to fully initialize
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Initialize Google Identity Services with FedCM support
      // This replaces the deprecated prompt() method
      window.google.accounts.id.initialize({
        client_id: API_CONFIG.GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true, // Opt into FedCM for better compatibility
      })

      // Create a hidden container for the Google button
      const buttonContainer = document.createElement('div')
      buttonContainer.style.position = 'fixed'
      buttonContainer.style.left = '-9999px'
      buttonContainer.style.top = '-9999px'
      document.body.appendChild(buttonContainer)

      // Render Google's official button (FedCM-compatible)
      window.google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      })

      // Wait for button to render, then programmatically click it
      setTimeout(() => {
        const googleButton = buttonContainer.querySelector('div[role="button"]')
        if (googleButton) {
          // Trigger the button click
          googleButton.click()
          
          // Clean up container after a delay
          setTimeout(() => {
            if (document.body.contains(buttonContainer)) {
              document.body.removeChild(buttonContainer)
            }
          }, 2000)
        } else {
          // Button didn't render - try alternative approach
          setIsGoogleLoading(false)
          
          // Fallback: Use the credential flow directly
          // This is a workaround if renderButton fails
          const fallbackContainer = document.createElement('div')
          fallbackContainer.style.display = 'none'
          document.body.appendChild(fallbackContainer)
          
          window.google.accounts.id.renderButton(fallbackContainer, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
          })
          
          setTimeout(() => {
            const btn = fallbackContainer.querySelector('div[role="button"]')
            if (btn) {
              btn.click()
              setTimeout(() => {
                if (document.body.contains(fallbackContainer)) {
                  document.body.removeChild(fallbackContainer)
                }
              }, 2000)
            } else {
              setErrorMessage('Failed to initialize Google sign-in. Please refresh the page and try again.')
              setShowErrorModal(true)
              if (document.body.contains(fallbackContainer)) {
                document.body.removeChild(fallbackContainer)
              }
            }
          }, 200)
          
          if (document.body.contains(buttonContainer)) {
            document.body.removeChild(buttonContainer)
          }
        }
      }, 100)
    } catch (error) {
      console.error('Google login error:', error)
      setIsGoogleLoading(false)
      
      let errorMsg = 'Failed to initialize Google login. '
      if (error.message?.includes('popup')) {
        errorMsg += 'Please allow popups for this site and try again.'
      } else if (error.message?.includes('origin')) {
        errorMsg += 'Please check your Google Cloud Console authorized JavaScript origins match http://localhost:5173 exactly.'
      } else {
        errorMsg += 'Please ensure your OAuth app is PUBLISHED (not in Testing mode) in Google Cloud Console.'
      }
      
      setErrorMessage(errorMsg)
      setShowErrorModal(true)
    }
  }

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google script'))
      document.head.appendChild(script)
    })
  }

  const handleGoogleCallback = async (response) => {
    try {
      setIsGoogleLoading(true)

      // Send the credential to backend
      const result = await userService.loginWithGoogle({
        idToken: response.credential,
        role: loginMode || 'user'
      })

      // Save user data
      if (result.user) {
        localStorage.setItem('currentUser', JSON.stringify(result.user))
        const userRole = result.user.role || loginMode || 'user'
        localStorage.setItem('userRole', userRole)
        localStorage.setItem('lastLoginTime', new Date().toLocaleString())
        
        // Log whether this is a new user sign-up or existing user login
        if (result.isNewUser) {
          console.log('✅ New user account created via Google OAuth:', result.user.email)
        } else {
          console.log('✅ Existing user logged in via Google OAuth:', result.user.email)
        }
      }

      setIsGoogleLoading(false)

      // Show Lottie success animation - this will display the same animation
      // used in regular login, then navigate to dashboard after animation completes
      setShowSuccessAnimation(true)
    } catch (error) {
      console.error('Google login callback error:', error)
      setIsGoogleLoading(false)
      
      let errorMsg = 'Google login failed. Please try again.'
      if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message
      } else if (error.message) {
        errorMsg = error.message
      }

      setErrorMessage(errorMsg)
      setShowErrorModal(true)
    }
  }


  // Load Google script on component mount
  // Note: We don't initialize here anymore to avoid conflicts
  // Initialization happens in handleGoogleLogin when the button is clicked
  useEffect(() => {
    if (API_CONFIG.GOOGLE_CLIENT_ID) {
      loadGoogleScript()
        .catch(err => {
          console.error('Failed to load Google script:', err)
        })
    }
  }, [])

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
      
      localStorage.setItem('walletData', JSON.stringify(walletData))
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      localStorage.setItem('loginMethod', 'wallet')
      localStorage.setItem('userRole', loginMode || 'user')
      localStorage.setItem('lastLoginTime', new Date().toLocaleString())
      
      setShowWalletModal(false)
      setIsConnecting(false)
      
      // Show success animation for all modes
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

            {/* Conditionally render different forms based on mode */}
            {isProviderMode ? (
              /* PROVIDER LOGIN FORM */
              <>
                <form className="provider-login-form" onSubmit={handleSubmit}>
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
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

                  <button type="submit" className="provider-login-button" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div className="provider-divider">
                  <span>or</span>
                </div>

                <div className="provider-social-login">
                  <button
                    type="button"
                    className="provider-social-button provider-google-button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isLoading}
                  >
                    {isGoogleLoading ? (
                      <>
                        <svg className="provider-social-icon loading-spinner-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" opacity="0.3"/>
                          <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="15.7 15.7"/>
                        </svg>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <svg className="provider-social-icon" viewBox="0 0 24 24" width="20" height="20">
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
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="provider-social-button provider-wallet-button"
                    onClick={handleWalletLogin}
                    disabled={isLoading}
                  >
                    <svg className="provider-social-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" ry="2"/>
                      <path d="M6 10h12M6 14h8"/>
                    </svg>
                    <span>Connect Wallet</span>
                  </button>
                </div>

                <p className="provider-switch-text">
                  Are you a patient? <button
                    type="button"
                    className="provider-switch-link"
                    onClick={() => onToggleMode && onToggleMode('user')}
                  >
                    User Login
                  </button>
                </p>

                <p className="provider-signup-text">
                  Don't have a provider account? <button
                    type="button"
                    className="provider-signup-link"
                    onClick={onNavigateToRegister}
                  >
                    Sign Up
                  </button>
                </p>
              </>
            ) : (
              /* USER/ADMIN LOGIN FORM */
              <>
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

                  <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="social-login">
                  <button
                    ref={googleButtonRef}
                    type="button"
                    className="social-button google-button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isLoading}
                  >
                    {isGoogleLoading ? (
                      <>
                        <span className="loading-spinner">⏳</span>
                        Signing in...
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
              </>
            )}
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

      {/* Success Animation with Lottie - Shows for all login methods:
          - Regular email/password login
          - Google OAuth login (both new sign-ups and existing users)
          - Wallet login
          - Provider login
          After animation completes (2.5s), navigates to user dashboard */}
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

      {/* Error Modal */}
      {showErrorModal && (
        <LoginErrorModal
          errorMessage={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  )
}

export default Login

