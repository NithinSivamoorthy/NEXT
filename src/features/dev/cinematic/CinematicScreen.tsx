import { Component, useCallback, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExperience } from '../../experience/ExperienceProvider';
import CinematicCanvas from './CinematicCanvas';
import { lettersOpacity } from './timeline';

class RenderBoundary extends Component<{ children: ReactNode; onError: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Cinematic prototype failed', error); this.props.onError(error.message); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function CinematicScreen() {
  const { settings } = useExperience();
  return <CinematicPlayer key={String(settings.reducedMotion)} />;
}

function CinematicPlayer() {
  const [loaded, fontError] = useFonts({ 'Cinematic-Clash': require('../../../../assets/dev/typography/ClashDisplay-Bold.otf') });
  const { settings } = useExperience();
  const [focused, setFocused] = useState(true);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [bounds, setBounds] = useState({ width: window.width, height: window.height });
  const [textWidth, setTextWidth] = useState(0);
  const [run, setRun] = useState(0);
  const [hold, setHold] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const onTime = useCallback((t: number) => opacity.setValue(lettersOpacity(t)), [opacity]);
  const onHold = useCallback(() => setHold(true), []);
  const size = Math.min(66, bounds.width * 0.165);
  const diameter = size * 0.13;
  const gap = size * 0.08;
  const top = bounds.height * 0.43;
  const errorText = error ?? fontError?.message;
  const replay = () => { opacity.setValue(0); setHold(false); setError(null); setRun(value => value + 1); };
  return <View style={s.screen} onLayout={({ nativeEvent }) => setBounds(nativeEvent.layout)}>
    <StatusBar hidden />
    {loaded && settings.ready && textWidth > 0 && <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <RenderBoundary key={`${run}-${settings.reducedMotion}`} onError={setError}>
        <CinematicCanvas active={settings.active && focused} reducedMotion={settings.reducedMotion}
          point={{ x: (textWidth + gap) / 2, y: top + size * 0.89 + diameter / 2 - bounds.height / 2, diameter, height: bounds.height }}
          onTime={onTime} onHold={onHold} />
      </RenderBoundary>
    </View>}
    {loaded && <Animated.View pointerEvents="none" accessible accessibilityLabel="NEXT" style={{ position: 'absolute', top, left: 0, right: 0, alignItems: 'center', opacity }}>
      <View style={{ paddingRight: gap + diameter }}>
        <Text allowFontScaling={false} onLayout={({ nativeEvent }) => setTextWidth(nativeEvent.layout.width)} style={{ fontFamily: 'Cinematic-Clash', fontSize: size, lineHeight: size * 1.3, letterSpacing: -size * 0.025, color: '#f5f5f5', includeFontPadding: false }}>NEXT</Text>
      </View>
    </Animated.View>}
    {(hold || errorText) && <View style={[s.controls, { bottom: Math.max(insets.bottom, 18), left: insets.left + 24, right: insets.right + 24 }]}>
      <Text accessibilityLiveRegion="polite" style={s.note}>{errorText ? `Cinematic error: ${errorText}` : 'DEVELOPMENT · TEMPORARY ASTRONAUT PROXY'}</Text>
      <View style={s.buttons}>
        <Pressable accessibilityRole="button" onPress={replay} style={s.button}><Text style={s.label}>Replay</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={s.button}><Text style={s.label}>Exit</Text></Pressable>
      </View>
    </View>}
  </View>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  controls: { position: 'absolute', gap: 8 },
  note: { color: '#6d747d', fontSize: 10, letterSpacing: 1, textAlign: 'center' },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  button: { minHeight: 44, minWidth: 72, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#b5bbc3', fontSize: 13, letterSpacing: 0.5 },
});
