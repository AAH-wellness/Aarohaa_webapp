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
  const [cancelReason, setCancelReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  useEffect(() => {
    // Always show modal when it's mounted (parent controls visibility via showCancelModal)
    setIsVisible(true)
    
    // Add class to body when modal is visible to lower header z-index
    document.body.classList.add('modal-open')
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])
  
  useEffect(() => {
    // When showSuccess changes to true, trigger the sad animation
    if (showSuccess) {
      setTimeout(() => setShowSadAnimation(true), 300)
    } else {
      // Reset animation when going back to confirmation state
      setShowSadAnimation(false)
    }
  }, [showSuccess])

  const handleConfirm = () => {
    // Validate reason is provided
    if (!cancelReason.trim()) {
      setReasonError('Please provide a reason for cancellation')
      return
    }
    
    if (cancelReason.trim().length < 10) {
      setReasonError('Reason must be at least 10 characters long')
      return
    }
    
    // Don't close the modal - let the parent handle the state change
    // The parent will set showSuccess=true which will change the modal content
    if (onConfirm) {
      onConfirm(cancelReason.trim())
    }
  }
  
  const handleReasonChange = (e) => {
    const value = e.target.value
    setCancelReason(value)
    if (value.trim() && reasonError) {
      setReasonError('')
    }
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
        <div className="cancel-reason-section">
          <label htmlFor="cancelReason" className="cancel-reason-label">
            Reason for Cancellation <span className="required">*</span>
          </label>
          <textarea
            id="cancelReason"
            className={`cancel-reason-input ${reasonError ? 'error' : ''}`}
            value={cancelReason}
            onChange={handleReasonChange}
            placeholder="Please provide a reason for cancelling this appointment (minimum 10 characters)..."
            rows="4"
            required
          />
          {reasonError && <span className="cancel-reason-error">{reasonError}</span>}
          <span className="cancel-reason-hint">This information helps us improve our services.</span>
        </div>
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
