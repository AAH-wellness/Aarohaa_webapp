import React, { useState, useEffect, useRef } from 'react'
import './ProviderActiveSession.css'
import { apiClient, API_CONFIG } from '../services'

const ProviderActiveSession = ({ selectedAppointment, onSessionCompleted }) => {
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeAppointment, setActiveAppointment] = useState(null)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const callContainerRef = useRef(null)
  const callObjectRef = useRef(null)

  useEffect(() => {
    // If selectedAppointment is passed, use it directly (but check if it's completed)
    if (selectedAppointment) {
      const status = String(selectedAppointment.status || '').toLowerCase()
      // Don't allow access to completed or cancelled sessions
      if (status === 'completed' || status === 'cancelled') {
        setActiveAppointment(null)
        setLoadingAppointments(false)
        return
      }
      setActiveAppointment(selectedAppointment)
      setLoadingAppointments(false)
      return
    }

    // Otherwise, load provider's appointments from backend
    const loadProviderAppointments = async () => {
      try {
        setLoadingAppointments(true)
        const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
        const response = await apiClient.get(`${apiBaseUrl}/users/provider/bookings`)
        const bookings = response.bookings || []
        
        const now = new Date()
        
        // Find the next active/upcoming appointment (exclude completed and cancelled)
        const activeAppt = bookings.find(booking => {
          const aptDate = new Date(booking.appointmentDate)
          const diffInMinutes = (aptDate - now) / (1000 * 60)
          const status = String(booking.status || '').toLowerCase()
          // Active if within 30 minutes before or after start time
          // Exclude completed and cancelled sessions - they are not accessible
          return diffInMinutes >= -30 && diffInMinutes <= 120 && 
                 status !== 'cancelled' && status !== 'completed'
        })
        
        if (activeAppt) {
          setActiveAppointment({
            id: activeAppt.id,
            userId: activeAppt.userId,
            userName: activeAppt.userName || 'Patient',
            dateTime: activeAppt.appointmentDate,
            sessionType: activeAppt.sessionType || 'Video Consultation',
            notes: activeAppt.notes,
            status: activeAppt.status
          })
        }
      } catch (error) {
        console.error('Error loading provider appointments:', error)
      } finally {
        setLoadingAppointments(false)
      }
    }

    loadProviderAppointments()
    const interval = setInterval(loadProviderAppointments, 60000)
    return () => clearInterval(interval)
  }, [selectedAppointment])

  useEffect(() => {
    if (isCallStarted) {
      const timer = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isCallStarted])

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

  const calculateEarnings = (seconds) => {
    // Assuming $3 per minute for provider
    const minutes = seconds / 60
    return (minutes * 3).toFixed(2)
  }

  const handleStartCall = async () => {
    setIsLoading(true)
    try {
      if (!activeAppointment?.id) {
        throw new Error('No active appointment found')
      }

      const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
      const joinInfo = await apiClient.post(`${apiBaseUrl}/users/bookings/${activeAppointment.id}/video/join`, {})

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
      
      // Listen for Jitsi events via postMessage
      const handleMessage = async (event) => {
        // Jitsi sends messages from meet.jit.si domain
        if (event.origin.includes('meet.jit.si') || event.origin.includes('jitsi')) {
          if (event.data && event.data.type === 'video-conference-left') {
            try {
              // Provider is host: ending/leaving marks session completed in DB
              await apiClient.post(`${apiBaseUrl}/users/bookings/${activeAppointment.id}/video/complete`, {
                sessionNotes: notes.trim() || null
              })
              
              // Session completed - clear active appointment
              setActiveAppointment(null)
              
              // Notify parent component
              if (onSessionCompleted) {
                onSessionCompleted()
              }
            } catch (e) {
              console.warn('Failed to mark session completed:', e)
            }

            setIsCallStarted(false)
            setSessionTime(0)
            setNotes('')
            window.removeEventListener('message', handleMessage)
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
      if (error.data?.error?.code === 'SESSION_NOT_ACTIVE') {
        errorMessage = 'The session is not yet active. Please wait until the scheduled time.'
      } else if (error.data?.error?.code === 'SESSION_EXPIRED') {
        errorMessage = 'The session join window has ended.'
      } else if (error.data?.error?.code === 'ACCESS_DENIED') {
        errorMessage = 'You do not have permission to join this session.'
      }
      
      alert(errorMessage)
      setIsLoading(false)
    }
  }

  const handleEndCall = async () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      try {
        if (callObjectRef.current && callObjectRef.current.cleanup) {
          callObjectRef.current.cleanup()
          callObjectRef.current = null
        }
        
        // Mark session as completed with session notes
        const apiBaseUrl = API_CONFIG.USER_SERVICE || 'http://localhost:3001/api'
        try {
          await apiClient.post(`${apiBaseUrl}/users/bookings/${activeAppointment.id}/video/complete`, {
            sessionNotes: notes.trim() || null
          })
          
          // Session completed successfully - clear active appointment and reload
          setActiveAppointment(null)
          setIsCallStarted(false)
          setSessionTime(0)
          setIsMuted(false)
          setIsVideoOff(false)
          setNotes('')
          
          // Show success message
          alert('Session completed successfully. The session has been saved.')
          
          // Notify parent component that session is completed
          if (onSessionCompleted) {
            onSessionCompleted()
          }
          
          // Reload appointments to get updated list (excluding completed sessions)
          const response = await apiClient.get(`${apiBaseUrl}/users/provider/bookings`)
          const bookings = response.bookings || []
          
          const now = new Date()
          const activeAppt = bookings.find(booking => {
            const aptDate = new Date(booking.appointmentDate)
            const diffInMinutes = (aptDate - now) / (1000 * 60)
            const status = String(booking.status || '').toLowerCase()
            // Only find active sessions (not completed or cancelled)
            return diffInMinutes >= -30 && diffInMinutes <= 120 && 
                   status !== 'cancelled' && status !== 'completed'
          })
          
          if (activeAppt) {
            setActiveAppointment({
              id: activeAppt.id,
              userId: activeAppt.userId,
              userName: activeAppt.userName || 'Patient',
              dateTime: activeAppt.appointmentDate,
              sessionType: activeAppt.sessionType || 'Video Consultation',
              notes: activeAppt.notes,
              status: activeAppt.status
            })
          } else {
            // No more active sessions
            setActiveAppointment(null)
          }
        } catch (e) {
          console.warn('Failed to mark session completed:', e)
          alert('Failed to complete session. Please try again.')
        }
      } catch (e) {
        console.error('Error ending call:', e)
        alert('Error ending call. Please try again.')
      }
    }
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

  if (loadingAppointments) {
    return (
      <div className="provider-active-session">
        <div className="provider-session-container">
          <div className="provider-session-header">
            <h1 className="provider-session-title">Loading Sessions...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (!activeAppointment) {
    return (
      <div className="provider-active-session">
        <div className="provider-session-container">
          <div className="provider-session-header">
            <h1 className="provider-session-title">No Active Session</h1>
            <p className="provider-no-session-message">
              You don't have any active sessions right now. Check your schedule to join upcoming sessions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const patientName = activeAppointment.userName || 'Patient'
  const sessionDate = new Date(activeAppointment.dateTime)
  const now = new Date()
  const diffInMinutes = (sessionDate - now) / (1000 * 60)
  // Provider can enter slightly earlier (matches backend join window).
  const isSessionActive = diffInMinutes <= 15 && diffInMinutes >= -30

  return (
    <div className="provider-active-session">
      <div className="provider-session-container">
        <div className="provider-session-header">
          <h1 className="provider-session-title">Active Session</h1>
          <div className="provider-patient-info">
            <span className="provider-patient-name">Patient: {patientName}</span>
            <span className="provider-session-type">{activeAppointment.sessionType}</span>
            <span className="provider-session-time">
              Scheduled: {sessionDate.toLocaleString()}
            </span>
          </div>
        </div>

        {isCallStarted && (
          <div className="provider-session-info-bar">
            <span>Session Time: {formatTime(sessionTime)}</span>
            <span>|</span>
            <span>Earnings: ${calculateEarnings(sessionTime)}</span>
          </div>
        )}

        <div className="provider-video-call-interface" style={{ height: '520px', position: 'relative' }}>
          {/* Always render the call container so ref is available */}
          <div ref={callContainerRef} style={{ width: '100%', height: '100%', display: isCallStarted ? 'block' : 'none' }} />
          {!isCallStarted && (
            <div className="provider-video-placeholder" style={{ position: 'absolute', inset: 0 }}>
              <div className="provider-video-icon">💻</div>
              <p className="provider-video-status">
                Ready to start session with<br />
                {patientName}
              </p>
              {!isSessionActive && diffInMinutes > 5 && (
                <p className="provider-session-countdown">
                  Session starts in {Math.floor(diffInMinutes / 60)}h {Math.floor(diffInMinutes % 60)}m
                </p>
              )}
            </div>
          )}
        </div>

        {isCallStarted ? (
          <div className="provider-call-controls">
            <button className="provider-control-btn provider-end-call-btn" onClick={handleEndCall} aria-label="Leave call">
              Leave
            </button>
          </div>
        ) : (
          <div className="provider-pre-call-section">
            <button
              className="provider-start-call-btn"
              onClick={handleStartCall}
              disabled={isLoading || !isSessionActive}
              style={{ opacity: isSessionActive ? 1 : 0.5, cursor: isSessionActive ? 'pointer' : 'not-allowed' }}
            >
              {isLoading ? 'Starting Call...' : isSessionActive ? 'Start Session' : 'Session Not Yet Active'}
            </button>
          </div>
        )}

        <div className="provider-session-notes-section">
          <h2 className="provider-notes-title">Session Notes</h2>
          <textarea
            className="provider-notes-textarea"
            placeholder="Take notes during the session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="6"
          />
        </div>
      </div>
    </div>
  )
}

export default ProviderActiveSession

