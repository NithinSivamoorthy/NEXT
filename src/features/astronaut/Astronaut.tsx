import { forwardRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { loadAstronaut } from './load';
import { createAstronautInstance } from './pose';

/** Same composition boundary as the former proxy. No spinner or proxy swap. */
export const Astronaut=forwardRef<Group,{reducedMotion?:boolean}>(function Astronaut({reducedMotion=false},ref){
  const [instance,setInstance]=useState<ReturnType<typeof createAstronautInstance>|null>(null);
  useEffect(()=>{
    let mounted=true,owned:ReturnType<typeof createAstronautInstance>|undefined;
    loadAstronaut().then(gltf=>{
      if(!mounted)return;
      owned=createAstronautInstance(gltf.scene);
      for(const material of owned.materials){material.transparent=true;material.opacity=0;material.depthWrite=false;}
      setInstance(owned);
    }).catch(error=>console.warn('[NEXT astronaut] Load failed; scene remains available:',error));
    return()=>{mounted=false;owned?.dispose();};
  },[]);
  useFrame((_,delta)=>{
    if(!instance || instance.materials[0].opacity===1)return;
    const opacity=Math.min(1,instance.materials[0].opacity+Math.min(delta,.05)/(reducedMotion?.25:.9));
    for(const material of instance.materials){material.opacity=opacity;if(opacity===1){material.transparent=false;material.depthWrite=true;material.needsUpdate=true;}}
  });
  return <group ref={ref}>{instance&&<primitive object={instance.group} dispose={null}/>}</group>;
});
