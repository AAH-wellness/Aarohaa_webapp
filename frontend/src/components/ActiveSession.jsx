import React, { useState, useEffect, useRef } from 'react'
import BookingRequiredModal from './BookingRequiredModal'
import SessionReviewModal from './SessionReviewModal'
import { userService, apiClient, API_CONFIG } from '../services'
import { useUserNotification } from '../contexts/UserNotificationContext'
import './ActiveSession.css'

const ActiveSession = ({ hasBookedSession, onNavigateToBooking, onActiveSessionChange, selectedAppointment }) => {
  const { addNotification } = useUserNotification()
  const [showModal, setShowModal] = useState(false)
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeBooking, setActiveBooking] = useState(null)
  const [providerNotes, setProviderNotes] = useState([])
  const [currentUserName, setCurrentUserName] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const callContainerRef = useRef(null)
  const callObjectRef = useRef(null)

  useEffect(() => {
    // If selectedAppointment is passed, use it directly
    if (selectedAppointment) {
      // Check if the selected appointment is cancelled or completed
      const status = String(selectedAppointment.status || '').toLowerCase()
      if (status === 'cancelled' || status === 'completed') {
        // Completed/cancelled sessions are not accessible
        setActiveBooking(null)
        setShowModal(true)
        // Clear active session in parent
        if (onActiveSessionChange) {
          onActiveSessionChange(null)
        }
        // Don't call onActiveSessionChange - let the modal show on the Active Session page
        return
      }

      const activeBookingData = {
        id: selectedAppointment.id,
        providerId: selectedAppointment.providerId,
        providerName: selectedAppointment.providerName || 'Provider',
        dateTime: selectedAppointment.dateTime,
        sessionType: selectedAppointment.sessionType || 'Video Consultation',
        notes: selectedAppointment.notes,
        status: selectedAppointment.status
      }
      setActiveBooking(activeBookingData)
      setShowModal(false)
      loadProviderNotes(selectedAppointment.id)
      let statusInterval = null
      const checkStatus = async () => {
        try {
          const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
          const response = await apiClient.get(`${apiBaseUrl}/users/bookings`)
          const bookings = response.bookings || []
          const updated = bookings.find((booking) => booking.id === selectedAppointment.id)
          if (!updated) {
            setActiveBooking(null)
            setShowModal(true)
            if (onActiveSessionChange) {
              onActiveSessionChange(null)
            }
            return
          }
          const updatedStatus = String(updated.status || '').toLowerCase()
          if (updatedStatus === 'completed' || updatedStatus === 'cancelled') {
            setActiveBooking(null)
            setShowModal(true)
            if (onActiveSessionChange) {
              onActiveSessionChange(null)
            }
          }
        } catch (error) {
          // If status check fails, keep the current session UI
        }
      }

      checkStatus()
      statusInterval = setInterval(checkStatus, 60000)
      
      // Get current user name
      userService.getProfile().then(profile => {
        if (profile.user && profile.user.name) {
          setCurrentUserName(profile.user.name)
        }
      })
      
      // Note: Auto-start removed to prevent race conditions
      // User can manually start the call when ready
      
      return () => {
        if (statusInterval) {
          clearInterval(statusInterval)
        }
      }
    }
    
    // Otherwise, check for active booking from backend API
    const checkActiveBooking = async () => {
      try {
        // Get current user ID
        const profile = await userService.getProfile()
        if (!profile.user || !profile.user.id) {
          setActiveBooking(null)
          setShowModal(true)
          // Don't call onActiveSessionChange here - let the modal show
          return
        }

        if (profile.user.name) {
          setCurrentUserName(profile.user.name)
        }

        const userId = profile.user.id
        
        // Get user bookings from backend
        const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
        const response = await apiClient.get(`${apiBaseUrl}/users/bookings`)
        const bookings = response.bookings || []
        
        const now = new Date()
        
        // Find the next upcoming booking (not completed or cancelled)
        // Only include bookings that are confirmed, scheduled, or in progress
        const upcomingBookings = bookings
          .filter(booking => {
            const aptDate = new Date(booking.appointmentDate)
            const status = String(booking.status || '').toLowerCase()
            // Exclude completed and cancelled bookings - these should not be accessible
            // Only include bookings that are in the future or within the last 30 minutes (active session window)
            const isNotCompletedOrCancelled = status !== 'completed' && status !== 'cancelled'
            const isFutureOrRecent = aptDate >= new Date(now.getTime() - 30 * 60 * 1000) // Within last 30 min or future
            return isNotCompletedOrCancelled && isFutureOrRecent
          })
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
        
        if (upcomingBookings.length > 0) {
          // Use the next upcoming booking
          const nextBooking = upcomingBookings[0]
          const activeBookingData = {
            id: nextBooking.id,
            providerId: nextBooking.providerId,
            providerName: nextBooking.providerName || 'Provider',
            dateTime: nextBooking.appointmentDate,
            sessionType: nextBooking.sessionType || 'Video Consultation',
            notes: nextBooking.notes,
            status: nextBooking.status
          }
          setActiveBooking(activeBookingData)
          setShowModal(false)
          loadProviderNotes(nextBooking.id)
          // Notify parent component about active session
          if (onActiveSessionChange) {
            onActiveSessionChange(activeBookingData)
          }
        } else {
          // No upcoming bookings (all cancelled/completed) - show modal
          setActiveBooking(null)
          setShowModal(true)
          // Don't call onActiveSessionChange - let the modal show on the Active Session page
        }
      } catch (error) {
        console.error('Error checking active booking:', error)
        setActiveBooking(null)
        setShowModal(true)
        // Don't call onActiveSessionChange - let the modal show on the Active Session page
      }
    }
    
    checkActiveBooking()
    // Check every minute for active sessions
    const interval = setInterval(checkActiveBooking, 60000)
    return () => clearInterval(interval)
  }, [hasBookedSession, onActiveSessionChange, selectedAppointment])

  const loadProviderNotes = (bookingId) => {
    // Load provider notes from localStorage (in production, this would be from API)
    const savedNotes = JSON.parse(localStorage.getItem(`session_notes_${bookingId}`) || '[]')
    setProviderNotes(savedNotes)
  }

  useEffect(() => {
    if (isCallStarted) {
      const timer = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isCallStarted])

  // Cleanup embedded call on unmount
  useEffect(() => {
    return () => {
      try {
        if (callObjectRef.current && callObjectRef.current.cleanup) {
          callObjectRef.current.cleanup()
          callObjectRef.current = null
        }
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const calculateCost = (seconds) => {
    if (!activeBooking) return '0.00'
    // Calculate based on provider's rate (default $3 per minute)
    const ratePerMinute = 3 // This should come from provider data
    const minutes = seconds / 60
    return (minutes * ratePerMinute).toFixed(2)
  }

  const handleStartCall = async () => {
    setIsLoading(true)
    try {
      // Use activeBooking if available, otherwise fallback to selectedAppointment
      const bookingToUse = activeBooking || (selectedAppointment ? {
        id: selectedAppointment.id,
        providerId: selectedAppointment.providerId,
        providerName: selectedAppointment.providerName || 'Provider',
        dateTime: selectedAppointment.dateTime,
        sessionType: selectedAppointment.sessionType || 'Video Consultation',
        notes: selectedAppointment.notes,
        status: selectedAppointment.status
      } : null)

      if (!bookingToUse?.id) {
        throw new Error('No active booking found')
      }

      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      const joinInfo = await apiClient.post(`${apiBaseUrl}/users/bookings/${bookingToUse.id}/video/join`, {})

      if (!callContainerRef.current) {
        throw new Error('Call container not available')
      }

      // Clean up existing call if any
      if (callObjectRef.current) {
        callContainerRef.current.innerHTML = ''
        callObjectRef.current = null
      }

      // Create Jitsi iframe
      const iframe = document.createElement('iframe')
      // Ensure English language - add lang parameter if not already in URL
      let roomUrl = joinInfo.roomUrl
      if (!roomUrl.includes('lang=')) {
        const separator = roomUrl.includes('?') ? '&' : '?'
        roomUrl = `${roomUrl}${separator}lang=en&config.lang=en&interfaceConfig.lang=en`
      }
      iframe.src = roomUrl
      iframe.allow = 'camera; microphone; fullscreen; speaker; display-capture'
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = '0'
      iframe.style.borderRadius = '16px'
      iframe.title = 'Video Call'
      
      // Listen for Jitsi events via postMessage (optional, for better UX)
      const handleMessage = (event) => {
        // Jitsi sends messages from meet.jit.si domain
        if (event.origin.includes('meet.jit.si') || event.origin.includes('jitsi')) {
          if (event.data && event.data.type === 'video-conference-left') {
            try {
              if (callObjectRef.current && callObjectRef.current.cleanup) {
                callObjectRef.current.cleanup()
                callObjectRef.current = null
              }
            } catch (e) { /* ignore */ }
            setIsCallStarted(false)
            setSessionTime(0)
            window.removeEventListener('message', handleMessage)
            setShowReviewModal(true)
          }
        }
      }
      window.addEventListener('message', handleMessage)

      callContainerRef.current.appendChild(iframe)
      callObjectRef.current = { iframe, cleanup: () => {
        window.removeEventListener('message', handleMessage)
        if (callContainerRef.current) {
          callContainerRef.current.innerHTML = ''
        }
      }}

      setIsCallStarted(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Error starting embedded call:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        errorCode: error.data?.error?.code
      })
      
      // Extract detailed error message from backend response
      let errorMessage = 'Failed to start the call. Please try again.'
      if (error.data?.error?.message) {
        errorMessage = error.data.error.message
      } else if (error.message && error.message !== `HTTP ${error.status}`) {
        errorMessage = error.message
      }
      
      // Provide helpful messages for common error codes
      if (error.data?.error?.code === 'WAITING_FOR_PROVIDER') {
        errorMessage = 'Please wait for the provider to start the session first.'
      } else if (error.data?.error?.code === 'SESSION_NOT_ACTIVE') {
        errorMessage = 'The session is not yet active. Please wait until the scheduled time.'
      } else if (error.data?.error?.code === 'SESSION_EXPIRED') {
        errorMessage = 'The session join window has ended.'
      } else if (error.data?.error?.code === 'ACCESS_DENIED') {
        errorMessage = 'You do not have permission to join this session.'
      }
      
      addNotification(errorMessage, { type: 'error' })
      setIsLoading(false)
    }
  }

  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end this session? You will need to rate and review the provider.')) {
      try {
        if (callObjectRef.current && callObjectRef.current.cleanup) {
          callObjectRef.current.cleanup()
          callObjectRef.current = null
        }
      } catch (e) {
        // ignore
      }

      setIsCallStarted(false)
      setSessionTime(0)
      setIsMuted(false)
      setIsVideoOff(false)
      setShowReviewModal(true)
    }
  }

  const handleReviewComplete = () => {
    setShowReviewModal(false)
    setActiveBooking(null)
    if (onActiveSessionChange) onActiveSessionChange(null)
    if (onNavigateToBooking) onNavigateToBooking()
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = isVideoOff
        setIsVideoOff(!isVideoOff)
      }
    }
  }

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted
        setIsMuted(!isMuted)
      }
    }
  }

  // Show premium modal if no active booking (always accessible but shows modal when no session)
  if (!activeBooking) {
    return (
      <div className="active-session">
        <BookingRequiredModal
          onClose={() => {
            // Don't close the modal - keep it visible since this is the Active Session page
            // User can click "Book Session" to navigate away
          }}
          onNavigateToBooking={onNavigateToBooking}
        />
      </div>
    )
  }

  const providerName = activeBooking.providerName || 'Your Provider'
  const sessionDate = new Date(activeBooking.dateTime)
  const now = new Date()
  const diffInMinutes = (sessionDate - now) / (1000 * 60)
  const isSessionActive = diffInMinutes <= 5 && diffInMinutes >= -30 // Within 5 min before or 30 min after
  const isSessionUpcoming = diffInMinutes > 5 // More than 5 minutes in the future
  const isSessionPast = diffInMinutes < -30 // More than 30 minutes past

  const formatCountdown = () => {
    if (diffInMinutes < 0) {
      const hoursAgo = Math.floor(Math.abs(diffInMinutes) / 60)
      const minutesAgo = Math.floor(Math.abs(diffInMinutes) % 60)
      if (hoursAgo > 0) {
        return `Session started ${hoursAgo}h ${minutesAgo}m ago`
      }
      return `Session started ${minutesAgo}m ago`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      const minutes = Math.floor(diffInMinutes % 60)
      if (hours > 0) {
        return `Session starts in ${hours}h ${minutes}m`
      }
      return `Session starts in ${minutes}m`
    }
  }

  return (
    <div className="active-session">
      {showReviewModal && activeBooking && (
        <SessionReviewModal
          bookingId={activeBooking.id}
          providerName={activeBooking.providerName || 'Provider'}
          onComplete={handleReviewComplete}
        />
      )}
      <div className="session-container">
        <div className="session-header">
          <h1 className="session-title">Video Session with {providerName}</h1>
          <p className="session-scheduled-time">Scheduled: {sessionDate.toLocaleString()}</p>
          {isSessionUpcoming && (
            <p className="session-countdown" style={{ color: '#0e4826', fontWeight: 600, marginTop: '8px' }}>
              {formatCountdown()}
            </p>
          )}
          {!isSessionActive && !isSessionUpcoming && (
            <p className="session-status" style={{ color: '#666', marginTop: '8px' }}>
              Session time has passed. You can still view session notes below.
            </p>
          )}
        </div>

        {isCallStarted && (
          <div className="session-info-bar">
            <span>Session Time: {formatTime(sessionTime)}</span>
            <span>|</span>
            <span>Cost: ${calculateCost(sessionTime)}</span>
          </div>
        )}

        <div className={`video-call-interface ${isCallStarted ? '' : 'pre-call'}`} style={{ height: '520px', position: 'relative' }}>
          <div ref={callContainerRef} style={{ width: '100%', height: '100%' }} />
          {!isCallStarted && (
            <div className="video-placeholder" style={{ position: 'absolute', inset: 0 }}>
              {isSessionUpcoming ? (
                <>
                  <div className="video-icon">⏰</div>
                  <p className="video-status">
                    Your session with {providerName} is scheduled for<br />
                    {sessionDate.toLocaleString()}
                    <br />
                    <br />
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#0e4826' }}>
                      {formatCountdown()}
                    </span>
                  </p>
                </>
              ) : isSessionPast ? (
                <>
                  <div className="video-icon">📋</div>
                  <p className="video-status">
                    Session with {providerName} has ended<br />
                    <br />
                    You can view session notes below
                  </p>
                </>
              ) : (
                <>
                  <div className="video-icon">📹</div>
                  <p className="video-status">
                    Ready to start your session with<br />
                    {providerName}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {isCallStarted ? (
          <div className="call-controls">
            <button className="control-btn end-call-btn" onClick={handleEndCall} aria-label="Leave call">
              Leave
            </button>
          </div>
        ) : (
          <div className="pre-call-section">
            <button
              className="start-call-btn"
              onClick={handleStartCall}
              disabled={isSessionUpcoming || isSessionPast || isLoading}
              style={isSessionUpcoming ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              {isSessionUpcoming
                ? 'Session Not Yet Active'
                : isLoading
                  ? 'Starting Call...'
                  : 'Start Call'}
            </button>
          </div>
        )}

        <div className="session-notes-section">
          <h2 className="notes-title">Provider Session Notes</h2>
          <p className="notes-description">
            Your provider will share important information here during and after the session.
          </p>
          
          {providerNotes.length > 0 ? (
            <div className="notes-list">
              {providerNotes.map((note, index) => (
                <div key={index} className="note-item">
                  <div className="note-header">
                    <span className="note-author">{note.providerName || activeBooking?.providerName || 'Provider'}</span>
                    <span className="note-time">{new Date(note.timestamp || note.date || Date.now()).toLocaleString()}</span>
                  </div>
                  <div className="note-content">{note.content || note.note || note}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-notes-placeholder">
              <p>No notes shared yet. Provider notes will appear here during or after your session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActiveSession
