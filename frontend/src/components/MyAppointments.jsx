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
          status: booking.status || 'scheduled',
          createdAt: booking.createdAt
        }))
        
        // Filter to only show upcoming appointments
        const now = new Date()
        const upcoming = userAppointments.filter(apt => {
          const aptDate = new Date(apt.dateTime)
          return aptDate > now && apt.status !== 'cancelled'
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
    const date = new Date(dateTimeString)
    const now = new Date()
    const diff = date - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 1) {
      return `In ${days} days`
    } else if (days === 1) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (hours > 0) {
      return `In ${hours} hours, ${minutes} minutes`
    } else if (minutes > 0) {
      return `In ${minutes} minutes`
    } else {
      return 'Starting soon'
    }
  }

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString)
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

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return

    const withinTwoHours = isWithinTwoHours(selectedAppointment.dateTime)
    
    // If within 2 hours, show additional warning (but still allow cancellation)
    if (withinTwoHours) {
      // TODO: Deduct 10 AAH tokens from user's wallet using paymentService
      console.log('Cancelling within 2 hours - 10 AAH tokens will be charged')
    }
    
    try {
      // Cancel booking via API
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      console.log('Cancelling booking:', selectedAppointment.id)
      
      const response = await apiClient.post(`${apiBaseUrl}/users/bookings/cancel`, { bookingId: selectedAppointment.id })
      console.log('Cancel booking response:', response)
      
      // Store the cancelled booking ID before clearing
      const cancelledBookingId = selectedAppointment.id
      
      // Show success state in modal
      setCancelSuccess(true)
      
      // After showing success, reload appointments
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
            status: booking.status || 'scheduled',
            createdAt: booking.createdAt
          }))
          
          // Filter to only show upcoming appointments
          const now = new Date()
          const upcoming = userAppointments.filter(apt => {
            const aptDate = new Date(apt.dateTime)
            return aptDate > now && apt.status !== 'cancelled'
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