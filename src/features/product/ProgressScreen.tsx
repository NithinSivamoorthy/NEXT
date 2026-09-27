import { Reveal } from './Reveal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExperience } from '../experience/ExperienceProvider';
import { deriveMomentum, momentumLevel } from './progress';
import { CapsuleComposer } from './MemoryUI';
import type { ExperienceState } from '../experience/model';
import { Action, ui, useProductFonts } from './ui';

/** The hero star restated in two dimensions, so the screen has the same anchor as the universe. */
function Anchor({ level, reducedMotion }: { level: number; reducedMotion: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion || level <= 0) return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 7200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }));
    loop.start(); return () => loop.stop();
  }, [pulse, reducedMotion, level]);
  const size = 84 + level * 26;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', marginTop: 14, marginBottom: 30 }}>
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: '#1a1108',
      shadowColor: '#ffce87', shadowOpacity: .34 + level * .34, shadowRadius: 24 + level * 14, shadowOffset: { width: 0, height: 0 },
      transform: reducedMotion ? [] : [{ scale: pulse.interpolate({ inputRange: [0, .5, 1], outputRange: [1, 1 + level * .045, 1] }) }],
    }}>
      <View style={{ position: 'absolute', inset: 10, borderRadius: size / 2, backgroundColor: '#3a2a14' }} />
      <View style={{ position: 'absolute', inset: 10 + level * 4, borderRadius: size / 2, backgroundColor: `rgba(255,220,170,${(.5 + level * .45).toFixed(3)})` }} />
    </Animated.View>
  </View>;
}

/** Recent days as points of light. Days before the first completion are absent, not missed. */
function RecentDays({ days, current, reducedMotion }: { days: ReturnType<typeof deriveMomentum>['days']; current: number; reducedMotion: boolean }) {
  const streakFrom = current > 0 ? days.length - current : days.length;
  const label = days.length ? `Last ${days.length} days. ${days.filter(d => d.count > 0).length} with a completed NEXT.` : '';
  return <View accessible accessibilityLabel={label} style={{ marginTop: 6 }}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', alignItems: 'center', height: 30 }}>
      {days.map((day, index) => {
        const done = day.count > 0, inStreak = done && index >= streakFrom;
        return <View key={day.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 30 }}>
          {/* The connecting light is drawn only between consecutive days of the live streak. */}
          {inStreak && index > streakFrom ? <View style={s.link} /> : null}
          <View style={[s.day, done && s.done, inStreak && s.live, day.before && !done && s.before,
            !reducedMotion && inStreak ? { shadowRadius: 9 } : null]} />
        </View>;
      })}
    </View>
  </View>;
}

