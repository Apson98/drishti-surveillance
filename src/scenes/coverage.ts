// Site model and coverage maths for the interactive planning scene.
// Everything is on the ground plane (x, z) in metres.

export type Box = { x: number; z: number; w: number; d: number; h: number; kind: 'building' | 'wall' | 'car' | 'hut' }
export type Cam = {
  id: string
  label: string
  x: number
  z: number
  h: number
  yaw: number // radians, 0 = +x, counter-clockwise looking from above (towards -z)
  fov: number // radians
  range: number
  type: 'bullet' | 'dome' | 'ptz'
  sweep?: number // PTZ sweep half-angle (radians)
}

export const LOT = { w: 26, d: 18 }

export const boxes: Box[] = [
  { x: -1, z: -1.5, w: 9, d: 6, h: 4.2, kind: 'building' },
  { x: 10.6, z: -7.3, w: 3, d: 2.6, h: 2.6, kind: 'hut' },
  { x: 10.6, z: 6.4, w: 2, d: 2, h: 2.4, kind: 'hut' },
  // perimeter walls (gap at front-right for the gate)
  { x: 0, z: -9, w: 26, d: 0.3, h: 1.6, kind: 'wall' },
  { x: -13, z: 0, w: 0.3, d: 18, h: 1.6, kind: 'wall' },
  { x: 13, z: 0, w: 0.3, d: 18, h: 1.6, kind: 'wall' },
  { x: -3.5, z: 9, w: 19, d: 0.3, h: 1.6, kind: 'wall' },
  // parked cars
  { x: -8.6, z: 5.6, w: 1.9, d: 4.2, h: 1.4, kind: 'car' },
  { x: -5.9, z: 5.6, w: 1.9, d: 4.2, h: 1.4, kind: 'car' },
  { x: 2.6, z: 6.2, w: 4.2, d: 1.9, h: 1.4, kind: 'car' },
]

const r = (d: number) => (d * Math.PI) / 180

export const cams: Cam[] = [
  { id: 'c1', label: 'CAM 01 · Gate', x: 3.7, z: 1.7, h: 3.4, yaw: r(-40), fov: r(100), range: 14, type: 'bullet' },
  { id: 'c2', label: 'CAM 02 · Entrance', x: -1, z: 1.7, h: 3.2, yaw: r(-90), fov: r(110), range: 11, type: 'dome' },
  { id: 'c3', label: 'CAM 03 · Parking', x: -5.7, z: 1.7, h: 3.4, yaw: r(-160), fov: r(110), range: 13, type: 'bullet' },
  { id: 'c4', label: 'CAM 04 · Rear left', x: -5.7, z: -4.7, h: 3.4, yaw: r(200), fov: r(110), range: 13, type: 'bullet' },
  { id: 'c5', label: 'CAM 05 · Yard PTZ', x: 12.2, z: -1.2, h: 4.6, yaw: r(165), fov: r(60), range: 16, type: 'ptz', sweep: r(55) },
  { id: 'c6', label: 'CAM 06 · Rear right', x: 3.7, z: -4.7, h: 3.4, yaw: r(140), fov: r(110), range: 13, type: 'bullet' },
]

export const NVR = { x: -1, z: -1.5 }

/** 2D segment vs axis-aligned rectangle test (slab method). */
function segmentHitsBox(ax: number, az: number, bx: number, bz: number, b: Box) {
  const minX = b.x - b.w / 2, maxX = b.x + b.w / 2
  const minZ = b.z - b.d / 2, maxZ = b.z + b.d / 2
  let t0 = 0, t1 = 1
  const dx = bx - ax, dz = bz - az
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0
    const t = q / p
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t }
    else { if (t < t0) return false; if (t < t1) t1 = t }
    return true
  }
  if (!clip(-dx, ax - minX) || !clip(dx, maxX - ax) || !clip(-dz, az - minZ) || !clip(dz, maxZ - az)) return false
  return t0 < t1 && t1 > 0.001 && t0 < 0.999
}

const blockers = boxes.filter((b) => b.kind === 'building' || b.kind === 'hut')

export function insideBox(x: number, z: number, b: Box, pad = 0) {
  return Math.abs(x - b.x) <= b.w / 2 + pad && Math.abs(z - b.z) <= b.d / 2 + pad
}

/** Can camera `c`, currently pointing at `yaw`, see ground point (x, z)? */
export function sees(c: Cam, yaw: number, x: number, z: number) {
  const dx = x - c.x
  const dz = z - c.z
  const dist = Math.hypot(dx, dz)
  if (dist > c.range || dist < 0.2) return false
  // our yaw is measured towards -z (screen "up"), so flip z when taking the angle
  const ang = Math.atan2(-dz, dx)
  let diff = ang - yaw
  diff = Math.atan2(Math.sin(diff), Math.cos(diff))
  if (Math.abs(diff) > c.fov / 2) return false
  // nudge the ray start out of the camera's own wall
  const sx = c.x + (dx / dist) * 0.4
  const sz = c.z + (dz / dist) * 0.4
  for (const b of blockers) if (segmentHitsBox(sx, sz, x, z, b)) return false
  return true
}

export const CELL = 0.5

/** Ground cells that need watching: inside the lot, not under a building, wall or car. */
export const cells: { x: number; z: number }[] = (() => {
  const out: { x: number; z: number }[] = []
  for (let x = -LOT.w / 2 + CELL / 2 + 0.2; x < LOT.w / 2 - 0.2; x += CELL)
    for (let z = -LOT.d / 2 + CELL / 2 + 0.2; z < LOT.d / 2 - 0.2; z += CELL)
      if (!boxes.some((b) => insideBox(x, z, b, 0.1))) out.push({ x, z })
  return out
})()

export function yawAt(c: Cam, t: number) {
  return c.sweep ? c.yaw + Math.sin(t * 0.35) * c.sweep : c.yaw
}
