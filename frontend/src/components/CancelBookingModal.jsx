import React, { useEffect, useState } from 'react'
import './CancelBookingModal.css'

const CancelBookingModal = ({ 
  appointment, 
  onConfirm, 
  onCancel,
  showSuccess = false 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showSadAnimation, setShowSadAnimation] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
    if (showSuccess) {
      setTimeout(() => setShowSadAnimation(true), 300)
    }
  }, [showSuccess])

  const handleConfirm = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onConfirm) {
        onConfirm()
      }
    }, 300)
  }

  const handleCancel = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onCancel) {
        onCancel()
      }
    }, 300)
  }

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (showSuccess) {
    // Success state - booking cancelled
    return (
      <div className={`cancel-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleCancel}>
        <div className={`cancel-modal-content success ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="cancel-icon-wrapper">
            <div className="cancel-icon success">
              <div className="cancel-circle">
                <svg className="cancel-svg" viewBox="0 0 52 52">
                  <circle className="cancel-circle-bg" cx="26" cy="26" r="25" fill="none" />
                  <path className="cancel-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
              <div className="cancel-rings">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </div>
            </div>
          </div>
          <h2 className="cancel-modal-title">Appointment Cancelled</h2>
          <p className="cancel-modal-message">
            Your appointment has been successfully cancelled.
            <br />
            <span className="cancel-sub-message">We're sorry to see you go. You can book a new appointment anytime.</span>
          </p>
          <button className="cancel-modal-btn primary" onClick={handleCancel}>
            Close
          </button>
        </div>
      </div>
    )
  }

  // Confirmation state - asking for confirmation
  return (
    <div className={`cancel-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleCancel}>
      <div className={`cancel-modal-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="cancel-icon-wrapper">
          <div className="cancel-icon">
            <div className="cancel-circle">
              <svg className="cancel-svg" viewBox="0 0 52 52">
                <circle className="cancel-circle-bg" cx="26" cy="26" r="25" fill="none" />
                <path className="cancel-x" fill="none" d="M16 16 L36 36 M36 16 L16 36" />
              </svg>
            </div>
            <div className="cancel-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>
        </div>
        <h2 className="cancel-modal-title">Cancel Appointment?</h2>
        <p className="cancel-modal-message">
          Are you sure you want to cancel your appointment with <strong>{appointment?.providerName || 'the provider'}</strong>?
        </p>
        {appointment && (
          <div className="cancel-appointment-details">
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <span className="detail-text">{formatDateTime(appointment.dateTime)}</span>
            </div>
            {appointment.sessionType && (
              <div className="detail-item">
                <span className="detail-icon">💬</span>
                <span className="detail-text">{appointment.sessionType}</span>
              </div>
            )}
          </div>
        )}
        <div className="cancel-modal-buttons">
          <button className="cancel-modal-btn secondary" onClick={handleCancel}>
            Keep Appointment
          </button>
          <button className="cancel-modal-btn danger" onClick={handleConfirm}>
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelBookingModal
