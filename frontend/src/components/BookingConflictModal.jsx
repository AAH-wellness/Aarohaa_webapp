import React, { useEffect, useState } from 'react'
import './BookingConflictModal.css'

const BookingConflictModal = ({ onClose, conflictingAppointment }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  const formatDateTime = (dateTime) => {
    if (!dateTime) return ''
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className={`booking-conflict-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`booking-conflict-modal ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="conflict-icon-container">
          <div className="conflict-icon-wrapper">
            <div className="conflict-icon-bg"></div>
            <div className="conflict-icon">⚠️</div>
            <div className="conflict-pulse-ring"></div>
            <div className="conflict-pulse-ring delay-1"></div>
            <div className="conflict-pulse-ring delay-2"></div>
          </div>
        </div>

        <h2 className="conflict-title">Time Slot Already Booked</h2>
        
        <div className="conflict-message">
          <p className="conflict-main-text">
            You already have an appointment scheduled at this time.
          </p>
          {conflictingAppointment && (
            <div className="conflict-details">
              <div className="conflict-detail-item">
                <span className="conflict-detail-label">Provider:</span>
                <span className="conflict-detail-value">
                  {conflictingAppointment.providerName || 'Provider'}
                </span>
              </div>
              <div className="conflict-detail-item">
                <span className="conflict-detail-label">Scheduled Time:</span>
                <span className="conflict-detail-value">
                  {formatDateTime(conflictingAppointment.dateTime || conflictingAppointment.appointmentDate)}
                </span>
              </div>
            </div>
          )}
          <p className="conflict-action-text">
            Please select a different time slot for your new appointment.
          </p>
        </div>

        <div className="conflict-buttons">
          <button className="conflict-btn primary" onClick={handleClose}>
            Select Another Time
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingConflictModal
