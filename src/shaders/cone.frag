// Camera field-of-view volume: soft falloff, moving scan bands, bright rim.
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlong;
varying vec3 vNormalV;
varying vec3 vViewDir;
void main() {
  float rim = pow(1.0 - abs(dot(vNormalV, vViewDir)), 2.5);
  float falloff = smoothstep(0.0, 0.9, vAlong);
  float bands = smoothstep(0.92, 1.0, fract(vAlong * 6.0 + uTime * 0.6)) * 0.6;
  float a = (0.10 + rim * 0.55 + bands * falloff) * falloff * uOpacity;
  gl_FragColor = vec4(uColor * (0.8 + rim), a);
}
