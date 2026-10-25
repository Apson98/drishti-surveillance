import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { Edges, Html, OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import coneVert from '../shaders/cone.vert'
import coneFrag from '../shaders/cone.frag'
import uvVert from '../shaders/uv.vert'
import pulseFrag from '../shaders/pulse.frag'
import { C } from './palette'
import { boxes, cams, cells, CELL, LOT, NVR, sees, yawAt, type Cam } from './coverage'

export type CoverageStats = { percent: number; blindM2: number; active: number; tracked: string | null }

type Props = {
  enabled: Record<string, boolean>
  showCones: boolean
  showCables: boolean
  night: boolean
  active: boolean
  reduced: boolean
  onToggleCam: (id: string) => void
  onStats: (s: CoverageStats) => void
}

const UP = new THREE.Vector3(0, -1, 0)
const tmpDir = new THREE.Vector3()

/** Shared clock so the cones, the coverage maths and the HUD agree on PTZ position. */
const clock = { t: 0 }

function FovCone({ cam, on, visible, night }: { cam: Cam; on: boolean; visible: boolean; night: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const aim = cam.range * 0.92
  const len = Math.hypot(aim, cam.h)
  const radius = Math.tan(cam.fov / 2) * len * 0.82
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(radius, len, 48, 1, true)
    g.translate(0, -len / 2, 0) // apex at the origin, opening along -Y
    return g
  }, [radius, len])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: coneVert,
        fragmentShader: coneFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uColor: { value: C.accent.clone() }, uOpacity: { value: 0.6 } },
      }),
    [],
  )
  useEffect(() => {
    mat.uniforms.uColor.value.copy(night ? C.ice : C.accent)
  }, [night, mat])

  useFrame((_, dt) => {
    mat.uniforms.uTime.value = clock.t
    const target = on && visible ? 0.6 : 0
    mat.uniforms.uOpacity.value += (target - mat.uniforms.uOpacity.value) * Math.min(1, dt * 6)
    group.current.visible = mat.uniforms.uOpacity.value > 0.01
    const yaw = yawAt(cam, clock.t)
    tmpDir.set(Math.cos(yaw) * aim, -cam.h, -Math.sin(yaw) * aim).normalize()
    group.current.quaternion.setFromUnitVectors(UP, tmpDir)
  })
  return (
    <group ref={group} position={[cam.x, cam.h, cam.z]}>
      <mesh geometry={geo} material={mat} />
    </group>
  )
}

function CameraModel({ cam, on, onToggle }: { cam: Cam; on: boolean; onToggle: () => void }) {
  const head = useRef<THREE.Group>(null!)
  const led = useRef<THREE.MeshBasicMaterial>(null!)
  useFrame(() => {
    head.current.rotation.y = yawAt(cam, clock.t)
    led.current.color.copy(on ? C.signal : C.steel)
  })
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onToggle()
  }
  return (
    <group position={[cam.x, 0, cam.z]}>
      {/* pole for free-standing PTZ, bracket otherwise */}
      {cam.type === 'ptz' && (
        <mesh position-y={cam.h / 2}>
          <cylinderGeometry args={[0.07, 0.1, cam.h, 12]} />
          <meshStandardMaterial color={C.steel} metalness={0.6} roughness={0.4} />
        </mesh>
      )}
      <group
        ref={head}
        position-y={cam.h}
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {cam.type === 'dome' ? (
          <mesh>
            <sphereGeometry args={[0.32, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color={on ? C.ice : C.steel} metalness={0.4} roughness={0.3} />
          </mesh>
        ) : (
          <mesh rotation-z={Math.PI / 2} position-x={0.22} rotation-y={0}>
            <capsuleGeometry args={[0.16, cam.type === 'ptz' ? 0.3 : 0.55, 6, 16]} />
            <meshStandardMaterial color={on ? C.ice : C.steel} metalness={0.4} roughness={0.35} />
          </mesh>
        )}
        <mesh position={[cam.type === 'dome' ? 0.0 : 0.62, cam.type === 'dome' ? -0.2 : 0.0, 0]}>
          <sphereGeometry args={[0.06, 12, 8]} />
          <meshBasicMaterial ref={led} color={C.signal} />
        </mesh>
        {/* large invisible hit area for easier clicking */}
        <mesh visible={false}>
          <sphereGeometry args={[0.7, 8, 8]} />
        </mesh>
      </group>
    </group>
  )
}

function Cables({ enabled, visible }: { enabled: Record<string, boolean>; visible: boolean }) {
  const items = useMemo(
    () =>
      cams.map((c) => {
        // run down the wall, along the ground, into the recorder in the main building
        const pts = [
          new THREE.Vector3(c.x, c.h - 0.2, c.z),
          new THREE.Vector3(c.x, 0.08, c.z),
          new THREE.Vector3(c.x, 0.08, NVR.z + (c.z > NVR.z ? 3.3 : -3.3)),
          new THREE.Vector3(NVR.x, 0.08, NVR.z + (c.z > NVR.z ? 3.3 : -3.3)),
          new THREE.Vector3(NVR.x, 0.6, NVR.z),
        ]
        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05)
        const geo = new THREE.TubeGeometry(curve, 120, 0.035, 6, false)
        const mat = new THREE.ShaderMaterial({
          vertexShader: uvVert,
          fragmentShader: pulseFrag,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: C.accent.clone() },
            uOpacity: { value: 1 },
            uSpeed: { value: 0.35 + Math.random() * 0.2 },
          },
        })
        return { id: c.id, geo, mat }
      }),
    [],
  )
  useFrame((_, dt) => {
    for (const it of items) {
      it.mat.uniforms.uTime.value = clock.t
      const target = visible ? (enabled[it.id] ? 1 : 0.15) : 0
      it.mat.uniforms.uOpacity.value += (target - it.mat.uniforms.uOpacity.value) * Math.min(1, dt * 6)
    }
  })
  return (
    <group>
      {items.map((it) => (
        <mesh key={it.id} geometry={it.geo} material={it.mat} />
      ))}
    </group>
  )
}

