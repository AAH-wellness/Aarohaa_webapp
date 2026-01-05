import React, { useEffect, useState } from 'react'
import './LoginErrorModal.css'

const LoginErrorModal = ({ errorMessage, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  return (
    <div className={`login-error-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`login-error-modal-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="login-error-icon">
          <div className="error-icon-circle">
            <div className="error-icon">✕</div>
          </div>
        </div>
        <h2 className="login-error-modal-title">Login Failed</h2>
        <p className="login-error-modal-message">
          {errorMessage || 'Invalid email or password. Please try again.'}
        </p>
        <button className="login-error-modal-btn" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default LoginErrorModal

