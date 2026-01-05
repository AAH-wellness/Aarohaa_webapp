import React, { useState, useEffect } from 'react'
import './MyAppointments.css'
import AppointmentReminder from './AppointmentReminder'
import { appointmentService, userService } from '../services'

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

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
        
        // Use service to get user's appointments from backend
        const userAppointments = await appointmentService.getUserAppointments(userId)
        
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
    return diffInHours <= 2 && diffInHours > 0
  }

  const handleCancelSession = async (appointmentId, dateTime) => {
    const isWithinTwoHoursBefore = isWithinTwoHours(dateTime)
    
    if (isWithinTwoHoursBefore) {
      const confirmCancel = window.confirm(
        'Cancelling this session within 2 hours will cost 10 AAH tokens. Do you want to proceed?'
      )
      if (!confirmCancel) return
      
      // TODO: Deduct 10 AAH tokens from user's wallet using paymentService
    }
    
    try {
      // Use service to cancel appointment
      await appointmentService.cancelAppointment(appointmentId)
      
      // Reload appointments to reflect the change
      const allAppointments = await appointmentService.getUpcomingAppointments()
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const userId = currentUser.id || 'current-user'
      const userAppointments = allAppointments.filter(apt => 
        !apt.userId || apt.userId === userId
      )
      userAppointments.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      setAppointments(userAppointments)
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Failed to cancel appointment. Please try again.')
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
                    <button className="join-session-btn">Join Session</button>
                    <button 
                      className="cancel-session-btn"
                      onClick={() => handleCancelSession(appointment.id, appointment.dateTime)}
                    >
                      {isWithinTwoHours(appointment.dateTime) ? 'Cancel: -10AAH' : 'Cancel Session'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyAppointments