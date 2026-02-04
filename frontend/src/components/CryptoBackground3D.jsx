import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './CryptoBackground3D.css'

/**
 * Three.js crypto-themed background: floating orbs, particles, hexagons.
 * Uses electric blue, neon pink, cyan, gold palette. Dark theme only.
 */
const CryptoBackground3D = () => {
  const containerRef = useRef(null)
  const animationIdRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      70,
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

    camera.position.z = 8

    const group = new THREE.Group()

    // Crypto color palette
    const COLORS = {
      blue: 0x4fc3f7,
      cyan: 0x00d4ff,
      pink: 0xff6b9d,
      gold: 0xf0b429,
      neon: 0x39ff14,
      purple: 0x9c6ade
    }

    // Floating orbs (metallic, emissive)
    const createOrb = (radius, color, position, speed) => {
      const geometry = new THREE.SphereGeometry(radius, 48, 48)
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.85,
        roughness: 0.12,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.88
      })
      const orb = new THREE.Mesh(geometry, material)
      orb.position.set(...position)
      orb.userData = { speed, originalY: position[1], originalX: position[0] }
      return orb
    }

    const orbs = [
      createOrb(0.4, COLORS.blue, [-2.2, 0.8, -1], 0.5),
      createOrb(0.3, COLORS.pink, [2, -0.7, 0], 0.7),
      createOrb(0.25, COLORS.cyan, [0, 1.4, -1.5], 0.6),
      createOrb(0.35, COLORS.gold, [0, -1.2, 1], 0.4),
      createOrb(0.2, COLORS.neon, [1.6, 1, -0.5], 0.8),
      createOrb(0.28, COLORS.purple, [-1.5, -0.9, 0.5], 0.55)
    ]
    orbs.forEach(orb => group.add(orb))

    // Rotating hexagon rings (crypto/blockchain vibe)
    const hexGeom = new THREE.RingGeometry(0.6, 0.85, 6)
    const hexMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    })
    const hex1 = new THREE.Mesh(hexGeom, hexMaterial.clone())
    hex1.position.set(-1.5, 0.5, -2)
    hex1.userData = { speed: 0.3 }
    group.add(hex1)

    const hex2 = new THREE.Mesh(hexGeom, hexMaterial.clone())
    hex2.position.set(2, -0.5, -1.5)
    hex2.rotation.z = Math.PI / 6
    hex2.userData = { speed: -0.25 }
    group.add(hex2)

    // Particle field (crypto dust)
    const particleCount = 600
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const colorList = [COLORS.blue, COLORS.cyan, COLORS.pink, COLORS.gold, COLORS.neon]
    const c = new THREE.Color()

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16
      c.setHex(colorList[i % colorList.length])
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
      sizes[i] = Math.random() * 0.04 + 0.01
    }

    const particleGeometry = new THREE.BufferGeometry()
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
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(0.6, 'rgba(255,255,255,0.6)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(center, center, center, 0, Math.PI * 2)
      ctx.fill()
      return new THREE.CanvasTexture(canvas)
    }

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      map: createCircleTexture() || undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.001
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    group.add(particles)

    scene.add(group)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(COLORS.blue, 0.8)
    dirLight1.position.set(5, 5, 5)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(COLORS.pink, 0.6)
    dirLight2.position.set(-5, -5, 5)
    scene.add(dirLight2)

    const pointLight = new THREE.PointLight(COLORS.cyan, 0.5, 20)
    pointLight.position.set(0, 0, 5)
    scene.add(pointLight)

    const clock = new THREE.Clock()
    let time = 0

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      time = clock.getElapsedTime()

      orbs.forEach(orb => {
        orb.rotation.x += 0.01
        orb.rotation.y += 0.015
        orb.position.y = orb.userData.originalY + Math.sin(time * orb.userData.speed) * 0.35
        orb.position.x = orb.userData.originalX + Math.cos(time * orb.userData.speed * 0.6) * 0.25
      })

      hex1.rotation.z += 0.01 * hex1.userData.speed
      hex2.rotation.z += 0.01 * hex2.userData.speed

      particles.rotation.x += 0.0002
      particles.rotation.y += 0.0005

      const pos = particles.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += Math.sin(time * 0.4 + i * 0.02) * 0.0003
      }
      particles.geometry.attributes.position.needsUpdate = true

      group.rotation.y += 0.0008
      camera.position.x = Math.sin(time * 0.1) * 0.3
      camera.position.y = Math.cos(time * 0.08) * 0.2
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
    }
  }, [])

  return (
    <div className="crypto-bg-3d" aria-hidden="true">
      <div ref={containerRef} className="crypto-bg-canvas" />
    </div>
  )
}

export default CryptoBackground3D
