import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, Color, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, DirectionalLight, ShaderMaterial, Vector2, Vector3 } from 'three';
import { boundaryVertex, boundaryFragment } from './pointBoundary';
import { TemporaryAstronaut } from './TemporaryAstronaut';
import { ARRIVAL_DELAY, CONTROLS_AT, PEAK_VELOCITY, smooth, travel } from './timeline';

export type SceneProps = {
  /** Optional development-host refinements; absent preserves the 4B.2 baseline. */
  /** Optional title-only pause; zero preserves the original cinematic. */
  openingHold?: number;
  energeticTravel?: boolean;
  discoveryEnd?: number;
  holdAt?: number;
  travelClock?: (seconds: number) => { time: number; rate: number };
  onProxyFrame?: (proxy: Group, delta: number) => void;
  reducedMotion: boolean;
  point: { x: number; y: number; diameter: number; height: number };
  onTime: (seconds: number, elapsedSeconds: number) => void;
  onHold: () => void;
};
const COUNT = 700;
const vertex = `attribute float weight;
varying float vWeight;
uniform float brightness;
uniform vec3 pointView;
uniform float apertureRadius;
uniform float interior;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_PointSize = clamp(110.0 / max(1.0, -p.z), 1.4, 3.5);
  vec2 atBoundary = p.xy * max(0.001, -pointView.z) / max(0.001, -p.z);
  float radial = length(atBoundary - pointView.xy) / max(0.0001, apertureRadius);
  float window = 1.0 - smoothstep(0.78, 1.22, radial);
  vWeight = weight * brightness * smoothstep(0.5, 5.0, -p.z) * mix(window, 1.0, interior);
}`;
const trailVertex = vertex.replace('attribute float weight;', 'attribute vec3 color; varying vec3 vColor;')
  .replace('void main() {', 'void main() { vColor = color;')
  .replace('weight * brightness', 'brightness');
