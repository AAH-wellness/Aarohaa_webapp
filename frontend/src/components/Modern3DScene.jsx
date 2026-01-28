import React, { useEffect, useRef } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import * as THREE from 'three'
import './Modern3DScene.css'

const Modern3DScene = ({ variant = 'panel' }) => {
  const containerRef = useRef(null)
  const animationIdRef = useRef(null)
  const isBackground = variant === 'background'
  const lottieSrc = 'https://lottie.host/18c3a0ee-5865-4a7a-8afd-751bf9463c64/HoxcAwToVM.lottie'

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    // Camera position
    camera.position.z = 5

    // Create premium geometric shapes
    const group = new THREE.Group()

    // Floating orbs with premium materials
    const createOrb = (radius, color, position, speed) => {
      const geometry = new THREE.SphereGeometry(radius, 64, 64)
      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: isBackground ? 0.7 : 0.4,
        transparent: true,
        opacity: isBackground ? 0.95 : 0.85
      })
      const orb = new THREE.Mesh(geometry, material)
      orb.position.set(...position)
      orb.userData = { speed, originalY: position[1], originalX: position[0] }
      return orb
    }

    // Create multiple orbs with brand colors
    const orbScale = isBackground ? 1.2 : 1
    const orbs = [
      createOrb(0.35 * orbScale, 0x0e4826, [-1.8, 0.6, 0], 0.5),
      createOrb(0.28 * orbScale, 0x16a34a, [1.8, -0.6, 0], 0.7),
      createOrb(0.22 * orbScale, 0x22c55e, [0, 1.2, -1.2], 0.6),
      createOrb(0.32 * orbScale, 0x0e4826, [0, -1.2, 1.2], 0.4)
    ]

    orbs.forEach(orb => group.add(orb))

    // Premium particle system
    const particleGeometry = new THREE.BufferGeometry()
    const particleCount = isBackground ? 700 : 400
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 12
      positions[i3 + 1] = (Math.random() - 0.5) * 12
      positions[i3 + 2] = (Math.random() - 0.5) * 12

      const color = new THREE.Color()
      const hue = Math.random() * 0.25 + 0.12 // Green hues
      color.setHSL(hue, 0.9, 0.65)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      const sizeBase = isBackground ? 0.045 : 0.03
      const sizeMin = isBackground ? 0.02 : 0.015
      sizes[i] = Math.random() * sizeBase + sizeMin
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const createCircleTexture = () => {
      const size = 64
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      const center = size / 2
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.6)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(center, center, center, 0, Math.PI * 2)
      ctx.fill()
      return new THREE.CanvasTexture(canvas)
    }

    const circleTexture = createCircleTexture()
    const particleMaterial = new THREE.PointsMaterial({
      size: isBackground ? 0.045 : 0.03,
      map: circleTexture || undefined,
      vertexColors: true,
      transparent: true,
      opacity: isBackground ? 0.95 : 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.001
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    group.add(particles)

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // Premium directional lights
    const light1 = new THREE.DirectionalLight(0x0e4826, 1.2)
    light1.position.set(5, 5, 5)
    scene.add(light1)

    const light2 = new THREE.DirectionalLight(0x16a34a, 1.0)
    light2.position.set(-5, -5, -5)
    scene.add(light2)

    // Point lights for glow effect
    const pointLight1 = new THREE.PointLight(0x0e4826, 1.5, 12)
    pointLight1.position.set(2, 2, 2)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x16a34a, 1.2, 12)
    pointLight2.position.set(-2, -2, -2)
    scene.add(pointLight2)

    scene.add(group)

    // Animation
    const clock = new THREE.Clock()
    let time = 0

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      time = clock.getElapsedTime()

      // Animate orbs with smooth floating
      orbs.forEach((orb) => {
        orb.rotation.x += 0.008
        orb.rotation.y += 0.012
        orb.position.y = orb.userData.originalY + Math.sin(time * orb.userData.speed) * 0.4
        orb.position.x = orb.userData.originalX + Math.cos(time * orb.userData.speed * 0.5) * 0.2
        orb.position.z += Math.sin(time * orb.userData.speed * 0.3) * 0.1
      })

      // Rotate particles smoothly
      particles.rotation.x += 0.0003
      particles.rotation.y += 0.0008

      // Animate particles with wave effect
      const particlePositions = particles.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        particlePositions[i3 + 1] += Math.sin(time * 0.5 + i * 0.01) * 0.0002
      }
      particles.geometry.attributes.position.needsUpdate = true

      // Slow group rotation
      group.rotation.y += 0.0015

      // Subtle camera movement for depth
      camera.position.x = Math.sin(time * 0.15) * 0.4
      camera.position.y = Math.cos(time * 0.12) * 0.25
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
  }, [])

  return (
    <div className={`modern-3d-scene-container ${isBackground ? 'modern-3d-scene-background' : ''}`}>
      <div ref={containerRef} className="modern-3d-canvas" />
      {isBackground && (
        <div className="modern-3d-lottie-field" aria-hidden="true">
          <div className="modern-3d-lottie modern-3d-lottie--one">
            <DotLottieReact src={lottieSrc} loop autoplay />
          </div>
          <div className="modern-3d-lottie modern-3d-lottie--two">
            <DotLottieReact src={lottieSrc} loop autoplay />
          </div>
          <div className="modern-3d-lottie modern-3d-lottie--three">
            <DotLottieReact src={lottieSrc} loop autoplay />
          </div>
          <div className="modern-3d-lottie modern-3d-lottie--four">
            <DotLottieReact src={lottieSrc} loop autoplay />
          </div>
          <div className="modern-3d-lottie modern-3d-lottie--five">
            <DotLottieReact src={lottieSrc} loop autoplay />
          </div>
          <div className="modern-3d-lottie modern-3d-lottie--six">
            <DotLottieReact src={lottieSrc} loop autoplay />
          </div>
        </div>
      )}
      {!isBackground && (
        <div className="wellness-content-overlay">
          <div className="wellness-content">
            <h2 className="wellness-title">Aarohaa Wellness</h2>
            <p className="wellness-subtitle">Your journey to holistic health and wellness</p>
            <div className="wellness-features">
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span>Personalized Care</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌱</span>
                <span>Holistic Approach</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💚</span>
                <span>Expert Providers</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Modern3DScene
