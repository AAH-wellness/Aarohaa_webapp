import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './AppointmentsBox3D.css'

/**
 * Renders the appointments container as a physical 3D card/box (Three.js).
 * Light theme only: extruded rounded-rectangle with depth, lighting, and subtle tilt.
 */
function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  const w = width
  const h = height
  const r = radius
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}

const AppointmentsBox3D = () => {
  const containerRef = useRef(null)
  const animationIdRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const aspect = width / height

    const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000)
    camera.position.set(0, 0, 2.8)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)

    // Card dimensions in world units (aspect matches container)
    const cardWidth = 1.6
    const cardHeight = cardWidth / aspect
    const depth = 0.06
    const cornerRadius = 0.08

    const shape = roundedRectShape(cardWidth, cardHeight, cornerRadius)
    const extrudeSettings = {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
    }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.center()

    const cardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.38,
      metalness: 0.06,
      flatShading: false,
    })
    const card = new THREE.Mesh(geometry, cardMaterial)
    card.rotation.x = -0.12
    card.rotation.y = 0.02
    card.castShadow = true
    card.receiveShadow = true
    scene.add(card)

    const ambient = new THREE.AmbientLight(0xffffff, 0.72)
    scene.add(ambient)
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.6)
    dir1.position.set(3, 4, 5)
    dir1.castShadow = true
    scene.add(dir1)
    const dir2 = new THREE.DirectionalLight(0xe8f5e9, 0.25)
    dir2.position.set(-2, 1, 3)
    scene.add(dir2)

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      geometry.dispose()
      cardMaterial.dispose()
    }
  }, [])

  return <div ref={containerRef} className="appointments-box-3d" aria-hidden="true" />
}

export default AppointmentsBox3D
