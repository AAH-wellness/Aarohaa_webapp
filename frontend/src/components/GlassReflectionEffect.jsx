import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './GlassReflectionEffect.css'

/**
 * Three.js glass reflection overlay for the form box fade area.
 * Renders a subtle fresnel-style reflection (stronger at top, bottom, right edges).
 */

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uFadeWidth;
  uniform float uReflectionStrength;

  varying vec2 vUv;

  void main() {
    float top = 1.0 - smoothstep(0.0, uFadeWidth, vUv.y);
    float bottom = 1.0 - smoothstep(1.0, 1.0 - uFadeWidth, vUv.y);
    float right = 1.0 - smoothstep(1.0, 1.0 - uFadeWidth, vUv.x);
    float reflection = (top + bottom + right) * uReflectionStrength;
    reflection = min(reflection, 0.5);
    gl_FragColor = vec4(1.0, 1.0, 1.0, reflection);
  }
`

const GlassReflectionEffect = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    if (width <= 0 || height <= 0) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)
    camera.position.z = 0

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uFadeWidth: { value: 0.22 },
        uReflectionStrength: { value: 0.18 },
      },
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    renderer.render(scene, camera)

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      if (w <= 0 || h <= 0) return
      renderer.setSize(w, h)
      renderer.render(scene, camera)
    }
    window.addEventListener('resize', handleResize)
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="glass-reflection-effect" aria-hidden="true" />
}

export default GlassReflectionEffect
