import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Keyboard, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useExperience } from '../experience/ExperienceProvider';
import type { NextRecord } from './next';
import type { CompletionMemory } from './memories';
import { Action, ui } from './ui';
import { Reveal } from './Reveal';
import { selectPhoto, discardPhoto } from './photos';

export const memoryUI=StyleSheet.create({
 fragment:{backgroundColor:'#0b0e18',borderWidth:1,borderColor:'#424052',borderRadius:14,padding:22,marginBottom:18,shadowColor:'#787ba9',shadowOpacity:.14,shadowRadius:14,shadowOffset:{width:0,height:2}},
 divider:{height:1,backgroundColor:'#37394b',marginVertical:28},
 gold:{color:'#d6b981'},cool:{color:'#b1c4d6'},
});
export function LocalPhoto({uri,variant='preview'}:{uri:string;variant?:'preview'|'thumbnail'|'card'}){const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[uri]);return failed?<Text style={ui.body}>This photo is no longer available on this device.</Text>:<Image accessibilityLabel="Photo saved with this completed NEXT" source={{uri}} onError={()=>setFailed(true)} resizeMode="cover" style={{width:variant==='thumbnail'?76:'100%',aspectRatio:variant==='thumbnail'?1:variant==='card'?.85:1.25,borderRadius:10,marginVertical:variant==='card'?0:16,borderWidth:1,borderColor:'#4f526e',backgroundColor:'#131624'}}/>;}
export function HistoryArchive(){
 const {state}=useExperience();const [selected,setSelected]=useState<string|null>(null),[page,setPage]=useState(0);
 const item=state.history.find(n=>n.id===selected);
 if(item)return <Reveal key={item.id}><Action label="← ALL FRAGMENTS" onPress={()=>setSelected(null)}/><View style={[memoryUI.fragment,{borderColor:'#8585ad',shadowOpacity:.3}]}>
  <Text style={[ui.eyebrow,memoryUI.cool]}>PRESERVED · {new Date(item.completedAt!).toLocaleDateString()}</Text><Text accessibilityRole="header" style={ui.title}>{item.title}</Text>
  <Text style={ui.body}>{item.action}</Text><Text style={[ui.label,{marginTop:26,marginBottom:10}]}>WHY THIS NEXT</Text><Text style={ui.body}>{item.why}</Text>
  <Text style={[ui.eyebrow,{marginTop:22}]}>{item.category} · {item.estimatedMinutes} MINUTES</Text>
  {item.photoUri&&<LocalPhoto uri={item.photoUri}/>}{item.memory&&<><Text style={ui.label}>WHAT YOU LEFT HERE</Text><Text style={[ui.body,{marginTop:12}]}>{item.memory}</Text></>}
  <View style={memoryUI.divider}/><Text style={ui.eyebrow}>PART OF YOUR JOURNEY TOWARD</Text><Text style={ui.body}>{state.answers.progressVision}</Text>
 </View></Reveal>;
 return <><Reveal><Text accessibilityRole="header" style={ui.title}>What remains.</Text><Text style={[ui.body,{marginBottom:24}]}>Each fragment holds a step you took.</Text></Reveal>{state.history.length?state.history.slice(page*6,page*6+6).map((n,i)=><Reveal key={n.id} delay={Math.min(i,4)*90}><Pressable accessibilityRole="button" accessibilityLabel={`Open completed NEXT: ${n.title}, ${new Date(n.completedAt!).toLocaleDateString()}`} onPress={()=>setSelected(n.id)} style={({pressed})=>[memoryUI.fragment,{borderColor:pressed?'#c3bfdf':'#424052'}]}>
  <Text style={[ui.eyebrow,memoryUI.cool]}>✦  {new Date(n.completedAt!).toLocaleDateString()}</Text><Text style={[ui.title,{fontSize:24,lineHeight:30}]}>{n.title}</Text><Text style={[ui.label,{color:'#9998b2',fontSize:11}]}>{n.category.toUpperCase()} · {n.estimatedMinutes} MIN</Text>{n.photoUri&&<LocalPhoto uri={n.photoUri} variant="thumbnail"/>}<Text style={[ui.label,{marginTop:24,color:'#c3c8db'}]}>OPEN FRAGMENT ↗</Text>
 </Pressable></Reveal>):<View style={memoryUI.fragment}><Text style={ui.body}>Your first completed NEXT will leave its light here.</Text></View>}{state.history.length>6&&<View><Text style={ui.eyebrow}>FRAGMENTS {page*6+1}–{Math.min(state.history.length,page*6+6)} OF {state.history.length}</Text>{page>0&&<Action label="← NEWER FRAGMENTS" onPress={()=>setPage(page-1)}/>}{(page+1)*6<state.history.length&&<Action label="OLDER FRAGMENTS →" onPress={()=>setPage(page+1)}/>}</View>}</>;
}
export function CompletionComposer({item,onCancel,onCommit}:{item:NextRecord;onCancel:()=>void;onCommit:(memory:CompletionMemory)=>void}){
 const {settings}=useExperience();const [memory,setMemory]=useState(''),[busy,setBusy]=useState(false);
 const locked=useRef(false),progress=useRef(new Animated.Value(0)).current;
 const animation=useRef<Animated.CompositeAnimation|null>(null);
 const [photoUri,setPhotoUri]=useState<string|undefined>(),[photoMessage,setPhotoMessage]=useState(''),[picking,setPicking]=useState(false);
 const [permissionDenied,setPermissionDenied]=useState(false);
 const draft=useRef<string|undefined>(undefined),mounted=useRef(true),pickerLock=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;animation.current?.stop();discardPhoto(draft.current);};},[]);
 const choosePhoto=async()=>{
  if(locked.current||pickerLock.current)return;
  pickerLock.current=true;setPicking(true);setPhotoMessage('');setPermissionDenied(false);Keyboard.dismiss();
  const result=await selectPhoto(item.id);
  pickerLock.current=false;
  if(!mounted.current){if(result.kind==='selected')discardPhoto(result.uri);return;}
  setPicking(false);
  if(result.kind==='selected'){discardPhoto(draft.current);draft.current=result.uri;setPhotoUri(result.uri);}
  else if(result.kind==='unavailable'){setPhotoMessage(result.message);setPermissionDenied(result.reason==='permission');}
 };
 const removePhoto=()=>{discardPhoto(draft.current);draft.current=undefined;setPhotoUri(undefined);setPhotoMessage('');};
 const submit=()=>{if(locked.current||pickerLock.current)return;locked.current=true;setBusy(true);Keyboard.dismiss();animation.current=Animated.timing(progress,{toValue:1,duration:settings.reducedMotion?550:2100,useNativeDriver:false});animation.current.start(({finished})=>{if(finished){const savedPhoto=draft.current;draft.current=undefined;onCommit({memory:memory.trim(),...(savedPhoto?{photoUri:savedPhoto}:{})});}});};
 return <View>
  <Text style={[ui.eyebrow,memoryUI.gold]}>LEAVE A LIGHT</Text><Text accessibilityRole="header" style={ui.title}>You took the step.</Text>
  <Animated.View style={[memoryUI.fragment,{borderColor:progress.interpolate({inputRange:[0,.65,1],outputRange:['#504a3e','#efd9a3','#a99a78']}),opacity:progress.interpolate({inputRange:[0,.65,1],outputRange:[1,.75,0]}),transform:[{scale:settings.reducedMotion?1:progress.interpolate({inputRange:[0,1],outputRange:[1,.94]})}]}]}>
   <Text style={[ui.title,{fontSize:24,lineHeight:30}]}>{item.title}</Text><Text style={ui.body}>{item.action}</Text>
   {photoUri&&<Reveal key={photoUri}><LocalPhoto uri={photoUri}/><Text style={[ui.eyebrow,memoryUI.cool]}>ATTACHED TO THIS NEXT</Text></Reveal>}
   {!busy&&<><Action label={picking?'SAVING PHOTO…':photoUri?'CHANGE PHOTO':'ADD A PHOTO'} photo={!photoUri} support={photoUri?undefined:'Preserve this moment.'} variant="primary" reducedMotion={settings.reducedMotion} disabled={picking} onPress={choosePhoto}/>{photoUri&&<Action variant="danger" label="REMOVE PHOTO" disabled={picking} onPress={removePhoto}/>}</>}
   {!!photoMessage&&<Text accessibilityRole="alert" style={[ui.body,{fontSize:13}]}>{photoMessage}</Text>}
   {permissionDenied&&!busy&&<Action variant="secondary" label="OPEN PHOTO SETTINGS" onPress={()=>{void Linking.openSettings().catch(()=>setPhotoMessage('Open your device Settings to allow photo access, then try again.'));}}/>}
   <Text style={[ui.label,{marginTop:24}]}>A MEMORY OF THIS STEP · OPTIONAL</Text><TextInput accessibilityLabel="Optional completion memory" value={memory} onChangeText={setMemory} editable={!busy} multiline maxLength={2000} keyboardAppearance="dark" placeholder="What do you want to remember?" placeholderTextColor="#777e8b" style={ui.input}/>
  </Animated.View>
  {busy?<View accessibilityLiveRegion="polite" style={{minHeight:110,alignItems:'center',justifyContent:'center'}}><Animated.View style={{width:12,height:12,borderRadius:6,backgroundColor:'#ffe6af',opacity:progress.interpolate({inputRange:[0,.4,.8,1],outputRange:[0,.3,1,0]}),transform:[{scale:settings.reducedMotion?1:progress.interpolate({inputRange:[0,.8,1],outputRange:[.4,2,.1]})}]}}/><Text style={[ui.label,memoryUI.gold,{marginTop:18}]}>LEAVING YOUR LIGHT</Text></View>:<><Action variant="primary" reducedMotion={settings.reducedMotion} label="SUBMIT NEXT" disabled={picking} onPress={submit}/><Action label="NOT YET · RETURN" disabled={picking} onPress={onCancel}/></>}
 </View>;
}
export function CapsuleComposer({nextId,onClose}:{nextId?:string;onClose:()=>void}){
 const {state,dispatch,settings}=useExperience();const [text,setText]=useState(''),[busy,setBusy]=useState(false);const lock=useRef(false);
 const progress=useRef(new Animated.Value(0)).current,animation=useRef<Animated.CompositeAnimation|null>(null);
 useEffect(()=>()=>animation.current?.stop(),[]);
 const seal=()=>{if(lock.current||!text.trim())return;lock.current=true;setBusy(true);Keyboard.dismiss();const value={id:`capsule-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,text:text.trim(),createdAt:new Date().toISOString(),...(nextId?{nextId}:{})};animation.current=Animated.timing(progress,{toValue:1,duration:settings.reducedMotion?350:1500,useNativeDriver:false});animation.current.start(({finished})=>{if(finished){dispatch({type:'seal-capsule',value});AccessibilityInfo.announceForAccessibility('Your capsule is sealed in your Hero Star until you move forward.');setText('');onClose();}});};
 return <><Text style={[ui.eyebrow,memoryUI.gold]}>TIME CAPSULE</Text><Text accessibilityRole="header" style={ui.title}>TO THE PERSON{`\n`}I’M BECOMING…</Text>
  {nextId&&<Text style={[ui.body,{marginBottom:18}]}>A light from {state.history.find(n=>n.id===nextId)?.title}.</Text>}
  <Animated.View style={{opacity:progress.interpolate({inputRange:[0,.7,1],outputRange:[1,0,0]})}}><View style={[memoryUI.fragment,{borderColor:'#6c5940'}]}><TextInput accessibilityLabel="Letter to your future self" multiline maxLength={2000} value={text} onChangeText={setText} editable={!busy} placeholder="Leave something only you could say." placeholderTextColor="#8d8270" keyboardAppearance="dark" style={[ui.input,{minHeight:180,borderBottomColor:'#6b5940'}]}/></View></Animated.View>
  {busy?<View accessibilityLiveRegion="polite" style={{alignItems:'center',padding:30}}><Animated.View style={{width:14,height:14,borderRadius:7,backgroundColor:'#f4d295',opacity:progress.interpolate({inputRange:[0,.4,.8,1],outputRange:[0,1,1,0]}),transform:[{scale:settings.reducedMotion?1:progress.interpolate({inputRange:[0,.4,1],outputRange:[.4,1,.1]})},{translateY:settings.reducedMotion?0:progress.interpolate({inputRange:[0,1],outputRange:[0,-55]})}]}}/><Text style={[ui.label,memoryUI.gold,{marginTop:20}]}>SEALING YOUR WORDS</Text></View>:<><Action label="SEAL CAPSULE" disabled={!text.trim()} onPress={seal}/><Action label="RETURN WITHOUT SEALING" onPress={onClose}/><Text style={[ui.body,{fontSize:12}]}>A local archive for your future self. Read it whenever you choose.</Text></>}
 </>;
}
