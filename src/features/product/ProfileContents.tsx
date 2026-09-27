import { useState } from 'react';
import { Keyboard, Linking, Text, TextInput, View } from 'react-native';
import { useExperience } from '../experience/ExperienceProvider';
import { validUsername } from './profile';
import { Reveal } from './Reveal';
import { Action, ui } from './ui';
export function ProfileContents(){
 const {state,dispatch}=useExperience();const [editing,setEditing]=useState(false),[name,setName]=useState(state.username);
 const words=[['MOVING FROM',state.answers.movingFrom],['WHY IT MATTERS TO ME',state.answers.reason],['MOVING TOWARD',state.answers.progressVision]];
 return <>
  <Reveal delay={120}><View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:22}}><View style={{width:5,height:5,borderRadius:3,backgroundColor:'#b2c7de'}}/><Text style={[ui.label,{fontSize:11,letterSpacing:2,color:'#a6bcd1'}]}>YOUR JOURNEY</Text></View><Text accessibilityRole="header" style={[ui.title,{fontSize:44,lineHeight:50}]}>{state.username||'Traveler'}</Text></Reveal>
  <Reveal delay={280}><Text style={[ui.body,{color:'#d1c6b3'}]}>{state.history.length} NEXT{state.history.length===1?'':'s'} completed. Each one left a light.</Text><Text style={[ui.eyebrow,{marginTop:18,marginBottom:28}]}>{state.currentNext?.status==='active'?'A STEP IN MOTION':state.currentNext?'A NEW STEP AHEAD':'SPACE FOR YOUR NEXT'}</Text></Reveal>
  <Reveal delay={430}><View style={{borderTopWidth:1,borderBottomWidth:1,borderColor:'#394657',paddingVertical:24,marginBottom:36}}><Text style={[ui.eyebrow,{color:'#a9bfd7'}]}>CURRENT NEXT</Text><Text style={[ui.title,{fontSize:25,lineHeight:31}]}>{state.currentNext?.title||'A new step is waiting.'}</Text>{state.currentNext&&<Text style={ui.body}>{state.currentNext.action}</Text>}</View></Reveal>
  <Reveal delay={550}><Text style={[ui.eyebrow,{color:'#d3bea0'}]}>WHAT I SAID</Text>{words.map(([label,answer],i)=><View key={label} style={{borderLeftWidth:1,borderLeftColor:i===1?'#665877':'#4c6177',paddingLeft:18,marginBottom:30}}><Text style={[ui.label,{fontSize:11,color:i===1?'#b9abc9':'#a8bfd0',marginBottom:12}]}>{label}</Text><Text style={ui.body}>{answer}</Text></View>)}
   <Text style={[ui.label,{marginBottom:10}]}>MY PACE</Text><Text style={ui.body}>{state.answers.dailyCommitment} minutes of space each day.</Text><Text style={[ui.body,{marginTop:8,color:'#aeb9c7'}]}>{state.answers.challengeLevel==='gentle'?'Start gently':state.answers.challengeLevel==='push'?'Push me':'Keep me balanced'}.</Text>
   {editing?<View style={{marginTop:20}}><TextInput accessibilityLabel="Update username" value={name} onChangeText={setName} maxLength={24} keyboardAppearance="dark" style={ui.input}/><Action label="SAVE IDENTITY" disabled={!validUsername(name)} onPress={()=>{Keyboard.dismiss();dispatch({type:'profile',username:name});setEditing(false);}}/><Action label="CANCEL NAME CHANGE" onPress={()=>{setEditing(false);setName(state.username);Keyboard.dismiss();}}/></View>:<View style={{marginTop:16}}><Action label="EDIT DISPLAY NAME" onPress={()=>setEditing(true)}/></View>}
   <Text style={[ui.body,{fontSize:12,color:'#78818c',lineHeight:18}]}>Local profile · stored on this device.</Text>
   <Text style={[ui.body,{fontSize:11,color:'#78818c',lineHeight:17,marginTop:20}]}>Astronaut by IvanPetrov · CC BY 4.0. Posed and material-adjusted for NEXT.</Text>
   <Text accessibilityRole="link" onPress={()=>{void Linking.openURL('https://sketchfab.com/3d-models/astronaut-d5a16f7ec11c4b1d876059cbf6adbf56').catch(()=>{});}} style={[ui.body,{fontSize:12,color:'#a8bfd0',paddingVertical:12}]}>Astronaut source ↗</Text>
   <Text accessibilityRole="link" onPress={()=>{void Linking.openURL('https://creativecommons.org/licenses/by/4.0/').catch(()=>{});}} style={[ui.body,{fontSize:12,color:'#a8bfd0',paddingVertical:12}]}>CC BY 4.0 license ↗</Text>
  </Reveal>
 </>;
}
