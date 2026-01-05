import React, { useState } from 'react'
import './BookAppointment.css'
import BookingSuccessModal from './BookingSuccessModal'

const BookAppointment = ({ selectedProvider, onBookingConfirmed, onNavigateToAppointments }) => {
  const [formData, setFormData] = useState({
    provider: selectedProvider || '',
    dateTime: '',
    sessionType: 'Video Consultation',
    notes: '',
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [bookedProvider, setBookedProvider] = useState(null)

  const providers = [
    { value: 'dr-maya-patel', name: 'Dr. Maya Patel', initials: 'DM' },
    { value: 'john-kumar', name: 'John Kumar', initials: 'JK' },
    { value: 'sarah-rodriguez', name: 'Sarah Rodriguez', initials: 'SR' },
  ]

  React.useEffect(() => {
    if (selectedProvider) {
      setFormData((prev) => ({ ...prev, provider: selectedProvider }))
    }
  }, [selectedProvider])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.provider) {
      alert('Please select a provider')
      return
    }
    
    if (!formData.dateTime) {
      alert('Please select a date and time')
      return
    }

    // Find provider details
    const providerDetails = providers.find(p => p.value === formData.provider)
    
    // Store appointment in localStorage
    const appointment = {
      id: Date.now(),
      provider: formData.provider,
      providerName: providerDetails?.name || formData.provider,
      providerInitials: providerDetails?.initials || 'PR',
      dateTime: formData.dateTime,
      sessionType: formData.sessionType,
      notes: formData.notes,
      bookedAt: new Date().toISOString(),
    }
    
    // Get existing appointments
    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    existingAppointments.push(appointment)
    localStorage.setItem('appointments', JSON.stringify(existingAppointments))

    // Set booked provider for success modal
    setBookedProvider(providerDetails?.name || formData.provider)
    
    // Show success modal
    setShowSuccessModal(true)

    // Call the callback to mark session as booked
    if (onBookingConfirmed) {
      onBookingConfirmed()
    }
    
    // Reset form
    setFormData({
      provider: selectedProvider || '',
      dateTime: '',
      sessionType: 'Video Consultation',
      notes: '',
    })
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
  }

  return (
    <div className="book-appointment">
      <div className="book-appointment-container">
        <h1 className="book-appointment-title">Book New Appointment</h1>
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label htmlFor="provider">Provider</label>
            <div className="input-wrapper">
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select a provider...</option>
                {providers.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <span className="input-icon">▼</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateTime">Date & Time</label>
            <div className="input-wrapper">
              <input
                type="datetime-local"
                id="dateTime"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleInputChange}
                className="form-input"
                min={new Date().toISOString().slice(0, 16)}
              />
              <span className="input-icon">📅</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sessionType">Session Type</label>
            <div className="input-wrapper">
              <select
                id="sessionType"
                name="sessionType"
                value={formData.sessionType}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Video Consultation">Video Consultation</option>
                <option value="Phone Consultation">Phone Consultation</option>
                <option value="In-Person">In-Person</option>
              </select>
              <span className="input-icon">▼</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Describe what you'd like to discuss..."
              className="form-textarea"
              rows="4"
            />
          </div>

          <button type="submit" className="confirm-booking-btn">
            Confirm Booking
          </button>
        </form>
      </div>

      {showSuccessModal && (
        <BookingSuccessModal
          providerName={bookedProvider}
          onClose={handleSuccessModalClose}
          onNavigateToAppointments={onNavigateToAppointments}
        />
      )}
    </div>
  )
}

export default BookAppointment


