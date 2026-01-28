import React, { useState, useEffect } from 'react'
import './ProviderAppointments.css'
import { apiClient, API_CONFIG } from '../services'
import RescheduleBookingModal from './RescheduleBookingModal'

const ProviderAppointments = ({ onJoinSession }) => {
  const [appointments, setAppointments] = useState([])
  const [filter, setFilter] = useState('today') // 'upcoming', 'today', 'all'
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleAlternatives, setRescheduleAlternatives] = useState([])
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false)
  const [rescheduleSuccessDate, setRescheduleSuccessDate] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true)
        const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
        const response = await apiClient.get(`${apiBaseUrl}/users/provider/bookings`)
        
        // Transform backend booking format to appointment format
        const allAppointments = (response.bookings || []).map(booking => ({
          id: booking.id,
          userId: booking.userId,
          patientName: booking.userName || 'Patient',
          userEmail: booking.userEmail,
          userPhone: booking.userPhone,
          dateTime: booking.appointmentDate,
          sessionType: booking.sessionType || 'Video Consultation',
          notes: booking.notes,
          status: booking.status || 'scheduled',
          rescheduledFrom: booking.rescheduledFrom || null,
          rescheduledAt: booking.rescheduledAt || null,
          rescheduledBy: booking.rescheduledBy || null,
          rescheduleCount: booking.rescheduleCount || 0,
          createdAt: booking.createdAt
        }))
        
        const now = new Date()
        let filtered = allAppointments
        
        if (filter === 'today') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          filtered = allAppointments.filter(apt => {
            const appointmentDate = new Date(apt.dateTime)
            return appointmentDate >= today && appointmentDate < tomorrow && 
                   apt.status !== 'cancelled' && apt.status !== 'completed'
          })
        } else if (filter === 'upcoming') {
          filtered = allAppointments.filter(apt => {
            const appointmentDate = new Date(apt.dateTime)
            return appointmentDate > now && 
                   apt.status !== 'cancelled' && apt.status !== 'completed'
          })
        } else if (filter === 'all') {
          // Show all non-cancelled, non-completed appointments
          filtered = allAppointments.filter(apt => 
            apt.status !== 'cancelled' && apt.status !== 'completed'
          )
        }
        
        // Sort by date
        filtered.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        setAppointments(filtered)
      } catch (error) {
        console.error('Error loading provider appointments:', error)
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
    const interval = setInterval(loadAppointments, 60000)
    
    return () => clearInterval(interval)
  }, [filter, refreshTick])

  const formatDateTime = (dateTimeString) => {
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

  const getTimeUntil = (dateTimeString) => {
    // Parse date correctly - handle dates without timezone indicator
    let date
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
    
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 1) {
      return `In ${days} days`
    } else if (days === 1) {
      return `Tomorrow`
    } else if (hours > 0) {
      return `In ${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `In ${minutes} minutes`
    } else {
      return 'Starting now'
    }
  }

  const getStatusBadge = (dateTimeString) => {
    const date = new Date(dateTimeString)
    const now = new Date()
    const diff = date - now
    const hours = diff / (1000 * 60 * 60)

    if (hours < 0) {
      return { text: 'Past', class: 'status-past' }
    } else if (hours <= 2) {
      return { text: 'Starting Soon', class: 'status-soon' }
    } else if (hours <= 24) {
      return { text: 'Today', class: 'status-today' }
    } else {
      return { text: 'Upcoming', class: 'status-upcoming' }
    }
  }

  const getPatientInitials = (name) => {
    if (!name) return 'PT'
    const names = name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleRescheduleSession = (appointmentId) => {
    const appointment = appointments.find(apt => apt.id === appointmentId)
    if (appointment) {
      setSelectedAppointment(appointment)
      setRescheduleAlternatives([])
      setRescheduleSuccess(false)
      setRescheduleSuccessDate(null)
      setShowRescheduleModal(true)
    }
  }

  const handleConfirmReschedule = async (newDateTime) => {
    if (!selectedAppointment) return
    try {
      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      const response = await apiClient.post(`${apiBaseUrl}/users/bookings/reschedule`, {
        bookingId: selectedAppointment.id,
        newAppointmentDate: newDateTime
      })
      setRescheduleSuccess(true)
      setRescheduleSuccessDate(response?.booking?.appointmentDate || newDateTime)
      setRefreshTick((value) => value + 1)
      setTimeout(() => {
        setShowRescheduleModal(false)
      }, 1200)
    } catch (error) {
      if (error?.status === 409 && error?.data?.alternatives) {
        setRescheduleAlternatives(error.data.alternatives)
      } else {
        const message = error?.data?.error?.message || error?.message || 'Failed to reschedule appointment.'
        alert(message)
        setShowRescheduleModal(false)
      }
    }
  }

  const handleRescheduleClose = () => {
    setShowRescheduleModal(false)
    setSelectedAppointment(null)
    setRescheduleAlternatives([])
    setRescheduleSuccess(false)
    setRescheduleSuccessDate(null)
  }

  return (
    <div className="provider-appointments">
      <div className="provider-appointments-header">
        <div>
          <h1 className="provider-appointments-title">My Schedule</h1>
          <p className="provider-appointments-subtitle">Manage your appointments and sessions</p>
        </div>
        <div className="provider-filter-tabs">
          <button
            className={`provider-filter-tab ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            className={`provider-filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`provider-filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      <div className="provider-appointments-container">
        {loading ? (
          <div className="provider-no-appointments">
            <div className="provider-no-appointments-icon">⏳</div>
            <p className="provider-no-appointments-message">
              Loading appointments...
            </p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="provider-no-appointments">
            <div className="provider-no-appointments-icon">📅</div>
            <p className="provider-no-appointments-message">
              No appointments found for the selected filter.
            </p>
          </div>
        ) : (
          <div className="provider-appointments-list">
            {appointments.map((appointment) => {
              const status = getStatusBadge(appointment.dateTime)
              return (
                <div key={appointment.id} className="provider-appointment-card">
                  <div className="provider-appointment-header">
                    <div className="provider-appointment-avatar">
                      {getPatientInitials(appointment.patientName || 'Patient')}
                    </div>
                    <div className="provider-appointment-info">
                      <div className="provider-appointment-top">
                        <h3 className="provider-appointment-patient">
                          {appointment.patientName || 'Patient'}
                        </h3>
                        <span className={`provider-status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="provider-appointment-time">{formatDateTime(appointment.dateTime)}</p>
                      <p className="provider-appointment-time-until">{getTimeUntil(appointment.dateTime)}</p>
                      {appointment.sessionType && (
                        <p className="provider-appointment-type">
                          <span className="provider-type-icon">💻</span>
                          {appointment.sessionType}
                        </p>
                      )}
                      {appointment.rescheduledFrom && (
                        <p className="provider-appointment-rescheduled">
                          Rescheduled from {formatDateTime(appointment.rescheduledFrom)}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="provider-appointment-notes">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="provider-appointment-actions">
                    <button 
                      className="provider-join-session-btn"
                      onClick={() => {
                        if (onJoinSession) {
                          onJoinSession({
                            id: appointment.id,
                            providerId: null, // Provider is viewing their own appointments
                            providerName: null,
                            dateTime: appointment.dateTime,
                            sessionType: appointment.sessionType,
                            notes: appointment.notes,
                            status: appointment.status,
                            userId: appointment.userId,
                            userName: appointment.patientName
                          })
                        }
                      }}
                    >
                      Join Session
                    </button>
                    <button className="provider-view-details-btn">
                      View Details
                    </button>
                    <button
                      className="provider-reschedule-btn"
                      onClick={() => handleRescheduleSession(appointment.id)}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {showRescheduleModal && (
        <RescheduleBookingModal
          appointment={selectedAppointment}
          alternatives={rescheduleAlternatives}
          onConfirm={handleConfirmReschedule}
          onCancel={handleRescheduleClose}
          showSuccess={rescheduleSuccess}
          successDateTime={rescheduleSuccessDate}
        />
      )}
    </div>
  )
}

export default ProviderAppointments

