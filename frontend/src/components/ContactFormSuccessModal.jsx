import React, { useEffect, useState } from 'react'
import './ContactFormSuccessModal.css'

const ContactFormSuccessModal = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  return (
    <div className={`contact-success-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`contact-success-modal-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="contact-success-icon">
          <div className="contact-checkmark-circle">
            <div className="contact-checkmark">✓</div>
          </div>
        </div>
        <h2 className="contact-success-modal-title">Message Sent!</h2>
        <p className="contact-success-modal-message">
          Thank you for contacting us. We have received your message and will get back to you soon.
        </p>
        <button className="contact-success-modal-btn" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default ContactFormSuccessModal


