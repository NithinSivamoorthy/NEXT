import { Canvas } from '@react-three/fiber/native';
import { PersonalizationScene, type PersonalizationProps } from './PersonalizationScene';
export default function ExperienceCanvas(props: PersonalizationProps & { active: boolean }) {
  return <Canvas camera={{ position:[0,0,0], fov:48, near:0.08, far:220 }} gl={{ antialias:false, alpha:false }} frameloop={props.active ? 'always' : 'never'}>
    <PersonalizationScene {...props} />
  </Canvas>;
}
