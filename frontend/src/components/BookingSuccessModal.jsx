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
            <svg className="checkmark-svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
        <h2 className="success-modal-title">🎉 Appointment Booked Successfully!</h2>
        <p className="success-modal-message">
          Your appointment has been confirmed with
        </p>
        <div className="success-provider-name">
          <strong>{providerName || 'Provider'}</strong>
        </div>
        <p className="success-modal-submessage">
          You can view and manage your appointments in the "My Appointments" section.
        </p>
        <div className="success-modal-buttons">
          <button className="success-modal-btn secondary" onClick={handleClose}>
            Close
          </button>
          <button className="success-modal-btn primary" onClick={handleViewAppointments}>
            View My Appointments
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccessModal


