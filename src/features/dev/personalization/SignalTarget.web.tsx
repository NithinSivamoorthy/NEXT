import { Animated } from 'react-native';
import type { TargetProps } from './SignalTarget';
export default function SignalTarget({interaction,position,label}:TargetProps) {
  return <Animated.View style={{position:'absolute',left:0,top:0,width:72,height:72,transform:position.getTranslateTransform()}}>
    <button aria-label={label} title={label}
      style={{width:72,height:72,border:0,background:'transparent',color:'transparent',padding:0,touchAction:'none',cursor:'pointer',borderRadius:8}}
      onPointerDown={(e)=>{if(e.button!==0)return; if(!e.isPrimary){interaction.cancel();return;} e.currentTarget.setPointerCapture(e.pointerId); interaction.begin();}}
      onPointerMove={(e)=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return; const r=e.currentTarget.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)interaction.cancel();}}
      onPointerUp={(e)=>{const r=e.currentTarget.getBoundingClientRect(); interaction.release(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);}}
      onPointerCancel={()=>interaction.cancel()} onLostPointerCapture={()=>interaction.cancel()}
      onClick={(e)=>{if(e.detail===0)interaction.activate();}}
      onKeyDown={(e)=>{if(e.key==='Escape')interaction.cancel();}}
      onBlur={()=>interaction.cancel()} />
  </Animated.View>;
}
