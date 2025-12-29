import React, { useState, useEffect } from 'react'
import LoginSuccess from './LoginSuccess'
import './ProviderLogin.css'
import userService from '../services/userService.js'

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
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [availableWallets, setAvailableWallets] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

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

  const handleSubmit = async (e) => {
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

        // Verify user is a provider
        if (user.role !== 'provider') {
          setLoginError('This account is not registered as a provider. Please use the user login.')
          setIsSubmitting(false)
          return
        }

        // Save remember password preference
        if (formData.rememberPassword) {
          localStorage.setItem('providerRememberEmail', formData.email)
        } else {
          localStorage.removeItem('providerRememberEmail')
        }

        // Save current user
        const currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'provider',
        }
        localStorage.setItem('currentUser', JSON.stringify(currentUser))

        // Save login status and role
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', 'provider')
        localStorage.setItem('loginMethod', 'email')
        
        // Save last login time
        localStorage.setItem('lastLoginTime', new Date().toLocaleString())

        // Show success animation
        setShowSuccessAnimation(true)
      }
    } catch (error) {
      console.error('Provider login error:', error)
      
      // Handle specific error messages from backend
      let errorMessage = 'Login failed. Please check your credentials and try again.'
      
      if (error.response?.data?.error) {
        const backendError = error.response.data.error
        errorMessage = backendError.message || errorMessage
        
        // Show specific messages based on error code
        if (backendError.code === 'USER_NOT_FOUND') {
          errorMessage = 'Provider account not found. Please check your email or sign up for a new account.'
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

  const handleWalletLogin = () => {
    console.log('Wallet login button clicked for provider')
    console.log('Checking for available wallets...')
    
    const wallets = []
    
    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      console.log('Phantom wallet detected')
      wallets.push({
        name: 'Phantom',
        icon: '👻',
        provider: window.solana,
      })
    }
    
    // Check for Solflare
    if (window.solflare) {
      console.log('Solflare wallet detected')
      wallets.push({
        name: 'Solflare',
        icon: '🔥',
        provider: window.solflare,
      })
    }
    
    // Check for Backpack
    if (window.backpack) {
      console.log('Backpack wallet detected')
      wallets.push({
        name: 'Backpack',
        icon: '🎒',
        provider: window.backpack,
      })
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
          // Always try to get public key first from existing connection
          if (window.solana.publicKey) {
            console.log('Phantom has public key, checking connection status...')
            publicKey = window.solana.publicKey.toString()
            
            // If not connected, we need to connect
            if (!window.solana.isConnected) {
              console.log('Phantom not connected, attempting to connect...')
              try {
                const response = await window.solana.connect()
                console.log('Phantom connection response:', response)
                
                // Update public key from response if available
                if (response && response.publicKey) {
                  publicKey = response.publicKey.toString()
                } else if (window.solana.publicKey) {
                  publicKey = window.solana.publicKey.toString()
                }
              } catch (connectErr) {
                console.error('Connect error when not connected:', connectErr)
                throw connectErr
              }
            } else {
              console.log('Phantom already connected, using existing public key')
            }
          } else {
            // No public key, need to connect
            console.log('No public key found, connecting to Phantom...')
            
            // Disconnect first if connected but no public key (edge case)
            if (window.solana.isConnected) {
              try {
                await window.solana.disconnect()
                console.log('Disconnected existing connection to reconnect')
              } catch (disconnectErr) {
                console.log('Disconnect not needed or failed:', disconnectErr)
              }
            }
            
            // Connect to Phantom wallet
            console.log('Calling window.solana.connect()...')
            const response = await window.solana.connect()
            console.log('Phantom connection response:', response)
            
            // Get public key from response or provider
            if (response && response.publicKey) {
              publicKey = response.publicKey.toString()
            } else if (window.solana.publicKey) {
              publicKey = window.solana.publicKey.toString()
            } else {
              throw new Error('Could not retrieve public key from Phantom wallet after connection')
            }
          }
          
          if (!publicKey) {
            throw new Error('Failed to get wallet address from Phantom')
          }
        } catch (phantomError) {
          console.error('Phantom connection error:', phantomError)
          console.error('Phantom error details:', {
            code: phantomError.code,
            message: phantomError.message,
            name: phantomError.name,
            toString: phantomError.toString(),
            stack: phantomError.stack
          })
          
          // Handle specific error codes
          if (phantomError.code === 4001) {
            throw new Error('Connection rejected. Please approve the connection request in your wallet popup.')
          } else if (phantomError.code === -32002) {
            throw new Error('Connection request already pending. Please check your wallet extension and approve the pending request.')
          }
          
          // Extract error message from various possible formats
          let errorMsg = 'Unknown error'
          if (phantomError.message) {
            errorMsg = phantomError.message
          } else if (phantomError.toString && typeof phantomError.toString === 'function') {
            errorMsg = phantomError.toString()
          } else if (typeof phantomError === 'string') {
            errorMsg = phantomError
          }
          
          // Don't wrap if it's already a user-friendly message
          if (errorMsg.includes('rejected') || errorMsg.includes('User rejected')) {
            throw new Error('Connection was rejected. Please try again and approve the connection in your wallet.')
          }
          
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
      
      // Create provider user from wallet
      const walletName = wallet.name || 'Wallet'
      const currentUser = {
        id: Date.now().toString(),
        name: `${walletName} Provider`,
        email: `${publicKey.substring(0, 8)}@provider.wallet`,
        role: 'provider',
      }
      
      localStorage.setItem('walletData', JSON.stringify(walletData))
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('loginMethod', 'wallet')
      localStorage.setItem('userRole', 'provider')
      localStorage.setItem('lastLoginTime', new Date().toLocaleString())
      
      console.log('Provider login data saved to localStorage')
      console.log('isLoggedIn:', localStorage.getItem('isLoggedIn'))
      console.log('userRole:', localStorage.getItem('userRole'))
      
      setShowWalletModal(false)
      setIsConnecting(false)
      
      // Show success animation first, which will trigger login
      console.log('Showing success animation...')
      setShowSuccessAnimation(true)
      
      // Fallback: Ensure login happens even if animation fails
      setTimeout(() => {
        const shouldBeLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        if (shouldBeLoggedIn && onLogin) {
          console.log('Fallback: Triggering provider login directly after timeout')
          onLogin()
        }
      }, 3000)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        toString: error.toString(),
        stack: error.stack,
        fullError: error
      })
      
      setIsConnecting(false)
      setShowWalletModal(false)
      
      let errorMessage = 'Failed to connect wallet.'
      
      // Handle specific error codes
      if (error.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection request in your wallet popup.'
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending. Please check your wallet extension and approve the pending request.'
      } else if (error.message) {
        // Check if error message already contains user-friendly text
        if (error.message.includes('rejected') || error.message.includes('User rejected')) {
          errorMessage = 'Connection was rejected. Please try again and approve the connection in your wallet.'
        } else if (error.message.includes('Phantom wallet connection failed')) {
          // Use the message as-is if it's already formatted
          errorMessage = error.message
        } else {
          errorMessage = `Failed to connect wallet: ${error.message}`
        }
      } else if (error.toString && typeof error.toString === 'function') {
        const errorStr = error.toString()
        if (errorStr.includes('rejected') || errorStr.includes('User rejected')) {
          errorMessage = 'Connection was rejected. Please try again and approve the connection in your wallet.'
        } else {
          errorMessage = `Failed to connect wallet: ${errorStr}`
        }
      } else {
        errorMessage = 'Failed to connect wallet. Please ensure:\n' +
          '1. Your wallet extension is installed and enabled\n' +
          '2. Your wallet is unlocked\n' +
          '3. You approve the connection request in the wallet popup\n' +
          '4. Try refreshing the page if the issue persists\n' +
          '5. Check the browser console for more details'
      }
      
      alert(errorMessage)
    }
  }

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
                className="provider-login-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Sign In'}
              </button>
            </form>

            <div className="provider-divider">
              <span>or</span>
            </div>

            <div className="provider-social-login">
              <button
                type="button"
                className="provider-social-button provider-wallet-button"
                onClick={handleWalletLogin}
              >
                <svg className="provider-social-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
                Connect Wallet
              </button>
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

