import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './BubbleBackground3D.css'

/**
 * Gas bubbles flowing bottom to top with vertex-shader wobble. Light-theme header/sidebar.
 */

const BUBBLE_COUNT = 24
const COLORS = [0xf0f9f4, 0xffffff, 0xe8f5e9, 0xfff8e1, 0x1a6b3a]

const vertexShader = `
  uniform float uTime;
  uniform float uWobbleAmplitude;
  uniform float uWobbleSpeed;
  uniform float uWobbleFreq;

  void main() {
    vec3 pos = position;
    float t = uTime * uWobbleSpeed;
    float wobble = uWobbleAmplitude * (
      sin(t + pos.x * uWobbleFreq) * cos(t * 0.7 + pos.y * uWobbleFreq) +
      sin(t * 1.3 + pos.z * uWobbleFreq) * 0.5
    );
    vec3 displaced = pos + normal * wobble;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`

const BubbleBackground3D = () => {
  const containerRef = useRef(null)
  const animationIdRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      -500,
      500
    )
    camera.position.z = 400

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    const bubbles = []
    const minR = 8
    const maxR = 28
    const speedMin = 0.25
    const speedMax = 0.85

    const hexToVec3 = (hex) => {
      const c = new THREE.Color(hex)
      return new THREE.Vector3(c.r, c.g, c.b)
    }

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const r = minR + Math.random() * (maxR - minR)
      const geometry = new THREE.SphereGeometry(r, 20, 14)
      const colorHex = COLORS[i % COLORS.length]
      const colorVec = hexToVec3(colorHex)
      const opacity = 0.25 + Math.random() * 0.2
      const wobbleAmp = 1.8 + Math.random() * 2.2
      const wobbleSpeed = 0.8 + Math.random() * 0.8
      const wobbleFreq = 0.08 + Math.random() * 0.06

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: colorVec },
          uOpacity: { value: opacity },
          uWobbleAmplitude: { value: wobbleAmp },
          uWobbleSpeed: { value: wobbleSpeed },
          uWobbleFreq: { value: wobbleFreq },
        },
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.x = (Math.random() - 0.5) * width
      mesh.position.y = (Math.random() - 0.5) * height - height * 0.6
      mesh.position.z = (Math.random() - 0.5) * 100
      mesh.userData = {
        speed: speedMin + Math.random() * (speedMax - speedMin),
        radius: r,
      }
      scene.add(mesh)
      bubbles.push(mesh)
    }

    const clock = new THREE.Clock()
    let currentWidth = width
    let currentHeight = height

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      bubbles.forEach((b) => {
        b.material.uniforms.uTime.value = t
        b.position.y += b.userData.speed
        if (b.position.y > currentHeight / 2 + b.userData.radius + 20) {
          b.position.y = -currentHeight / 2 - b.userData.radius - 20
          b.position.x = (Math.random() - 0.5) * currentWidth
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      currentWidth = w
      currentHeight = h
      camera.left = -w / 2
      camera.right = w / 2
      camera.top = h / 2
      camera.bottom = -h / 2
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      bubbles.forEach((b) => {
        b.geometry.dispose()
        b.material.dispose()
      })
    }
  }, [])

  return <div ref={containerRef} className="bubble-background-3d" aria-hidden="true" />
}

export default BubbleBackground3D
