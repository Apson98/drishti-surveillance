// Data packets travelling along a cable (uv.x runs along the tube).
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSpeed;
varying vec2 vUv;
void main() {
  float packets = smoothstep(0.8, 1.0, fract(vUv.x * 5.0 - uTime * uSpeed));
  float a = (0.18 + packets * 0.9) * uOpacity;
  gl_FragColor = vec4(uColor * (0.6 + packets), a);
}
