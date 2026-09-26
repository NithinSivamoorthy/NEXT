import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Mesh } from 'three';
import { UniverseCamera } from './camera';
import { createStarField, HERO_STAR } from './model';
import { coronaFragment, coronaVertex, fieldFragment, fieldVertex, starFragment, starVertex } from './shaders';

export type UniverseProps = { controls: UniverseCamera; active: boolean; reducedMotion: boolean };

export function UniverseScene({ controls, reducedMotion }: UniverseProps) {
  const stars = useMemo(() => createStarField(HERO_STAR.seed), []);
  const star = useRef<Mesh>(null);
  const corona = useRef<Mesh>(null);
  const time = useMemo(() => ({ uTime: { value: 0 } }), []);
  const field = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }), []);

  useFrame(({ camera, gl, size }, delta) => {
    controls.step(delta, reducedMotion);
    // Keep the entire core visible even in narrow split-screen web viewports.
    const minimumDistance = 1.3 / (Math.tan(25 * Math.PI / 180) * Math.min(size.width / size.height, 1));
    const distance = Math.max(controls.distance, minimumDistance);
    const horizontal = Math.cos(controls.pitch) * distance;
    camera.position.set(Math.sin(controls.yaw) * horizontal, Math.sin(controls.pitch) * distance, Math.cos(controls.yaw) * horizontal);
    camera.lookAt(0, 0, 0);
    if (!reducedMotion) time.uTime.value += Math.min(delta, 0.05);
    field.uTime.value = time.uTime.value;
    field.uPixelRatio.value = gl.getPixelRatio();
    if (star.current) star.current.rotation.y = time.uTime.value * 0.018;
    if (corona.current) corona.current.quaternion.copy(camera.quaternion);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[stars.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[stars.sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[stars.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial vertexShader={fieldVertex} fragmentShader={fieldFragment} uniforms={field} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </points>
      <mesh ref={star} name={HERO_STAR.id}>
        <sphereGeometry args={[HERO_STAR.radius, 64, 40]} />
        <shaderMaterial vertexShader={starVertex} fragmentShader={starFragment} uniforms={time} toneMapped={false} />
      </mesh>
      <mesh ref={corona}>
        <planeGeometry args={[5.6, 5.6]} />
        <shaderMaterial vertexShader={coronaVertex} fragmentShader={coronaFragment} uniforms={time} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
    </>
  );
}
