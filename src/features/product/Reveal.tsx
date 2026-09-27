import { useEffect, useRef, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { useExperience } from '../experience/ExperienceProvider';
/** One opacity/offset per text block; no springs or character-level animation. */
export function Reveal({children,delay=0}:{children:ReactNode;delay?:number}){
 const {settings}=useExperience(),progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const animation=Animated.timing(progress,{toValue:1,delay:settings.reducedMotion?0:delay,duration:settings.reducedMotion?250:650,useNativeDriver:false});animation.start();return()=>animation.stop();},[progress,delay,settings.reducedMotion]);
 return <Animated.View style={{opacity:progress,transform:[{translateY:settings.reducedMotion?0:progress.interpolate({inputRange:[0,1],outputRange:[9,0]})}]}}>{children}</Animated.View>;
}
