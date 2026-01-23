import React, { useState, useEffect, useRef, useCallback } from 'react'
import './MyAppointments.css'
import AppointmentReminder from './AppointmentReminder'
import CancelBookingModal from './CancelBookingModal'
import { appointmentService, userService, apiClient, API_CONFIG } from '../services'

const MyAppointments = ({ onJoinSession, onSessionCancelled }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const cancelTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)
  const intervalRef = useRef(null)
  const modalManuallyClosedRef = useRef(false)
  const isCancellingRef = useRef(false)
  const isLoadingRef = useRef(false)
  const debouncedReloadRef = useRef(null)

  // Memoize loadAppointments to prevent infinite loops and concurrent calls
  const loadAppointments = useCallback(async () => {
    // Prevent concurrent calls - if already loading, skip
    if (isLoadingRef.current) {
      return
    }
    
    // Check if component is still mounted before starting
    if (!isMountedRef.current) {
      return
    }

    isLoadingRef.current = true

    try {
      // Only set loading if component is still mounted
      if (isMountedRef.current) {
        setLoading(true)
      }
      
      // Get current user ID from backend profile
      let userId = null
      try {
        const profile = await userService.getProfile()
        if (!isMountedRef.current) return // Check after async call
        
        if (profile.user && profile.user.id) {
          userId = profile.user.id
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
      
      if (!userId) {
        // If we can't get user ID, show empty appointments
        if (isMountedRef.current) {
          setAppointments([])
          setLoading(false)
        }
        return
      }
      
      // Get user bookings from backend API
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      const response = await apiClient.get(`${apiBaseUrl}/users/bookings`)
      
      if (!isMountedRef.current) return // Check after async call
      
      // Transform backend booking format to appointment format
      const userAppointments = (response.bookings || []).map(booking => ({
        id: booking.id,
        providerId: booking.providerId,
        providerName: booking.providerName || 'Provider',
        providerInitials: booking.providerName ? 
          booking.providerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'PR',
        dateTime: booking.appointmentDate,
        sessionType: booking.sessionType || 'Video Consultation',
        notes: booking.notes,
        status: booking.status || 'confirmed',
        reason: booking.reason || null,
        createdAt: booking.createdAt
      }))
      
      // Filter to show appointments that are not cancelled or completed
      // Show appointments until they are cancelled or the session has started (within 30 min window for active sessions)
      const now = new Date()
      const upcoming = userAppointments.filter(apt => {
        // Parse date correctly - treat ISO strings without timezone as UTC
        let aptDate
        if (typeof apt.dateTime === 'string') {
          const isISOFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(apt.dateTime)
          // Check for timezone: 'Z' at end, or '+HH:MM' or '-HH:MM' pattern at end
          const hasTimezone = /[Zz]$/.test(apt.dateTime) || /[+-]\d{2}:\d{2}$/.test(apt.dateTime)
          
          if (isISOFormat && !hasTimezone) {
            // Treat as UTC
            aptDate = new Date(apt.dateTime + 'Z')
          } else {
            aptDate = new Date(apt.dateTime)
          }
        } else {
          aptDate = new Date(apt.dateTime)
        }
        
        const status = apt.status?.toLowerCase() || ''
        const isCancelled = status === 'cancelled'
        const isCompleted = status === 'completed'
        
        // Don't show cancelled or completed appointments
        if (isCancelled || isCompleted) {
          return false
        }
        
        // Show appointments that haven't started yet, or are within 30 minutes of start time (active session window)
        const diffInMinutes = (aptDate.getTime() - now.getTime()) / (1000 * 60)
        
        // Show if appointment is in the future OR within 30 minutes after start (active session)
        return diffInMinutes >= -30
      })
      
      // Sort by date
      upcoming.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setAppointments(upcoming)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      // Fallback to empty array on error
      if (isMountedRef.current) {
        setAppointments([])
        setLoading(false)
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [])

  // Debounced reload function to prevent multiple rapid calls
  const debouncedReload = useCallback(() => {
    // Clear any existing debounce timeout
    if (debouncedReloadRef.current) {
      clearTimeout(debouncedReloadRef.current)
      debouncedReloadRef.current = null
    }
    
    // Set new debounced call
    debouncedReloadRef.current = setTimeout(() => {
      if (isMountedRef.current && !isLoadingRef.current) {
        loadAppointments()
      }
      debouncedReloadRef.current = null
    }, 500) // 500ms debounce
  }, [loadAppointments])

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true
    
    // Load appointments immediately
    loadAppointments()
    
    // Refresh every minute
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        loadAppointments()
      }
    }, 60000)
    
    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Clear any pending cancel timeouts
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current)
        cancelTimeoutRef.current = null
      }
      // Clear debounced reload
      if (debouncedReloadRef.current) {
        clearTimeout(debouncedReloadRef.current)
        debouncedReloadRef.current = null
      }
      isMountedRef.current = false
      isLoadingRef.current = false
    }
  }, [loadAppointments])

  const formatDateTime = (dateTimeString) => {
    // Parse the date string - handle both ISO strings and other formats
    // CRITICAL: Dates from backend are stored in UTC (ISO format)
    // We need to parse them as UTC to get the correct time
    let date
    if (!dateTimeString) {
      return 'Invalid date'
    }
    
    // If the string is an ISO-like format but missing 'Z', treat it as UTC
    // PostgreSQL timestamps are typically in format: "2026-01-12T06:12:00.000" (no Z)
    // JavaScript will parse this as LOCAL time, which is wrong - it should be UTC
    if (typeof dateTimeString === 'string') {
      // Check if it looks like an ISO string but doesn't have timezone indicator
      const isISOFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateTimeString)
      // Check for timezone: 'Z' at end, or '+HH:MM' or '-HH:MM' pattern at end
      const hasTimezone = /[Zz]$/.test(dateTimeString) || /[+-]\d{2}:\d{2}$/.test(dateTimeString)
      
      if (isISOFormat && !hasTimezone) {
        // This is likely a PostgreSQL timestamp without timezone - treat as UTC
        // Add 'Z' to indicate UTC
        date = new Date(dateTimeString + 'Z')
      } else {
        // Has timezone info or is not ISO format - parse normally
        date = new Date(dateTimeString)
      }
    } else {
      date = new Date(dateTimeString)
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateTimeString)
      return 'Invalid date'
    }
    
    const now = new Date()
    
    // Calculate difference in milliseconds using getTime() for accuracy
    // CRITICAL: Both dates must be in the same timezone reference (UTC milliseconds)
    const diff = date.getTime() - now.getTime()
    
    // If the date is in the past, show appropriate message
    if (diff < 0) {
      const absDiff = Math.abs(diff)
      const minutesAgo = Math.floor(absDiff / (1000 * 60))
      const hoursAgo = Math.floor(minutesAgo / 60)
      if (hoursAgo > 0) {
        return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
      } else if (minutesAgo > 0) {
        return `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`
      } else {
        return 'Just now'
      }
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 1) {
      return `In ${days} days`
    } else if (days === 1) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (hours > 0) {
      return `In ${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? `, ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`
    } else if (minutes > 0) {
      return `In ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else {
      return 'Starting soon'
    }
  }

  const formatDate = (dateTimeString) => {
    // Parse date as UTC if it's an ISO string without timezone
    let date
    if (typeof dateTimeString === 'string') {
      const isISOFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateTimeString)
      // Check for timezone: 'Z' at end, or '+HH:MM' or '-HH:MM' pattern at end
      const hasTimezone = /[Zz]$/.test(dateTimeString) || /[+-]\d{2}:\d{2}$/.test(dateTimeString)
      
      if (isISOFormat && !hasTimezone) {
        // Treat as UTC
        date = new Date(dateTimeString + 'Z')
      } else {
        date = new Date(dateTimeString)
      }
    } else {
      date = new Date(dateTimeString)
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getProviderInitials = (providerName) => {
    const names = providerName.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return providerName.substring(0, 2).toUpperCase()
  }

  const isWithinTwoHours = (dateTimeString) => {
    const appointmentTime = new Date(dateTimeString)
    const now = new Date()
    const diffInMs = appointmentTime - now
    const diffInHours = diffInMs / (1000 * 60 * 60)
    // Returns true if within 2 hours before session (0 to 2 hours before)
    return diffInHours > 0 && diffInHours <= 2
  }

  const canCancelForFree = (dateTimeString) => {
    const appointmentTime = new Date(dateTimeString)
    const now = new Date()
    const diffInMs = appointmentTime - now
    const diffInHours = diffInMs / (1000 * 60 * 60)
    // Free cancellation if more than 2 hours before session
    return diffInHours > 2
  }

  const handleCancelSession = (appointmentId, dateTime) => {
    // Find the appointment details
    const appointment = appointments.find(apt => apt.id === appointmentId)
    if (appointment) {
      // Reset flags when opening modal
      modalManuallyClosedRef.current = false
      isCancellingRef.current = false
      setSelectedAppointment(appointment)
      setShowCancelModal(true)
      setCancelSuccess(false)
    }
  }

  const handleConfirmCancel = useCallback(async (cancelReason) => {
    if (!selectedAppointment) return
    
    // Prevent multiple simultaneous cancellation requests
    if (isCancellingRef.current) {
      console.warn('Cancellation already in progress')
      return
    }
    
    if (!cancelReason || !cancelReason.trim()) {
      console.error('Cancel reason is required')
      return
    }

    // Mark that cancellation is in progress
    isCancellingRef.current = true

    const withinTwoHours = isWithinTwoHours(selectedAppointment.dateTime)
    
    // If within 2 hours, show additional warning (but still allow cancellation)
    if (withinTwoHours) {
      // TODO: Deduct 10 AAH tokens from user's wallet using paymentService
      console.log('Cancelling within 2 hours - 10 AAH tokens will be charged')
    }
    
    // Store the cancelled booking ID before any async operations
    const cancelledBookingId = selectedAppointment.id
    
    try {
      // Cancel booking via API with reason
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      
      await apiClient.post(`${apiBaseUrl}/users/bookings/cancel`, { 
        bookingId: cancelledBookingId,
        reason: cancelReason.trim()
      })
      
      // Show success state in modal immediately (don't close and reopen)
      if (isMountedRef.current) {
        setCancelSuccess(true)
      }
      
      // Reload appointments after successful cancellation using debounced reload
      // This prevents multiple simultaneous calls and ensures the list updates
      debouncedReload()
      
      // Notify parent that session was cancelled (to clear active session if it was the active one)
      if (onSessionCancelled) {
        onSessionCancelled(cancelledBookingId)
      }
      
      // Clear any existing timeout
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current)
        cancelTimeoutRef.current = null
      }
      
      // Reset manual close flag when starting cancellation
      modalManuallyClosedRef.current = false
      
      // After showing success for 2 seconds, auto-close modal (if not manually closed)
      cancelTimeoutRef.current = setTimeout(() => {
        // Check if component is still mounted and modal wasn't manually closed
        if (!isMountedRef.current || modalManuallyClosedRef.current) {
          cancelTimeoutRef.current = null
          isCancellingRef.current = false
          return
        }
        
        // Close modal after timeout (appointments already reloaded above)
        if (isMountedRef.current && !modalManuallyClosedRef.current) {
          setShowCancelModal(false)
          setSelectedAppointment(null)
          setCancelSuccess(false)
        }
        
        cancelTimeoutRef.current = null
        isCancellingRef.current = false
      }, 2000) // Show success message for 2 seconds
      
    } catch (error) {
      // Reset cancellation flag on error
      isCancellingRef.current = false
      console.error('Error cancelling appointment:', error)
      
      // Show detailed error message
      let errorMessage = 'Failed to cancel appointment. Please try again.'
      if (error.status === 403) {
        errorMessage = 'You do not have permission to cancel this appointment.'
      } else if (error.status === 404) {
        errorMessage = 'Appointment not found. It may have already been cancelled.'
      } else if (error.data?.error?.message) {
        errorMessage = error.data.error.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      if (isMountedRef.current) {
        alert(`Cancel Error: ${errorMessage}`)
        setShowCancelModal(false)
        setSelectedAppointment(null)
      }
    }
  }, [selectedAppointment, debouncedReload, onSessionCancelled])

  const handleCancelModalClose = () => {
    // Mark that modal was manually closed
    modalManuallyClosedRef.current = true
    
    // Clear any pending cancel timeout FIRST
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current)
      cancelTimeoutRef.current = null
    }
    
    // If cancellation was successful, ensure appointments are reloaded
    // Use debounced reload to prevent duplicate calls
    if (cancelSuccess && isMountedRef.current) {
      debouncedReload()
    }
    
    // Reset cancellation flag
    isCancellingRef.current = false
    
    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setShowCancelModal(false)
      setSelectedAppointment(null)
      setCancelSuccess(false)
    }
  }

  const handleJoinSession = (appointment) => {
    const status = String(appointment?.status || '').toLowerCase()
    if (status === 'cancelled' || status === 'completed') {
      alert(`This session is ${status} and cannot be joined.`)
      return
    }

    if (onJoinSession) onJoinSession(appointment)
  }

  return (
    <div className="my-appointments">
      <AppointmentReminder appointments={appointments} />
      <h1 className="appointments-title">My Appointments</h1>
      
      <div className="appointments-container">
        <div className="upcoming-sessions-section">
          <h2 className="section-title">Upcoming Sessions</h2>
          {loading ? (
            <div className="loading-state">
              <p>Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="no-appointments">
              <div className="no-appointments-icon">📅</div>
              <p className="no-appointments-message">
                You don't have any upcoming appointments.
                <br />
                Book a session with our providers to get started!
              </p>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-header">
                    <div className="appointment-avatar">
                      {appointment.providerInitials || getProviderInitials(appointment.providerName)}
                    </div>
                    <div className="appointment-info">
                      <h3 className="appointment-provider-name">{appointment.providerName}</h3>
                      <p className="appointment-time">{formatDateTime(appointment.dateTime)}</p>
                      <p className="appointment-full-time">{formatDate(appointment.dateTime)}</p>
                      {appointment.sessionType && (
                        <p className="appointment-type">{appointment.sessionType}</p>
                      )}
                      {appointment.status === 'cancelled' && appointment.reason && (
                        <div className="appointment-cancellation-reason">
                          <span className="cancellation-label">Cancellation Reason:</span>
                          <span className="cancellation-text">{appointment.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button 
                      className="join-session-btn"
                      onClick={() => handleJoinSession(appointment)}
                      disabled={['cancelled', 'completed'].includes(String(appointment.status || '').toLowerCase())}
                      style={
                        ['cancelled', 'completed'].includes(String(appointment.status || '').toLowerCase())
                          ? { opacity: 0.5, cursor: 'not-allowed' }
                          : undefined
                      }
                    >
                      {['cancelled', 'completed'].includes(String(appointment.status || '').toLowerCase())
                        ? 'Session Not Available'
                        : 'Join Session'}
                    </button>
                    <button 
                      className="cancel-session-btn"
                      onClick={() => handleCancelSession(appointment.id, appointment.dateTime)}
                    >
                      {isWithinTwoHours(appointment.dateTime) ? 'Cancel: -10AAH' : 'Cancel Session (Free)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCancelModal && (
        <CancelBookingModal
          appointment={selectedAppointment}
          onConfirm={handleConfirmCancel}
          onCancel={handleCancelModalClose}
          showSuccess={cancelSuccess}
        />
      )}
    </div>
  )
}

export default MyAppointments