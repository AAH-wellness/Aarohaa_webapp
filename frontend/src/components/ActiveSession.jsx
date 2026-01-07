import React, { useState, useEffect, useRef } from 'react'
import BookingRequiredModal from './BookingRequiredModal'
import './ActiveSession.css'

const ActiveSession = ({ hasBookedSession, onNavigateToBooking }) => {
  const [showModal, setShowModal] = useState(false)
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeBooking, setActiveBooking] = useState(null)
  const [providerNotes, setProviderNotes] = useState([])
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    // Check for active booking when component mounts
    const checkActiveBooking = () => {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
      const now = new Date()
      
      // Find active booking (scheduled for today/now or in progress)
      const active = appointments.find(apt => {
        const aptDate = new Date(apt.dateTime)
        const diffInHours = (aptDate - now) / (1000 * 60 * 60)
        // Active if appointment is within 1 hour before or 2 hours after scheduled time
        return diffInHours >= -1 && diffInHours <= 2 && apt.status !== 'completed' && apt.status !== 'cancelled'
      })
      
      if (active) {
        setActiveBooking(active)
        setShowModal(false)
        loadProviderNotes(active.id)
      } else {
        setActiveBooking(null)
        setShowModal(true)
      }
    }
    
    checkActiveBooking()
  }, [hasBookedSession])

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

  useEffect(() => {
    // Setup video element when call starts and video element is available
    if (isCallStarted && streamRef.current) {
      // Use a small timeout to ensure video element is in the DOM
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
            // Metadata already loaded
            playVideo()
          } else {
            // Wait for metadata
            video.onloadedmetadata = playVideo
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    }

    // Cleanup video stream when call ends
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true,
      })

      console.log('Stream obtained:', stream)
      console.log('Video tracks:', stream.getVideoTracks())
      
      // Store the stream
      streamRef.current = stream

      // Set call started so video element renders
      setIsCallStarted(true)
      setIsLoading(false)

      // Attach stream to video element after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          const video = videoRef.current
          video.srcObject = streamRef.current
          video.muted = false
          
          // Wait for video metadata to load before playing
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
          
          // Also try playing immediately if metadata is already loaded
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
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      // Mark session as completed
      if (activeBooking) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
        const updatedAppointments = appointments.map(apt => {
          if (apt.id === activeBooking.id) {
            return {
              ...apt,
              status: 'completed',
              sessionDuration: sessionTime,
              completedAt: new Date().toISOString()
            }
          }
          return apt
        })
        localStorage.setItem('appointments', JSON.stringify(updatedAppointments))
      }

      setIsCallStarted(false)
      setSessionTime(0)
      setIsMuted(false)
      setIsVideoOff(false)
      
      // Show completion message
      alert('Session completed! You can access provider notes in this section.')
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

  // Show modal if no active booking
  if (!activeBooking && showModal) {
    return (
      <div className="active-session">
        <BookingRequiredModal
          onClose={() => setShowModal(false)}
          onNavigateToBooking={onNavigateToBooking}
        />
      </div>
    )
  }

  // Don't show session content if no active booking
  if (!activeBooking) {
    return null
  }

  const providerName = activeBooking.providerName || 'Your Provider'
  const sessionDate = new Date(activeBooking.dateTime).toLocaleString()

  return (
    <div className="active-session">
      <div className="session-container">
        <div className="session-header">
          <h1 className="session-title">Video Session with {providerName}</h1>
          <p className="session-scheduled-time">Scheduled: {sessionDate}</p>
        </div>

        {isCallStarted ? (
          <>
            <div className="session-info-bar">
              <span>Session Time: {formatTime(sessionTime)}</span>
              <span>|</span>
              <span>Cost: ${calculateCost(sessionTime)}</span>
            </div>

            <div className="video-call-interface">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                className="user-video"
              />
              {isVideoOff && (
                <div className="video-off-overlay">
                  <div className="video-icon">📹</div>
                  <p className="video-status">Video is off</p>
                </div>
              )}
            </div>

            <div className="call-controls">
              <button
                className={`control-btn mic-btn ${isMuted ? 'active' : ''}`}
                onClick={toggleMute}
                aria-label="Toggle microphone"
              >
                🎤
              </button>
              <button
                className={`control-btn video-btn ${isVideoOff ? 'active' : ''}`}
                onClick={toggleVideo}
                aria-label="Toggle video"
              >
                📹
              </button>
              <button
                className="control-btn end-call-btn"
                onClick={handleEndCall}
                aria-label="End call"
              >
                📞
              </button>
            </div>
          </>
        ) : (
          <div className="pre-call-section">
            <div className="video-call-interface pre-call">
              <div className="video-placeholder">
                <div className="video-icon">📹</div>
                <p className="video-status">
                  Ready to start your session with<br />
                  {providerName}
                </p>
              </div>
            </div>
            <button
              className="start-call-btn"
              onClick={handleStartCall}
              disabled={isLoading}
            >
              {isLoading ? 'Starting Call...' : 'Start Call'}
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
                    <span className="note-author">{note.providerName}</span>
                    <span className="note-time">{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="note-content">{note.content}</div>
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
