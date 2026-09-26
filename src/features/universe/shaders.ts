// Small, texture-free materials. Three.js owns shader compilation and all GL resources.
const noise = /* glsl */ `
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.17, 0.31, 0.57));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;

export const starVertex = /* glsl */ `
varying vec3 vSurface;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vSurface = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
export const starFragment = /* glsl */ `
uniform float uTime;
varying vec3 vSurface;
varying vec3 vNormal;
varying vec3 vView;
${noise}
void main() {
  vec3 p = vSurface * 5.0;
  p += 0.22 * sin(p.yzx * 2.0 + uTime * 0.09);
  float broad = noise3(p + vec3(0.0, uTime * 0.025, 0.0));
  float cells = noise3(p * 4.2 + broad * 1.5);
  float fine = noise3(p * 10.0 - uTime * 0.035);
  float veins = pow(1.0 - abs(cells * 2.0 - 1.0), 5.0);
  float heat = clamp(broad * 0.38 + cells * 0.28 + fine * 0.16 + veins * 0.24, 0.0, 1.0);
  vec3 ember = vec3(0.42, 0.075, 0.008);
  vec3 gold = vec3(1.0, 0.46, 0.095);
  vec3 whiteHeat = vec3(1.6, 1.3, 0.77);
  vec3 color = mix(ember, gold, smoothstep(0.15, 0.58, heat));
  color = mix(color, whiteHeat, smoothstep(0.51, 0.85, heat));
  float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
  // Limb darkening and a thin chromosphere preserve the sense of a luminous volume.
  color *= 0.45 + 0.55 * pow(facing, 0.4);
  float rim = pow(1.0 - facing, 4.0);
  color += vec3(1.0, 0.42, 0.07) * rim * (0.35 + broad * 0.5);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
export const coronaVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const coronaFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 5.6;
  float r = length(p);
  if (r < 0.98 || r > 2.8) discard;
  float a = atan(p.y, p.x);
  float turbulence = sin(a * 11.0 + sin(a * 7.0 - uTime * 0.08) * 2.0 + r * 3.0);
  float threads = pow(0.5 + 0.5 * sin(a * 47.0 + turbulence * 3.0 + sin(r * 9.0 + a * 13.0) * 0.7 + uTime * 0.13), 6.0);
  float petals = 0.5 + 0.5 * sin(a * 5.0 + sin(a * 9.0 + uTime * 0.06));
  float edge = max(r - 1.0, 0.0);
  float inner = exp(-edge * 15.0) * 0.44;
  float stream = exp(-edge * (6.5 - petals * 2.0)) * (0.028 + threads * 0.12);
  float haze = exp(-edge * 3.0) * 0.024;
  float fade = 1.0 - smoothstep(1.8, 2.8, r);
  vec3 color = vec3(1.0, 0.53, 0.17) * (inner + stream) + vec3(0.72, 0.53, 0.34) * haze;
  gl_FragColor = vec4(color * fade, 1.0);
  #include <colorspace_fragment>
}
`;
export const fieldVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColor = aColor * (0.92 + 0.08 * sin(uTime * 0.35 + aPhase));
  gl_PointSize = clamp(aSize * uPixelRatio * 40.0 / max(-mv.z, 1.0), 1.0 * uPixelRatio, 3.5 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`;
export const fieldFragment = /* glsl */ `
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float light = exp(-r * r * 3.5) * (1.0 - smoothstep(0.7, 1.0, r));
  gl_FragColor = vec4(vColor * light, 1.0);
  #include <colorspace_fragment>
}
`;
