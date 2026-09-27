import { PlanetRotation } from './PlanetRotation';
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, Text, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { UniverseCamera } from '../universe/camera';
import { useExperience } from '../experience/ExperienceProvider';
import ProductCanvas from './ProductCanvas';
import type { SpaceFocus } from './ProductScene';
import { deriveMomentum, momentumLevel, photoMemories } from './progress';
import { ROTATABLE, WORLDS } from './worlds';
import { ui } from './ui';
class Boundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onError();}render(){return this.state.failed?null:this.props.children;}}
/**
 * Exactly one Animated value and one cached position per world, rebuilt if the world list ever
 * changes length — including across a Fast Refresh, where these refs outlive WORLDS itself.
 */
function useWorldOverlay(width:number,height:number){
 const store=useRef<{targets:Animated.ValueXY[];last:{x:number;y:number}[]}|null>(null);
 if(!store.current||store.current.targets.length!==WORLDS.length){
  store.current={
   targets:WORLDS.map(world=>new Animated.ValueXY({x:width*world.anchor[0]-48,y:height*world.anchor[1]-42+world.labelOffset})),
   last:WORLDS.map(()=>({x:0,y:0})),
  };
 }
 return store.current;
}
export function ProductSpace({focus=null,onToday,onHistory,onProfile,onMemory,onStar}:{focus?:SpaceFocus;onToday?:()=>void;onHistory?:()=>void;onProfile?:()=>void;onMemory?:()=>void;onStar?:()=>void}){
 const {state,settings}=useExperience();const {width,height}=useWindowDimensions();
 const momentum=useMemo(()=>deriveMomentum(state.history),[state.history]);
 const kept=useMemo(()=>photoMemories(state.history).length,[state.history]);
 const [focused,setFocused]=useState(true),[failed,setFailed]=useState(false);
 const [controls]=useState(()=>new UniverseCamera());
 useFocusEffect(useCallback(()=>{setFocused(true);return()=>{setFocused(false);controls.cancel();};},[controls]));
 useEffect(()=>{if(!settings.active||focus)controls.cancel();},[settings.active,focus,controls]);
 const [rotations]=useState(()=>ROTATABLE.map(()=>new PlanetRotation()));
 const rotation=focus?rotations[ROTATABLE.indexOf(focus)]??null:null;
 useEffect(()=>()=>{rotations.forEach(r=>r.cancel());},[rotation,rotations]);
  const spin=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>!!rotation,onMoveShouldSetPanResponder:(_,g)=>!!rotation&&(Math.abs(g.dx)+Math.abs(g.dy)>5),onPanResponderGrant:e=>rotation?.begin(e.nativeEvent.pageX,e.nativeEvent.pageY),onPanResponderMove:e=>rotation?.move(e.nativeEvent.pageX,e.nativeEvent.pageY),onPanResponderRelease:()=>rotation?.release(),onPanResponderTerminate:()=>rotation?.cancel()}),[rotation]);
  // A planet's visible overlay owns its own drag. Pressable keeps taps/accessibility, while
  // the parent claims a gesture only after movement or a second finger. The canvas sibling
  // continues to own empty-space orbit. A second finger hands this gesture to camera pinch.
  const planetGestures=useMemo(()=>ROTATABLE.map((_,index)=>{
    const body=rotations[index];
    const gesture={mode:'idle' as 'idle'|'turn'|'pinch',suppress:false};
    const sample=(event:GestureResponderEvent)=>controls.sample(event.nativeEvent.touches.map(t=>({id:t.identifier,x:t.pageX,y:t.pageY})),width,height);
    const responder=PanResponder.create({
      onStartShouldSetPanResponder:e=>e.nativeEvent.touches.length>1,
      onMoveShouldSetPanResponder:(e,g)=>e.nativeEvent.touches.length>1||Math.hypot(g.dx,g.dy)>8,
      onPanResponderGrant:(e,g)=>{
        gesture.suppress=true;
        if(e.nativeEvent.touches.length>1){gesture.mode='pinch';body.cancel();sample(e);}
        else{gesture.mode='turn';body.begin(g.x0,g.y0);body.move(e.nativeEvent.pageX,e.nativeEvent.pageY);}
      },
      onPanResponderStart:e=>{if(e.nativeEvent.touches.length>1){gesture.mode='pinch';gesture.suppress=true;body.cancel();sample(e);}},
      onPanResponderMove:e=>{
        if(e.nativeEvent.touches.length>1){if(gesture.mode!=='pinch'){gesture.mode='pinch';body.cancel();}sample(e);}
        else if(gesture.mode==='pinch')sample(e); // Re-anchor after a finger leaves; no accidental turn/tap.
        else if(gesture.mode==='turn')body.move(e.nativeEvent.pageX,e.nativeEvent.pageY);
      },
      onPanResponderEnd:e=>{if(gesture.mode==='pinch'&&e.nativeEvent.touches.length)sample(e);},
      onPanResponderRelease:()=>{if(gesture.mode==='pinch')controls.release();else if(gesture.mode==='turn')body.release();gesture.mode='idle';},
      onPanResponderTerminate:()=>{body.cancel();controls.cancel();gesture.mode='idle';},
      onPanResponderTerminationRequest:()=>true,
    });
    return {panHandlers:responder.panHandlers,gesture,rotation:body};
  }),[rotations,controls,width,height]);
 const overlay=useWorldOverlay(width,height);
 const project=useCallback((index:number,x:number,y:number)=>{
  const cached=overlay.last[index],target=overlay.targets[index];
  // A projection can briefly outrun this bookkeeping across a Fast Refresh that changes the
  // world list, because ref state outlives the module constants that sized it. Skip that
  // frame rather than writing past the end; the rebuild below restores the pairing.
  if(!cached||!target)return;
  if(Math.abs(cached.x-x)+Math.abs(cached.y-y)<.3)return;
  cached.x=x;cached.y=y;
  target.setValue({x:Math.max(4,Math.min(width-100,x-48)),y:Math.max(64,Math.min(height-130,y-42+WORLDS[index].labelOffset))});
 },[overlay,width,height]);
 return <View style={{position:'absolute',inset:0,pointerEvents:'box-none'}}>
  {settings.ready&&focused&&!failed&&<Boundary onError={()=>setFailed(true)}><ProductCanvas rotations={rotations} active={settings.active} reducedMotion={settings.reducedMotion} controls={controls} focus={focus} count={state.history.length} momentum={momentumLevel(momentum.current)} stored={1-Math.exp(-kept/3)} status={state.currentNext?.status==='active'?'active':state.currentNext?'available':'empty'} onProject={project}/></Boundary>}
  {rotation&&<View {...spin.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={`Rotate ${focus} world`} accessibilityHint="Drag across the world to turn it. This does not move the camera." accessibilityActions={[{name:'increment',label:'Rotate right'},{name:'decrement',label:'Rotate left'}]} onAccessibilityAction={e=>rotation.nudge(e.nativeEvent.actionName==='increment'?1:-1)} style={{position:'absolute',top:86,bottom:'58%',left:24,right:24}}/>}
  {/* One hit target per world, in the same order the scene projects them. */}
  {WORLDS.map((world,index)=>{
   const item={
    today:{action:onToday,label:'TODAY’S NEXT',a11y:"Today's NEXT"},
    history:{action:onHistory,label:'PREVIOUS NEXTS',a11y:`Previous NEXTs, ${state.history.length} completed`},
    profile:{action:onProfile,label:'YOUR IDENTITY',a11y:'Astronaut, your profile'},
    memory:{action:onMemory,label:'MEMORIES',a11y:kept?`Memories, ${kept} photo${kept===1?'':'s'} preserved`:'Memories, none preserved yet'},
    star:{action:onStar,label:'YOUR MOMENTUM',a11y:momentum.total?`Your momentum, ${momentum.current} day streak, ${momentum.total} completed`:'Your momentum, nothing completed yet'},
   }[world.id];
   const target=overlay.targets[index];
   if(!item.action||focus||!target)return null;
   const planet=planetGestures[ROTATABLE.indexOf(world.id)];
   return <Animated.View key={world.id} style={{position:'absolute',left:0,top:0,width:96,transform:target.getTranslateTransform()}} {...planet?.panHandlers}><Pressable accessibilityRole="button" accessibilityLabel={item.a11y}
    accessibilityHint={planet?'Tap to open. Drag to turn this planet.':'Tap to open.'}
    accessibilityActions={planet?[{name:'increment',label:'Rotate right'},{name:'decrement',label:'Rotate left'}]:undefined}
    onAccessibilityAction={planet?e=>planet.rotation.nudge(e.nativeEvent.actionName==='increment'?1:-1):undefined}
    onPressIn={()=>{if(planet)planet.gesture.suppress=false;}}
    onPress={()=>{if(!planet?.gesture.suppress)item.action?.();}}
    style={{minHeight:108,justifyContent:'flex-end',alignItems:'center',paddingBottom:4}}><Text style={[ui.label,{fontSize:10,lineHeight:15,textAlign:'center',color:'#c0c0ba'}]}>{item.label}</Text></Pressable></Animated.View>;
  })}
  {failed&&<Text accessibilityRole="alert" style={[ui.body,{position:'absolute',top:100,left:28,right:28}]}>The scene is unavailable. Your NEXT, history and profile remain accessible.</Text>}
 </View>;
}
