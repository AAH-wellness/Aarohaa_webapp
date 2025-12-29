import React, { useEffect } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import './LoginSuccess.css'

const LoginSuccess = ({ onAnimationComplete }) => {
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
        <DotLottieReact
          src="https://lottie.host/1edd2824-6ed1-4491-9610-85f73b24973d/bommfZSwAA.lottie"
          loop={false}
          autoplay
        />
      </div>
    </div>
  )
}

export default LoginSuccess



