import React, { useState, useEffect, useRef } from 'react'
import appointmentService from '../services/appointmentService'
import './ProviderActiveSession.css'

const ProviderActiveSession = () => {
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [patientInfo, setPatientInfo] = useState({
    name: 'Loading...',
    sessionType: 'Video Consultation',
  })
  const [currentBooking, setCurrentBooking] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    // Fetch provider's upcoming bookings on mount
    const fetchProviderBookings = async () => {
      setIsLoadingBookings(true)
      try {
        const bookings = await appointmentService.getProviderAppointments()
        if (bookings && bookings.length > 0) {
          // Get the next upcoming booking
          const now = new Date()
          const upcoming = bookings
            .filter(booking => {
              const appointmentDate = new Date(booking.appointmentDate || booking.appointment_date)
              return appointmentDate > now && booking.status === 'scheduled'
            })
            .sort((a, b) => {
              const dateA = new Date(a.appointmentDate || a.appointment_date)
              const dateB = new Date(b.appointmentDate || b.appointment_date)
              return dateA - dateB
            })
          
          if (upcoming.length > 0) {
            const booking = upcoming[0]
            setCurrentBooking(booking)
            setPatientInfo({
              name: booking.userName || booking.user_name || 'Patient',
              sessionType: booking.sessionType || booking.session_type || 'Video Consultation',
            })
          } else {
            setPatientInfo({
              name: 'No upcoming sessions',
              sessionType: 'N/A',
            })
          }
        } else {
          setPatientInfo({
            name: 'No upcoming sessions',
            sessionType: 'N/A',
          })
        }
      } catch (error) {
        console.error('Error fetching provider bookings:', error)
        setPatientInfo({
          name: 'Error loading patient info',
          sessionType: 'N/A',
        })
      } finally {
        setIsLoadingBookings(false)
      }
    }

    fetchProviderBookings()
  }, [])

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

  return (
    <div className="provider-active-session">
      <div className="provider-session-container">
        <div className="provider-session-header">
          <h1 className="provider-session-title">Active Session</h1>
          {!isLoadingBookings && (
            <div className="provider-patient-info">
              <span className="provider-patient-name">Patient: {patientInfo.name}</span>
              <span className="provider-session-type">{patientInfo.sessionType}</span>
            </div>
          )}
          {isLoadingBookings && (
            <div className="provider-patient-info">
              <span className="provider-patient-name">Loading patient info...</span>
            </div>
          )}
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
                  {patientInfo.name !== 'No upcoming sessions' && patientInfo.name !== 'Error loading patient info' ? (
                    <>
                      Ready to start session with<br />
                      {patientInfo.name}
                    </>
                  ) : (
                    patientInfo.name
                  )}
                </p>
              </div>
            </div>
            <button
              className="provider-start-call-btn"
              onClick={handleStartCall}
              disabled={isLoading}
            >
              {isLoading ? 'Starting Call...' : 'Start Session'}
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

