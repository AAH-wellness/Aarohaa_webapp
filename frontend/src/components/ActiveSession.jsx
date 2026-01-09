import React, { useState, useEffect, useRef } from 'react'
import BookingRequiredModal from './BookingRequiredModal'
import { userService, apiClient, API_CONFIG } from '../services'
import './ActiveSession.css'

const ActiveSession = ({ hasBookedSession, onNavigateToBooking, onActiveSessionChange, selectedAppointment }) => {
  const [showModal, setShowModal] = useState(false)
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeBooking, setActiveBooking] = useState(null)
  const [providerNotes, setProviderNotes] = useState([])
  const [currentUserName, setCurrentUserName] = useState('')
  const [peerConnection, setPeerConnection] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const videoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const streamRef = useRef(null)
  const localStreamRef = useRef(null)

  useEffect(() => {
    // If selectedAppointment is passed, use it directly
    if (selectedAppointment) {
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
      
      // Get current user name
      userService.getProfile().then(profile => {
        if (profile.user && profile.user.name) {
          setCurrentUserName(profile.user.name)
        }
      })
      
      // Check if it's time to auto-start (within 5 minutes of scheduled time)
      const appointmentTime = new Date(selectedAppointment.dateTime)
      const now = new Date()
      const diffInMinutes = (appointmentTime - now) / (1000 * 60)
      
      if (diffInMinutes <= 5 && diffInMinutes >= -30) {
        // Auto-start video if within 5 minutes before or 30 minutes after
        setTimeout(() => {
          handleStartCall()
        }, Math.max(0, diffInMinutes * 60 * 1000))
      }
      
      if (onActiveSessionChange) {
        onActiveSessionChange(activeBookingData)
      }
      return
    }
    
    // Otherwise, check for active booking from backend API
    const checkActiveBooking = async () => {
      try {
        // Get current user ID
        const profile = await userService.getProfile()
        if (!profile.user || !profile.user.id) {
          setActiveBooking(null)
          setShowModal(true)
          if (onActiveSessionChange) {
            onActiveSessionChange(null)
          }
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
        const upcomingBookings = bookings
          .filter(booking => {
            const aptDate = new Date(booking.appointmentDate)
            return booking.status !== 'completed' && 
                   booking.status !== 'cancelled' &&
                   aptDate >= now // Only future or current bookings
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
          // No upcoming bookings - show modal
          setActiveBooking(null)
          setShowModal(true)
          if (onActiveSessionChange) {
            onActiveSessionChange(null)
          }
        }
      } catch (error) {
        console.error('Error checking active booking:', error)
        setActiveBooking(null)
        setShowModal(true)
        if (onActiveSessionChange) {
          onActiveSessionChange(null)
        }
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

  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      if (peerConnection) {
        peerConnection.close()
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [peerConnection])

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
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      })

      console.log('Local stream obtained:', stream)
      localStreamRef.current = stream
      streamRef.current = stream

      // Initialize WebRTC peer connection
      await initializeWebRTC(stream)

      // Set call started so video element renders
      setIsCallStarted(true)
      setIsLoading(false)

      // Attach local stream to video element
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          const video = videoRef.current
          video.srcObject = streamRef.current
          video.muted = true // Mute local video to avoid echo
          
          video.onloadedmetadata = () => {
            video.play()
              .then(() => {
                console.log('Local video started playing successfully')
              })
              .catch((error) => {
                console.error('Error playing local video:', error)
              })
          }
          
          if (video.readyState >= 2) {
            video.play().catch((error) => {
              console.error('Error playing local video:', error)
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

  const initializeWebRTC = async (localStream) => {
    try {
      // Create RTCPeerConnection with STUN servers for NAT traversal
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }

      const pc = new RTCPeerConnection(configuration)
      setPeerConnection(pc)

      // Add local stream tracks to peer connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
        console.log('Added local track:', track.kind)
      })

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind)
        const remoteStream = event.streams[0]
        setRemoteStream(remoteStream)
        
        // Attach remote stream to remote video element
        setTimeout(() => {
          if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
            remoteVideoRef.current.play().catch(err => {
              console.error('Error playing remote video:', err)
            })
          }
        }, 100)
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate)
          // In production, send this to signaling server
          // For now, store in localStorage for demo
          if (activeBooking) {
            const candidates = JSON.parse(localStorage.getItem(`ice_candidates_${activeBooking.id}`) || '[]')
            candidates.push(event.candidate)
            localStorage.setItem(`ice_candidates_${activeBooking.id}`, JSON.stringify(candidates))
          }
        }
      }

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          console.log('WebRTC connection established!')
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.warn('WebRTC connection lost')
        }
      }

      // Create offer (user initiates connection)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log('Created offer:', offer)

      // In production, send offer to signaling server
      // For now, store in localStorage
      if (activeBooking) {
        localStorage.setItem(`webrtc_offer_${activeBooking.id}`, JSON.stringify(offer))
      }

      // Simulate receiving answer (in production, this comes from signaling server)
      // For demo purposes, we'll create a simple peer connection
      // In real implementation, provider would receive offer and create answer

    } catch (error) {
      console.error('Error initializing WebRTC:', error)
      // Continue with local video even if WebRTC fails
    }
  }

  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      // Close peer connection
      if (peerConnection) {
        peerConnection.close()
        setPeerConnection(null)
      }

      // Stop all local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Clear video elements
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }

      setRemoteStream(null)

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
      alert('Session completed! You can access session notes in the chat below.')
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

        {isCallStarted ? (
          <>
            <div className="session-info-bar">
              <span>Session Time: {formatTime(sessionTime)}</span>
              <span>|</span>
              <span>Cost: ${calculateCost(sessionTime)}</span>
            </div>

            <div className="video-call-interface">
              <div className="video-grid">
                {/* Remote video (provider) */}
                <div className="video-container remote-video">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="remote-video-element"
                    />
                  ) : (
                    <div className="video-placeholder">
                      <div className="video-icon">👤</div>
                      <p className="video-status">Waiting for {activeBooking?.providerName || 'provider'} to join...</p>
                    </div>
                  )}
                </div>
                
                {/* Local video (user) - Picture in picture */}
                <div className="video-container local-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={true}
                    className="local-video-element"
                  />
                  {isVideoOff && (
                    <div className="video-off-overlay">
                      <div className="video-icon">📹</div>
                      <p className="video-status">Your video is off</p>
                    </div>
                  )}
                </div>
              </div>
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
        ) : isSessionUpcoming ? (
          <div className="pre-call-section">
            <div className="video-call-interface pre-call">
              <div className="video-placeholder">
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
              </div>
            </div>
            <button
              className="start-call-btn"
              onClick={handleStartCall}
              disabled={true}
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              Session Not Yet Active
            </button>
          </div>
        ) : isSessionPast ? (
          <div className="pre-call-section">
            <div className="video-call-interface pre-call">
              <div className="video-placeholder">
                <div className="video-icon">📋</div>
                <p className="video-status">
                  Session with {providerName} has ended<br />
                  <br />
                  You can view session notes below
                </p>
              </div>
            </div>
          </div>
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
