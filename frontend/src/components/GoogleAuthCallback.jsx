import { useEffect, useState } from 'react'
import './GoogleAuthCallback.css'

const GoogleAuthCallback = ({ onLogin }) => {
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const userParam = urlParams.get('user')
    const errorParam = urlParams.get('error')

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      setStatus('error')
      return
    }

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam))

        // Store authentication data
        localStorage.setItem('authToken', token)
        localStorage.setItem('currentUser', JSON.stringify(userData))
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', userData.role)
        localStorage.setItem('loginMethod', 'google')
        localStorage.setItem('lastLoginTime', new Date().toLocaleString())

        setStatus('success')

        // Call onLogin callback
        if (onLogin) {
          setTimeout(() => {
            onLogin(userData)
          }, 1500)
        }
      } catch (err) {
        console.error('Error processing Google auth callback:', err)
        setError('Failed to process authentication')
        setStatus('error')
      }
    } else {
      setError('Missing authentication data')
      setStatus('error')
    }
  }, [searchParams, onLogin])

  if (status === 'processing') {
    return (
      <div className="google-auth-callback">
        <div className="callback-container">
          <div className="spinner"></div>
          <h2>Completing sign in...</h2>
          <p>Please wait while we complete your Google sign in.</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="google-auth-callback">
        <div className="callback-container error">
          <div className="error-icon">✕</div>
          <h2>Sign in failed</h2>
          <p>{error || 'An error occurred during Google sign in.'}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.href = '/'}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="google-auth-callback">
      <div className="callback-container success">
        <div className="success-icon">✓</div>
        <h2>Sign in successful!</h2>
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}

export default GoogleAuthCallback

