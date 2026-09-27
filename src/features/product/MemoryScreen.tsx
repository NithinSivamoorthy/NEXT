import { Reveal } from './Reveal';
import { LocalPhoto, memoryUI } from './MemoryUI';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExperience } from '../experience/ExperienceProvider';
import { formatCompleted, photoMemories } from './progress';
import { Action, ui, useProductFonts } from './ui';

/** A view of completed records with photos, never a separate archive/database. */
export default function MemoryScreen() {
  const { state, settings } = useExperience();
  const router = useRouter(); const insets = useSafeAreaInsets(); const [fontsLoaded] = useProductFonts();
  const { width, fontScale } = useWindowDimensions();
  const [opened, setOpened] = useState<string | null>(null);
  const kept = useMemo(() => photoMemories(state.history), [state.history]);
  const item = kept.find(record => record.id === opened);
  const back = () => router.canGoBack() ? router.back() : router.replace('/universe');
  const columns = width >= 360 && fontScale <= 1.3 ? 2 : 1;
  const cardWidth = (Math.min(width, 680) - 48 - (columns - 1) * 12) / columns;
  const container = { paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40, maxWidth: 680, width: '100%' as const, alignSelf: 'center' as const };
  if (!fontsLoaded) return <View style={ui.screen} />;
  return <View style={ui.screen}>
    <StatusBar hidden />
    {item ? <ScrollView contentContainerStyle={container}>
      <Action label="← ALL MEMORIES" onPress={() => setOpened(null)} />
      <Reveal key={item.id}><View style={s.detail}>
        <LocalPhoto uri={item.photoUri!} />
        <Text accessibilityRole="header" style={[ui.title, { marginTop: 12 }]}>{item.title}</Text>
        <Text style={[ui.eyebrow, memoryUI.gold]}>{formatCompleted(item.completedAt)}</Text>
        <View style={memoryUI.divider} />
        <Text style={s.section}>WHAT THIS NEXT ASKED</Text><Text style={ui.body}>{item.action}</Text>
        {item.memory ? <View style={s.sectionBlock}><Text style={s.section}>YOUR MEMORY</Text><Text style={ui.body}>{item.memory}</Text></View> : null}
      </View></Reveal>
    </ScrollView> : <FlatList key={columns} data={kept} numColumns={columns} keyExtractor={record => record.id}
      contentContainerStyle={container} columnWrapperStyle={columns === 2 ? { gap: 12 } : undefined}
      initialNumToRender={6} maxToRenderPerBatch={4} windowSize={5}
      ListHeaderComponent={<View>
        <Action label="← RETURN TO UNIVERSE" onPress={back} />
        <Reveal><Text accessibilityRole="header" style={[ui.eyebrow, { marginTop: 14, marginBottom: 12 }]}>MEMORIES</Text>
          <Text style={[ui.title, { fontSize: 27, lineHeight: 34 }]}>{'YOUR UNIVERSE\nREMEMBERS WHAT YOU LIVED.'}</Text>
          <Text style={[ui.body, { fontSize: 14, marginBottom: 24 }]}>The light you chose to keep.</Text></Reveal>
      </View>}
      renderItem={({ item: record }) => <Pressable accessibilityRole="button"
        accessibilityLabel={`Open memory: ${record.title}, ${formatCompleted(record.completedAt)}`}
        onPress={() => setOpened(record.id)} style={({ pressed }) => [s.card, { width: cardWidth }, pressed && s.pressed,
          { transform: [{ scale: pressed && !settings.reducedMotion ? .985 : 1 }] }]}>
        <LocalPhoto uri={record.photoUri!} variant="card" />
        <View style={s.caption}><Text numberOfLines={3} style={s.cardTitle}>{record.title}</Text>
          <Text style={s.date}>{formatCompleted(record.completedAt)}</Text></View>
      </Pressable>}
      ListEmptyComponent={<Reveal delay={180}><View style={s.detail}>
        <Text style={ui.body}>Complete a NEXT and leave a photo behind. It will be kept here.</Text>
        <Text style={[ui.body, { fontSize: 14, color: '#9da5b4', marginTop: 16 }]}>Your completed NEXTs stay in Previous NEXTs either way.</Text>
      </View></Reveal>}
      ListFooterComponent={kept.length ? <Text style={[ui.eyebrow, { marginTop: 20, textAlign: 'center' }]}>{kept.length} PRESERVED</Text> : null}
    />}
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#10121e', borderWidth: 1, borderColor: '#3b405b', borderRadius: 12, marginBottom: 16, padding: 5 },
  pressed: { borderColor: '#b0b4ee', backgroundColor: '#1c1c32', shadowColor: '#8583d6', shadowOpacity: .22, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  caption: { padding: 10 },
  cardTitle: { fontFamily: 'Contact-Space', color: '#f1eee9', fontSize: 15, lineHeight: 21, marginBottom: 12 },
  date: { fontFamily: 'Contact-Inter', color: '#c0b292', fontSize: 11, lineHeight: 17 },
  detail: { backgroundColor: '#0c0f1a', borderWidth: 1, borderColor: '#464b68', borderRadius: 16, padding: 18, marginTop: 12 },
  section: { fontFamily: 'Contact-Space', fontSize: 12, lineHeight: 19, letterSpacing: 1, color: '#bdc4e6', marginBottom: 12 },
  sectionBlock: { marginTop: 28, borderTopWidth: 1, borderTopColor: '#2c3045', paddingTop: 24 },
});
