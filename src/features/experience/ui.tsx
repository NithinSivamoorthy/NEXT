import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export const palette = { background: '#000', text: '#f3f0ea', secondary: '#aaa8a4', faint: '#777570', accent: '#d3bd98', line: '#292725' };

export function QuietStars() {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
    {Array.from({ length: 22 }, (_, i) => <View key={i} style={{ position: 'absolute', left: `${(i * 37 + 11) % 100}%`, top: `${(i * 23 + 7) % 95}%`, width: i % 6 === 0 ? 2 : 1, height: i % 6 === 0 ? 2 : 1, borderRadius: 2, backgroundColor: '#e2d7c3', opacity: i % 6 === 0 ? 0.35 : 0.16 }} />)}
  </View>;
}

export function ScreenShell({ children, stars = false, keyboard = false }: { children: ReactNode; stars?: boolean; keyboard?: boolean }) {
  return <SafeAreaView style={styles.screen}>
    <StatusBar style="light" />
    {stars && <QuietStars />}
    <KeyboardAvoidingView style={{ flex: 1 }} enabled={keyboard} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
      <View style={styles.width}>{children}</View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function PrimaryButton({ label, onPress, disabled = false, hint }: { label: string; onPress: () => void; disabled?: boolean; hint?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, disabled && { color: palette.secondary }]}>{label}</Text><Text accessible={false} style={[styles.arrow, disabled && { color: palette.secondary }]}>↗</Text>
  </Pressable>;
}
export function BackButton({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onPress} hitSlop={8} style={styles.back}><Text style={styles.backText}>‹  Back</Text></Pressable>;
}
export function Wordmark({ small = false }: { small?: boolean }) {
  return <Text style={small ? styles.smallWordmark : styles.wordmark}>NEXT.</Text>;
}
export function OrbitMark() {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.orbitSpace}>
    <View style={styles.orbit} /><View style={styles.orbitInner} /><View style={styles.light} />
  </View>;
}
export const ui = StyleSheet.create({
  header: { minHeight: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, lineHeight: 18, letterSpacing: 2.8, color: palette.accent, fontWeight: '500' },
  heading: { color: palette.text, fontSize: 34, lineHeight: 42, letterSpacing: -0.9, fontWeight: '400' },
  body: { color: palette.secondary, fontSize: 15, lineHeight: 24 },
  footer: { paddingTop: 20, paddingBottom: 14, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  caption: { color: palette.faint, fontSize: 12, lineHeight: 19, textAlign: 'center' },
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  width: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 28 },
  button: { minHeight: 58, paddingVertical: 17, paddingHorizontal: 22, backgroundColor: palette.text, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  buttonText: { color: '#111', fontSize: 16, fontWeight: '600', flexShrink: 1 },
  arrow: { color: '#333', fontSize: 21 },
  disabled: { backgroundColor: '#292725' },
  pressed: { opacity: 0.75 },
  back: { minHeight: 44, minWidth: 64, justifyContent: 'center' },
  backText: { color: palette.secondary, fontSize: 14 },
  wordmark: { fontSize: 66, letterSpacing: 7, color: palette.text, fontWeight: '400' },
  smallWordmark: { fontSize: 16, letterSpacing: 4, color: palette.text, fontWeight: '400' },
  orbitSpace: { width: 180, height: 130, justifyContent: 'center', alignItems: 'center' },
  orbit: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: '#363029', transform: [{ rotate: '-28deg' }, { scaleY: 0.45 }] },
  orbitInner: { position: 'absolute', width: 108, height: 108, borderRadius: 54, borderWidth: 1, borderColor: '#211e1a' },
  light: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accent },
});
