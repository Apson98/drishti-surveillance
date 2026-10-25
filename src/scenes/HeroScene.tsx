import { useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import gridVert from '../shaders/grid.vert'
import gridFrag from '../shaders/grid.frag'
import { C, L, arcShape, chevronShape, extrude } from './palette'

type Props = {
  pointer: MutableRefObject<{ x: number; y: number }>
  scroll: MutableRefObject<number>
  active: boolean
  compact: boolean
  reduced: boolean
}

const deg = THREE.MathUtils.degToRad

/** The Drishti eye: a camera lens wrapped in the logo's rings, arcs and chevrons. */
function DrishtiEye({ pointer, scroll, reduced }: Omit<Props, 'active' | 'compact'>) {
  const root = useRef<THREE.Group>(null!)
  const look = useRef<THREE.Group>(null!)
  const arcsInner = useRef<THREE.Group>(null!)
  const arcsOuter = useRef<THREE.Group>(null!)
  const chevrons = useRef<THREE.Group>(null!)
  const iris = useRef<THREE.Group>(null!)
  const glow = useRef<THREE.MeshBasicMaterial>(null!)
  const ringMat = useRef<THREE.MeshStandardMaterial>(null!)

  const geo = useMemo(() => {
    const ring = extrude(arcShape(1.62, 1.86, 0, Math.PI * 2), 0.26)
    const inner = [deg(-52), deg(180 - 52)].map((a0) => extrude(arcShape(2.12, 2.42, a0, a0 + deg(104))))
    const outer = [deg(-40), deg(180 - 40)].map((a0) => extrude(arcShape(2.66, 2.92, a0, a0 + deg(80))))
    const chev = ([1, -1] as const).map((s) => extrude(chevronShape(3.18, 3.82, deg(26), s), 0.2))
    // iris blade: a thin curved wedge, eight of them overlap to form the aperture
    const bladeShape = new THREE.Shape()
    bladeShape.moveTo(0, 0)
    bladeShape.quadraticCurveTo(0.55, 0.12, 0.95, 0.0)
    bladeShape.lineTo(0.78, 0.42)
    bladeShape.quadraticCurveTo(0.35, 0.36, 0, 0)
    const blade = new THREE.ShapeGeometry(bladeShape, 12)
    return { ring, inner, outer, chev, blade }
  }, [])

  const metalIce = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4a6b84', metalness: 0.25, roughness: 0.38, envMapIntensity: 1 }),
    [],
  )
  const housing = useMemo(
    () => new THREE.MeshStandardMaterial({ color: C.graphite, metalness: 0.7, roughness: 0.42 }),
    [],
  )

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const s = scroll.current // 0 at top, 1 once the hero has scrolled away
    const k = 1 - Math.exp(-dt * 4)
    // lens follows the pointer
    const tx = pointer.current.x * 0.45
    const ty = pointer.current.y * 0.32
    look.current.rotation.y += (tx - look.current.rotation.y) * k
    look.current.rotation.x += (-ty + s * 0.35 - look.current.rotation.x) * k
    root.current.position.y = -s * 1.4
    root.current.rotation.z = Math.sin(t * 0.25) * 0.03

    const m = reduced ? 0 : 1
    arcsInner.current.rotation.z = Math.sin(t * 0.4) * 0.06 * m + s * 0.6
    arcsOuter.current.rotation.z = -Math.sin(t * 0.33) * 0.08 * m - s * 0.9
    const spread = 1 + s * 0.25 + Math.sin(t * 1.1) * 0.012 * m
    arcsOuter.current.scale.setScalar(spread)
    chevrons.current.scale.setScalar(1 + s * 0.4 + Math.sin(t * 1.1 + 0.6) * 0.015 * m)

    // aperture: breathes slowly, closes as you scroll down
    const open = THREE.MathUtils.clamp(0.75 + Math.sin(t * 0.7) * 0.12 * m - s * 0.6, 0.1, 1)
    iris.current.children.forEach((b, i) => {
      b.rotation.z = (i / 8) * Math.PI * 2 + (1 - open) * 0.9
      b.position.setLength(0.3 + open * 0.45)
    })
    glow.current.opacity = 0.55 + Math.sin(t * 2.2) * 0.2 * m
    ringMat.current.emissiveIntensity = 0.1 + Math.max(0, Math.sin(t * 1.4)) * 0.25 * m
  })

  return (
    <group ref={root}>
      <group ref={look}>
        {/* lens housing */}
        <mesh rotation-x={Math.PI / 2} position-z={-0.25} material={housing}>
          <cylinderGeometry args={[1.5, 1.6, 0.9, 64]} />
        </mesh>
        <mesh position-z={0.2}>
          <torusGeometry args={[1.38, 0.13, 24, 96]} />
          <meshStandardMaterial color={C.steel} metalness={0.9} roughness={0.25} />
        </mesh>
        {/* knurled focus ring */}
        <mesh rotation-x={Math.PI / 2} position-z={0.05}>
          <cylinderGeometry args={[1.26, 1.26, 0.3, 96, 1, true]} />
          <meshStandardMaterial color={C.graphite} metalness={0.6} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        {/* sensor glow at the centre of the iris */}
        <mesh position-z={0.04}>
          <circleGeometry args={[0.2, 48]} />
          <meshBasicMaterial ref={glow} color={L.lens} transparent opacity={0.6} />
        </mesh>
        <mesh position-z={0.01}>
          <ringGeometry args={[0.9, 1.0, 64]} />
          <meshBasicMaterial color={L.lens} transparent opacity={0.35} />
        </mesh>
        <group ref={iris} position-z={0.0}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return (
              <mesh key={i} geometry={geo.blade} position={[Math.cos(a) * 0.5, Math.sin(a) * 0.5, i * 0.004]}>
                <meshStandardMaterial color="#05080d" metalness={0.2} roughness={0.8} side={THREE.DoubleSide} />
              </mesh>
            )
          })}
        </group>
        {/* coated front glass */}
        <mesh position-z={0.12} scale={[1, 1, 0.38]}>
          <sphereGeometry args={[1.22, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#0a1424"
            metalness={0.1}
            roughness={0.04}
            clearcoat={1}
            clearcoatRoughness={0.02}
            iridescence={1}
            iridescenceIOR={1.6}
            iridescenceThicknessRange={[200, 700]}
            transparent
            opacity={0.16}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* logo geometry */}
        <mesh geometry={geo.ring} position-z={-0.05} rotation-x={0}>
          <meshStandardMaterial
            ref={ringMat}
            color={'#36566e'}
            metalness={0.3}
            roughness={0.32}
            emissive={L.accent}
            emissiveIntensity={0.15}
          />
        </mesh>
        <group ref={arcsInner} position-z={-0.12}>
          {geo.inner.map((g, i) => (
            <mesh key={i} geometry={g} material={metalIce} />
          ))}
        </group>
        <group ref={arcsOuter} position-z={-0.18}>
          {geo.outer.map((g, i) => (
            <mesh key={i} geometry={g} material={metalIce} />
          ))}
        </group>
        <group ref={chevrons} position-z={-0.22}>
          {geo.chev.map((g, i) => (
            <mesh key={i} geometry={g} material={metalIce} />
          ))}
        </group>
      </group>
    </group>
  )
}