const trailFragment = `varying float vWeight; varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, vWeight); }`;
const fragment = `varying float vWeight;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.15, 1.0, r)) * vWeight;
  gl_FragColor = vec4(0.76, 0.83, 1.0, a);
}`;
const glowVertex = `varying vec2 vUv;
void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const glowFragment = `varying vec2 vUv; uniform float strength;
void main(){ float r=length(vUv-0.5)*2.0;
float a=exp(-r*r*9.0)*(1.0-smoothstep(0.65,1.0,r));
gl_FragColor=vec4(0.60,0.73,1.0,a*strength); }`;

export function CinematicScene({ reducedMotion, point, onTime, onHold, travelClock, onProxyFrame, openingHold = 0, energeticTravel = false, discoveryEnd = 20, holdAt = CONTROLS_AT }: SceneProps) {
  const time = useRef(0);
  const held = useRef(false);
  const pointMesh = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const boundary = useRef<Mesh>(null);
  const starMaterial = useRef<ShaderMaterial>(null);
  const proxy = useRef<Group>(null);
  const key = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const stars = useMemo(() => {
    let seed = 4917;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const origins = new Float32Array(COUNT * 3);
    const positions = new Float32Array(COUNT * 3);
    const trails = new Float32Array(COUNT * 6);
    const colors = new Float32Array(COUNT * 6);
    const weights = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // Broad volume, not a screen-space radial distribution. Camera parallax provides depth.
      origins.set([(random() - 0.5) * 160, (random() - 0.5) * 120, random() * 180], i * 3);
      weights[i] = 0.16 + random() ** 3 * 0.7;
      const tint = new Color().setRGB(0.64 + random() * 0.15, 0.73 + random() * 0.12, 0.88);
      colors.set([tint.r * weights[i], tint.g * weights[i], tint.b * weights[i], 0, 0, 0], i * 6);
    }
    return { origins, positions: new BufferAttribute(positions, 3), trails: new BufferAttribute(trails, 3), colors: new BufferAttribute(colors, 3), weights: new BufferAttribute(weights, 1) };
  }, []);
  const starUniforms = useMemo(() => ({ brightness: { value: 0 }, pointView: { value: new Vector3() }, apertureRadius: { value: 0.1 }, interior: { value: 0 } }), []);
  const boundaryUniforms = useMemo(() => ({ centerView: { value: new Vector3() }, lens: { value: new Vector2() }, radius: { value: 0.1 }, reveal: { value: 0 }, development: { value: 0 }, proximity: { value: 0 } }), []);
  const trailUniforms = useMemo(() => ({ brightness: { value: 0 }, pointView: { value: new Vector3() }, apertureRadius: { value: 0.1 }, interior: { value: 0 } }), []);
  const glowUniforms = useMemo(() => ({ strength: { value: 0 } }), []);
  const trailMaterial = useRef<ShaderMaterial>(null);
  useFrame(({ camera }, delta) => {
    // A resumed/background frame never advances the journey by a wall-clock gap.
    time.current += Math.min(delta, 0.05);
    const rawTime = time.current;
    // Pause before approach begins. Later animation samples are unchanged, only offset.
    const holdAtTime = reducedMotion ? 2 : 1.25;
    const journeyTime = rawTime <= holdAtTime ? rawTime : Math.max(holdAtTime, rawTime - openingHold);
    const clock = !reducedMotion && travelClock ? travelClock(journeyTime) : { time: journeyTime, rate: 1 };
    const t = clock.time;
    // R3F may copy uniform wrapper objects when applying props. Update the live
    // materials, not the initial scalar wrappers; vector references alone survive.
    const boundaryU = ((boundary.current?.material as ShaderMaterial)?.uniforms ?? boundaryUniforms) as typeof boundaryUniforms;
    const starU = (starMaterial.current?.uniforms ?? starUniforms) as typeof starUniforms;
    const glowU = ((glow.current?.material as ShaderMaterial)?.uniforms ?? glowUniforms) as typeof glowUniforms;
    const setupTime = reducedMotion ? t : t * 1.6;
    if (setupTime < 5.6) onTime(Math.min(setupTime, 5.5), rawTime);
    const arrivalTime = reducedMotion ? t : t - ARRIVAL_DELAY;
    if (arrivalTime >= holdAt && !held.current) { held.current = true; onHold(); }
    const motion = travel(t);
    const distance = reducedMotion ? 0 : motion.distance;
    const velocity = reducedMotion ? 0 : motion.velocity * clock.rate;
    const worldPerPixel = 2 * 14 * Math.tan(24 * Math.PI / 180) / point.height;
    const px = point.x * worldPerPixel;
    const py = -point.y * worldPerPixel;
    const aim = reducedMotion ? 0 : smooth(3.2, 5.6, t);
    camera.position.set(px * aim, py * aim, -distance);
    // A slight bank-free sideways settle. No orbit, shake or uncontrolled camera.
    if (!reducedMotion) camera.position.x += 0.18 * smooth(13, 20, arrivalTime);
    camera.rotation.set(0, 0, 0);
    const cam = camera as PerspectiveCamera;
    const fov = 48 + (reducedMotion ? 0 : 3 * velocity / PEAK_VELOCITY);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    const reveal = smooth(0.8, 2, setupTime);
    const pointFade = reducedMotion ? 1 - smooth(6, 9, t) : 1 - smooth(11, 15, distance);
    if (pointMesh.current && glow.current) {
      const radius = point.diameter * worldPerPixel / 2;
      pointMesh.current.position.set(px, py, -14);
      pointMesh.current.scale.setScalar(radius);
      (pointMesh.current.material as MeshBasicMaterial).opacity = reveal * pointFade;
      glow.current.position.set(px, py, -13.98);
      glow.current.scale.setScalar(radius * (7 + smooth(4, 7, t) * 4));
      glowU.strength.value = smooth(2.6, 4.5, t) * pointFade * 0.35;
    }
    const radius = point.diameter * worldPerPixel / 2;
    boundaryU.centerView.value.set(px - camera.position.x, py - camera.position.y, distance - 14);
    boundaryU.lens.value.set(cam.aspect * Math.tan(fov * Math.PI / 360), Math.tan(fov * Math.PI / 360));
    if (boundary.current) boundary.current.visible = distance < 14 + radius * 2.2;
    boundaryU.radius.value = radius;
    boundaryU.reveal.value = reveal;
    boundaryU.development.value = smooth(2.6, 5.5, setupTime);
    boundaryU.proximity.value = smooth(10, 13.8, distance);
    starU.pointView.value.copy(boundaryU.centerView.value);
    starU.apertureRadius.value = radius;
    starU.interior.value = reducedMotion ? 1 : smooth(4, 14.3, distance);
    const spaceReveal = reducedMotion ? smooth(7, 12, t) : smooth(3.2, 5.5, t);
    starU.brightness.value = spaceReveal * (0.55 + velocity / 110 * (energeticTravel ? 2.1 : 1));
    if (trailMaterial.current) {
      const u = trailMaterial.current.uniforms;
      u.brightness.value = spaceReveal * velocity / 110 * (energeticTravel ? 2.6 : 1);
      u.pointView.value.copy(starU.pointView.value);
      u.apertureRadius.value = starU.apertureRadius.value;
      u.interior.value = starU.interior.value;
    }
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3;
      let x = stars.origins[j];
      let y = stars.origins[j + 1];
      let originDepth = stars.origins[j + 2];
      if (!reducedMotion) {
        // Uniform volume for every star: no special central cone or depth compression.
        x += px;
        y += py;
        originDepth += 14;
        // Opt-in broad near-pass layer, distributed across the volume, never a cone.
        if (energeticTravel && i % 4 === 0) { x = px + stars.origins[j] * 0.38; y = py + stars.origins[j + 1] * 0.38; }
      }
      const depth = ((originDepth - distance) % 180 + 180) % 180;
      // Recycle beyond the eye; near-plane fading hides the wrap.
      const z = -distance - depth - 0.5;
      stars.positions.setXYZ(i, x, y, z);
      const proximity = 1 - smooth(8, 95, depth);
      const variation = 0.55 + stars.weights.array[i] * 0.8;
      const tail = energeticTravel
        ? Math.min(11, velocity * 0.052 * variation * (0.55 + proximity * 1.25))
        : Math.min(travelClock ? 4.2 : 2.8, velocity * 0.034);
      stars.trails.setXYZ(i * 2, x, y, z);
      stars.trails.setXYZ(i * 2 + 1, x, y, z - tail);
    }
    stars.positions.needsUpdate = true;
    stars.trails.needsUpdate = true;
    const discovery = smooth(16, discoveryEnd, arrivalTime);
    if (proxy.current) {
      // Entire character is only ~10–12% of portrait height; the rest is negative space.
      const depth = reducedMotion ? 25 : 460;
      const quietTime = Math.max(0, arrivalTime - 16);
      proxy.current.position.set(px + 1.8 + (reducedMotion ? 0 : Math.sin(quietTime * 0.045) * 0.15), py - 1.7, -depth);
      proxy.current.rotation.set(0.15, -0.72 + (reducedMotion ? 0 : Math.sin(quietTime * 0.025) * 0.12), -0.3 + (reducedMotion ? 0 : Math.sin(quietTime * 0.035) * 0.07));
      proxy.current.visible = discovery > 0;
      onProxyFrame?.(proxy.current, Math.min(delta, 0.05));
    }
    if (key.current) {
      key.current.position.set(px - 8, py + 7, -(reducedMotion ? 17 : 450));
      key.current.intensity = discovery * 2;
      if (proxy.current) key.current.target = proxy.current;
    }
    if (rim.current) {
      rim.current.position.set(px + 5, py + 3, -(reducedMotion ? 30 : 465));
      rim.current.intensity = discovery * 3.4;
      if (proxy.current) rim.current.target = proxy.current;
    }
  });
  return <>
    <color attach="background" args={['#000000']} />
    <points frustumCulled={false} renderOrder={2}>
      <bufferGeometry><primitive attach="attributes-position" object={stars.positions} /><primitive attach="attributes-weight" object={stars.weights} /></bufferGeometry>
      <shaderMaterial ref={starMaterial} uniforms={starUniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} blending={AdditiveBlending} />
    </points>
    <lineSegments frustumCulled={false}>
      <bufferGeometry><primitive attach="attributes-position" object={stars.trails} /><primitive attach="attributes-color" object={stars.colors} /></bufferGeometry>
      <shaderMaterial ref={trailMaterial} uniforms={trailUniforms} vertexShader={trailVertex} fragmentShader={trailFragment} transparent depthWrite={false} blending={AdditiveBlending} />
    </lineSegments>
    {!reducedMotion && <mesh ref={boundary} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial uniforms={boundaryUniforms} vertexShader={boundaryVertex} fragmentShader={boundaryFragment} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} />
    </mesh>}
    <mesh visible={reducedMotion} ref={pointMesh}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#f5f5f5" transparent opacity={0} toneMapped={false} /></mesh>
    <mesh visible={reducedMotion} ref={glow}><planeGeometry args={[2, 2]} /><shaderMaterial uniforms={glowUniforms} vertexShader={glowVertex} fragmentShader={glowFragment} transparent depthWrite={false} blending={AdditiveBlending} /></mesh>
    <directionalLight ref={key} color="#a9bdd9" intensity={0} />
    <directionalLight ref={rim} color="#cfdbef" intensity={0} />
    <TemporaryAstronaut ref={proxy} />
  </>;
}
