import React, { useState, useEffect } from 'react'
import providerService from '../services/providerService'
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
  const [providers, setProviders] = useState([])
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)
  const [providersError, setProvidersError] = useState(null)

  // Fetch providers from API on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoadingProviders(true)
      setProvidersError(null)
      try {
        // Fetch providers from API (only ready providers with availability set)
        const providersData = await providerService.getProviders({ status: 'ready' })
        
        console.log('BookAppointment - Fetched providers:', providersData)
        
        // Ensure providersData is an array
        if (!Array.isArray(providersData)) {
          console.error('Invalid providers data format:', providersData)
          setProvidersError('Invalid response format from server.')
          setIsLoadingProviders(false)
          return
        }
        
        // Transform API data to dropdown format
        const formattedProviders = providersData.map(provider => {
          const providerId = provider.id ? provider.id.toString() : String(provider.id)
          return {
            value: providerId, // Use provider ID as value (string)
            name: provider.name,
            id: provider.id, // Keep original ID (number)
            specialty: provider.specialty || provider.title || 'Wellness Professional',
          }
        })
        
        console.log('Formatted providers for dropdown:', formattedProviders)
        setProviders(formattedProviders)
      } catch (error) {
        console.error('Error fetching providers for booking:', error)
        setProvidersError('Failed to load providers. Please try again.')
        setProviders([])
      } finally {
        setIsLoadingProviders(false)
      }
    }

    fetchProviders()
  }, [])

  useEffect(() => {
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

  const handleSubmit = async (e) => {
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
    
    // Ensure providers are loaded
    if (providers.length === 0) {
      alert('Providers are still loading. Please wait a moment and try again.')
      return
    }

    // Find provider details from the fetched providers
    // Normalize the selected value to string for comparison
    const selectedProviderId = String(formData.provider).trim()
    
    console.log('Looking for provider:', {
      selectedProviderId,
      formDataProvider: formData.provider,
      providersCount: providers.length,
      providers: providers.map(p => ({ value: p.value, id: p.id, name: p.name }))
    })
    
    const providerDetails = providers.find(p => {
      // Try multiple ways to match
      const providerValue = p.value ? String(p.value).trim() : ''
      const providerId = p.id ? String(p.id).trim() : ''
      const match = providerValue === selectedProviderId || providerId === selectedProviderId
      if (match) {
        console.log('Matched provider:', p)
      }
      return match
    })
    
    if (!providerDetails) {
      console.error('Provider lookup failed:', {
        selectedProvider: formData.provider,
        selectedProviderId,
        availableProviders: providers.map(p => ({ value: p.value, id: p.id, name: p.name }))
      })
      alert(`Selected provider not found. Please select a provider again.\n\nDebug: Looking for "${selectedProviderId}", found ${providers.length} providers.`)
      return
    }
    
    console.log('Found provider details:', providerDetails)
    
    try {
      // Save appointment to database via API
      const appointmentService = (await import('../services/appointmentService.js')).default
      
      // Use the actual provider ID from database
      // Ensure providerId is a valid number
      const providerId = parseInt(providerDetails.id)
      if (isNaN(providerId)) {
        alert('Invalid provider ID. Please select a provider again.')
        return
      }
      
      // Format dateTime properly (datetime-local gives YYYY-MM-DDTHH:mm format)
      // Backend expects ISO timestamp format
      const appointmentDate = formData.dateTime ? new Date(formData.dateTime).toISOString() : null
      if (!appointmentDate || isNaN(new Date(appointmentDate).getTime())) {
        alert('Invalid date/time. Please select a valid date and time.')
        return
      }
      
      // appointmentService expects dateTime and maps it to appointmentDate
      const appointmentData = {
        providerId: providerId,
        dateTime: appointmentDate, // ISO format timestamp
        sessionType: formData.sessionType || 'Video Consultation',
        notes: formData.notes || null
      }
      
      console.log('Creating appointment with data:', appointmentData)
      
      // Call the API to create appointment
      const response = await appointmentService.createAppointment(appointmentData)
      console.log('BookAppointment - Full response:', response)
      
      // Handle response format - backend returns { booking: {...}, message: '...' }
      if (!response) {
        throw new Error('No response from server')
      }
      
      // Extract booking from response
      const booking = response.booking || response
      
      if (!booking) {
        console.error('BookAppointment - No booking in response:', response)
        throw new Error('Invalid response from server: booking data not found')
      }
      
      console.log('BookAppointment - Extracted booking:', booking)
      console.log('BookAppointment - Booking properties:', {
        id: booking.id,
        providerName: booking.providerName,
        providerId: booking.providerId,
        appointmentDate: booking.appointmentDate
      })
      
      // Set booked provider name for success modal (use provider name from response or from providerDetails)
      const bookedProviderName = booking.providerName || providerDetails?.name || 'Provider'
      setBookedProvider(bookedProviderName)
      
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
    } catch (error) {
      console.error('Error creating appointment:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        data: error.data,
        response: error.response
      })
      
      // Show more detailed error message
      let errorMessage = 'Failed to book appointment. Please try again.'
      
      // Check for error in different possible locations
      if (error.data?.error?.message) {
        errorMessage = error.data.error.message
        if (error.data.error.detail) {
          errorMessage += `: ${error.data.error.detail}`
        }
      } else if (error.data?.error?.detail) {
        errorMessage = error.data.error.detail
      } else if (error.data?.message) {
        errorMessage = error.data.message
      } else if (error.message && error.message !== 'HTTP 500') {
        errorMessage = error.message
      } else if (error.status === 400 || error.statusCode === 400) {
        errorMessage = 'Invalid booking data. Please check your selections and try again.'
      } else if (error.status === 401 || error.statusCode === 401) {
        errorMessage = 'You are not logged in. Please log in and try again.'
      } else if (error.status === 404 || error.statusCode === 404) {
        errorMessage = 'Provider not found. Please select a different provider.'
      } else if (error.status === 500 || error.statusCode === 500) {
        errorMessage = 'Server error occurred. Please check the backend logs and try again.'
        if (error.data?.error?.detail) {
          errorMessage = `Server error: ${error.data.error.detail}`
        } else if (error.data?.error?.message) {
          errorMessage = `Server error: ${error.data.error.message}`
        }
      }
      
      alert(errorMessage)
    }
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
              {isLoadingProviders ? (
                <select
                  id="provider"
                  name="provider"
                  className="form-input"
                  disabled
                >
                  <option value="">Loading providers...</option>
                </select>
              ) : providersError ? (
                <select
                  id="provider"
                  name="provider"
                  className="form-input"
                  disabled
                >
                  <option value="">Error loading providers</option>
                </select>
              ) : providers.length === 0 ? (
                <select
                  id="provider"
                  name="provider"
                  className="form-input"
                  disabled
                >
                  <option value="">No providers available</option>
                </select>
              ) : (
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">Select a provider...</option>
                  {providers.map((provider) => {
                    const optionValue = provider.value || (provider.id ? provider.id.toString() : String(provider.id))
                    return (
                      <option key={provider.id || provider.value} value={optionValue}>
                        {provider.name} {provider.specialty ? `- ${provider.specialty}` : ''}
                      </option>
                    )
                  })}
                </select>
              )}
              <span className="input-icon">▼</span>
            </div>
            {providersError && (
              <p style={{ color: '#c33', fontSize: '12px', marginTop: '4px' }}>
                {providersError}
              </p>
            )}
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


