import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import CalendarGrid from './CalendarGrid'
import TimeSlotsList from './TimeSlotsList'
import BookingSuccessModal from './BookingSuccessModal'
import BookingConflictModal from './BookingConflictModal'
import { userService } from '../services'
import { apiClient, API_CONFIG } from '../services'
import './ProviderAvailabilityModal.css'

const ProviderAvailabilityModal = ({ provider, onClose, onBook, onNavigateToAppointments }) => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [sessionType, setSessionType] = useState('Video Consultation')
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictingAppointment, setConflictingAppointment] = useState(null)
  const [bookedProvider, setBookedProvider] = useState(null)
  const [error, setError] = useState(null)
  const [existingBookings, setExistingBookings] = useState([])
  const timeoutRef = useRef(null)

  // Memoize loadAvailableSlots to prevent recreation on every render
  const loadAvailableSlots = useCallback(async () => {
    if (!provider?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Calculate date range (2 weeks from today)
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 14)
      
      const startDateStr = today.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      const response = await userService.getProviderAvailableSlots(
        provider.id,
        startDateStr,
        endDateStr
      )
      
      const slotsArray = response.slots || []
      setSlots(slotsArray)
      
      // Auto-select first date with slots if available
      if (slotsArray.length > 0) {
        const firstDate = slotsArray[0].date
        setSelectedDate(firstDate)
      } else {
        // No slots available - provider might not have set availability
        setError('No available appointments found. This provider may not have set their availability yet.')
      }
    } catch (err) {
      console.error('Error loading available slots:', err)
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      })
      
      // Provide more specific error message
      let errorMessage = 'Failed to load availability. Please try again.'
      if (err.status === 404) {
        errorMessage = 'Provider not found.'
      } else if (err.status === 400) {
        errorMessage = 'Invalid request. Please try again.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [provider?.id]) // Only depend on provider.id, not the whole object

  // Load existing bookings to check for conflicts
  useEffect(() => {
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
    
    loadExistingBookings()
  }, [])

  useEffect(() => {
    loadAvailableSlots()
    
    // Cleanup function
    return () => {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [loadAvailableSlots])

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    setError(null)
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

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return
    
    setError(null)
    
    // Check for time conflicts before submitting
    const conflict = checkForConflict(selectedSlot.datetime)
    if (conflict) {
      setConflictingAppointment(conflict)
      setShowConflictModal(true)
      return
    }
    
    setBooking(true)
    
    try {
      // Create booking via API
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      
      const bookingData = {
        providerId: provider.id,
        appointmentDate: selectedSlot.datetime,
        sessionType: sessionType,
        notes: notes.trim() || null
      }
      
      const response = await apiClient.post(`${apiBaseUrl}/users/bookings`, bookingData)
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create booking')
      }
      
      // Set booked provider for success modal
      const bookingProviderName = response.booking?.providerName || provider.name
      setBookedProvider(bookingProviderName)
      
      // Update existing bookings list to include the new booking
      if (response.booking) {
        setExistingBookings(prev => [...prev, response.booking])
      }
      
      // Call the onBook callback if provided
      if (onBook) {
        onBook(response.booking || bookingData)
      }
      
      // Close modal and navigate to My Appointments immediately
      handleClose()
      if (onNavigateToAppointments) {
        onNavigateToAppointments()
      }
    } catch (err) {
      console.error('Error creating booking:', err)
      
      // Show more detailed error message
      let errorMessage = 'Failed to create booking. Please try again.'
      if (err.status === 400) {
        if (err.data?.error?.message) {
          errorMessage = err.data.error.message
        } else if (err.message) {
          errorMessage = err.message
        }
      } else if (err.status === 409) {
        // Conflict error from server
        errorMessage = err.data?.error?.message || 'This time slot is no longer available. Please select another time.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setBooking(false)
    }
  }

  const handleClose = () => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setSelectedDate(null)
    setSelectedSlot(null)
    setSessionType('Video Consultation')
    setNotes('')
    setShowSuccessModal(false)
    setShowConflictModal(false)
    setError(null)
    onClose()
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    handleClose()
    // Navigate to My Appointments after closing success modal
    if (onNavigateToAppointments) {
      onNavigateToAppointments()
    }
  }

  // Don't render main modal if conflict modal is showing
  if (showConflictModal) {
    return createPortal(
      <BookingConflictModal
        conflictingAppointment={conflictingAppointment}
        onClose={() => {
          setShowConflictModal(false)
          setConflictingAppointment(null)
        }}
      />,
      document.body
    )
  }

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4" 
      onClick={handleClose}
      style={{ zIndex: 9999 }}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Available Appointments</h2>
            <p className="text-xs text-gray-600">{provider.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content - Fixed height with scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error && !selectedSlot ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-red-600 mb-4 text-sm">{error}</p>
              <button
                onClick={loadAvailableSlots}
                className="text-green-800 hover:text-green-900 font-medium text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <CalendarGrid
                slots={slots}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />

              {/* Time Slots */}
              {selectedDate && (
                <div className="mt-4">
                  <TimeSlotsList
                    slots={slots}
                    selectedDate={selectedDate}
                    onSlotSelect={handleSlotSelect}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Booking Form - Always visible at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-4">
            {/* Selected Time Display */}
            {selectedSlot ? (
              <div className="pb-2 border-b border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Selected Time</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedSlot.datetime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}{' '}
                  at {new Date(selectedSlot.datetime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            ) : (
              <div className="pb-2 border-b border-gray-200">
                <p className="text-xs text-gray-500">Please select a time slot above</p>
              </div>
            )}
            
            {/* Session Type */}
            <div>
              <label htmlFor="sessionType" className="block text-xs font-semibold text-gray-700 mb-2">
                Session Type <span className="text-red-500">*</span>
              </label>
              <select
                id="sessionType"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="Video Consultation">Video Consultation</option>
                <option value="Phone Consultation">Phone Consultation</option>
                <option value="In-Person">In-Person</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you'd like to discuss..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white"
                rows="3"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirmBooking}
              disabled={!selectedSlot || booking}
              className={`w-full text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                selectedSlot && !booking
                  ? 'bg-green-800 hover:bg-green-900'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Render modal using portal to document.body to escape any stacking contexts
  return createPortal(modalContent, document.body)
}

export default ProviderAvailabilityModal

