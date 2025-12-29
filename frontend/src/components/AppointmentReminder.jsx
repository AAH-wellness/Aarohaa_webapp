import React, { useState, useEffect } from 'react'
import './AppointmentReminder.css'

const AppointmentReminder = ({ appointments }) => {
  const [showReminder, setShowReminder] = useState(false)
  const [upcomingAppointment, setUpcomingAppointment] = useState(null)

  useEffect(() => {
    if (appointments.length === 0) {
      setShowReminder(false)
      return
    }

    const checkUpcomingAppointments = () => {
      const now = new Date()
      const soon = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
      
      // Find appointments starting within 30 minutes
      const upcoming = appointments.find(apt => {
        const aptDate = new Date(apt.dateTime)
        return aptDate > now && aptDate <= soon
      })

      if (upcoming) {
        setUpcomingAppointment(upcoming)
        setShowReminder(true)
      } else {
        setShowReminder(false)
      }
    }

    checkUpcomingAppointments()
    // Check every minute
    const interval = setInterval(checkUpcomingAppointments, 60000)
    
    return () => clearInterval(interval)
  }, [appointments])

  const getTimeRemaining = (dateTimeString) => {
    const date = new Date(dateTimeString)
    const now = new Date()
    const diff = date - now
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes <= 0) {
      return 'Starting now'
    } else if (minutes === 1) {
      return 'in 1 minute'
    } else {
      return `in ${minutes} minutes`
    }
  }

  if (!showReminder || !upcomingAppointment) {
    return null
  }

  return (
    <div className={`appointment-reminder ${showReminder ? 'visible' : ''}`}>
      <div className="reminder-content">
        <div className="reminder-icon">🔔</div>
        <div className="reminder-text">
          <strong>Upcoming Appointment!</strong>
          <p>
            Your session with {upcomingAppointment.providerName} starts {getTimeRemaining(upcomingAppointment.dateTime)}
          </p>
        </div>
        <button 
          className="reminder-close"
          onClick={() => setShowReminder(false)}
          aria-label="Close reminder"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default AppointmentReminder


