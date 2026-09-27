import { Canvas } from '@react-three/fiber/native';
import { useMemo, useRef } from 'react';
import { PanResponder, View, type GestureResponderEvent } from 'react-native';
import { ProductScene, type ProductSceneProps } from './ProductScene';
export default function ProductCanvas(props:ProductSceneProps){
 const bounds=useRef({width:1,height:1}),controls=props.controls;
 const responder=useMemo(()=>{
  const sample=(event:GestureResponderEvent)=>controls.sample(event.nativeEvent.touches.map(t=>({id:t.identifier,x:t.pageX,y:t.pageY})),bounds.current.width,bounds.current.height);
  return PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:sample,onPanResponderMove:sample,onPanResponderStart:sample,onPanResponderEnd:e=>{if(e.nativeEvent.touches.length)sample(e);},onPanResponderRelease:()=>controls.release(),onPanResponderTerminate:()=>controls.cancel(),onPanResponderTerminationRequest:()=>true});
 },[controls]);
 return <View style={{position:'absolute',inset:0}} onLayout={e=>{bounds.current=e.nativeEvent.layout;}}>
  <View style={{position:'absolute',inset:0,pointerEvents:'none'}} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Canvas camera={{position:[0,0,12.2],fov:48,near:.1,far:220}} gl={{antialias:false,alpha:false}} frameloop={props.active?'always':'never'}><ProductScene {...props}/></Canvas></View>
  {!props.focus&&<View style={{position:'absolute',inset:0}} {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Explore your universe" accessibilityHint="Drag for a bounded view. Pinch to zoom. Celestial objects have separate buttons." accessibilityActions={[{name:'increment',label:'Zoom in'},{name:'decrement',label:'Zoom out'}]} onAccessibilityAction={e=>controls.zoom(e.nativeEvent.actionName==='increment'?.9:1.1)}/>}
 </View>;
}
