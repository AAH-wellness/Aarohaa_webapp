import React, { useEffect, useState } from 'react'
import './ContactFormSuccessModal.css'

const ContactFormSuccessModal = ({ onClose, email = '', ticketId = null }) => {
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
        <h2 className="contact-success-modal-title">Request submitted</h2>
        <p className="contact-success-modal-message">
          Thanks for reaching out — we’ve received your support request.
          {ticketId ? (
            <>
              <br />
              <span className="contact-success-ticket">Ticket ID: #{ticketId}</span>
            </>
          ) : null}
        </p>

        <div className="contact-success-modal-note">
          <div className="contact-success-modal-note-title">What happens next</div>
          <div className="contact-success-modal-note-body">
            Our team will reply by email. Please check your inbox{email ? ` (${email})` : ''} for updates and replies.
            <span className="contact-success-modal-note-muted"> If you don’t see it, check Spam/Junk.</span>
          </div>
        </div>
        <button className="contact-success-modal-btn" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default ContactFormSuccessModal


