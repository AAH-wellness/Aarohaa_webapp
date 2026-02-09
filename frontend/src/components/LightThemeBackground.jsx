import React, { useEffect, useRef } from 'react'
import './LightThemeBackground.css'

/**
 * Dragon-flight path: sinuous curve (x,y) from path parameter s.
 * Two harmonics so the trail weaves like a dragon flying through the sky.
 */
function dragonPath(s, config) {
  const { startX, startY, scaleX, scaleY, ampX, ampY, freqX, freqY, phaseX, phaseY, ampX2, ampY2, phaseX2, phaseY2 } = config
  const wave1X = ampX * Math.sin(s * freqX + phaseX)
  const wave2X = (ampX2 || 0) * Math.sin(s * freqX * 1.7 + (phaseX2 ?? 0))
  const wave1Y = ampY * Math.sin(s * freqY + phaseY)
  const wave2Y = (ampY2 || 0) * Math.sin(s * freqY * 1.5 + (phaseY2 ?? 0))
  const x = startX + s * scaleX + wave1X + wave2X
  const y = startY + s * scaleY + wave1Y + wave2Y
  return { x, y }
}

/**
 * Premium light-theme background: morphing blobs, orbs, rays, and molecular particles
 * flowing along dragon-flight (sinuous) paths.
 */
const LightThemeBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId = null
    let time = 0
    let w = window.innerWidth
    let h = window.innerHeight

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()
    window.addEventListener('resize', setSize)

    // Molecular particle groups: each group flows along a dragon-flight path (sinuous, winding)
    const STREAM_COUNT = 7
    const PARTICLES_PER_STREAM = 22
    const particleStreams = []
    for (let g = 0; g < STREAM_COUNT; g++) {
      const startX = Math.random() * w
      const startY = Math.random() * h
      const angle = (Math.PI * 0.2) + Math.random() * Math.PI * 0.6
      const scaleX = Math.cos(angle) * (w * 0.0018)
      const scaleY = -Math.sin(angle) * (h * 0.0015)
      particleStreams.push({
        pathConfig: {
          startX,
          startY,
          scaleX,
          scaleY,
          ampX: w * (0.12 + Math.random() * 0.14),
          ampY: h * (0.1 + Math.random() * 0.12),
          freqX: 0.045 + Math.random() * 0.035,
          freqY: 0.04 + Math.random() * 0.04,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          ampX2: w * (0.04 + Math.random() * 0.06),
          ampY2: h * (0.035 + Math.random() * 0.05),
          phaseX2: Math.random() * Math.PI * 2,
          phaseY2: Math.random() * Math.PI * 2,
        },
        speed: 0.35 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
        particles: Array.from({ length: PARTICLES_PER_STREAM }, (_, i) => ({
          offset: -i * 10 - Math.random() * 6,
          size: 1.2 + Math.random() * 1.4,
          opacity: 0.22 + Math.random() * 0.25,
        })),
        color: [
          [14, 72, 38],
          [26, 107, 58],
          [48, 161, 78],
          [240, 249, 244],
          [232, 245, 233],
        ][g % 5],
      })
    }

    const drawParticles = () => {
      particleStreams.forEach((stream) => {
        const s0 = time * stream.speed + stream.phase
        stream.particles.forEach((p) => {
          const s = s0 + p.offset
          const { x, y } = dragonPath(s, stream.pathConfig)
          if (x >= -20 && x <= w + 20 && y >= -20 && y <= h + 20) {
            ctx.beginPath()
            ctx.arc(x, y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${stream.color[0]},${stream.color[1]},${stream.color[2]},${p.opacity})`
            ctx.fill()
          }
        })
      })
    }

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
      ctx.clearRect(0, 0, w, h)
      drawBlobs()
      drawParticles()
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
