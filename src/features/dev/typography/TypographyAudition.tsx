import { useState } from 'react';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { auditionFonts } from './fonts';
import { directions, periodStudies, statements } from './specimens';
import { tokens } from './tokens';
import WordmarkSpecimen from './WordmarkSpecimen';

const sections = ['Wordmark', 'Statements', 'Interface', 'Tokens'] as const;
export default function TypographyAudition() {
  const [loaded, error] = useFonts(auditionFonts);
  const [direction, setDirection] = useState(0);
  const [section, setSection] = useState<(typeof sections)[number]>('Wordmark');
  const [selected, setSelected] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const current = directions[direction];
  const largeMark = Math.min(64, (Math.min(width, 560) - 96) / 4);
  if (!loaded) return <SafeAreaView style={s.screen}><View style={s.content}><Text style={{ color: tokens.color.white, fontSize: 18 }}>{error ? `Font loading failed: ${error.message}` : 'Loading local audition fonts…'}</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={s.control}><Text style={{ color: tokens.color.white }}>Return to NEXT</Text></Pressable></View></SafeAreaView>;
  const display = { fontFamily: current.family };
  return <SafeAreaView style={s.screen}>
    <StatusBar style="light" />
    <View style={s.frame}>
      <View style={s.header}><Text style={s.label}>NEXT / TYPE LAB</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={s.exit}><Text style={s.small}>Exit</Text></Pressable></View>
      <Text style={s.note}>DEVELOPMENT AUDITION · NO BRAND SELECTED</Text>
      <View style={s.row}>{directions.map((item, i) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Direction ${item.id}, ${item.name}`} accessibilityState={{ selected: i === direction }} aria-selected={i === direction} onPress={() => setDirection(i)} style={[s.direction, i === direction && s.selected]}><Text style={[s.directionLetter, i === direction && { color: '#000' }]}>{item.id}</Text><Text style={[s.directionName, i === direction && { color: '#000' }]}>{item.name}</Text></Pressable>)}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={{ gap: 8 }}>{sections.map((name) => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: name === section }} onPress={() => setSection(name)} style={[s.tab, name === section && { borderBottomColor: tokens.color.stellar }]}><Text style={s.small}>{name}</Text></Pressable>)}</ScrollView>
      <ScrollView key={section} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[s.heading, display]}>{current.name}</Text><Text style={[s.body, { marginBottom: 28 }]}>{current.character}{'\n'}Paired with Inter Regular / Medium</Text>
        {section === 'Wordmark' && <>
          <Text style={[s.body, { marginBottom: 24 }]}>Same sizes across A/B/C. Each treatment appears at display and compact scale, then reverses to black on white. Marks use fixed sizes; reading text follows your device settings.</Text>
          {periodStudies.map((study, variant) => <View key={study.name} style={s.study}>
            <Text style={s.label}>{study.name}</Text><Text style={[s.small, { marginVertical: 10 }]}>{study.detail}</Text>
            <View style={s.markPanel}><WordmarkSpecimen family={current.family} variant={variant} size={largeMark} /><WordmarkSpecimen family={current.family} variant={variant} size={24} /></View>
            <View style={[s.markPanel, { backgroundColor: '#FFFFFF' }]}><WordmarkSpecimen family={current.family} variant={variant} size={largeMark} inverse /><WordmarkSpecimen family={current.family} variant={variant} size={24} inverse /></View>
          </View>)}
        </>}
        {section === 'Statements' && statements.map((copy) => <View key={copy} style={s.statement}><Text accessibilityRole="header" style={[s.display, display]}>{copy}</Text></View>)}
        {section === 'Interface' && <>
          <Text style={s.label}>YOUR FIRST NEXT</Text>
          <Text accessibilityRole="header" style={[s.display, display, { marginVertical: 20 }]}>Clear a small space.</Text>
          <Text style={s.body}>Choose one small surface near you. Spend five minutes putting a few things back where they belong. One small attempt is enough for today.</Text>
          <Text style={[s.label, { marginVertical: 24 }]}>5 MINUTES · ONE SMALL BEGINNING</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Begin, typography sample" onPress={() => setSelected(!selected)} style={s.primary}><Text style={s.buttonText}>{selected ? 'Sample selected' : 'Begin'}</Text><Text style={s.buttonText}>↗</Text></Pressable>
          <View style={s.statement}><Text style={s.label}>QUESTION 01 / 05</Text><Text accessibilityRole="header" style={[s.question, display]}>What are you ready to move forward from?</Text><Text style={s.body}>This can be a habit, a relationship, a setback, or anything you want to leave behind.</Text><Text style={[s.body, { marginTop: 28, paddingBottom: 20, borderBottomWidth: 1, borderColor: tokens.color.border }]}>Start wherever you are.</Text></View>
          <Text style={s.small}>Controls are specimens only. No answers or production preferences are changed.</Text>
        </>}
        {section === 'Tokens' && <>
          {Object.entries(tokens.color).map(([name, color]) => <View key={name} style={s.token}><View style={{ width: 32, height: 32, backgroundColor: color, borderWidth: 1, borderColor: '#555' }} /><Text style={s.body}>{name} / {color}</Text></View>)}
          <Text style={s.tokenText}>Spacing / {tokens.space.join(' · ')} pt</Text>
          <Text style={s.tokenText}>Corners / square compositions, 6pt controls</Text>
          <Text style={s.tokenText}>Borders / 1pt, selection and separation only</Text>
          <Text style={s.tokenText}>Opacity / 100% primary · 72% secondary · 16% decorative. Reading text uses solid color tokens.</Text>
          <Text style={s.tokenText}>Glow / none 0 · trace 0.06 · focal 0.14. Reserved intensity values; no glow is rendered in this audition.</Text>
          <Text style={s.tokenText}>Type / display 36 · question 30 · body 17 · label 12 · control 16 pt</Text>
          <Text style={s.small}>Exploration values only. Existing production tokens remain unchanged.</Text>
        </>}
      </ScrollView>
    </View>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' }, frame: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, exit: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  label: { fontFamily: 'Audition-InterMedium', fontSize: 12, lineHeight: 19, letterSpacing: 1.8, color: tokens.color.stellar },
  note: { fontFamily: 'Audition-Inter', fontSize: 10, lineHeight: 16, color: tokens.color.secondary, marginHorizontal: 24, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 24 }, direction: { flex: 1, borderWidth: 1, borderColor: tokens.color.border, padding: 10, minHeight: 76, borderRadius: 6 }, selected: { backgroundColor: tokens.color.white, borderColor: tokens.color.white },
  directionLetter: { fontFamily: 'Audition-InterMedium', fontSize: 20, color: tokens.color.white }, directionName: { fontFamily: 'Audition-Inter', fontSize: 11, lineHeight: 16, color: tokens.color.secondary, marginTop: 4 },
  tabs: { flexGrow: 0, flexShrink: 0, marginHorizontal: 24, marginTop: 10 }, tab: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderColor: 'transparent', paddingHorizontal: 8 },
  content: { padding: 24, paddingBottom: 64 }, heading: { color: tokens.color.white, fontSize: 24, lineHeight: 32 },
  body: { fontFamily: 'Audition-Inter', color: tokens.color.secondary, fontSize: 17, lineHeight: 27 }, small: { fontFamily: 'Audition-Inter', color: tokens.color.secondary, fontSize: 13, lineHeight: 21 },
  study: { marginBottom: 40 }, markPanel: { borderWidth: 1, borderColor: tokens.color.border, padding: 16, gap: 18 },
  statement: { paddingVertical: 32, borderTopWidth: 1, borderColor: tokens.color.border, marginTop: 24 }, display: { color: tokens.color.white, fontSize: tokens.type.display, lineHeight: 42, letterSpacing: -0.8 },
  question: { color: tokens.color.white, fontSize: 30, lineHeight: 38, marginVertical: 20 },
  primary: { padding: 20, minHeight: 58, borderRadius: 6, backgroundColor: tokens.color.white, flexDirection: 'row', justifyContent: 'space-between' }, buttonText: { fontFamily: 'Audition-InterMedium', fontSize: 16, color: '#000' }, control: { padding: 20, marginTop: 20, minHeight: 44 },
  token: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }, tokenText: { fontFamily: 'Audition-Inter', fontSize: 16, lineHeight: 26, color: tokens.color.white, marginBottom: 24 },
});