/** The Hero Star is the only place that presents sealed or opened letters after creation. */
function CapsuleArchive({state,reducedMotion}:{state:ExperienceState;reducedMotion:boolean}){
  const [openedId,setOpenedId]=useState<string|null>(null);
  const opened=state.capsules.find(c=>c.id===openedId&&state.openedCapsuleIds.includes(c.id));
  const date=(value:string)=>new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  const origin=(nextId?:string)=>nextId?state.history.find(n=>n.id===nextId)?.title:undefined;
  return <View style={s.capsuleSection}>
    <Text accessibilityRole="header" style={[ui.label,{color:'#dec396',marginBottom:14}]}>TIME CAPSULES</Text>
    {opened?<Reveal key={opened.id}>
      <Action label="← ALL TIME CAPSULES" onPress={()=>setOpenedId(null)}/>
      <View style={[s.capsuleCard,s.openedCapsule]}>
        <Text style={[ui.eyebrow,{color:'#edcf96'}]}>OPENED · {date(opened.createdAt).toUpperCase()}</Text>
        {origin(opened.nextId)?<Text style={[ui.label,{fontSize:11,marginBottom:20}]}>FROM: {origin(opened.nextId)}</Text>:null}
        <Text style={[ui.body,{color:'#f0e9d9'}]}>{opened.text}</Text>
      </View>
    </Reveal>:state.capsules.length?state.capsules.map(capsule=>{
      const unlocked=state.openedCapsuleIds.includes(capsule.id);
      const source=origin(capsule.nextId);
      const label=`Time Capsule. ${unlocked?'Opened':'Sealed'} ${date(capsule.createdAt)}. ${source?`From ${source}. `:''}${unlocked?'Open to read.':'Waiting to be opened.'}`;
      const content=<>
        <View style={s.capsuleLight} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <Text style={[ui.eyebrow,{color:unlocked?'#f1d6a4':'#c4aa7e',marginBottom:12}]}>{unlocked?'OPENED':'SEALED'} · {date(capsule.createdAt).toUpperCase()}</Text>
        {source?<Text style={[ui.label,{fontSize:11,marginBottom:12,color:'#d4d2c9'}]}>FROM: {source}</Text>:null}
        <Text style={[ui.body,{fontSize:14,lineHeight:21,color:unlocked?'#d8cbb2':'#ada497'}]}>{unlocked?'A voice from who you were. Open it here.':'WAITING FOR THE PERSON YOU BECOME.'}</Text>
      </>;
      return unlocked?<Pressable key={capsule.id} accessibilityRole="button" accessibilityLabel={label} onPress={()=>setOpenedId(capsule.id)} style={({pressed})=>[s.capsuleCard,pressed&&{borderColor:'#f2d4a0',backgroundColor:'#1b1821',transform:[{scale:reducedMotion?1:.988}]}]}>{content}</Pressable>
        :<View key={capsule.id} accessible accessibilityRole="text" accessibilityLabel={label} style={s.capsuleCard}>{content}</View>;
    }):<Text style={[ui.body,{fontSize:14,color:'#a9a39d'}]}>A letter to your future self will wait here when you seal one.</Text>}
  </View>;
}

