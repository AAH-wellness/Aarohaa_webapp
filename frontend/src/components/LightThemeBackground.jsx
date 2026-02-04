import React, { useEffect, useRef } from 'react'
import './LightThemeBackground.css'

/**
 * Premium light-theme background: morphing gradient blobs, soft orbs, flowing rays.
 * No floating particles. Distinct from dark theme. High-quality, smooth animations.
 */
const LightThemeBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId = null
    let time = 0

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()
    window.addEventListener('resize', setSize)

    // Premium palette: soft greens, cream, gold, white
    const blobColors = [
      { r: 240, g: 249, b: 244, a: 0.5 },   // mint
      { r: 232, g: 245, b: 233, a: 0.45 }, // soft green
      { r: 255, g: 254, b: 247, a: 0.5 },  // cream
      { r: 245, g: 230, b: 200, a: 0.35 }, // soft gold
      { r: 220, g: 237, b: 230, a: 0.4 },  // sage
    ]

    const blobs = blobColors.map((_, i) => ({
      x: 0.2 + (i * 0.15) + Math.sin(i) * 0.1,
      y: 0.3 + (i * 0.1) + Math.cos(i * 0.7) * 0.1,
      radius: 0.25 + (i % 3) * 0.15,
      phaseX: i * 1.2,
      phaseY: i * 0.8,
      speedX: 0.15 + (i % 5) * 0.05,
      speedY: 0.12 + (i % 4) * 0.04,
      ...blobColors[i],
    }))

    const drawBlobs = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      blobs.forEach((b, i) => {
        const x = w * (b.x + Math.sin(time * b.speedX + b.phaseX) * 0.08)
        const y = h * (b.y + Math.cos(time * b.speedY + b.phaseY) * 0.06)
        const r = w * b.radius * (0.9 + Math.sin(time * 0.3 + i) * 0.1)

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(0, `rgba(${b.r},${b.g},${b.b},${b.a})`)
        gradient.addColorStop(0.5, `rgba(${b.r},${b.g},${b.b},${b.a * 0.5})`)
        gradient.addColorStop(1, 'rgba(255,255,255,0)')

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })
    }

    const loop = () => {
      time += 0.012
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)
      drawBlobs()
      animationId = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', setSize)
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="light-theme-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="light-theme-bg-canvas" />
      <div className="light-theme-bg-shapes">
        <div className="light-theme-bg-orb light-theme-bg-orb-1" />
        <div className="light-theme-bg-orb light-theme-bg-orb-2" />
        <div className="light-theme-bg-orb light-theme-bg-orb-3" />
        <div className="light-theme-bg-orb light-theme-bg-orb-4" />
      </div>
      <svg className="light-theme-bg-rays" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="light-ray-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(14,72,38,0.03)" />
            <stop offset="50%" stopColor="rgba(14,72,38,0.01)" />
            <stop offset="100%" stopColor="rgba(14,72,38,0)" />
          </linearGradient>
        </defs>
        {[...Array(10)].map((_, i) => (
          <path
            key={i}
            className="light-theme-bg-ray"
            fill="none"
            stroke="url(#light-ray-grad)"
            strokeWidth="0.5"
            strokeLinecap="round"
            d={`M 50 50 L ${50 + Math.cos((i / 10) * Math.PI * 2) * 80} ${50 + Math.sin((i / 10) * Math.PI * 2) * 80}`}
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </svg>
    </div>
  )
}

export default LightThemeBackground
