import { restingDistance } from './framing';
import type { PlanetRotation } from './PlanetRotation';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, Color, Group, Mesh, Points, PointLight, ShaderMaterial, Vector3 } from 'three';
import { Astronaut } from '../astronaut/Astronaut';
import { smooth } from '../dev/cinematic/timeline';
import { UniverseCamera } from '../universe/camera';
import { createStarField } from '../universe/model';
import { fieldVertex, fieldFragment } from '../universe/shaders';
import { surfaceVertex, livingStarFragment, haloVertex, haloFragment, planetFragment, memoryFragment } from './spaceShaders';
import { ROTATABLE, WORLDS, worldIndex, type WorldId } from './worlds';
export type SpaceFocus=WorldId|null;
export type ProductSceneProps={active:boolean;reducedMotion:boolean;controls:UniverseCamera;focus:SpaceFocus;count:number;status:'available'|'active'|'empty';
 /** Bounded 0–1 streak response and preserved-photo presence. Both derived, never stored. */
 momentum:number;stored:number;
 /** One controller per rotatable world, in ROTATABLE order. */
 rotations:readonly PlanetRotation[];onProject:(index:number,x:number,y:number)=>void};
// Positions are built once from the shared world list, so the scene and the overlay agree.
const POSITIONS=WORLDS.map(world=>new Vector3(world.at[0],world.at[1],world.at[2]));
const placeOf=(id:WorldId)=>POSITIONS[worldIndex(id)];
const TODAY=placeOf('today'),HISTORY=placeOf('history'),PERSON=placeOf('profile'),MEMORY=placeOf('memory'),HERO=placeOf('star');
export function ProductScene({reducedMotion,controls,focus,count,status,momentum,stored,onProject,rotations}:ProductSceneProps){
 const today=useRef<Mesh>(null),history=useRef<Mesh>(null),memory=useRef<Mesh>(null),fragments=useRef<Points>(null);
 const star=useRef<Mesh>(null),halo=useRef<Mesh>(null),person=useRef<Group>(null),packet=useRef<Mesh>(null),remnants=useRef<Points>(null);
 const starMat=useRef<ShaderMaterial>(null),haloMat=useRef<ShaderMaterial>(null),fieldMat=useRef<ShaderMaterial>(null);
 const todayMat=useRef<ShaderMaterial>(null),historyMat=useRef<ShaderMaterial>(null),memoryMat=useRef<ShaderMaterial>(null);
 const personResponse=useRef(0),live=useRef(0),held=useRef(0),flare=useRef(0),nextFlare=useRef(14);
 const key=useRef<PointLight>(null);
 const previousStored=useRef(stored),memoryPulse=useRef(0);
 const time=useRef(0),previousCount=useRef(count),consequence=useRef(99);
 const look=useMemo(()=>new Vector3(),[]),target=useMemo(()=>new Vector3(),[]),desired=useMemo(()=>new Vector3(),[]),projected=useMemo(()=>new Vector3(),[]);
 const turning=useMemo(()=>({today,history,memory} as Partial<Record<WorldId,typeof today>>),[]);
 const {camera:sceneCamera,size:viewport}=useThree();
 const restZ=useMemo(()=>restingDistance(viewport.width,viewport.height),[viewport.width,viewport.height]);
 const initialFocus=useRef(focus);
 useLayoutEffect(()=>{if(!initialFocus.current||reducedMotion){sceneCamera.position.set(0,0,restZ);sceneCamera.lookAt(look);return;}const p=placeOf(initialFocus.current);sceneCamera.position.set(p.x+.2,p.y+.05,p.z+(initialFocus.current==='profile'?6.4:initialFocus.current==='star'?8.4:7.1));look.set(p.x,p.y-1.15,p.z);sceneCamera.lookAt(look);},[sceneCamera,look,reducedMotion,restZ]);
 const field=useMemo(()=>createStarField(7021,900),[]);
 const remnantPositions=useMemo(()=>{const p=new Float32Array(32*3);for(let i=0;i<32;i++){const radius=.65+Math.sqrt(i)*.09;p.set([HISTORY.x+Math.cos(i*2.399)*radius,HISTORY.y+Math.sin(i*2.399)*radius*.55,HISTORY.z+Math.sin(i*1.7)*.3],i*3);}return p;},[]);
 const starUniforms=useMemo(()=>({time:{value:0},energy:{value:1},momentum:{value:0},flare:{value:0}}),[]);
 const memoryUniforms=useMemo(()=>({starPosition:{value:HERO},tint:{value:new Color('#6a5568')},time:{value:0},selected:{value:0},presence:{value:1},stored:{value:0}}),[]);
 // A thin ring of kept fragments. Fixed count, no allocation per frame, hidden when empty.
 const fragmentPositions=useMemo(()=>{const p=new Float32Array(26*3);for(let i=0;i<26;i++){const a=i*2.399,radius=.72+((i*37)%11)*.014;p.set([Math.cos(a)*radius,Math.sin(a)*radius*.34,Math.sin(a*1.4)*radius*.5],i*3);}return p;},[]);
 const fieldUniforms=useMemo(()=>({uTime:{value:0},uPixelRatio:{value:1},quiet:{value:1}}),[]);
 const todayUniforms=useMemo(()=>({starPosition:{value:HERO},tint:{value:new Color('#677887')},time:{value:0},selected:{value:0},presence:{value:1}}),[]);
 const historyUniforms=useMemo(()=>({starPosition:{value:HERO},tint:{value:new Color('#635a7c')},time:{value:0},selected:{value:0},presence:{value:1}}),[]);
 useFrame(({camera,size,gl},delta)=>{
  const dt=Math.min(delta,.05),blend=1-Math.exp(-dt*3.2);
  if(!reducedMotion)time.current+=dt;
  if(count!==previousCount.current){previousCount.current=count;consequence.current=reducedMotion?99:0;}
  consequence.current+=dt;
  controls.step(dt,reducedMotion);
  // Controllers are matched to bodies by world id, not by position in the array.
  rotations.forEach((r,i)=>{r.step(dt,reducedMotion);const mesh=turning[ROTATABLE[i]]?.current;if(mesh)mesh.rotation.set(r.x,r.y,0);});
  if(!focus){
   target.set(0,0,0);
   desired.set(reducedMotion?0:Math.atan(controls.yaw)*1.1,reducedMotion?0:(controls.pitch-.12)*1.4,restZ+(controls.distance-10.5)*.38);
  }else{
   const position=placeOf(focus);
   // Keep the focused body above the native reading plane; never fly through it.
   target.set(position.x,position.y-1.15,position.z);
   desired.set(position.x+.2,position.y+.05,position.z+(focus==='profile'?6.4:focus==='star'?8.4:7.1));
   if(reducedMotion){target.set(0,0,0);desired.set(0,0,restZ);}
  }
  camera.position.lerp(desired,reducedMotion?1:blend);look.lerp(target,reducedMotion?1:blend);camera.lookAt(look);
  const t=consequence.current;
  const pulse=(smooth(1.1,1.7,t)*(1-smooth(2,3.7,t)))*.48;
  // Momentum eases toward its derived level, so a completion is felt as a change, not a jump.
  live.current+=(momentum-live.current)*(reducedMotion?1:blend*.45);
  held.current+=(stored-held.current)*(reducedMotion?1:blend*.45);
  if(stored>previousStored.current)memoryPulse.current=reducedMotion?0:1;
  previousStored.current=stored;memoryPulse.current=Math.max(0,memoryPulse.current-dt*.55);
  if(reducedMotion||focus){flare.current=0;}
  else{
   // A rare, brief lift rather than a constant flicker. Never while a panel is focused.
   nextFlare.current-=dt*(.25+live.current);
   if(nextFlare.current<=0){nextFlare.current=16+Math.random()*22;flare.current=1;}
   flare.current=Math.max(0,flare.current-dt*.85);
  }
  const breath=reducedMotion?0:Math.sin(time.current*.55)*.02*live.current;
  const energy=1+Math.min(count,12)*.035+(status==='active'?.08:0)+pulse+live.current*.16+breath;
  if(star.current)star.current.scale.setScalar(.56+Math.min(count,12)*.007+live.current*.045+pulse*.025);
  for(const material of [starMat.current,haloMat.current])if(material){
   material.uniforms.time.value=time.current;
   material.uniforms.energy.value=energy*(focus&&focus!=='star'?.6:1);
   material.uniforms.momentum.value=live.current;
   material.uniforms.flare.value=flare.current*flare.current*live.current;
  }
  if(halo.current){halo.current.quaternion.copy(camera.quaternion);halo.current.scale.setScalar((.56+Math.min(count,12)*.007)*(5.8+live.current*1.5));}
  if(memoryMat.current){const u=memoryMat.current.uniforms;u.time.value=time.current;u.stored.value=Math.min(1,held.current+memoryPulse.current*.18);
   u.selected.value+=(Number(focus==='memory')-u.selected.value)*blend;
   u.presence.value+=((focus&&focus!=='memory'?.22:1)-u.presence.value)*blend;}
  if(fragments.current){
   fragments.current.visible=held.current>.01;
   if(!reducedMotion)fragments.current.rotation.set(.42,time.current*.06,.12);
  }
  if(key.current)key.current.intensity=30+live.current*9;
  if(fieldMat.current){fieldMat.current.uniforms.uTime.value=time.current;fieldMat.current.uniforms.uPixelRatio.value=gl.getPixelRatio();fieldMat.current.uniforms.quiet.value+=((focus ? .42 : 1)-fieldMat.current.uniforms.quiet.value)*blend;}
  for(const [material,selected] of [[todayMat.current,focus==='today'],[historyMat.current,focus==='history']] as const)if(material){material.uniforms.selected.value+=(Number(selected)-material.uniforms.selected.value)*blend;material.uniforms.presence.value+=((focus && !selected ? .22 : 1)-material.uniforms.presence.value)*blend;}
  personResponse.current+=((focus==='profile'?.12:pulse*.12)-personResponse.current)*(reducedMotion?1:1-Math.exp(-dt*1.3));
  if(person.current){person.current.position.copy(PERSON);if(!reducedMotion)person.current.position.y+=Math.sin(time.current*.11)*.035;person.current.rotation.set(.12,-.6+(reducedMotion?0:Math.sin(time.current*.07)*.07+personResponse.current),-.2+(reducedMotion?0:Math.sin(time.current*.055)*.025+personResponse.current*.5)-pulse*.08);}
  if(packet.current){const progress=smooth(.25,1.6,t);packet.current.visible=t<1.8&&t>.25;packet.current.position.lerpVectors(TODAY,HERO,progress);packet.current.position.z+=Math.sin(progress*Math.PI)*.7;}
  if(remnants.current)remnants.current.geometry.setDrawRange(0,Math.min(32,Math.max(0,count-(t<2.4?1:0))));
  camera.updateMatrixWorld();
  // One projection per world, in the shared order the overlay indexes by.
  WORLDS.forEach((world,index)=>{
   projected.copy(world.id==='profile'&&person.current?person.current.position:POSITIONS[index]).project(camera);
   onProject(index,(projected.x+1)*size.width/2,(1-projected.y)*size.height/2);
  });
 });
 return <>
  <color attach="background" args={['#000002']}/>
  <points frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[field.positions,3]}/><bufferAttribute attach="attributes-aColor" args={[field.colors,3]}/><bufferAttribute attach="attributes-aSize" args={[field.sizes,1]}/><bufferAttribute attach="attributes-aPhase" args={[field.phases,1]}/></bufferGeometry><shaderMaterial ref={fieldMat} uniforms={fieldUniforms} vertexShader={fieldVertex} fragmentShader={'uniform float quiet;\n'+fieldFragment.replace('vColor * light','vColor * light * quiet')} transparent depthWrite={false} blending={AdditiveBlending}/></points>
  <mesh ref={star} position={HERO} scale={.56}><sphereGeometry args={[1,40,28]}/><shaderMaterial ref={starMat} uniforms={starUniforms} vertexShader={surfaceVertex} fragmentShader={livingStarFragment}/></mesh>
  <mesh ref={halo} position={HERO} scale={3.25}><planeGeometry args={[1,1]}/><shaderMaterial ref={haloMat} uniforms={starUniforms} vertexShader={haloVertex} fragmentShader={haloFragment} transparent depthWrite={false} blending={AdditiveBlending}/></mesh>
  <mesh ref={today} position={TODAY}><sphereGeometry args={[.62,40,28]}/><shaderMaterial ref={todayMat} uniforms={todayUniforms} vertexShader={surfaceVertex} fragmentShader={planetFragment}/></mesh>
  <mesh ref={history} position={HISTORY}><sphereGeometry args={[.38,28,20]}/><shaderMaterial ref={historyMat} uniforms={historyUniforms} vertexShader={surfaceVertex} fragmentShader={planetFragment}/></mesh>
  {/* Memory: what those completions looked like, not the record of them. */}
  <mesh ref={memory} position={MEMORY}><sphereGeometry args={[.47,32,22]}/><shaderMaterial ref={memoryMat} uniforms={memoryUniforms} vertexShader={surfaceVertex} fragmentShader={memoryFragment}/></mesh>
  <points ref={fragments} position={MEMORY} visible={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[fragmentPositions,3]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} blending={AdditiveBlending} vertexShader="void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(38./max(1.,-p.z),1.6,4.2);}" fragmentShader="void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(1.,.82,.58,(1.-smoothstep(.1,1.,r))*.55);}"/></points>
  {/* The transform belongs to this replaceable asset boundary, not the profile UI. */}
  <group ref={person} position={PERSON} scale={.38}><Astronaut reducedMotion={reducedMotion}/></group>
  {/* A broad conceptual star key keeps its screen direction while reaching the visor-facing surface. */}
  <ambientLight intensity={.035}/><pointLight ref={key} position={[HERO.x,HERO.y,3.5]} color="#ffe0b1" intensity={30} distance={18} decay={2}/><directionalLight position={[4,1,-4]} color="#92b8e2" intensity={.65}/>
  <mesh ref={packet} visible={false}><sphereGeometry args={[.045,10,8]}/><meshBasicMaterial color="#fff1d6" toneMapped={false}/></mesh>
  <points ref={remnants}><bufferGeometry><bufferAttribute attach="attributes-position" args={[remnantPositions,3]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} blending={AdditiveBlending} vertexShader="void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(45./max(1.,-p.z),2.,5.);}" fragmentShader="void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.8,.86,.95,(1.-smoothstep(.15,1.,r))*.8);}"/></points>
 </>;
}
