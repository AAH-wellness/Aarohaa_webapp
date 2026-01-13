import React, { useState } from 'react'
import { userService } from '../services'
import './Messages.css'
import ContactFormSuccessModal from './ContactFormSuccessModal'

const Messages = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    messageType: 'Feedback',
    message: '',
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }
    
    if (!formData.email.trim()) {
      setError('Please enter your email')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!formData.subject.trim()) {
      setError('Please enter a subject')
      return
    }
    
    if (!formData.message.trim()) {
      setError('Please enter your message')
      return
    }

    setIsSubmitting(true)

    try {
      // Submit support ticket to backend
      const response = await userService.submitSupportTicket({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        messageType: formData.messageType,
        message: formData.message.trim()
      })

      console.log('Support ticket submitted:', response)
      
      setIsSubmitting(false)
      setShowSuccessModal(true)

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        messageType: 'Feedback',
        message: '',
      })
    } catch (err) {
      console.error('Support ticket submission error:', err)
      setError(err.message || 'Failed to submit support ticket. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
  }

  return (
    <div className="messages">
      <div className="messages-container">
        <h1 className="messages-title">Contact Us</h1>
        <p className="messages-subtitle">
          We'd love to hear from you! Share your feedback, report an issue, or ask us anything.
        </p>

        <div className="contact-form-container">
          {error && (
            <div className="contact-form-error" style={{
              background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.05) 100%)',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#d32f2f',
              fontSize: '14px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="messageType">Message Type *</label>
                <div className="input-wrapper">
                  <select
                    id="messageType"
                    name="messageType"
                    value={formData.messageType}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="Feedback">Feedback</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Question">Question</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="input-icon">▼</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Brief description of your message"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Please provide details about your feedback, complaint, or question..."
                rows="8"
                required
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Message'}
            </button>
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <ContactFormSuccessModal onClose={handleSuccessModalClose} />
      )}
    </div>
  )
}

export default Messages


