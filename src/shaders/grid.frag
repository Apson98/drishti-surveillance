// Perspective floor grid with a radar sweep and an outgoing pulse ring.
uniform float uTime;
uniform vec3 uLine;
uniform vec3 uAccent;
uniform float uFade;
uniform float uStrength;
varying vec3 vWorld;

float gridLine(vec2 p, float scale) {
  vec2 g = abs(fract(p * scale - 0.5) - 0.5) / fwidth(p * scale);
  return 1.0 - min(min(g.x, g.y), 1.0);
}

void main() {
  vec2 p = vWorld.xz;
  float r = length(p);
  float minor = gridLine(p, 1.0) * 0.35;
  float major = gridLine(p, 0.2) * 0.8;
  float lines = max(minor, major);

  // radar sweep: bright leading edge with a fading trail
  float a = atan(p.y, p.x);
  float sweepAngle = mod(uTime * 0.55, 6.28318);
  float d = mod(sweepAngle - a + 6.28318, 6.28318);
  float sweep = exp(-d * 2.2) * smoothstep(0.0, 0.05, d + 0.05);

  // concentric range rings every 4 units
  float rings = 1.0 - min(abs(fract(r / 4.0 - 0.5) - 0.5) / fwidth(r / 4.0), 1.0);

  // outgoing pulse
  float pulseR = mod(uTime * 3.0, 28.0);
  float pulse = exp(-abs(r - pulseR) * 1.6) * (1.0 - pulseR / 28.0);

  float fade = smoothstep(uFade, 0.0, r);
  vec3 col = uLine * lines + uAccent * (rings * 0.35 + sweep * 0.25 + pulse * 0.45);
  float alpha = (lines * 0.55 + rings * 0.3 + sweep * 0.35 + pulse * 0.5) * fade;
  gl_FragColor = vec4(col, alpha * uStrength);
}
