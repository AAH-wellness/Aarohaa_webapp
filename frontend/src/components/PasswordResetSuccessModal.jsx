import React, { useEffect, useState } from 'react'
import './PasswordResetSuccessModal.css'

const PasswordResetSuccessModal = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
    setTimeout(() => setShowConfetti(true), 300)
    
    // Add class to body when modal is visible to lower header z-index
    document.body.classList.add('modal-open')
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  return (
    <div className={`password-reset-success-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`confetti confetti-${i % 5}`} style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }} />
          ))}
        </div>
      )}
      <div className={`password-reset-success-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="password-reset-success-icon-wrapper">
          <div className="password-reset-success-icon">
            <div className="checkmark-circle">
              <svg className="checkmark-svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <div className="success-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>
        </div>
        <h2 className="password-reset-success-title">Password Reset Successful! </h2>
        <p className="password-reset-success-message">
          Your password has been successfully updated.
          <br />
          <span className="password-reset-sub-message">You will be redirected to the login page to sign in with your new password.</span>
        </p>
        <div className="password-reset-success-details">
          <div className="password-reset-detail-item">
            <span className="detail-icon">✅</span>
            <span className="detail-text">Your account is secure</span>
          </div>
          <div className="password-reset-detail-item">
            <span className="detail-icon">🔒</span>
            <span className="detail-text">New password is active</span>
          </div>
        </div>
        <div className="password-reset-success-buttons">
          <button className="password-reset-success-btn primary" onClick={handleClose}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default PasswordResetSuccessModal
