import React, { useState, useEffect, useRef } from 'react'
import './ProviderActiveSession.css'
import { apiClient, API_CONFIG } from '../services'

const ProviderActiveSession = ({ selectedAppointment }) => {
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeAppointment, setActiveAppointment] = useState(null)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    // If selectedAppointment is passed, use it directly
    if (selectedAppointment) {
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
        
        // Find the next active/upcoming appointment
        const activeAppt = bookings.find(booking => {
          const aptDate = new Date(booking.appointmentDate)
          const diffInMinutes = (aptDate - now) / (1000 * 60)
          // Active if within 30 minutes before or after start time
          return diffInMinutes >= -30 && diffInMinutes <= 120 && 
                 booking.status !== 'cancelled' && booking.status !== 'completed'
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
    if (isCallStarted && streamRef.current) {
      const timer = setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          const video = videoRef.current
          video.srcObject = streamRef.current
          
          const playVideo = () => {
            video.play()
              .then(() => {
                console.log('Video is playing successfully')
              })
              .catch((error) => {
                console.error('Error playing video:', error)
              })
          }
          
          if (video.readyState >= 2) {
            playVideo()
          } else {
            video.onloadedmetadata = playVideo
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    }

    if (!isCallStarted && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isCallStarted])

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true,
      })

      streamRef.current = stream
      setIsCallStarted(true)
      setIsLoading(false)

      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          const video = videoRef.current
          video.srcObject = streamRef.current
          video.muted = false
          
          video.onloadedmetadata = () => {
            video.play()
              .then(() => {
                console.log('Video started playing successfully')
              })
              .catch((error) => {
                console.error('Error playing video:', error)
                alert('Video playback failed. Please try again.')
              })
          }
          
          if (video.readyState >= 2) {
            video.play().catch((error) => {
              console.error('Error playing video:', error)
            })
          }
        }
      }, 200)
    } catch (error) {
      console.error('Error accessing webcam:', error)
      alert('Failed to access webcam. Please ensure you have granted camera and microphone permissions.')
      setIsLoading(false)
    }
  }

  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsCallStarted(false)
      setSessionTime(0)
      setIsMuted(false)
      setIsVideoOff(false)
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
  const isSessionActive = diffInMinutes <= 5 && diffInMinutes >= -30

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

        {isCallStarted ? (
          <>
            <div className="provider-session-info-bar">
              <span>Session Time: {formatTime(sessionTime)}</span>
              <span>|</span>
              <span>Earnings: ${calculateEarnings(sessionTime)}</span>
            </div>

            <div className="provider-video-call-interface">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                className="provider-user-video"
              />
              {isVideoOff && (
                <div className="provider-video-off-overlay">
                  <div className="provider-video-icon">📹</div>
                  <p className="provider-video-status">Video is off</p>
                </div>
              )}
            </div>

            <div className="provider-call-controls">
              <button
                className={`provider-control-btn provider-mic-btn ${isMuted ? 'active' : ''}`}
                onClick={toggleMute}
                aria-label="Toggle microphone"
              >
                🎤
              </button>
              <button
                className={`provider-control-btn provider-video-btn ${isVideoOff ? 'active' : ''}`}
                onClick={toggleVideo}
                aria-label="Toggle video"
              >
                📹
              </button>
              <button
                className="provider-control-btn provider-end-call-btn"
                onClick={handleEndCall}
                aria-label="End call"
              >
                📞
              </button>
            </div>
          </>
        ) : (
          <div className="provider-pre-call-section">
            <div className="provider-video-call-interface provider-pre-call">
              <div className="provider-video-placeholder">
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
            </div>
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

