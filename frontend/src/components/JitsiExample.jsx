/**
 * Example: Jitsi Meet Integration (FREE Alternative to Daily.co)
 * 
 * This shows two approaches:
 * 1. Simple iframe embed (easiest, no dependencies)
 * 2. Jitsi API (more control, requires @jitsi/react-sdk)
 */

import React, { useState, useEffect, useRef } from 'react'

// APPROACH 1: Simple Iframe Embed (Recommended - No dependencies!)
const JitsiIframeEmbed = ({ roomUrl, userName, onLeave }) => {
  const iframeRef = useRef(null)

  useEffect(() => {
    // Jitsi automatically handles the call
    // No additional setup needed!
    return () => {
      // Cleanup if needed
    }
  }, [roomUrl])

  return (
    <iframe
      ref={iframeRef}
      src={roomUrl}
      allow="camera; microphone; fullscreen; speaker; display-capture"
      style={{
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '16px',
      }}
      title="Video Call"
    />
  )
}

// APPROACH 2: Jitsi API (More control - requires npm install @jitsi/react-sdk)
// Uncomment and install: npm install @jitsi/react-sdk
/*
import { JitsiMeeting } from '@jitsi/react-sdk'

const JitsiAPIControl = ({ roomName, userName, onLeave }) => {
  return (
    <JitsiMeeting
      domain="meet.jit.si"
      roomName={roomName}
      userInfo={{
        displayName: userName,
      }}
      configOverwrite={{
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      }}
      interfaceConfigOverwrite={{
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone',
        ],
      }}
      onApiReady={(api) => {
        // Handle API ready
        api.addEventListener('videoConferenceLeft', () => {
          onLeave?.()
        })
      }}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.height = '100%'
        iframeRef.style.width = '100%'
        iframeRef.style.border = '0'
        iframeRef.style.borderRadius = '16px'
      }}
    />
  )
}
*/

// Example Usage Component
const JitsiVideoCall = ({ roomUrl, userName, isProvider, onCallEnd }) => {
  const [isCallStarted, setIsCallStarted] = useState(false)

  const handleStartCall = () => {
    setIsCallStarted(true)
  }

  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      setIsCallStarted(false)
      onCallEnd?.()
    }
  }

  return (
    <div style={{ height: '520px', position: 'relative' }}>
      {isCallStarted ? (
        <>
          <JitsiIframeEmbed
            roomUrl={roomUrl}
            userName={userName}
            onLeave={handleEndCall}
          />
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
            <button
              onClick={handleEndCall}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              End Call
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: '#f5f5f5',
            borderRadius: '16px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📹</div>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Ready to start video session
          </p>
          <button
            onClick={handleStartCall}
            style={{
              padding: '12px 32px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Start Call
          </button>
        </div>
      )}
    </div>
  )
}

export default JitsiVideoCall
