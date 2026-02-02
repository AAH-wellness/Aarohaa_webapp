import React, { useState, useEffect, useRef } from 'react'
import { useUserNotification } from '../contexts/UserNotificationContext'

/**
 * When an appointment is starting within 30 minutes, shows the reminder
 * in the headline ticker (below header) instead of a top-right box.
 */
const AppointmentReminder = ({ appointments }) => {
  const { addNotification } = useUserNotification()
  const [upcomingAppointment, setUpcomingAppointment] = useState(null)
  const lastNotifiedBookingIdRef = useRef(null)

  const getTimeRemaining = (dateTimeString) => {
    const date = new Date(dateTimeString)
    const now = new Date()
    const diff = date - now
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes <= 0) return 'Starting now'
    if (minutes === 1) return 'in 1 minute'
    return `in ${minutes} minutes`
  }

  useEffect(() => {
    if (appointments.length === 0) {
      setUpcomingAppointment(null)
      lastNotifiedBookingIdRef.current = null
      return
    }

    const checkUpcomingAppointments = () => {
      const now = new Date()
      const soon = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now

      const upcoming = appointments.find((apt) => {
        const aptDate = new Date(apt.dateTime)
        return aptDate > now && aptDate <= soon
      })

      if (upcoming) {
        setUpcomingAppointment(upcoming)
        // Only add to ticker once per appointment (no top-right box)
        if (lastNotifiedBookingIdRef.current !== upcoming.id) {
          lastNotifiedBookingIdRef.current = upcoming.id
          const message = `🔔 Upcoming: Your session with ${upcoming.providerName} starts ${getTimeRemaining(upcoming.dateTime)}`
          addNotification(message, { type: 'info', autoDismissMs: 12000 })
        }
      } else {
        setUpcomingAppointment(null)
        lastNotifiedBookingIdRef.current = null
      }
    }

    checkUpcomingAppointments()
    const interval = setInterval(checkUpcomingAppointments, 60000)
    return () => clearInterval(interval)
  }, [appointments, addNotification])

  // No UI – reminder is shown in the headline ticker below the header
  return null
}

export default AppointmentReminder
