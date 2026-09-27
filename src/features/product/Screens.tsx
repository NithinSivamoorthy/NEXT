import { Wordmark } from './Wordmark';
import { Reveal } from './Reveal';
import { CompletionComposer, HistoryArchive } from './MemoryUI';
import type { NextRecord } from './next';
import type { CompletionMemory } from './memories';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PersonalizationScreen from '../dev/personalization/PersonalizationScreen';
import { useExperience } from '../experience/ExperienceProvider';
import { completeAnswers } from '../experience/model';
import { firstUnanswered, questionAnswered, questions } from '../experience/content';
import { generateNext } from './next';
import { ProductSpace } from './ProductSpace';
import { Action, ui, useProductFonts } from './ui';

export function ProductLaunch(){const {hydrated}=useExperience();return hydrated?<RestoredLaunch/>:<View style={ui.screen}/>;}
function RestoredLaunch(){
 const {state,dispatch,settings,entranceComplete,authPreview,cinematicResumeAt,finishEntrance,beginAuth}=useExperience(),router=useRouter();
 const [branch]=useState(()=>state.onboardingComplete?'returning':state.firstConsequenceComplete?'resume':'first');
 // Derived, never captured: a stale first-render copy would survive Fast Refresh and hide the
 // fresh-user path. profileCreated cannot change while this cinematic runs.
 const needsAuth=!state.profileCreated||authPreview!==null;
 const awaitingAuth=needsAuth&&cinematicResumeAt===null;
 const handoffAt=settings.reducedMotion?13:12.6;
 useEffect(()=>{if(__DEV__)console.log('NEXT launch:',JSON.stringify({profileCreated:state.profileCreated,authPreview,needsAuth,awaitingAuth,branch,handoffAt,resumeAt:cinematicResumeAt}));},[state.profileCreated,authPreview,needsAuth,awaitingAuth,branch,handoffAt,cinematicResumeAt]);
 const answer=useCallback((value:string)=>dispatch({type:'first-consequence',answer:value}),[dispatch]);
 const done=useCallback((value:string)=>{answer(value);finishEntrance();router.replace('/reflect');},[answer,finishEntrance,router]);
 const arrive=useCallback(()=>{finishEntrance();router.replace(branch==='returning'?'/universe':'/reflect');},[finishEntrance,router,branch]);
 const handoff=useCallback((seconds:number)=>{if(__DEV__)console.log('NEXT launch: handing off to /auth at',seconds.toFixed(2));beginAuth(seconds);router.replace('/auth');},[beginAuth,router]);
 const recover=useCallback(()=>{finishEntrance();router.replace(branch==='returning'?'/universe':'/reflect');},[finishEntrance,router,branch]);
 if(entranceComplete)return <Redirect href={state.onboardingComplete?'/universe':'/reflect'}/>;
 // Travel out of lightspeed, then leave for the dedicated auth screen.
 if(awaitingAuth)return <><PersonalizationScreen handoffAt={handoffAt} onHandoff={handoff} onRecovery={recover}/><SaveNotice/></>;
 return <><PersonalizationScreen initialTime={cinematicResumeAt??0} arrivalOnly={branch!=='first'} onArrival={branch!=='first'?arrive:undefined} onAnswer={answer} onComplete={branch==='first'?done:undefined} onRecovery={recover}/><SaveNotice/></>;
}
export function SaveNotice(){const {storageError,retrySave}=useExperience();return storageError?<View style={{position:'absolute',top:52,left:24,right:24,backgroundColor:'#141414',padding:12}}><Text accessibilityRole="alert" style={ui.body}>This device could not finish saving or cleaning up local memories.</Text><Action label="RETRY SAVE" onPress={retrySave}/></View>:null;}
export function ReflectionScreen(){
 const {state,dispatch,hydrated,entranceComplete}=useExperience(),router=useRouter(),insets=useSafeAreaInsets();
 useProductFonts();
 const [step,setStep]=useState(()=>Math.min(4,firstUnanswered(state.answers)-1));
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const request=useRef<AbortController|null>(null),locked=useRef(false);
 useEffect(()=>()=>request.current?.abort(),[]);
 useEffect(()=>{if(hydrated)setStep(Math.min(4,firstUnanswered(state.answers)-1));},[hydrated,entranceComplete]);
 const question=questions[step];
 const next=async()=>{
  if(locked.current||!questionAnswered(question,state.answers))return;
  Keyboard.dismiss();
  if(step<4){setStep(step+1);AccessibilityInfo.announceForAccessibility(questions[step+1].title);return;}
  const answers=completeAnswers(state.answers);if(!answers)return;
  locked.current=true;setBusy(true);request.current=new AbortController();
  try{const result=await generateNext(answers,request.current.signal);dispatch({type:'generated',value:result});router.replace('/universe');}
  catch{if(!request.current.signal.aborted){setMessage('Please try again.');setBusy(false);locked.current=false;}}
 };
 if(!hydrated)return <View style={ui.screen}/>;
 // Hand the entrance back to "/" rather than running a second launch inside this screen:
 // two mounted launches mean two cinematics, two GL canvases and two competing handoffs.
 if(!entranceComplete)return <Redirect href="/"/>;
 if(state.onboardingComplete)return <Redirect href="/universe"/>;
 return <View style={ui.screen}><StatusBar hidden/><ProductSpace/>
  <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
   <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{flexGrow:1,justifyContent:'flex-end',paddingTop:insets.top+80,paddingHorizontal:28,paddingBottom:insets.bottom+32}}>
    <View style={{backgroundColor:'rgba(0,0,0,0.84)',paddingTop:22,maxWidth:560,width:'100%',alignSelf:'center'}}>
    {busy?<View style={{paddingVertical:70}}><Text accessibilityRole="header" accessibilityLiveRegion="polite" style={ui.label}>FORMING YOUR NEXT</Text><Text style={[ui.body,{marginTop:20}]}>A small step. A place to begin.</Text></View>:<>
     <Text accessibilityRole="header" style={ui.title}>{question.title.toUpperCase()}</Text>
     <Text style={ui.body}>{question.support}</Text>
     {question.kind==='text'?<TextInput key={question.field} accessibilityLabel={question.title} value={state.answers[question.field]} onChangeText={value=>dispatch({type:'answer',field:question.field,value})} placeholder={question.placeholder} placeholderTextColor="#78808c" multiline maxLength={2000} keyboardAppearance="dark" style={ui.input}/>:<View style={{marginVertical:16}}>{question.choices.map(choice=><Pressable key={choice.value} accessibilityRole="radio" accessibilityState={{checked:state.answers[question.field]===choice.value}} onPress={()=>{if(question.kind==='time')dispatch({type:'answer',field:'dailyCommitment',value:choice.value as 5|15|30|60});else dispatch({type:'answer',field:'challengeLevel',value:choice.value as 'gentle'|'balanced'|'push'});}} style={{paddingVertical:14,borderBottomWidth:1,borderBottomColor:state.answers[question.field]===choice.value?'#e5d7bf':'#25282e'}}><Text style={ui.label}>{choice.label}</Text><Text style={[ui.body,{fontSize:14,marginTop:4}]}>{choice.detail}</Text></Pressable>)}</View>}
     {message&&<Text accessibilityRole="alert" style={ui.body}>{message}</Text>}
     <View style={{flexDirection:'row',justifyContent:'space-between',gap:24}}>{step>0?<Action label="BACK" onPress={()=>{Keyboard.dismiss();setStep(step-1);}}/>:<View/>}<Action label={step===4?'FORM MY NEXT':'CONTINUE'} disabled={!questionAnswered(question,state.answers)} onPress={()=>void next()}/></View>
    </>}
    </View>
   </ScrollView>
  </KeyboardAvoidingView><SaveNotice/>
 </View>;
}
export function ProductUniverse(){
 const {state,dispatch,hydrated,entranceComplete,settings}=useExperience(),router=useRouter(),insets=useSafeAreaInsets();useProductFonts();
 const [panel,setPanel]=useState<'today'|'history'|'profile'|'memory'|'star'|null>(null),[busy,setBusy]=useState(false),[consequence,setConsequence]=useState(false);
 const [composing,setComposing]=useState(false),[capsuleOffer,setCapsuleOffer]=useState<string|null>(null);
 const handoff=useRef<ReturnType<typeof setTimeout>|null>(null),didHandoff=useRef(false);
 useFocusEffect(useCallback(()=>{if(didHandoff.current){didHandoff.current=false;handoff.current=setTimeout(()=>setPanel(null),180);}return()=>{if(handoff.current)clearTimeout(handoff.current);};},[]));
 const [completedPreview,setCompletedPreview]=useState<NextRecord|null>(null);
 const panelOpacity=useRef(new Animated.Value(1)).current;
 const completionAnimation=useRef<Animated.CompositeAnimation|null>(null),closing=useRef(false);
 const entryOpacity=useRef(new Animated.Value(1)).current;
 const request=useRef<AbortController|null>(null),locked=useRef(false);
 useEffect(()=>()=>{request.current?.abort();completionAnimation.current?.stop();},[]);
 useEffect(()=>{if(!entranceComplete)return;entryOpacity.setValue(1);const a=Animated.timing(entryOpacity,{toValue:0,duration:settings.reducedMotion?300:950,useNativeDriver:false});a.start();return()=>a.stop();},[entranceComplete,settings.reducedMotion,entryOpacity]);
 useEffect(()=>{if(!consequence)return;const timer=setTimeout(()=>setConsequence(false),4500);return()=>clearTimeout(timer);},[consequence]);
 const open=(value:typeof panel)=>{if(closing.current)return;panelOpacity.setValue(1);setPanel(value);};
 const generate=async()=>{const answers=completeAnswers(state.answers);if(!answers||locked.current)return;locked.current=true;setBusy(true);request.current=new AbortController();try{const value=await generateNext(answers,request.current.signal);dispatch({type:'generated',value});}catch{}finally{if(!request.current.signal.aborted){setBusy(false);locked.current=false;}}};
 const complete=(memory:CompletionMemory)=>{
  if(!state.currentNext||closing.current)return;
  closing.current=true;setCompletedPreview(state.currentNext);setComposing(false);setCapsuleOffer(state.currentNext.id);
  dispatch({type:'complete-next',id:state.currentNext.id,at:new Date().toISOString(),...memory});
  completionAnimation.current=Animated.timing(panelOpacity,{toValue:0,duration:settings.reducedMotion?200:350,useNativeDriver:false});
  completionAnimation.current.start(({finished})=>{if(!finished)return;setPanel(null);setCompletedPreview(null);closing.current=false;setConsequence(true);AccessibilityInfo.announceForAccessibility('Your universe has changed. Your completed NEXT is in Previous NEXTs.');});
 };
 if(!hydrated)return <View style={ui.screen}/>;
 // Same rule as the reflection screen: only "/" ever owns a running entrance.
 if(!entranceComplete)return <Redirect href="/"/>;
 if(!state.onboardingComplete)return <Redirect href="/"/>;
 const current=state.currentNext??completedPreview;
 // Memory, Journey and Progress are their own screens; the focus is the transition into them.
 const depart=(focus:'profile'|'memory'|'star',href:'/journey'|'/memory'|'/progress')=>{
  if(closing.current)return;
  open(focus);
  handoff.current=setTimeout(()=>{didHandoff.current=true;router.push(href);},settings.reducedMotion?200:850);
 };
 return <View style={ui.screen}><StatusBar hidden/><ProductSpace focus={panel} onToday={()=>open('today')} onHistory={()=>open('history')} onProfile={()=>depart('profile','/journey')} onMemory={()=>depart('memory','/memory')} onStar={()=>depart('star','/progress')}/>
  {!panel&&<>
   <View style={{position:'absolute',top:insets.top+22,left:28}}><Wordmark/></View>
   <View style={{position:'absolute',bottom:insets.bottom+42,left:28,right:28,pointerEvents:'none'}}><Text accessibilityLiveRegion="polite" style={[ui.label,{textAlign:'center',fontSize:10,color:'#858d97'}]}>{consequence?'NEXT COMPLETED · ANOTHER STEP FORWARD':'EVERY NEXT LEAVES A LIGHT'}</Text></View>
   {__DEV__&&<Pressable accessibilityRole="button" accessibilityLabel="Development controls" onPress={()=>router.push('/dev/reset')} style={{position:'absolute',top:insets.top+20,right:20,minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#777'}}>···</Text></Pressable>}
  </>}
  {(panel==='today'||panel==='history')&&<>
   <View style={{position:'absolute',top:insets.top+12,left:28,right:28}}><Action label="RETURN TO UNIVERSE" disabled={!!completedPreview||composing} onPress={()=>open(null)}/></View>
   <Animated.View accessibilityViewIsModal style={{position:'absolute',top:'42%',bottom:0,left:0,right:0,opacity:panelOpacity,backgroundColor:'rgba(0,0,3,0.84)'}}>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView key={composing?'compose':panel} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:28,paddingTop:22,paddingBottom:insets.bottom+36,maxWidth:620,width:'100%',alignSelf:'center'}}>
     {completedPreview?<View style={{minHeight:180}}/>:composing&&current?<CompletionComposer item={current} onCancel={()=>setComposing(false)} onCommit={complete}/>:<>
      <Reveal delay={250}><Text style={ui.eyebrow}>{panel==='today'?'TODAY’S NEXT':'PREVIOUS NEXTS'}</Text></Reveal>
      {panel==='today'?(current?<>
       <Reveal delay={350}><Text accessibilityRole="header" style={[ui.title,{textShadowColor:'#d8c09940',textShadowRadius:8}]}>{current.title}</Text></Reveal>
       <Reveal delay={600}><Text style={ui.body}>{current.action}</Text></Reveal>
       <Reveal delay={850}><Text style={[ui.eyebrow,{marginTop:24}]}>{current.estimatedMinutes} MINUTES · {current.category.toUpperCase()}{current.status==='active'?' · IN PROGRESS':''}</Text><Text style={[ui.label,{marginTop:8,marginBottom:12}]}>WHY THIS NEXT</Text><Text style={ui.body}>{current.why}</Text>
        {current.status==='active'&&<Text style={[ui.body,{marginTop:24}]}>{current.reflection}</Text>}
       </Reveal>
       <Reveal delay={1050}><View style={{marginTop:24}}>{current.status==='available'?<Action variant="primary" reducedMotion={settings.reducedMotion} label="BEGIN NEXT" onPress={()=>dispatch({type:'begin-next',id:current.id})}/>:<Action variant="primary" reducedMotion={settings.reducedMotion} label="COMPLETE NEXT" disabled={!!completedPreview} onPress={()=>setComposing(true)}/>}</View></Reveal>
      </>:<Reveal delay={400}><Text style={ui.title}>A little more light.</Text><Text style={ui.body}>Your completed NEXT lives in Previous NEXTs. There is no need to rush.</Text><View style={{marginTop:28}}><Action label={busy?'FORMING YOUR NEXT':'GENERATE ANOTHER NEXT'} disabled={busy} onPress={()=>void generate()}/></View></Reveal>):<HistoryArchive/>}
     </>}
    </ScrollView></KeyboardAvoidingView>
   </Animated.View>
  </>}
  <Animated.View style={{position:'absolute',inset:0,backgroundColor:'#000',opacity:entryOpacity,pointerEvents:'none'}}/>
  {capsuleOffer&&!panel&&!consequence&&<View style={{position:'absolute',bottom:insets.bottom+65,left:28,right:28,backgroundColor:'#090908e8',paddingHorizontal:16,borderWidth:1,borderColor:'#4f4530'}}><Action label="LEAVE SOMETHING FOR YOUR FUTURE SELF ↗" onPress={()=>{const id=capsuleOffer;setCapsuleOffer(null);router.push({pathname:'/progress',params:{capsule:id}});}}/><Action label="LATER" onPress={()=>setCapsuleOffer(null)}/></View>}
  <SaveNotice/>
 </View>;
}
export function ResetScreen(){
 const {state,dispatch,replayEntrance,entranceComplete,authPreview,cinematicResumeAt}=useExperience(),router=useRouter();useProductFonts();
 const [confirmReset,setConfirmReset]=useState(false);
 /**
  * Leaves nothing behind in the stack. A screen left mounted under this one keeps rendering,
  * and an entrance running in two places produces two cinematics and two competing handoffs.
  */
 const leaveTo=useCallback((href:'/'|'/auth')=>{if(router.canDismiss())router.dismissAll();router.replace(href);},[router]);
 const reset=()=>{dispatch({type:'reset'});leaveTo('/');};
 const replay=(auth?:'create'|'signin')=>{replayEntrance(auth?{auth}:undefined);leaveTo('/');};
 const routes=!state.profileCreated||authPreview!==null?'/auth':state.onboardingComplete?'/universe':'/reflect';
 return <View style={[ui.screen,{padding:32,justifyContent:'center'}]}>
  <Text style={ui.title}>Development</Text><Text style={ui.body}>Reset removes this device’s answers, identity, current NEXT, completed history and capsules.</Text>
  {/* The exact values the launch branch reads, so a routing question can be answered on the device. */}
  <Text accessibilityLabel={`Identity ${state.profileCreated?'created':'none'}. Next launch routes to ${routes}.`} style={[ui.body,{fontSize:12,lineHeight:19,color:'#8d959f',marginTop:18}]}>
   {`IDENTITY ${state.profileCreated?`CREATED · ${state.username||'—'}`:'NONE'}\nONBOARDING ${state.onboardingComplete?'COMPLETE':'INCOMPLETE'} · ENTRANCE ${entranceComplete?'DONE':'PENDING'}\nPREVIEW ${authPreview??'NONE'} · RESUME ${cinematicResumeAt??'NONE'}\nAFTER LIGHTSPEED → ${routes}`}
  </Text>
  {confirmReset?<><Text accessibilityRole="alert" style={[ui.body,{marginTop:24}]}>Erase this local profile and all its progress?</Text><Action label="CONFIRM RESET" onPress={reset}/><Action label="CANCEL" onPress={()=>setConfirmReset(false)}/></>:<Action label="RESET & REPLAY ONBOARDING" onPress={()=>{if(Platform.OS==='web')setConfirmReset(true);else Alert.alert('Reset NEXT?','This erases local progress on this device.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:reset}]);}}/>}
  <Action label="REPLAY ENTRANCE · KEEP PROGRESS" onPress={()=>replay()}/>
  <Action label="PREVIEW CREATE ACCOUNT · KEEP PROGRESS" onPress={()=>replay('create')}/>
  <Action label="PREVIEW SIGN IN · KEEP PROGRESS" onPress={()=>replay('signin')}/>
  <Action label="OPEN /auth NOW · SKIP CINEMATIC" onPress={()=>{replayEntrance({auth:'create'});leaveTo('/auth');}}/>
  <Action label="BACK" onPress={()=>leaveTo('/')}/>
 </View>;
}