function Site({ night }: { night: boolean }) {
  return (
    <group>
      {/* lot slab */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[LOT.w + 6, LOT.d + 6]} />
        <meshStandardMaterial color={night ? '#0b0f14' : '#0b1322'} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0}>
        <planeGeometry args={[LOT.w, LOT.d]} />
        <meshStandardMaterial color={night ? '#11161d' : '#0f1a2c'} roughness={0.9} />
      </mesh>
      <gridHelper args={[LOT.w + 6, (LOT.w + 6) / 1, '#1d2b42', '#142034']} position-y={0.005} />
      {boxes.map((b, i) =>
        b.kind === 'car' ? (
          <RoundedBox key={i} args={[b.w, b.h, b.d]} radius={0.3} position={[b.x, b.h / 2, b.z]}>
            <meshStandardMaterial color="#1a2433" metalness={0.5} roughness={0.4} />
          </RoundedBox>
        ) : (
          <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={b.kind === 'wall' ? '#1b2638' : '#152031'}
              metalness={0.2}
              roughness={0.8}
              transparent={b.kind === 'building'}
              opacity={b.kind === 'building' ? 0.92 : 1}
            />
            <Edges color={b.kind === 'wall' ? '#2d4060' : '#4a6a96'} threshold={15} />
          </mesh>
        ),
      )}
      {/* recorder marker inside the building */}
      <mesh position={[NVR.x, 0.6, NVR.z]}>
        <boxGeometry args={[0.9, 0.25, 0.6]} />
        <meshStandardMaterial color="#0c1018" emissive={C.accent} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

/** Ground heat-map: every half-metre cell is blue when a live camera sees it, red when it is a blind spot. */
function CoverageGrid({ enabled, onStats, intruder }: Pick<Props, 'enabled' | 'onStats'> & { intruder: React.MutableRefObject<THREE.Vector3> }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const last = useRef(-1)
  const covered = useMemo(() => new THREE.Color().copy(C.accent).multiplyScalar(0.32), [])
  const blind = useMemo(() => new THREE.Color().copy(C.signal).multiplyScalar(0.38), [])

  useEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    cells.forEach((c, i) => {
      m.compose(new THREE.Vector3(c.x, 0.02, c.z), q, new THREE.Vector3(1, 1, 1))
      mesh.current.setMatrixAt(i, m)
      mesh.current.setColorAt(i, covered)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    last.current = -1
  }, [covered])

  useFrame(() => {
    // recompute five times a second: cheap, and keeps the PTZ sweep visible in the numbers
    if (clock.t - last.current < 0.2) return
    last.current = clock.t
    const live = cams.filter((c) => enabled[c.id])
    const yaws = live.map((c) => yawAt(c, clock.t))
    let n = 0
    cells.forEach((c, i) => {
      const seen = live.some((k, j) => sees(k, yaws[j], c.x, c.z))
      if (seen) n++
      mesh.current.setColorAt(i, seen ? covered : blind)
    })
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    const p = intruder.current
    const by = live.find((k, j) => sees(k, yaws[j], p.x, p.z))
    onStats({
      percent: (n / cells.length) * 100,
      blindM2: (cells.length - n) * CELL * CELL,
      active: live.length,
      tracked: by ? by.label : null,
    })
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, cells.length]} frustumCulled={false}>
      <planeGeometry args={[CELL * 0.82, CELL * 0.82]} />
      <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

/** A person walking a loop through the site. A detection box appears when any live camera sees them. */
function Intruder({ pos, enabled }: { pos: React.MutableRefObject<THREE.Vector3>; enabled: Record<string, boolean> }) {
  const body = useRef<THREE.Group>(null!)
  const box = useRef<HTMLDivElement>(null!)
  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          [10.5, 8.2], [8.5, 4.5], [5, 3.2], [0, 3.4], [-4, 3.6], [-10.5, 2.2], [-11.5, -2.5],
          [-10, -7.2], [-3, -7.4], [4.8, -6.8], [6.5, -3], [11, -3.6], [12, 3], [11.5, 7.6],
        ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
        true,
        'centripetal',
      ),
    [],
  )
  useFrame(() => {
    const u = (clock.t * 0.012) % 1
    const p = path.getPointAt(u)
    const n = path.getTangentAt(u)
    body.current.position.copy(p)
    body.current.rotation.y = Math.atan2(n.x, n.z)
    body.current.position.y = Math.abs(Math.sin(clock.t * 6)) * 0.05
    pos.current.copy(p)
    const seen = cams.some((c) => enabled[c.id] && sees(c, yawAt(c, clock.t), p.x, p.z))
    if (box.current) box.current.dataset.seen = seen ? '1' : '0'
  })
  return (
    <group ref={body}>
      <mesh position-y={0.85}>
        <capsuleGeometry args={[0.22, 0.9, 6, 12]} />
        <meshStandardMaterial color="#c8d3e2" roughness={0.6} />
      </mesh>
      <mesh position-y={1.75}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#c8d3e2" roughness={0.6} />
      </mesh>
      <Html position={[0, 1.1, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={box} className="det-box" data-seen="0">
          <span className="det-tag det-tag--seen">PERSON 0.96</span>
          <span className="det-tag det-tag--blind">NOT SEEN</span>
        </div>
      </Html>
    </group>
  )
}

function Clock({ reduced }: { reduced: boolean }) {
  useFrame((_, dt) => {
    clock.t += Math.min(dt, 0.05) * (reduced ? 0.35 : 1)
  })
  return null
}

export default function CoverageScene(props: Props) {
  const { enabled, showCones, showCables, night, active, reduced, onToggleCam, onStats } = props
  const intruder = useRef(new THREE.Vector3())
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [21, 27, 31], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => (document.body.style.cursor = '')}
    >
      <Clock reduced={reduced} />
      <ambientLight intensity={night ? 0.15 : 0.45} />
      <directionalLight position={[10, 18, 8]} intensity={night ? 0.25 : 1.4} color="#dfe9ff" />
      <pointLight position={[-8, 6, -6]} intensity={night ? 10 : 30} color={C.accent} />
      <group position={[0, 0, 0]}>
        <Site night={night} />
        <CoverageGrid enabled={enabled} onStats={onStats} intruder={intruder} />
        <Cables enabled={enabled} visible={showCables} />
        {cams.map((c) => (
          <group key={c.id}>
            <CameraModel cam={c} on={enabled[c.id]} onToggle={() => onToggleCam(c.id)} />
            <FovCone cam={c} on={enabled[c.id]} visible={showCones} night={night} />
          </group>
        ))}
        <Intruder pos={intruder} enabled={enabled} />
      </group>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={1.15}
        target={[0.5, -0.5, 2]}
        rotateSpeed={0.5}
        enableDamping
      />
    </Canvas>
  )
}
