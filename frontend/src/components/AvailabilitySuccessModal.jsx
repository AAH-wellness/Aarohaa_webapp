import React from 'react'
import './AvailabilitySuccessModal.css'

const AvailabilitySuccessModal = ({ onClose }) => {
  return (
    <div className="availability-success-overlay" onClick={onClose}>
      <div className="availability-success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="availability-success-icon">
          <div className="success-checkmark">
            <svg viewBox="0 0 52 52">
              <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
        <h2 className="availability-success-title">Availability Saved!</h2>
        <p className="availability-success-message">
          Your availability has been updated successfully.
        </p>
        <p className="availability-success-highlight">
          ✨ <strong>Visible to Users!!</strong> ✨
        </p>
        <p className="availability-success-submessage">
          Your schedule is now live and users can book sessions with you.
        </p>
        <button className="availability-success-button" onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  )
}

export default AvailabilitySuccessModal

