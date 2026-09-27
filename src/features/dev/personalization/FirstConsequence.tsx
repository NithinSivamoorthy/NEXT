import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, Group, ShaderMaterial } from 'three';
import type { SceneProps } from '../cinematic/CinematicScene';
import type { FirstContact } from './interaction';
import { consequenceAt, fragmentPosition, fragments, FRAGMENT_COUNT, TRACE_SEGMENTS } from './consequence';

/** Local matter only. No camera ownership, answer state, textures, or scene-wide effects. */
export function FirstConsequence({ interaction, point, reducedMotion }: Pick<SceneProps, 'point' | 'reducedMotion'> & { interaction: FirstContact }) {
  const coordinate = useMemo<[number, number, number]>(() => [0, 0, 0], []);
  const group = useRef<Group>(null);
  const dots = useRef<ShaderMaterial>(null);
  const traces = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => ({
    positions: new BufferAttribute(new Float32Array(FRAGMENT_COUNT * 3), 3),
    sizes: new BufferAttribute(new Float32Array(fragments.map(f => f.size)), 1),
    weights: new BufferAttribute(new Float32Array(fragments.map(f => f.weight)), 1),
    tails: new BufferAttribute(new Float32Array(FRAGMENT_COUNT * TRACE_SEGMENTS * 6), 3),
    tailWeights: new BufferAttribute(new Float32Array(fragments.flatMap(f => Array.from({ length: TRACE_SEGMENTS * 2 }, (_, j) => f.weight * (1 - j / (TRACE_SEGMENTS * 2))))), 1),
  }), []);
  const uniforms = useMemo(() => ({ opacity: { value: 0 }, pixelRatio: { value: 1 } }), []);
  const traceUniforms = useMemo(() => ({ opacity: { value: 0 } }), []);
  useFrame(({ gl }) => {
    if (!group.current || !dots.current || !traces.current) return;
    group.current.visible = interaction.answerCommitCount === 1;
    if (!group.current.visible) return;
    const age = interaction.elapsed - interaction.answeredAt;
    const state = consequenceAt(age, reducedMotion);
    const worldPerPixel = 28 * Math.tan(24 * Math.PI / 180) / point.height;
    group.current.position.set(point.x * worldPerPixel - 2, -point.y * worldPerPixel + 0.7, reducedMotion ? -25 : -460);
    for (let i = 0; i < fragments.length; i++) {
      const f = fragments[i];
      geometry.positions.setXYZ(i, ...fragmentPosition(f, age, reducedMotion, 0, coordinate));
      for (let j = 0; j < TRACE_SEGMENTS; j++) {
        const length = (0.08 + (i % 3) * 0.035) * state.formation;
        const index = (i * TRACE_SEGMENTS + j) * 2;
        geometry.tails.setXYZ(index, ...fragmentPosition(f, age, reducedMotion, length * j / TRACE_SEGMENTS, coordinate));
        geometry.tails.setXYZ(index + 1, ...fragmentPosition(f, age, reducedMotion, length * (j + 1) / TRACE_SEGMENTS, coordinate));
      }
    }
    geometry.positions.needsUpdate = true;
    geometry.tails.needsUpdate = true;
    dots.current.uniforms.opacity.value = state.opacity * (0.9 + 0.25 * (1 - state.settled));
    dots.current.uniforms.pixelRatio.value = gl.getPixelRatio();
    traces.current.uniforms.opacity.value = state.opacity * state.formation * 0.65;
  });
  const vertex = `attribute float weight; varying float vWeight; void main(){vWeight=weight;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
  return <group ref={group} visible={false}>
    <points frustumCulled={false}>
      <bufferGeometry><primitive attach="attributes-position" object={geometry.positions}/><primitive attach="attributes-weight" object={geometry.weights}/><primitive attach="attributes-size" object={geometry.sizes}/></bufferGeometry>
      <shaderMaterial ref={dots} uniforms={uniforms} transparent depthWrite={false} blending={AdditiveBlending}
        vertexShader={`attribute float size; uniform float pixelRatio; ${vertex.replace('vWeight=weight;', 'vWeight=weight;gl_PointSize=size*pixelRatio;')}`}
        fragmentShader={`varying float vWeight;uniform float opacity;void main(){float r=length(gl_PointCoord-0.5)*2.0;gl_FragColor=vec4(0.7,0.82,1.0,(1.0-smoothstep(0.1,1.0,r))*vWeight*opacity);}`}/>
    </points>
    <lineSegments frustumCulled={false}>
      <bufferGeometry><primitive attach="attributes-position" object={geometry.tails}/><primitive attach="attributes-weight" object={geometry.tailWeights}/></bufferGeometry>
      <shaderMaterial ref={traces} uniforms={traceUniforms} transparent depthWrite={false} blending={AdditiveBlending} vertexShader={vertex}
        fragmentShader="varying float vWeight;uniform float opacity;void main(){gl_FragColor=vec4(0.62,0.75,1.0,vWeight*opacity);}"/>
    </lineSegments>
  </group>;
}
