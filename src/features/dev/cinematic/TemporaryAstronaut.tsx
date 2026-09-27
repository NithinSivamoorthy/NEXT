import { forwardRef } from 'react';
import type { Group } from 'three';

/** TEMPORARY blocking mannequin. No final asset, textures or production identity. */
export const TemporaryAstronaut = forwardRef<Group>(function TemporaryAstronaut(_, ref) {
  const limb = (key: string, position: [number, number, number], scale: [number, number, number], rotation = 0) =>
    <mesh key={key} position={position} scale={scale} rotation={[0, 0, rotation]}>
      <capsuleGeometry args={[1, 1, 3, 6]} />
      <meshStandardMaterial color="#777e85" roughness={0.94} />
    </mesh>;
  return <group ref={ref}>
    <mesh scale={[0.36, 0.52, 0.22]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#858b91" roughness={0.95} /></mesh>
    <mesh position={[0, 0.7, 0]} scale={[0.3, 0.34, 0.3]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#929aa2" roughness={0.8} /></mesh>
    <mesh position={[0, 0.71, 0.21]} scale={[0.24, 0.22, 0.12]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#06090d" roughness={0.32} metalness={0.35} /></mesh>
    <mesh position={[0, 0.05, -0.29]} scale={[0.55, 0.73, 0.3]}><boxGeometry /><meshStandardMaterial color="#646c75" roughness={1} /></mesh>
    {limb('left-arm', [-0.47, -0.03, 0.04], [0.115, 0.24, 0.115], -0.38)}
    {limb('right-arm', [0.49, 0.08, 0.1], [0.115, 0.24, 0.115], 0.55)}
    {limb('left-leg', [-0.21, -0.85, 0.02], [0.14, 0.32, 0.14], -0.12)}
    {limb('right-leg', [0.25, -0.8, 0.15], [0.14, 0.29, 0.14], 0.27)}
    <mesh position={[-0.26, -1.32, 0.1]} scale={[0.25, 0.2, 0.38]}><boxGeometry /><meshStandardMaterial color="#434a54" roughness={1} /></mesh>
    <mesh position={[0.38, -1.2, 0.23]} scale={[0.25, 0.2, 0.38]}><boxGeometry /><meshStandardMaterial color="#434a54" roughness={1} /></mesh>
  </group>;
});
