import React, { useState, useEffect } from 'react'
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

  useEffect(() => {
    // Load appointments using service layer
    const loadAppointments = async () => {
      try {
        setLoading(true)
        
        // Get current user ID from backend profile
        let userId = null
        try {
          const profile = await userService.getProfile()
          if (profile.user && profile.user.id) {
            userId = profile.user.id
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
        
        if (!userId) {
          // If we can't get user ID, show empty appointments
          setAppointments([])
          return
        }
        
        // Get user bookings from backend API
        const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
        const response = await apiClient.get(`${apiBaseUrl}/users/bookings`)
        
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
          
          // Debug logging for recent appointments (within 6 hours)
          if (Math.abs(diffInMinutes) < 360) {
            console.log('MyAppointments - Appointment date debug:', {
              bookingId: apt.id,
              appointmentDateRaw: apt.dateTime,
              parsedDateISO: aptDate.toISOString(),
              parsedDateLocal: aptDate.toLocaleString(),
              nowISO: now.toISOString(),
              nowLocal: now.toLocaleString(),
              diffMs: aptDate.getTime() - now.getTime(),
              diffMinutes: diffInMinutes,
              diffHours: diffInMinutes / 60
            })
          }
          
          // Show if appointment is in the future OR within 30 minutes after start (active session)
          return diffInMinutes >= -30
        })
        
        // Sort by date
        upcoming.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        setAppointments(upcoming)
      } catch (error) {
        console.error('Error loading appointments:', error)
        // Fallback to empty array on error
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
    // Refresh every minute
    const interval = setInterval(loadAppointments, 60000)
    
    return () => clearInterval(interval)
  }, [])

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
        console.log('🔧 Parsing date as UTC (added Z):', {
          original: dateTimeString,
          withZ: dateTimeString + 'Z',
          parsedISO: date.toISOString(),
          parsedLocal: date.toLocaleString(),
          timezoneOffset: date.getTimezoneOffset()
        })
      } else {
        // Has timezone info or is not ISO format - parse normally
        date = new Date(dateTimeString)
        if (hasTimezone) {
          console.log('✅ Date has timezone info, parsing normally:', {
            original: dateTimeString,
            parsedISO: date.toISOString(),
            parsedLocal: date.toLocaleString()
          })
        }
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
    
    // Debug logging (can be removed later)
    if (Math.abs(diff) < 1000 * 60 * 60 * 6) { // Log if within 6 hours
      console.log('Time calculation:', {
        dateTimeString,
        parsedDateISO: date.toISOString(),
        parsedDateUTC: date.getTime(),
        parsedDateLocal: date.toLocaleString(),
        nowISO: now.toISOString(),
        nowUTC: now.getTime(),
        nowLocal: now.toLocaleString(),
        diffMs: diff,
        diffMinutes: Math.floor(diff / (1000 * 60)),
        diffHours: Math.floor(diff / (1000 * 60 * 60)),
        timezoneOffset: date.getTimezoneOffset(),
        nowTimezoneOffset: now.getTimezoneOffset()
      })
    }
    
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
      setSelectedAppointment(appointment)
      setShowCancelModal(true)
      setCancelSuccess(false)
    }
  }

  const handleConfirmCancel = async (cancelReason) => {
    if (!selectedAppointment) return
    
    if (!cancelReason || !cancelReason.trim()) {
      console.error('Cancel reason is required')
      return
    }

    const withinTwoHours = isWithinTwoHours(selectedAppointment.dateTime)
    
    // If within 2 hours, show additional warning (but still allow cancellation)
    if (withinTwoHours) {
      // TODO: Deduct 10 AAH tokens from user's wallet using paymentService
      console.log('Cancelling within 2 hours - 10 AAH tokens will be charged')
    }
    
    try {
      // Cancel booking via API with reason
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      console.log('Cancelling booking:', selectedAppointment.id, 'Reason:', cancelReason)
      
      const response = await apiClient.post(`${apiBaseUrl}/users/bookings/cancel`, { 
        bookingId: selectedAppointment.id,
        reason: cancelReason.trim()
      })
      console.log('Cancel booking response:', response)
      
      // Store the cancelled booking ID before clearing
      const cancelledBookingId = selectedAppointment.id
      
      // Show success state in modal immediately (don't close and reopen)
      setCancelSuccess(true)
      
      // After showing success for 2 seconds, reload appointments and close modal
      setTimeout(async () => {
        // Reload appointments using the same method as initial load
        const profile = await userService.getProfile()
        if (profile.user && profile.user.id) {
          // Use the same API endpoint that was used to load appointments initially
          const bookingsResponse = await apiClient.get(`${apiBaseUrl}/users/bookings`)
          const bookings = bookingsResponse.bookings || []
          
          // Transform backend booking format to appointment format
          const userAppointments = bookings.map(booking => ({
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
            const aptDate = new Date(apt.dateTime)
            const status = apt.status?.toLowerCase() || ''
            const isCancelled = status === 'cancelled'
            const isCompleted = status === 'completed'
            
            // Don't show cancelled or completed appointments
            if (isCancelled || isCompleted) {
              return false
            }
            
            // Show appointments that haven't started yet, or are within 30 minutes of start time (active session window)
            const diffInMinutes = (aptDate - now) / (1000 * 60)
            // Show if appointment is in the future OR within 30 minutes after start (active session)
            return diffInMinutes >= -30
          })
          
          // Sort by date
          upcoming.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
          setAppointments(upcoming)
        }
        
        // Notify parent that session was cancelled (to clear active session if it was the active one)
        if (onSessionCancelled) {
          onSessionCancelled(cancelledBookingId)
        }
        
        // Close modal after reload
        setShowCancelModal(false)
        setSelectedAppointment(null)
        setCancelSuccess(false)
      }, 2000) // Show success message for 2 seconds
      
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      
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
      
      alert(`Cancel Error: ${errorMessage}`)
      setShowCancelModal(false)
      setSelectedAppointment(null)
    }
  }

  const handleCancelModalClose = () => {
    setShowCancelModal(false)
    setSelectedAppointment(null)
    setCancelSuccess(false)
  }

  const handleJoinSession = (appointment) => {
    if (onJoinSession) {
      onJoinSession(appointment)
    }
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
                    >
                      Join Session
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