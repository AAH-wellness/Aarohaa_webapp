import React, { useEffect, useState } from 'react'
import './BookingRequiredModal.css'

const BookingRequiredModal = ({ onClose, onNavigateToBooking }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 10)
    
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

  const handleBookNow = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
      onNavigateToBooking()
    }, 300)
  }

  return (
    <div className={`booking-required-modal-overlay modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`booking-required-modal-content modal-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <div className="icon-bounce">📅</div>
        </div>
        <h2 className="modal-title">Session Access Required</h2>
        <p className="modal-message">
          Session can only be accessed if a session is booked with one of our providers.
        </p>
        <p className="modal-submessage">
          Book a session now to start your wellness journey!
        </p>
        <div className="modal-buttons">
          <button className="modal-btn primary" onClick={handleBookNow}>
            Book Session
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingRequiredModal
