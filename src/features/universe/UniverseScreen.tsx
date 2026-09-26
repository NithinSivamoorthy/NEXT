import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import UniverseCanvas from './UniverseCanvas';
import { UniverseCamera } from './camera';

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Universe renderer failed:', error, info.componentStack); }
  render() {
    return this.state.failed ? <View style={styles.error}><Text style={styles.caption}>The universe could not render. Reload to try again.</Text></View> : this.props.children;
  }
}

export default function UniverseScreen() {
  const insets = useSafeAreaInsets();
  const [controls] = useState(() => new UniverseCamera());
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReducedMotion(value); });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const activity = AppState.addEventListener('change', (state) => { controls.cancel(); setActive(state === 'active'); });
    return () => { mounted = false; controls.cancel(); motion.remove(); activity.remove(); };
  }, [controls]);
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SceneBoundary><UniverseCanvas controls={controls} active={active} reducedMotion={reducedMotion} /></SceneBoundary>
      <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 20) + 42, paddingLeft: insets.left + 24, paddingRight: insets.right + 24 }]}>
        <Text style={styles.title} accessibilityRole="header">NEXT.</Text>
        <Text style={styles.caption}>Your universe begins here.</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 16, pointerEvents: 'none' },
  title: { fontSize: 25, fontWeight: '300', letterSpacing: 7, color: '#f0ebe3' },
  caption: { fontSize: 13, lineHeight: 20, letterSpacing: 0.8, color: '#aaa5a0', textAlign: 'center' },
  error: { flex: 1, justifyContent: 'center', padding: 32 },
});
