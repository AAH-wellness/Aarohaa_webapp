import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './NetworkBackground3D.css'

/**
 * Full-page static netted network pattern in light beige (Three.js).
 * No animation; pattern is completely still.
 */

// Light beige
const BEIGE_COLOR = new THREE.Color(0xe5ddd0)

const vertexShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`

function buildNetworkGeometry(width, height, cellSize = 44) {
  const segments = []

  const cols = Math.ceil(width / cellSize) + 2
  const rows = Math.ceil(height / cellSize) + 2
  const ox = -width / 2 - cellSize * 0.5
  const oy = -height / 2 - cellSize * 0.5

  const nodes = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cellSize + (r % 2) * (cellSize * 0.3)
      const y = oy + r * cellSize
      nodes.push({ x, y, r, c })
    }
  }

  const getIdx = (r, c) => r * cols + c

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = getIdx(r, c)
      const n = nodes[i]
      if (!n) continue

      const addSegment = (r1, c1) => {
        if (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols) {
          const j = getIdx(r1, c1)
          const n2 = nodes[j]
          if (n2) {
            segments.push(n.x, n.y, 0, n2.x, n2.y, 0)
          }
        }
      }

      addSegment(r, c + 1)
      addSegment(r + 1, c)
      addSegment(r + 1, c + 1)
      if (r % 2 === 0) addSegment(r + 1, c - 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segments), 3))
  geometry.computeBoundingSphere()
  return geometry
}

const NetworkBackground3D = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      -1000,
      1000
    )
    camera.position.z = 500

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    const geometry = buildNetworkGeometry(width, height, 28)
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Vector3(BEIGE_COLOR.r, BEIGE_COLOR.g, BEIGE_COLOR.b) },
        uOpacity: { value: 0.45 },
      },
    })

    const line = new THREE.LineSegments(geometry, mat)
    scene.add(line)

    const render = () => renderer.render(scene, camera)
    render()

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.left = -w / 2
      camera.right = w / 2
      camera.top = h / 2
      camera.bottom = -h / 2
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)

      line.geometry.dispose()
      const newGeo = buildNetworkGeometry(w, h, 28)
      line.geometry = newGeo
      render()
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
      line.geometry.dispose()
      mat.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="network-background-3d" aria-hidden="true" />
}

export default NetworkBackground3D
