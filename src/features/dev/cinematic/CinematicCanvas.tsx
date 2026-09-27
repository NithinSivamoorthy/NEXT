import { Canvas } from '@react-three/fiber/native';
import { CinematicScene, type SceneProps } from './CinematicScene';

export default function CinematicCanvas(props: SceneProps & { active: boolean }) {
  return <Canvas camera={{ position: [0, 0, 0], fov: 48, near: 0.08, far: 220 }}
    gl={{ antialias: false, alpha: false }}
    frameloop={props.active ? 'always' : 'never'}>
    <CinematicScene {...props} />
  </Canvas>;
}