function Floor() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridVert,
        fragmentShader: gridFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uLine: { value: L.line.clone() },
          uAccent: { value: L.accent.clone() },
          uFade: { value: 18 },
          uStrength: { value: 0.45 },
        },
        extensions: { derivatives: true } as never,
      }),
    [],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-4.2} material={mat}>
      <planeGeometry args={[80, 80]} />
    </mesh>
  )
}

function Dust({ count = 260 }) {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = Math.random() * 12 - 4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4
    }
    return arr
  }, [count])
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.012))
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={L.accent} size={0.03} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function Rig({ compact }: { compact: boolean }) {
  const { camera } = useThree()
  useFrame(() => {
    camera.lookAt(compact ? 0 : -1.2, compact ? 0.6 : 0, 0)
  })
  return null
}

export default function HeroScene(props: Props) {
  const { active, compact } = props
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, compact ? 1.5 : 2]}
      camera={{ position: [0, 0.6, 13], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Rig compact={compact} />
      <ambientLight intensity={0.6} />
      <spotLight position={[6, 8, 8]} angle={0.5} penumbra={0.8} intensity={180} color="#e8f0ff" />
      <pointLight position={[-6, -2, 4]} intensity={30} color={L.lens} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 6]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#7fb2ff" position={[-6, 0, 3]} scale={[2, 8, 1]} />
        <Lightformer form="ring" intensity={2} position={[5, 1, 4]} scale={2} />
      </Environment>
      <group position={compact ? [0, 2.6, 0] : [2.75, 0.2, 0]} scale={compact ? 0.48 : 0.7}>
        <DrishtiEye {...props} />
      </group>
      <Floor />
      <Dust />
    </Canvas>
  )
}
