import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExperience } from '../../experience/ExperienceProvider';
import { questions } from '../../experience/content';
import { reflectionLayout, sloganOpacity } from './presentation';
import { lettersOpacity } from '../cinematic/timeline';
import ExperienceCanvas from './ExperienceCanvas';
import SignalTarget from './SignalTarget';
import { FirstContact, type Snapshot } from './interaction';

class Boundary extends Component<{children:ReactNode; onError:(message:string)=>void},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error){console.error('First contact renderer failed',error);this.props.onError(error.message);}
  render(){return this.state.failed?null:this.props.children;}
}
export default function PersonalizationScreen(){
  const [run,setRun]=useState(0);
  return <Player key={run} replay={()=>setRun(v=>v+1)}/>;
}
function Player({replay}:{replay:()=>void}) {
  const {settings}=useExperience();
  const motionMode = settings.ready ? settings.reducedMotion : null;
  const [loaded,fontError]=useFonts({
    'Contact-Clash':require('../../../../assets/dev/typography/ClashDisplay-Bold.otf'),
    'Contact-Inter':require('../../../../assets/dev/typography/Inter-Regular.otf'),
    'Contact-Space':require('../../../../assets/dev/typography/SpaceGrotesk-Bold.otf'),
  });
  const [interaction]=useState(()=>new FirstContact());
  const [snapshot,setSnapshot]=useState<Snapshot>(interaction.snapshot);
  interaction.onChange=setSnapshot;
  const [focused,setFocused]=useState(true);
  useFocusEffect(useCallback(()=>{setFocused(true);return ()=>{interaction.setActive(false);setFocused(false);};},[interaction]));
  const router=useRouter(); const insets=useSafeAreaInsets(); const window=useWindowDimensions();
  const [bounds,setBounds]=useState({width:window.width,height:window.height});
  const [textWidth,setTextWidth]=useState(0);
  const [error,setError]=useState<string|null>(null);
  const root=useRef<View>(null);
  const rootY=useRef(0);
  // Screen-wide ownership rule: every Animated graph remains JS-driven for life.
  // Shared style nodes can promote sibling values; never native-drive even opacity here.
  const slogan=useRef(new Animated.Value(0)).current;
  const sloganSettle=useRef(new Animated.Value(3)).current;
  const [typing,setTyping]=useState(false);
  const typingProgress=useRef(new Animated.Value(0)).current;
  const [starY,setStarY]=useState(window.height*0.46);
  const projectionLayout=useRef('');
  const opacity=useRef(new Animated.Value(0)).current;
  const questionOpacity=useRef(new Animated.Value(0)).current;
  const targetPosition=useRef(new Animated.ValueXY({x:-100,y:-100})).current;
  const instructionPosition=useRef(new Animated.ValueXY({x:-300,y:-100})).current;
  const lastProjection=useRef({x:-100,y:-100});
  const questionRef=useRef<Text>(null);
  const announced=useRef(false);
  const consequenceAnnounced=useRef(false);
  const [draft,setDraft]=useState('');
  const [keyboardTop,setKeyboardTop]=useState<number|null>(null);
  const instructionOpacity=useRef(new Animated.Value(0)).current;
  const inputRef=useRef<TextInput>(null);
  useEffect(()=>{
    const show=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillChangeFrame':'keyboardDidShow', e=>{if(!settings.reducedMotion)Keyboard.scheduleLayoutAnimation(e);if(inputRef.current?.isFocused())setTyping(true);setKeyboardTop(e.endCoordinates.screenY-rootY.current);});
    const hide=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillHide':'keyboardDidHide', ()=>{setKeyboardTop(null);setTyping(false);});
    return ()=>{show.remove();hide.remove();};
  },[settings.reducedMotion]);
  useEffect(()=>{
    const animation=Animated.timing(instructionOpacity,{toValue:snapshot.instruction?1:0,duration:settings.reducedMotion?0:250,useNativeDriver:false});
    animation.start();return ()=>animation.stop();
  },[snapshot.instruction,settings.reducedMotion,instructionOpacity]);
  useEffect(()=>{
    if(snapshot.phase==='answered'){Keyboard.dismiss();inputRef.current?.blur();}
    if(snapshot.phase!=='settled')return;
    if(!consequenceAnnounced.current){
      consequenceAnnounced.current=true;
      if(settings.screenReader)AccessibilityInfo.announceForAccessibility('Your universe has changed.');
    }
  },[snapshot.phase,settings.screenReader]);
  useEffect(()=>{interaction.setActive(settings.active&&focused);return ()=>interaction.setActive(false);},[settings.active,focused,interaction]);
  useEffect(()=>{
    if(snapshot.phase==='committed'&&!announced.current){announced.current=true;if(settings.screenReader)AccessibilityInfo.announceForAccessibility('The light remains.');}
    if(snapshot.phase==='answered'){
      const fade=Animated.timing(questionOpacity,{toValue:0,duration:settings.reducedMotion?180:300,useNativeDriver:false});
      fade.start();return ()=>fade.stop();
    }
    if(snapshot.phase!=='questionVisible')return;
    const animation=Animated.timing(questionOpacity,{toValue:1,duration:settings.reducedMotion?0:550,useNativeDriver:false});
    animation.start(({finished})=>{
      if(!finished)return;
      if(Platform.OS==='web') (questionRef.current as unknown as {focus?:()=>void})?.focus?.();
      else if(settings.screenReader){const handle=findNodeHandle(questionRef.current);if(handle)AccessibilityInfo.setAccessibilityFocus(handle);}
    });
    return ()=>animation.stop();
  },[snapshot.phase,settings.screenReader,settings.reducedMotion,questionOpacity]);
  useEffect(()=>{
    const animation=Animated.timing(typingProgress,{toValue:typing?1:0,duration:settings.reducedMotion?0:220,useNativeDriver:false});
    animation.start();return ()=>animation.stop();
  },[typing,settings.reducedMotion,typingProgress]);
  const onTime=useCallback((t:number,elapsedSeconds:number)=>{
    opacity.setValue(lettersOpacity(t));
    const titleTime=elapsedSeconds-(settings.reducedMotion?0.75:0);
    slogan.setValue(sloganOpacity(titleTime));
    sloganSettle.setValue(settings.reducedMotion?0:3*(1-Math.min(1,Math.max(0,(titleTime-1.65)/0.5))));
  },[opacity,slogan,sloganSettle,settings.reducedMotion]);
  const onHold=useCallback(()=>interaction.markHold(),[interaction]);
  const onProject=useCallback((x:number,y:number)=>{
    if(Math.abs(lastProjection.current.x-x)+Math.abs(lastProjection.current.y-y)<0.25)return;
    // Layout receives a projection only once per viewport; renderer still updates refs.
    const viewport=`${bounds.width}:${bounds.height}`;
    if(projectionLayout.current!==viewport){projectionLayout.current=viewport;setStarY(y);}
    lastProjection.current={x,y}; targetPosition.setValue({x:x-36,y:y-36});
    instructionPosition.setValue({x:Math.max(16,Math.min(bounds.width-196,x-80)),y:y+42});
  },[targetPosition,instructionPosition,bounds.width,bounds.height]);
  const size=Math.min(66,bounds.width*0.165),diameter=size*0.13,gap=size*0.08,top=bounds.height*0.43;
  const answering=snapshot.phase==='questionVisible';
  const canActivate=snapshot.available&&(snapshot.phase==='waiting'||(answering&&snapshot.valid));
  const restingLayout=reflectionLayout(bounds.height,insets.top,starY,keyboardTop,false);
  const typingLayout=reflectionLayout(bounds.height,insets.top,starY,keyboardTop,true);
  const interpolate=(a:number,b:number)=>typingProgress.interpolate({inputRange:[0,1],outputRange:[a,b]});
  const commitAnswer=()=>interaction.activate();
  const errorText=error??fontError?.message;
  return <View ref={root} style={s.screen} onLayout={({nativeEvent})=>{setBounds(nativeEvent.layout);root.current?.measureInWindow((_x,y)=>{rootY.current=y;});}}>
    <StatusBar hidden/>
    {loaded&&motionMode!==null&&textWidth>0&&<View style={[StyleSheet.absoluteFill,{pointerEvents:'none'}]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Boundary onError={setError}><ExperienceCanvas active={settings.active&&focused} reducedMotion={motionMode}
        point={{x:(textWidth+gap)/2,y:top+size*0.89+diameter/2-bounds.height/2,diameter,height:bounds.height}}
        onTime={onTime} onHold={onHold} interaction={interaction} onProject={onProject}/></Boundary>
    </View>}
    {loaded&&<Animated.View aria-hidden={snapshot.atHold} accessible={!snapshot.atHold} accessibilityElementsHidden={snapshot.atHold} importantForAccessibility={snapshot.atHold ? 'no-hide-descendants' : 'auto'} accessibilityLabel="NEXT" style={{position:'absolute',top,left:0,right:0,alignItems:'center',opacity,pointerEvents:'none'}}>
      <View style={{paddingRight:gap+diameter}}><Text allowFontScaling={false} onLayout={({nativeEvent})=>setTextWidth(nativeEvent.layout.width)} style={{fontFamily:'Contact-Clash',fontSize:size,lineHeight:size*1.3,letterSpacing:-size*0.025,color:'#f5f5f5',includeFontPadding:false}}>NEXT</Text></View>
    </Animated.View>}
    {loaded&&!snapshot.atHold&&<Animated.View accessible accessibilityLabel="BUILD YOUR UNIVERSE, ONE NEXT AT A TIME." style={{position:'absolute',left:24,right:24,bottom:Math.max(insets.bottom+40,56),opacity:slogan,transform:[{translateY:sloganSettle}],pointerEvents:'none'}}>
      <Text style={s.slogan}>{'BUILD YOUR UNIVERSE,\nONE NEXT AT A TIME.'}</Text>
    </Animated.View>}
    {canActivate&&!errorText&&<>
      <SignalTarget interaction={interaction} position={targetPosition} screenReader={settings.screenReader} label={answering?'Send reflection to the light':'Touch the light'}/>
      <Animated.View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',left:0,top:0,width:180,opacity:answering?1:instructionOpacity,transform:instructionPosition.getTranslateTransform(),pointerEvents:'none'}}>
        <Text style={s.instruction}>{answering?'SEND TO THE LIGHT':'TOUCH THE LIGHT'}</Text>
      </Animated.View>
    </>}
    {(answering||snapshot.phase==='answered')&&<Animated.View pointerEvents={answering?'auto':'none'} aria-hidden={!answering} accessibilityElementsHidden={!answering} importantForAccessibility={answering?'auto':'no-hide-descendants'} style={{position:'absolute',top:restingLayout.top,transform:[{translateY:interpolate(0,typingLayout.top-restingLayout.top)}],left:24,right:24,height:interpolate(restingLayout.height,typingLayout.height),opacity:questionOpacity}}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{paddingBottom:12}}>
        <Animated.Text ref={questionRef} accessible accessibilityRole="header" accessibilityLabel={questions[0].title} {...(Platform.OS==='web'?{tabIndex:-1}:{})} style={[s.question,{fontSize:interpolate(26,19),lineHeight:interpolate(32,23),opacity:interpolate(1,0.72)}]}>{questions[0].title.toUpperCase()}</Animated.Text>
        <TextInput editable={answering} ref={inputRef} onFocus={()=>setTyping(true)} onBlur={()=>setTyping(false)} value={draft} onChangeText={value=>{setDraft(value);interaction.edit(value);}}
          accessibilityLabel="Your reflection: What are you ready to move forward from?"
          accessibilityHint="Write your answer, then send it to the light."
          placeholder="Start wherever you are." placeholderTextColor="#737d8a"
          style={[s.input,typing&&{marginTop:8,maxHeight:76}]} multiline scrollEnabled returnKeyType="send" submitBehavior="submit"
          keyboardAppearance="dark" autoCorrect autoCapitalize="sentences"
          selectionColor="#ccd8eb" onSubmitEditing={commitAnswer}
          onKeyPress={e=>{
            if(Platform.OS!=='web')return;
            const key=e.nativeEvent as typeof e.nativeEvent & {isComposing?:boolean;keyCode?:number;shiftKey?:boolean};
            if(key.key==='Escape')inputRef.current?.blur();
            if(key.key==='Enter'&&!key.shiftKey&&!key.isComposing&&key.keyCode!==229){e.preventDefault();commitAnswer();}
          }}
        />
        {typing&&snapshot.valid&&<Pressable accessibilityRole="button" accessibilityLabel="Send reflection to the light" onPress={commitAnswer} style={{minHeight:44,justifyContent:'center'}}>
          <Text style={s.keyboardAction}>SEND TO THE LIGHT ↗</Text>
        </Pressable>}
      </ScrollView>
    </Animated.View>}
    {(snapshot.atHold||errorText)&&<View style={[s.controls,{bottom:Math.max(insets.bottom,18),left:24,right:24}]}>
      {errorText&&<Text accessibilityRole="alert" style={s.error}>First contact could not render: {errorText}</Text>}
      <View style={s.buttons}><Pressable accessibilityRole="button" onPress={replay} style={s.button}><Text style={s.label}>{errorText?'Retry':'Replay'}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>router.replace('/')} style={s.button}><Text style={s.label}>Exit</Text></Pressable></View>
      <Text style={s.note}>DEVELOPMENT · TEMPORARY ASTRONAUT</Text>
    </View>}
  </View>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#000'},
  slogan:{fontFamily:'Contact-Space',fontSize:12,lineHeight:20,letterSpacing:1.4,color:'#c9c7c2',textAlign:'center'},
  instruction:{fontFamily:'Contact-Space',fontSize:13,lineHeight:20,color:'#b5bac2',textAlign:'center'},
  question:{fontFamily:'Contact-Clash',fontSize:26,lineHeight:32,color:'#eeeff1',maxWidth:480},
  input:{fontFamily:'Contact-Inter',fontSize:17,lineHeight:25,color:'#e1e5eb',marginTop:18,paddingVertical:10,paddingHorizontal:0,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#38414c',minHeight:54,maxHeight:110,textAlignVertical:'top'},
  keyboardAction:{fontFamily:'Contact-Space',fontSize:11,color:'#bac4d2',letterSpacing:0.6},
  controls:{position:'absolute',gap:6}, buttons:{flexDirection:'row',justifyContent:'center',gap:24},
  button:{minWidth:72,minHeight:44,justifyContent:'center',alignItems:'center'},
  label:{fontFamily:'Contact-Space',fontSize:12,color:'#aeb4bd'},
  note:{fontFamily:'Contact-Space',fontSize:9,color:'#717780',textAlign:'center',letterSpacing:1},
  error:{color:'#ddd',fontSize:15,lineHeight:22},
});
