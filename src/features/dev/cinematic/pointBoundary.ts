/** Analytic world-space luminous volume. No render target, texture or post-process.
 * The quad is only raster coverage: rays intersect a fixed sphere at the period's
 * scene position, including when the camera is inside/nearer than its near plane.
 */
export const boundaryVertex = `varying vec2 vScreen;
void main() { vScreen = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
export const boundaryFragment = `
varying vec2 vScreen;
uniform vec3 centerView;
uniform vec2 lens;
uniform float radius;
uniform float reveal;
uniform float development;
uniform float proximity;
void main() {
  vec3 ray = normalize(vec3(vScreen * lens, -1.0));
  float along = dot(centerView, ray);
  float closest2 = max(0.0, dot(centerView, centerView) - along * along);
  float outer = radius * 2.2;
  float discriminant = outer * outer - closest2;
  if (discriminant <= 0.0 || along + sqrt(discriminant) <= 0.0) discard;
  float halfChord = sqrt(discriminant);
  float entry = max(0.0, along - halfChord);
  float exitDistance = along + halfChord;
  float chord = (exitDistance - entry) / (2.0 * outer);
  vec3 samplePosition = (ray * (entry + exitDistance) * 0.5 - centerView) / radius;
  float irregularity = sin(samplePosition.x * 3.1 + samplePosition.z * 1.7)
    * sin(samplePosition.y * 3.7 - samplePosition.z * 2.3);
  float radial = sqrt(closest2) / radius;
  float edge = radial + irregularity * proximity * 0.08;
  float core = 1.0 - smoothstep(0.82 - proximity * 0.18, 1.04 + proximity * 0.2, edge);
  // Attenuate the core on exit rather than losing it at the near clipping plane.
  float forwardCore = smoothstep(-radius, radius, along);
  // Far away it reads as punctuation. Close up, a concentrated density profile
  // replaces the flat interior rather than broadening it into an opaque disk.
  core = mix(core, exp(-edge * edge * 3.8), proximity) * forwardCore;
  float halo = exp(-radial * radial * 2.4) * chord * development;
  float structure = 0.86 + 0.14 * sin(samplePosition.x * 1.9 + samplePosition.y * 2.4 + samplePosition.z);
  float radiance = core * mix(0.94, 0.72, proximity)
    + halo * mix(0.08, 0.18, proximity) * structure;
  vec3 warmWhite = mix(vec3(0.96), vec3(1.0, 0.99, 0.97), proximity);
  gl_FragColor = vec4(warmWhite, min(0.88, radiance) * reveal);
}`;
