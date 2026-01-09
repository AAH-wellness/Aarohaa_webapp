import React, { useEffect, useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import './LoginSuccess.css'

const LoginSuccess = ({ onAnimationComplete }) => {
  const [animationError, setAnimationError] = useState(false)

  useEffect(() => {
    // Wait for animation to complete (adjust timing based on your animation duration)
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete()
      }
    }, 2500) // Adjust this time based on your animation duration

    return () => clearTimeout(timer)
  }, [onAnimationComplete])

  return (
    <div className="login-success-overlay">
      <div className="login-success-content">
        {animationError ? (
          <div className="login-success-fallback">
            <div className="success-checkmark">✓</div>
            <p className="success-message">Login Successful!</p>
          </div>
        ) : (
          <DotLottieReact
            src="https://lottie.host/1edd2824-6ed1-4491-9610-85f73b24973d/bommfZSwAA.lottie"
            loop={false}
            autoplay
            onError={() => {
              console.warn('Lottie animation failed to load, showing fallback')
              setAnimationError(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default LoginSuccess



