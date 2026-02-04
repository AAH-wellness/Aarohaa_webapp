import React, { useState, useEffect } from 'react'
import './BookAppointment.css'
import BookingSuccessModal from './BookingSuccessModal'
import BookingConflictModal from './BookingConflictModal'
import { userService, apiClient, API_CONFIG } from '../services'
import { useUserNotification } from '../contexts/UserNotificationContext'

const BookAppointment = ({ selectedProvider, onBookingConfirmed, onNavigateToAppointments }) => {
  const { addNotification } = useUserNotification()
  const [formData, setFormData] = useState({
    provider: selectedProvider || '',
    dateTime: '',
    sessionType: 'Video Consultation',
    notes: '',
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictingAppointment, setConflictingAppointment] = useState(null)
  const [bookedProvider, setBookedProvider] = useState(null)
  const [availableProviders, setAvailableProviders] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [providerAvailability, setProviderAvailability] = useState(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [existingBookings, setExistingBookings] = useState([])

  const formatLocalDateTimeInput = (date) => {
    const pad = (value) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  useEffect(() => {
    // Load available providers from backend
    const loadProviders = async () => {
      try {
        const providers = await userService.getAllProviders({ status: 'ready' })
        setAvailableProviders(providers)
        
        // If selectedProvider is passed and it's a provider ID, find the provider
        if (selectedProvider && typeof selectedProvider === 'number') {
          const provider = providers.find(p => p.id === selectedProvider)
          if (provider) {
            setFormData((prev) => ({ ...prev, provider: provider.id.toString() }))
            // Load availability for selected provider
            loadProviderAvailability(provider.id)
          }
        } else if (selectedProvider) {
          const providerId = parseInt(selectedProvider)
          if (!isNaN(providerId)) {
            setFormData((prev) => ({ ...prev, provider: selectedProvider.toString() }))
            loadProviderAvailability(providerId)
          }
        }
      } catch (error) {
        console.error('Error loading providers:', error)
      }
    }
    
    // Load existing bookings to check for conflicts
    const loadExistingBookings = async () => {
      try {
        const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
        const response = await apiClient.get(`${apiBaseUrl}/users/bookings`)
        const bookings = response.bookings || []
        // Filter out completed and cancelled bookings
        const activeBookings = bookings.filter(
          booking => booking.status !== 'completed' && booking.status !== 'cancelled'
        )
        setExistingBookings(activeBookings)
      } catch (error) {
        console.error('Error loading existing bookings:', error)
        setExistingBookings([])
      }
    }
    
    loadProviders()
    loadExistingBookings()
  }, [selectedProvider])

  const loadProviderAvailability = async (providerId) => {
    try {
      setLoadingAvailability(true)
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      const response = await apiClient.get(`${apiBaseUrl}/providers/${providerId}/availability`)
      setProviderAvailability(response.availability || null)
    } catch (error) {
      console.error('Error loading provider availability:', error)
      setProviderAvailability(null)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    
    // If provider changed, load their availability
    if (name === 'provider' && value) {
      const providerId = parseInt(value)
      if (!isNaN(providerId)) {
        loadProviderAvailability(providerId)
      } else {
        setProviderAvailability(null)
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.provider) {
      newErrors.provider = 'Provider is required'
    }
    
    if (!formData.dateTime) {
      newErrors.dateTime = 'Date and time is required'
    } else {
      // Check if selected time is in the future
      const selectedDate = new Date(formData.dateTime)
      const now = new Date()
      const diffMs = selectedDate.getTime() - now.getTime()
      if (diffMs <= 0) {
        newErrors.dateTime = 'Please select a future date and time'
      } else if (diffMs < 5 * 60 * 1000) {
        newErrors.dateTime = 'Please select a time at least 5 minutes from now'
      } else if (providerAvailability) {
        // Validate against provider availability
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayOfWeek = selectedDate.getDay()
        const dayName = dayNames[dayOfWeek]
        const dayAvailability = providerAvailability[dayName]
        
        if (!dayAvailability || !dayAvailability.enabled) {
          const dayDisplay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
          newErrors.dateTime = `Provider is not available on ${dayDisplay}. Please select a different day.`
        } else {
          // Check if time is within availability window
          // Use local time hours and minutes (not UTC)
          const appointmentHours = selectedDate.getHours()
          const appointmentMinutes = selectedDate.getMinutes()
          const appointmentTimeMinutes = appointmentHours * 60 + appointmentMinutes
          
          const [startHours, startMinutes] = dayAvailability.start.split(':').map(Number)
          const [endHours, endMinutes] = dayAvailability.end.split(':').map(Number)
          const startTimeMinutes = startHours * 60 + startMinutes
          const endTimeMinutes = endHours * 60 + endMinutes
          
          // Allow booking if time is >= start and <= end (end time is inclusive)
          if (appointmentTimeMinutes < startTimeMinutes || appointmentTimeMinutes > endTimeMinutes) {
            newErrors.dateTime = `Provider is only available between ${dayAvailability.start} and ${dayAvailability.end} on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}. Please select a time within this range.`
          }
        }
      }
    }
    
    if (!formData.sessionType) {
      newErrors.sessionType = 'Session type is required'
    }
    
    // Notes are optional, so no validation needed
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkForConflict = (selectedDateTime) => {
    const selectedDate = new Date(selectedDateTime)
    const selectedTime = selectedDate.getTime()
    
    // Check if there's a conflict with existing bookings
    // Consider it a conflict if the time difference is less than 1 hour (60 minutes)
    const conflictThreshold = 60 * 60 * 1000 // 1 hour in milliseconds
    
    for (const booking of existingBookings) {
      const bookingDate = new Date(booking.appointmentDate || booking.dateTime)
      const bookingTime = bookingDate.getTime()
      const timeDifference = Math.abs(selectedTime - bookingTime)
      
      if (timeDifference < conflictThreshold) {
        return booking
      }
    }
    
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    // Check for time conflicts before submitting
    const conflict = checkForConflict(formData.dateTime)
    if (conflict) {
      setConflictingAppointment(conflict)
      setShowConflictModal(true)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Find provider details
      const providerId = parseInt(formData.provider)
      const providerDetails = availableProviders.find(p => p.id === providerId)
      
      if (!providerDetails) {
        setErrors({ provider: 'Selected provider not found' })
        setLoading(false)
        return
      }

      // Prepare booking data
      // datetime-local input gives us "YYYY-MM-DDTHH:mm" in local time (no timezone)
      // When we create a Date object, JavaScript treats it as local time
      // When we convert to ISO string, it converts to UTC
      // This is correct behavior - the ISO string represents the same moment in time
      const localDate = new Date(formData.dateTime)
      
      // Verify the date is correct
      const now = new Date()
      const diffMs = localDate.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      
      console.log('Booking date conversion:', {
        input: formData.dateTime,
        localDateString: localDate.toString(),
        localDateISO: localDate.toISOString(),
        localTime: localDate.toLocaleString(),
        now: now.toLocaleString(),
        diffMs: diffMs,
        diffMinutes: diffMinutes,
        expectedDiff: 'Should be 1 minute if booking for next minute'
      })
      
      // Ensure the date is in the future
      if (diffMs <= 0) {
        setErrors({ dateTime: 'Please select a future date and time' })
        setLoading(false)
        return
      }

      if (diffMs < 5 * 60 * 1000) {
        setErrors({ dateTime: 'Please select a time at least 5 minutes from now' })
        setLoading(false)
        return
      }
      
      const bookingData = {
        providerId: providerId,
        appointmentDate: localDate.toISOString(),
        sessionType: formData.sessionType,
        notes: formData.notes || null,
      }

      // Create booking via API (stores in user_bookings table)
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      
      console.log('Sending booking request:', {
        url: `${apiBaseUrl}/users/bookings`,
        data: bookingData
      })
      
      const response = await apiClient.post(`${apiBaseUrl}/users/bookings`, bookingData)
      
      console.log('Booking response:', response)
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create booking')
      }

      // Set booked provider for success modal (use response data or fallback to form data)
      const bookingProviderName = response.booking?.providerName || providerDetails.name
      setBookedProvider(bookingProviderName)
      
      // Update existing bookings list to include the new booking
      if (response.booking) {
        setExistingBookings(prev => [...prev, response.booking])
      }
      
      // Show success modal and ticker
      setShowSuccessModal(true)
      addNotification('Appointment booked successfully.', { type: 'success' })

      // Call the callback to mark session as booked
      if (onBookingConfirmed) {
        onBookingConfirmed(bookingProviderName)
      }

      // Reset form
      setFormData({
        provider: selectedProvider ? selectedProvider.toString() : '',
        dateTime: '',
        sessionType: 'Video Consultation',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating booking:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      
      // Show more detailed error message
      let errorMessage = 'Failed to create booking. Please try again.'
      
      // Check if it's an ApiError with status and data
      if (error.status === 400) {
        // 400 Bad Request - validation error
        if (error.data?.error?.message) {
          errorMessage = error.data.error.message
        } else if (error.message) {
          errorMessage = error.message
        } else {
          errorMessage = 'Invalid booking data. Please check your selections and try again.'
        }
      } else if (error.status === 500) {
        // 500 Internal Server Error - show detailed error for debugging
        if (error.data?.error?.message) {
          errorMessage = error.data.error.message
          // Include database error details if available
          if (error.data.error.databaseErrorDetail) {
            errorMessage += `\n\nDatabase Error: ${error.data.error.databaseErrorDetail}`
          }
          if (error.data.error.databaseErrorCode) {
            errorMessage += `\n\nError Code: ${error.data.error.databaseErrorCode}`
          }
        } else if (error.data?.error?.detail) {
          errorMessage = `Server Error: ${error.data.error.detail}`
        } else if (error.message) {
          errorMessage = `Server Error: ${error.message}`
        } else {
          errorMessage = 'Server error occurred. Please check the server console logs for details.'
        }
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.data?.error?.message) {
        errorMessage = error.data.error.message
      } else if (error.data?.error?.detail) {
        errorMessage = `${error.data.error.message || 'Error'}: ${error.data.error.detail}`
      }
      
      // Show error in headline ticker below header
      console.error('Full error object:', error)
      addNotification(`Booking Error: ${errorMessage}`, { type: 'error' })
    } finally {
      setLoading(false)
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
            <label htmlFor="provider">Provider <span className="required">*</span></label>
            <div className="input-wrapper">
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className={`form-input ${errors.provider ? 'error' : ''}`}
                disabled={!!selectedProvider}
                required
              >
                {!selectedProvider && <option value="">Select a provider...</option>}
                {availableProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} {provider.title ? `- ${provider.title}` : ''}
                  </option>
                ))}
              </select>
              <span className="input-icon">▼</span>
            </div>
            {errors.provider && <span className="error-message">{errors.provider}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="dateTime">Date & Time <span className="required">*</span></label>
            {providerAvailability && (
              <div className="availability-info">
                <span className="availability-label">Provider Availability:</span>
                <div className="availability-days">
                  {Object.entries(providerAvailability).map(([day, schedule]) => {
                    if (schedule && schedule.enabled) {
                      const dayDisplay = day.charAt(0).toUpperCase() + day.slice(1)
                      return (
                        <span key={day} className="availability-day">
                          {dayDisplay}: {schedule.start} - {schedule.end}
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )}
            <div className="input-wrapper">
              <input
                type="datetime-local"
                id="dateTime"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleInputChange}
                className={`form-input ${errors.dateTime ? 'error' : ''}`}
                min={(() => {
                  // Set min to 5 minutes from now to enforce lead time in the UI
                  const now = new Date()
                  const minTime = new Date(now.getTime() + 5 * 60 * 1000)
                  return formatLocalDateTimeInput(minTime)
                })()}
                required
              />
              <span className="input-icon">📅</span>
            </div>
            {errors.dateTime && <span className="error-message">{errors.dateTime}</span>}
            {providerAvailability && !errors.dateTime && (
              <span className="availability-hint">
                Please select a date and time within the provider's available hours shown above.
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="sessionType">Session Type <span className="required">*</span></label>
            <div className="input-wrapper">
              <select
                id="sessionType"
                name="sessionType"
                value={formData.sessionType}
                onChange={handleInputChange}
                className={`form-input ${errors.sessionType ? 'error' : ''}`}
                required
              >
                <option value="Video Consultation">Video Consultation</option>
                <option value="Phone Consultation">Phone Consultation</option>
                <option value="In-Person">In-Person</option>
              </select>
              <span className="input-icon">▼</span>
            </div>
            {errors.sessionType && <span className="error-message">{errors.sessionType}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Describe what you'd like to discuss... (Optional)"
              className="form-textarea"
              rows="4"
            />
          </div>

          <button type="submit" className="confirm-booking-btn" disabled={loading}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>

      {showSuccessModal && bookedProvider && (
        <BookingSuccessModal
          providerName={bookedProvider}
          onClose={handleSuccessModalClose}
          onNavigateToAppointments={onNavigateToAppointments}
        />
      )}

      {showConflictModal && (
        <BookingConflictModal
          conflictingAppointment={conflictingAppointment}
          onClose={() => {
            setShowConflictModal(false)
            setConflictingAppointment(null)
          }}
        />
      )}
    </div>
  )
}

export default BookAppointment


