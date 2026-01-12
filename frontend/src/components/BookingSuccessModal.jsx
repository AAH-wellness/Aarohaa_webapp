import React, { useEffect, useState } from 'react'
import './BookingSuccessModal.css'

const BookingSuccessModal = ({ providerName, onClose, onNavigateToAppointments }) => {
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

  const handleViewAppointments = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
      if (onNavigateToAppointments) {
        onNavigateToAppointments()
      }
    }, 300)
  }

  return (
    <div className={`success-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
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
      <div className={`success-modal-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="success-icon-wrapper">
          <div className="success-icon">
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
        <h2 className="success-modal-title">Booking Confirmed! 🎉</h2>
        <p className="success-modal-message">
          Your appointment with <strong>{providerName}</strong> has been successfully booked.
          <br />
          <span className="success-sub-message">You'll receive a confirmation email shortly.</span>
        </p>
        <div className="success-details">
          <div className="success-detail-item">
            <span className="detail-icon">📅</span>
            <span className="detail-text">Check your appointments section for details</span>
          </div>
        </div>
        <div className="success-modal-buttons">
          <button className="success-modal-btn secondary" onClick={handleClose}>
            Close
          </button>
          <button className="success-modal-btn primary" onClick={handleViewAppointments}>
            View Appointments
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccessModal
