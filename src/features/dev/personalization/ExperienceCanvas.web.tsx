import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PersonalizationScene, type PersonalizationProps } from './PersonalizationScene';
export default function ExperienceCanvas(props: PersonalizationProps & { active: boolean }) {
  const [mounted,setMounted]=useState(false);
  const [visible,setVisible]=useState(true);
  useEffect(()=>{
    setMounted(true);
    const change=()=>{setVisible(!document.hidden); props.interaction.setActive(props.active && !document.hidden);};
    change(); document.addEventListener('visibilitychange',change);
    return ()=>document.removeEventListener('visibilitychange',change);
  },[props.active,props.interaction]);
  return mounted ? <Canvas camera={{position:[0,0,0],fov:48,near:0.08,far:220}} gl={{antialias:false,alpha:false}} dpr={[1,1.5]} frameloop={props.active && visible ? 'always':'never'}>
    <PersonalizationScene {...props}/>
  </Canvas> : null;
}
