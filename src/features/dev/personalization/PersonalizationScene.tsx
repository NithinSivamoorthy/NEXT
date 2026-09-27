import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Group, Points, ShaderMaterial, Vector3 } from 'three';
import { CinematicScene, type SceneProps } from '../cinematic/CinematicScene';
import { smooth } from '../cinematic/timeline';
import { contactTravelClock } from './travelProfile';
import { FirstConsequence } from './FirstConsequence';
import { consequenceAt } from './consequence';
import type { FirstContact } from './interaction';
export type PersonalizationProps = SceneProps & {
  children?: ReactNode;
  interaction: FirstContact;
  onProject: (x: number, y: number) => void;
};

export function PersonalizationScene(props: PersonalizationProps) {
  const orientation = useRef(0);
  const onProxyFrame = useCallback((proxy: Group, dt: number) => {
    // Add only a small roll toward the upper-left light; no translation/head gesture.
    // Reduced Motion preserves the original pose entirely.
    const target = props.reducedMotion ? 0 : props.interaction.commitCount ? 0.085 : props.interaction.available ? 0.035 : 0;
    orientation.current += (target - orientation.current) * (1 - Math.exp(-dt * 0.65));
    proxy.rotation.z += orientation.current;
    // Witness the formation with a delayed additional ~5 degree roll, no translation.
    if (!props.reducedMotion && props.interaction.answerCommitCount) {
      proxy.rotation.z += 0.09 * smooth(1.5, 3.5, props.interaction.elapsed - props.interaction.answeredAt);
    }
  }, [props.interaction, props.reducedMotion]);
  return <><CinematicScene {...props} openingHold={2.4} travelClock={contactTravelClock} energeticTravel discoveryEnd={18.75} holdAt={19.25} onProxyFrame={onProxyFrame} /><Signal {...props} /><FirstConsequence {...props} />{props.children}</>;
}
function Signal({ point, reducedMotion, interaction, onProject }: PersonalizationProps) {
  const mesh = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);
  const projected = useMemo(() => new Vector3(), []);
  const positions = useMemo(() => new Float32Array([0, 0, 0]), []);
  const uniforms = useMemo(() => ({ intensity: { value: 0 }, pixelRatio: { value: 1 }, extent: { value: 6 } }), []);
  useFrame(({ camera, size, gl }, dt) => {
    interaction.step(dt, reducedMotion);
    if (!mesh.current || !material.current) return;
    mesh.current.visible = interaction.available;
    if (!interaction.available) return;
    const worldPerPixel = 28 * Math.tan(24 * Math.PI / 180) / point.height;
    mesh.current.position.set(point.x * worldPerPixel - 2, -point.y * worldPerPixel + 0.7, reducedMotion ? -25 : -460);
    mesh.current.updateMatrixWorld(); camera.updateMatrixWorld();
    projected.copy(mesh.current.position).project(camera);
    onProject((projected.x + 1) * size.width / 2, (1 - projected.y) * size.height / 2);
    const age = interaction.elapsed - interaction.appearedAt;
    const ignition = reducedMotion ? smooth(0, 0.3, age) : smooth(0, 0.12, age) * (1 + 1.8 * Math.exp(-(((age - 0.16) / 0.075) ** 2)));
    const response = consequenceAt(interaction.elapsed - interaction.answeredAt, reducedMotion);
    const consequence = interaction.answerCommitCount ? response.settled : 0;
    const contraction = interaction.answerCommitCount ? response.contraction : 0;
    const pulse = interaction.answerCommitCount ? response.pulse : 0;
    const availableAnswer = interaction.phase === 'questionVisible' && interaction.valid;
    const u = material.current.uniforms;
    const intensity = ignition * (2.4 + interaction.commitCount * 0.2 + (availableAnswer ? 0.12 : 0) + consequence * 0.65 + pulse * 1.5 - contraction * 0.3 + (interaction.pressed ? 0.15 : 0));
    u.intensity.value += (intensity - u.intensity.value) * (1 - Math.exp(-dt * 20));
    u.extent.value = 12 + consequence * 0.8 - contraction * 1.6 + pulse * 0.5;
    u.pixelRatio.value = gl.getPixelRatio();
  });
  return <points ref={mesh} visible={false} frustumCulled={false} renderOrder={3}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false} blending={AdditiveBlending}
      vertexShader={`uniform float pixelRatio,extent;
        void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=extent*pixelRatio;}`}
      fragmentShader={`uniform float intensity;
        void main(){float r=length(gl_PointCoord-0.5)*2.0;
          float core=exp(-r*r*32.0);
          float falloff=0.14*exp(-r*r*7.0);
          vec2 q=abs(gl_PointCoord-0.5)*2.0;
          float rays=0.035*(exp(-q.x*65.0)*exp(-q.y*5.0)+exp(-q.y*65.0)*exp(-q.x*5.0));
          core=(core+falloff+rays)*(1.0-smoothstep(0.72,1.0,r));
          gl_FragColor=vec4(vec3(0.96,0.97,1.0)*intensity,core);
        }`} />
  </points>;
}
