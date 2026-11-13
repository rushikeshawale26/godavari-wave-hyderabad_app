import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'

const GLOBE_RADIUS = 1.45

interface CityHub {
  id: string
  name: string
  label: string
  lat: number
  lon: number
  isHQ?: boolean
}

const CITY_HUBS: CityHub[] = [
  { id: 'hyd', name: 'Hyderabad', label: 'Hyderabad · HQ', lat: 17.385, lon: 78.4867, isHQ: true },
  { id: 'sin', name: 'Singapore', label: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { id: 'dxb', name: 'Dubai', label: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { id: 'lon', name: 'London', label: 'London', lat: 51.5074, lon: -0.1278 },
  { id: 'fra', name: 'Frankfurt', label: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
  { id: 'nyc', name: 'New York', label: 'New York', lat: 40.7128, lon: -74.006 },
  { id: 'sfo', name: 'San Francisco', label: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { id: 'tyo', name: 'Tokyo', label: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { id: 'syd', name: 'Sydney', label: 'Sydney', lat: -33.8688, lon: 151.2093 },
]

const CONNECTIONS: [string, string][] = [
  ['hyd', 'sin'],
  ['hyd', 'dxb'],
  ['hyd', 'lon'],
  ['hyd', 'fra'],
  ['hyd', 'tyo'],
  ['hyd', 'nyc'],
  ['hyd', 'sfo'],
  ['hyd', 'syd'],
  ['lon', 'nyc'],
  ['nyc', 'sfo'],
  ['sin', 'tyo'],
]

const AMBIENT_PARTICLE_COUNT = 130

class ImmediateResizeObserver extends ResizeObserver {
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    super(callback)
    this.callback = callback
  }

  override observe(target: Element, options?: ResizeObserverOptions) {
    super.observe(target, options)
    this.callback([], this)
  }
}

function createStaticAmbientPositions(): Float32Array {
  const positions = new Float32Array(AMBIENT_PARTICLE_COUNT * 3)
  for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
    // Deterministic golden-ratio spherical distribution
    const u = ((i * 137.5) % 360) / 360
    const v = (i + 0.5) / AMBIENT_PARTICLE_COUNT
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = GLOBE_RADIUS * (1.25 + (((i * 73) % 100) / 100) * 0.75)
    const sinPhi = Math.sin(phi)

    positions[i * 3] = r * sinPhi * Math.cos(theta)
    positions[i * 3 + 1] = r * sinPhi * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

const STATIC_AMBIENT_POSITIONS = createStaticAmbientPositions()

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

function createArcCurve(p1: THREE.Vector3, p2: THREE.Vector3, globeRadius: number): THREE.QuadraticBezierCurve3 {
  const distance = p1.distanceTo(p2)
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
  const elevation = globeRadius + Math.min(distance * 0.32, globeRadius * 0.45)
  const controlPoint = mid.clone().normalize().multiplyScalar(elevation)
  return new THREE.QuadraticBezierCurve3(p1, controlPoint, p2)
}

function updatePulsePositions(
  positions: Float32Array,
  curves: THREE.QuadraticBezierCurve3[],
  time: number,
) {
  let idx = 0
  for (let c = 0; c < curves.length; c++) {
    const curve = curves[c]
    const t1 = (time * 0.22 + c * 0.17) % 1
    const pt1 = curve.getPointAt(t1)
    positions[idx * 3] = pt1.x
    positions[idx * 3 + 1] = pt1.y
    positions[idx * 3 + 2] = pt1.z
    idx++

    const t2 = (time * 0.22 + c * 0.17 + 0.5) % 1
    const pt2 = curve.getPointAt(t2)
    positions[idx * 3] = pt2.x
    positions[idx * 3 + 1] = pt2.y
    positions[idx * 3 + 2] = pt2.z
    idx++
  }
}

function GlobeInner({
  hqLabelRef,
  onFirstFrame,
}: {
  hqLabelRef: RefObject<HTMLDivElement | null>
  onFirstFrame: () => void
}) {
  const globeGroupRef = useRef<THREE.Group>(null)
  const pulsesPointsRef = useRef<THREE.Points>(null)
  const haloRingRef = useRef<THREE.Mesh>(null)
  const hqPulseRef = useRef<THREE.Mesh>(null)
  const hasReportedFirstFrame = useRef(false)
  const readyFrameRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (readyFrameRef.current !== null) {
      cancelAnimationFrame(readyFrameRef.current)
    }
  }, [])

  // Map cities to 3D positions
  const hubsWithPos = useMemo(() => {
    return CITY_HUBS.map((city) => ({
      ...city,
      pos: latLongToVector3(city.lat, city.lon, GLOBE_RADIUS),
    }))
  }, [])

  const hqNode = useMemo(() => hubsWithPos.find((h) => h.isHQ)!, [hubsWithPos])
  const hqFacingRotationY = Math.atan2(-hqNode.pos.x, hqNode.pos.z)
  const hqLabelPosition = useMemo(
    () => hqNode.pos.clone().add(new THREE.Vector3(0, 0.08, 0)),
    [hqNode],
  )
  const projectedHqLabelPosition = useMemo(() => new THREE.Vector3(), [])

  // Pre-calculate connection curves
  const curves = useMemo(() => {
    const hubMap = new Map<string, THREE.Vector3>()
    for (const h of hubsWithPos) {
      hubMap.set(h.id, h.pos)
    }

    const list: THREE.QuadraticBezierCurve3[] = []
    for (const [id1, id2] of CONNECTIONS) {
      const p1 = hubMap.get(id1)
      const p2 = hubMap.get(id2)
      if (p1 && p2) {
        list.push(createArcCurve(p1, p2, GLOBE_RADIUS))
      }
    }
    return list
  }, [hubsWithPos])

  // Single LineSegments geometry for all connection arcs (ultra-optimized single draw-call)
  const arcsGeometry = useMemo(() => {
    const points: number[] = []
    const segmentsPerCurve = 36

    for (const curve of curves) {
      const curvePoints = curve.getPoints(segmentsPerCurve)
      for (let i = 0; i < curvePoints.length - 1; i++) {
        points.push(curvePoints[i].x, curvePoints[i].y, curvePoints[i].z)
        points.push(curvePoints[i + 1].x, curvePoints[i + 1].y, curvePoints[i + 1].z)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return geo
  }, [curves])

  // Surface Dot Matrix (Fibonacci sphere distribution)
  const dotMatrixGeometry = useMemo(() => {
    const count = 480
    const phi = Math.PI * (3 - Math.sqrt(5))
    const positions = new Float32Array(count * 3)
    const radius = GLOBE_RADIUS * 1.006

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = phi * i
      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY

      positions[i * 3] = x * radius
      positions[i * 3 + 1] = y * radius
      positions[i * 3 + 2] = z * radius
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  // Latitude and Longitude Grid lines (Single LineSegments geometry)
  const gridGeometry = useMemo(() => {
    const points: number[] = []
    const steps = 64

    // Latitude parallels
    const latitudes = [-60, -35, -10, 10, 35, 60]
    for (const lat of latitudes) {
      const phi = (90 - lat) * (Math.PI / 180)
      const r = GLOBE_RADIUS * 1.002 * Math.sin(phi)
      const y = GLOBE_RADIUS * 1.002 * Math.cos(phi)

      for (let i = 0; i < steps; i++) {
        const theta1 = (i / steps) * Math.PI * 2
        const theta2 = ((i + 1) / steps) * Math.PI * 2
        points.push(r * Math.cos(theta1), y, r * Math.sin(theta1))
        points.push(r * Math.cos(theta2), y, r * Math.sin(theta2))
      }
    }

    // Longitude meridians
    const meridians = [0, 45, 90, 135, 180, 225, 270, 315]
    for (const lon of meridians) {
      const rad = (lon * Math.PI) / 180
      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2
        const a2 = ((i + 1) / steps) * Math.PI * 2
        points.push(
          GLOBE_RADIUS * 1.002 * Math.sin(a1) * Math.cos(rad),
          GLOBE_RADIUS * 1.002 * Math.cos(a1),
          GLOBE_RADIUS * 1.002 * Math.sin(a1) * Math.sin(rad),
        )
        points.push(
          GLOBE_RADIUS * 1.002 * Math.sin(a2) * Math.cos(rad),
          GLOBE_RADIUS * 1.002 * Math.cos(a2),
          GLOBE_RADIUS * 1.002 * Math.sin(a2) * Math.sin(rad),
        )
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return geo
  }, [])

  // Regular Hub Nodes Points
  const regularHubsGeometry = useMemo(() => {
    const nonHQ = hubsWithPos.filter((h) => !h.isHQ)
    const positions = new Float32Array(nonHQ.length * 3)
    for (let i = 0; i < nonHQ.length; i++) {
      const pos = nonHQ[i].pos
      positions[i * 3] = pos.x * 1.01
      positions[i * 3 + 1] = pos.y * 1.01
      positions[i * 3 + 2] = pos.z * 1.01
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [hubsWithPos])

  // Ambient Floating Particles
  const ambientParticlesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(STATIC_AMBIENT_POSITIONS, 3))
    return geo
  }, [])

  // Dynamic traveling data pulses along the curves
  const pulsesCount = curves.length * 2
  const pulsePositions = useMemo(() => {
    const positions = new Float32Array(pulsesCount * 3)
    updatePulsePositions(positions, curves, 0)
    return positions
  }, [curves, pulsesCount])
  const pulsesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3))
    return geo
  }, [pulsePositions])

  // Animation frame loop
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime()
    const canvas = state.gl.domElement
    const canvasBounds = canvas.getBoundingClientRect()
    if (
      !hasReportedFirstFrame.current &&
      state.size.width > 0 &&
      state.size.height > 0 &&
      canvas.width > 0 &&
      canvas.height > 0 &&
      Math.abs(canvasBounds.width - state.size.width) < 1 &&
      Math.abs(canvasBounds.height - state.size.height) < 1
    ) {
      hasReportedFirstFrame.current = true
      readyFrameRef.current = requestAnimationFrame(() => {
        readyFrameRef.current = null
        onFirstFrame()
      })
    }

    const group = globeGroupRef.current
    if (!group) return

    // Base constant smooth rotation around Y
    group.rotation.y += delta * 0.12

    // Smooth mouse parallax interpolation
    const targetRotX = -state.pointer.y * 0.28 + 0.05
    const targetRotZ = -state.pointer.x * 0.12
    const targetPosX = state.pointer.x * 0.18
    const targetPosY = state.pointer.y * 0.16

    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, 0.045)
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ, 0.045)
    group.position.x = THREE.MathUtils.lerp(group.position.x, targetPosX, 0.045)
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetPosY, 0.045)

    if (hqLabelRef.current) {
      group.updateWorldMatrix(true, false)
      projectedHqLabelPosition
        .copy(hqLabelPosition)
        .applyMatrix4(group.matrixWorld)
        .project(state.camera)
      const labelX = projectedHqLabelPosition.x * state.size.width * 0.5
      const labelY =
        (-projectedHqLabelPosition.y * 0.5 + 0.5 - 0.32) *
        state.size.height
      hqLabelRef.current.style.transform =
        `translate3d(${labelX}px, ${labelY}px, 0) translate(-50%, -100%)`
    }

    // Pulse Hyderabad beacon
    if (hqPulseRef.current) {
      const scale = 1 + Math.sin(time * 3.5) * 0.35
      hqPulseRef.current.scale.set(scale, scale, scale)
    }

    // Slowly rotate outer halo ring
    if (haloRingRef.current) {
      haloRingRef.current.rotation.z = time * 0.06
    }

    // Update animated data pulse points along curves
    if (pulsesPointsRef.current) {
      const posAttr = pulsesPointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      const posArray = posAttr.array as Float32Array
      updatePulsePositions(posArray, curves, time)
      posAttr.needsUpdate = true
    }
  })

  return (
    <Float speed={1.6} rotationIntensity={0.12} floatIntensity={0.24}>
      <group
        ref={globeGroupRef}
        position={[0, 0, 0]}
        rotation={[0, hqFacingRotationY, 0]}
      >
        {/* Globe Inner Core Sphere with translucent corporate blue sheen */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 0.992, 36, 36]} />
          <meshPhysicalMaterial
            color="#2563eb"
            roughness={0.25}
            metalness={0.15}
            transmission={0.65}
            ior={1.2}
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </mesh>

        {/* Inner Light Glow Sphere */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 0.96, 24, 24]} />
          <meshBasicMaterial
            color="#dbeafe"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>

        {/* Latitude and Longitude Grid Lines */}
        <lineSegments geometry={gridGeometry}>
          <lineBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </lineSegments>

        {/* Digital Coordinate Dot Matrix */}
        <points geometry={dotMatrixGeometry}>
          <pointsMaterial
            color="#38bdf8"
            size={0.024}
            transparent
            opacity={0.62}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {/* Connection Arcs */}
        <lineSegments geometry={arcsGeometry}>
          <lineBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.68}
            depthWrite={false}
          />
        </lineSegments>

        {/* Moving Data Packets along Arcs */}
        <points ref={pulsesPointsRef} geometry={pulsesGeometry}>
          <pointsMaterial
            color="#ffffff"
            size={0.045}
            transparent
            opacity={0.95}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {/* Global Network Nodes (Regular Hubs) */}
        <points geometry={regularHubsGeometry}>
          <pointsMaterial
            color="#0284c7"
            size={0.048}
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {/* HYDERABAD PRIMARY NODE (Highlighted HQ) */}
        <group position={[hqNode.pos.x, hqNode.pos.y, hqNode.pos.z]}>
          {/* Inner core pin */}
          <mesh>
            <sphereGeometry args={[0.038, 16, 16]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>

          {/* Glowing Outer Beacon */}
          <mesh ref={hqPulseRef}>
            <sphereGeometry args={[0.065, 16, 16]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.45}
              depthWrite={false}
            />
          </mesh>

        </group>

        {/* Ambient Data Particles Cloud */}
        <points geometry={ambientParticlesGeometry}>
          <pointsMaterial
            color="#93c5fd"
            size={0.028}
            transparent
            opacity={0.52}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {/* Decorative Outer Tech Ring 1 */}
        <mesh ref={haloRingRef} rotation={[1.1, 0.25, -0.45]}>
          <torusGeometry args={[GLOBE_RADIUS * 1.34, 0.007, 4, 80]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.28}
            depthWrite={false}
          />
        </mesh>

        {/* Decorative Outer Tech Ring 2 (Dashed aesthetic) */}
        <mesh rotation={[-0.8, 0.45, 0.35]}>
          <torusGeometry args={[GLOBE_RADIUS * 1.18, 0.005, 4, 64]} />
          <meshBasicMaterial
            color="#93c5fd"
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Float>
  )
}

interface HeroGlobeSceneProps {
  isVisible?: boolean
  hasRendered: boolean
  onFirstFrame: () => void
  hqLabelRef: RefObject<HTMLDivElement | null>
}

export default function HeroGlobeScene({
  isVisible = true,
  hasRendered,
  onFirstFrame,
  hqLabelRef,
}: HeroGlobeSceneProps) {
  return (
    <Canvas
      frameloop={isVisible || !hasRendered ? 'always' : 'never'}
      camera={{ position: [0, 0, 4.4], fov: 42 }}
      gl={{
        powerPreference: 'low-power',
        antialias: true,
        alpha: true,
      }}
      dpr={[1, 1.5]}
      resize={{ polyfill: ImmediateResizeObserver }}
      className="hero-scene-canvas"
      aria-hidden="true"
    >
      <ambientLight color="#bfdbfe" intensity={1.8} />
      <directionalLight position={[-3, 4, 3]} color="#ffffff" intensity={2.2} />
      <directionalLight position={[3, -2, 2]} color="#60a5fa" intensity={1.8} />
      <GlobeInner hqLabelRef={hqLabelRef} onFirstFrame={onFirstFrame} />
    </Canvas>
  )
}
