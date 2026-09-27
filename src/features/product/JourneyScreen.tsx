import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useExperience } from '../experience/ExperienceProvider';
import { Action, ui, useProductFonts } from './ui';
import { ProfileContents } from './ProfileContents';
import { LocalPhoto, memoryUI } from './MemoryUI';
import { SaveNotice } from './Screens';
import { Reveal } from './Reveal';

/** A dedicated native journey page. No additional GL context or background renderer. */
export default function JourneyScreen(){
 const {state,dispatch,hydrated,entranceComplete,settings}=useExperience(),router=useRouter(),insets=useSafeAreaInsets();useProductFonts();
 const [page,setPage]=useState<'profile'|'recap'>('profile');
 const opacity=useRef(new Animated.Value(0)).current,animation=useRef<Animated.CompositeAnimation|null>(null),closing=useRef(false);
 useEffect(()=>{animation.current=Animated.timing(opacity,{toValue:1,duration:settings.reducedMotion?200:650,useNativeDriver:false});animation.current.start();return()=>animation.current?.stop();},[opacity,settings.reducedMotion]);
 const leave=()=>{if(closing.current)return;closing.current=true;animation.current=Animated.timing(opacity,{toValue:0,duration:settings.reducedMotion?180:450,useNativeDriver:false});animation.current.start(({finished})=>{if(finished){if(router.canGoBack())router.back();else router.replace('/universe');}});};
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(page!=='profile')setPage('profile');else leave();return true;});return()=>sub.remove();},[page]);
 if(!hydrated)return <View style={ui.screen}/>;
 if(!entranceComplete||!state.onboardingComplete)return <Redirect href="/"/>;
 return <View style={ui.screen}><StatusBar hidden/><Animated.View style={{flex:1,opacity}}>
  <View pointerEvents="none" style={{position:'absolute',inset:0}}>{Array.from({length:24},(_,i)=><View key={i} style={{position:'absolute',left:`${(i*37+11)%100}%`,top:`${(i*23+7)%100}%`,width:i%5===0?2:1,height:i%5===0?2:1,borderRadius:2,backgroundColor:i%3?'#8b97b2':'#c8a56f',opacity:.25}}/>)}</View>
  <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
   <View style={{paddingTop:insets.top+12,paddingHorizontal:28}}><Action label={page==='profile'?'← RETURN TO UNIVERSE':'← YOUR JOURNEY'} onPress={page==='profile'?leave:()=>setPage('profile')}/></View>
   <ScrollView key={page} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{padding:28,paddingBottom:insets.bottom+40,maxWidth:620,width:'100%',alignSelf:'center'}}>
    {page==='recap'?<Recap/>:<>
     <ProfileContents/>
     <Reveal delay={500}><View style={memoryUI.divider}/><Text style={ui.eyebrow}>THE LARGER JOURNEY</Text><Text style={ui.title}>Look at the distance.</Text><Text style={ui.body}>A reflection on the words and steps you have left here.</Text><Action label="I’VE MOVED FORWARD ↗" onPress={()=>{dispatch({type:'moved-forward'});setPage('recap');}}/></Reveal>
    </>}
   </ScrollView>
  </KeyboardAvoidingView>
 </Animated.View><SaveNotice/></View>;
}
function Recap(){const {state}=useExperience();return <>
 <Reveal><Text style={[ui.eyebrow,memoryUI.gold]}>YOUR JOURNEY · A RECAP</Text><Text accessibilityRole="header" style={ui.title}>YOU STARTED HERE</Text><Text style={ui.body}>{state.answers.movingFrom}</Text></Reveal>
 <Reveal delay={200}><View style={memoryUI.divider}/><Text style={ui.title}>YOU MOVED THROUGH</Text><Text style={[ui.eyebrow,memoryUI.cool]}>{state.history.length} COMPLETED NEXT{state.history.length===1?'':'S'}</Text>{state.history.length?state.history.slice(0,8).map(n=><View key={n.id} style={memoryUI.fragment}><Text style={[ui.title,{fontSize:23,lineHeight:29}]}>{n.title}</Text><Text style={ui.body}>{n.action}</Text>{n.photoUri&&<LocalPhoto uri={n.photoUri}/>}{n.memory&&<Text style={[ui.body,{marginTop:16,color:'#e0cba8'}]}>{n.memory}</Text>}</View>):<Text style={ui.body}>No completed steps yet. Your beginning still belongs here.</Text>}{state.history.length>8&&<Text style={ui.body}>Your full archive holds {state.history.length} completed steps.</Text>}</Reveal>
 <Reveal delay={400}><View style={memoryUI.divider}/><Text style={ui.title}>YOU ARE HERE NOW</Text><Text style={ui.eyebrow}>THE DIRECTION YOU CHOSE</Text><Text style={ui.body}>{state.answers.progressVision}</Text><Text style={[ui.body,{marginTop:20}]}>{state.currentNext?`Your current NEXT: ${state.currentNext.title}. ${state.currentNext.status==='active'?'In progress.':'Ready when you are.'}`:'Your next step is yours to choose.'}</Text>
 <Text style={[ui.body,{marginTop:24,fontSize:13}]}>This recap uses your saved words and actions. Your history stays with you.</Text></Reveal>
 </>;}
