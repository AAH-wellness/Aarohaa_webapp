import React, { useEffect, useState } from 'react'
import './BookingSuccessModal.css'

const BookingSuccessModal = ({ providerName, onClose, onNavigateToAppointments }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
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
      <div className={`success-modal-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="success-icon">
          <div className="checkmark-circle">
            <div className="checkmark">✓</div>
          </div>
        </div>
        <h2 className="success-modal-title">Appointment Booked!</h2>
        <p className="success-modal-message">
          An appointment has been booked with <strong>{providerName}</strong>.
          <br />
          Review your appointments in appointments section.
        </p>
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