export default function ProgressScreen() {
  const { state, settings, hydrated } = useExperience();
  const router = useRouter(); const insets = useSafeAreaInsets(); const [fontsLoaded] = useProductFonts();
  const params=useLocalSearchParams<{capsule?:string}>();
  const [composing,setComposing]=useState<string|null>(()=>typeof params.capsule==='string'?params.capsule:null);
  const composeOpen=composing==='manual'||(composing!==null&&state.history.some(n=>n.id===composing));
  const momentum = useMemo(() => deriveMomentum(state.history), [state.history]);
  const level = momentumLevel(momentum.current);
  const back = () => router.canGoBack() ? router.back() : router.replace('/universe');
  const figures = [
    { value: momentum.current, unit: momentum.current === 1 ? 'DAY' : 'DAYS', label: 'CURRENT STREAK' },
    { value: momentum.longest, unit: momentum.longest === 1 ? 'DAY' : 'DAYS', label: 'LONGEST STREAK' },
    { value: momentum.total, unit: '', label: momentum.total === 1 ? 'NEXT COMPLETED' : 'NEXTS COMPLETED' },
  ];
  const open = momentum.lastDay !== null && momentum.current === 0;

  if (!fontsLoaded||!hydrated) return <View style={ui.screen} />;
  return <View style={ui.screen}>
    <StatusBar hidden />
    <ScrollView key={composeOpen?'capsule-composer':'progress'} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 28, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 44 }}>
      <Action label="← RETURN TO UNIVERSE" onPress={back} />
      <Reveal><Text accessibilityRole="header" style={[ui.eyebrow, { marginTop: 12, marginBottom: 0 }]}>YOUR MOMENTUM</Text></Reveal>
      <Anchor level={level} reducedMotion={settings.reducedMotion} />
      {composeOpen?<CapsuleComposer nextId={composing==='manual'?undefined:composing??undefined} onClose={()=>setComposing(null)}/>:<>{momentum.total === 0 ? <Reveal delay={200}>
        <Text style={s.figure}>0</Text>
        <Text style={[ui.eyebrow, { marginTop: 6 }]}>NEXTS COMPLETED</Text>
        <View style={s.rule} />
        <Text style={[ui.title, { fontSize: 25, lineHeight: 32 }]}>{'YOUR FIRST NEXT\nCHANGES THIS STAR.'}</Text>
      </Reveal> : <>
        <Reveal delay={160}><View style={s.current}>
          <Text style={[s.figure,{fontSize:72,lineHeight:82,color:'#f4d6a4',textAlign:'center'}]}>{momentum.current}</Text>
          <Text style={[ui.label,{color:'#d3bd96',textAlign:'center'}]}>{figures[0].unit} · CURRENT STREAK</Text>
        </View></Reveal>
        <View style={{flexDirection:'row',gap:12,flexWrap:'wrap'}}>
          {[figures[2],figures[1]].map(figure=><View key={figure.label} style={s.stat}>
            <Text style={[s.figure,{fontSize:40,lineHeight:48}]}>{figure.value}</Text>
            <Text style={[ui.eyebrow,{fontSize:10,lineHeight:17,marginTop:8,marginBottom:0}]}>{figure.label}</Text>
          </View>)}
        </View>
        <Reveal delay={560}>
          <View style={s.rule} />
          <Text style={[ui.label, { marginBottom: 16 }]}>RECENT ACTIVITY</Text>
          <RecentDays days={momentum.days} current={momentum.current} reducedMotion={settings.reducedMotion} />
          <Text style={[ui.body, { fontSize: 13, lineHeight: 20, color: '#79818d', marginTop: 20 }]}>
            {open ? 'Your streak is waiting. Complete a NEXT today to begin it again.'
              : momentum.current >= momentum.longest && momentum.current > 1 ? 'This is the furthest you have carried it.'
                : 'One completed NEXT a day keeps this alight.'}
          </Text>
          <Text style={[ui.label, { marginTop: 30, color: '#cbb894' }]}>KEEP MOVING.</Text>
        </Reveal>
      </>}
      <CapsuleArchive state={state} reducedMotion={settings.reducedMotion}/>
      <Action variant="secondary" label="WRITE TO MY FUTURE SELF ↗" onPress={()=>setComposing('manual')}/>
      </>}
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  capsuleSection:{marginTop:44,paddingTop:26,borderTopWidth:1,borderTopColor:'#68553b'},
  capsuleCard:{minHeight:118,backgroundColor:'#111016',borderRadius:14,borderWidth:1,borderColor:'#766548',padding:20,marginBottom:14,overflow:'hidden'},
  openedCapsule:{borderColor:'#c9a872',backgroundColor:'#19151a'},
  capsuleLight:{position:'absolute',top:0,left:0,right:0,height:2,backgroundColor:'#96774c',opacity:.72},
  current: { paddingBottom:32, marginBottom:20, borderBottomWidth:1, borderBottomColor:'#3d3324' },
  stat: { flex:1, minWidth:130, padding:18, backgroundColor:'#10121d', borderWidth:1, borderColor:'#363b50', borderRadius:14 },
  figure: { fontFamily: 'Contact-Clash', fontSize: 62, lineHeight: 70, color: '#f6f1e7', letterSpacing: -1.5 },
  unit: { fontFamily: 'Contact-Space', fontSize: 14, letterSpacing: 2.4, color: '#9aa2ae', marginLeft: 12 },
  rule: { height: 1, backgroundColor: '#2f3340', marginVertical: 26 },
  day: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#242936', shadowColor: '#ffdcab', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  before: { backgroundColor: '#14171f' },
  done: { backgroundColor: '#c9b184', shadowOpacity: .5 },
  live: { backgroundColor: '#ffe3b4', shadowOpacity: .85 },
  link: { position: 'absolute', height: 1, left: '-50%', right: '50%', backgroundColor: '#6d5c3f' },
});
