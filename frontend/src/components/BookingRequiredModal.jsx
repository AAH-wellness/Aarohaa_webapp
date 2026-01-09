import React, { useEffect, useState } from 'react'
import './BookingRequiredModal.css'

const BookingRequiredModal = ({ onClose, onNavigateToBooking }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 10)
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
    <div className={`modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`modal-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
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
          <button className="modal-btn secondary" onClick={handleClose}>
            Close
          </button>
          <button className="modal-btn primary" onClick={handleBookNow}>
            Book Session
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingRequiredModal
