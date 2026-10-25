import * as THREE from 'three'

// Scene colours mirror the CSS tokens in styles/tokens.scss
export const C = {
  ink: new THREE.Color('#070d18'),
  line: new THREE.Color('#3a5374'),
  accent: new THREE.Color('#7fb2ff'),
  ice: new THREE.Color('#d6e2f0'),
  steel: new THREE.Color('#2a3546'),
  graphite: new THREE.Color('#141b26'),
  signal: new THREE.Color('#ff5a4f'),
}

// Light-page palette for the hero, taken from the Drishti logo
export const L = {
  navy: new THREE.Color('#24475b'),
  slate: new THREE.Color('#3b5a72'),
  line: new THREE.Color('#93a8b9'),
  accent: new THREE.Color('#3b6f8f'),
  lens: new THREE.Color('#7fa8ff'),
}

/** An annular sector (part of a ring) as a 2D shape, angles in radians. */
export function arcShape(r0: number, r1: number, a0: number, a1: number) {
  const s = new THREE.Shape()
  s.absarc(0, 0, r1, a0, a1, false)
  s.absarc(0, 0, r0, a1, a0, true)
  s.closePath()
  return s
}

/** Curved chevron like the outermost marks of the Drishti logo. */
export function chevronShape(r0: number, tip: number, span: number, side: 1 | -1) {
  const s = new THREE.Shape()
  const base = side === 1 ? 0 : Math.PI
  const steps = 16
  for (let i = 0; i <= steps; i++) {
    const a = base - span + (2 * span * i) / steps
    const x = Math.cos(a) * r0
    const y = Math.sin(a) * r0
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)
  }
  s.lineTo(side * tip, 0)
  s.closePath()
  return s
}

export const extrude = (shape: THREE.Shape, depth = 0.22) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 48,
  })
