import { useMemo } from 'react';
import { Animated, PanResponder } from 'react-native';
import type { FirstContact } from './interaction';
export type TargetProps = { interaction: FirstContact; position: Animated.ValueXY; screenReader: boolean; label: string };
export default function SignalTarget({ interaction,position,screenReader,label }:TargetProps) {
  const responders=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>!screenReader,
    onMoveShouldSetPanResponder:()=>!screenReader,
    onPanResponderGrant:()=>interaction.begin(),
    onPanResponderStart:(e)=>{if(e.nativeEvent.touches.length!==1)interaction.cancel();},
    onPanResponderMove:(e)=>{
      const {locationX:x,locationY:y}=e.nativeEvent;
      if(x<0||x>72||y<0||y>72||e.nativeEvent.touches.length!==1) interaction.cancel();
    },
    onPanResponderRelease:(e)=>{
      const {locationX:x,locationY:y}=e.nativeEvent;
      interaction.release(x>=0&&x<=72&&y>=0&&y<=72);
    },
    onPanResponderTerminate:()=>interaction.cancel(),
    onPanResponderTerminationRequest:()=>true,
  }),[interaction,screenReader]);
  return <Animated.View {...responders.panHandlers} accessible accessibilityRole="button"
    accessibilityLabel={label} accessibilityHint="Double-tap to activate."
    accessibilityActions={[{name:'activate',label}]}
    onAccessibilityAction={(e)=>{if(e.nativeEvent.actionName==='activate')interaction.activate();}}
    onAccessibilityTap={()=>interaction.activate()}
    style={{position:'absolute',left:0,top:0,width:72,height:72,transform:position.getTranslateTransform()}} />;
}
