import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CinematicScene, type SceneProps } from './CinematicScene';

export default function CinematicCanvas(props: SceneProps & { active: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setMounted(true);
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return mounted ? <Canvas camera={{ position: [0, 0, 0], fov: 48, near: 0.08, far: 220 }}
    dpr={[1, 1.5]} gl={{ antialias: false, alpha: false }}
    frameloop={props.active && visible ? 'always' : 'never'}>
    <CinematicScene {...props} />
  </Canvas> : null;
}
