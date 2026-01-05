import React, { useState, useEffect, useRef } from 'react'
import BookingRequiredModal from './BookingRequiredModal'
import './ActiveSession.css'

const ActiveSession = ({ hasBookedSession, onNavigateToBooking }) => {
  const [showModal, setShowModal] = useState(false)
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    // Check if session is booked when component mounts or when hasBookedSession changes
    if (!hasBookedSession) {
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [hasBookedSession])

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
    // Assuming $3 per minute for Dr. Maya Patel
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

  // Show modal if session is not booked
  if (!hasBookedSession && showModal) {
    return (
      <div className="active-session">
        <BookingRequiredModal
          onClose={() => setShowModal(false)}
          onNavigateToBooking={onNavigateToBooking}
        />
      </div>
    )
  }

  // Don't show session content if not booked
  if (!hasBookedSession) {
    return null
  }

  return (
    <div className="active-session">
      <div className="session-container">
        <h1 className="session-title">Video Session with Dr. Maya Patel</h1>

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
                  Dr. Maya Patel
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
          <h2 className="notes-title">Session Notes</h2>
          <textarea
            className="notes-textarea"
            placeholder="Take notes during your session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="6"
          />
        </div>
      </div>
    </div>
  )
}

export default ActiveSession
