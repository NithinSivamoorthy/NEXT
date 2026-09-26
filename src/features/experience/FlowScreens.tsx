import { useEffect, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Animated, Platform, ScrollView, Text, View } from 'react-native';
import { useExperience } from './ExperienceProvider';
import { CinematicSequence } from './CinematicSequence';
import { firstUnanswered, philosophy, universeNarrative } from './content';
import { completeAnswers } from './model';
import { personalizeLocally } from './personalization';
import { BackButton, OrbitMark, palette, PrimaryButton, ScreenShell, ui, Wordmark } from './ui';

const launchFrames = [{ text: 'Build your universe, one NEXT at a time.', holdMs: 1300 }];
export function LaunchScreen() {
  const router = useRouter();
  return <CinematicSequence launch frames={launchFrames} onComplete={() => router.replace('/entry')} />;
}
export function EntryScreen() {
  const router = useRouter();
  const { dispatch } = useExperience();
  return <ScreenShell stars>
    <View style={ui.header}><Wordmark small /></View>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}>
      <Text style={ui.eyebrow}>A BEGINNING, ON YOUR TERMS</Text>
      <Text accessibilityRole="header" style={[ui.heading, { marginTop: 25, fontSize: 39, lineHeight: 49 }]}>You don't need to change your whole life.</Text>
      <Text style={[ui.heading, { marginTop: 24, color: palette.secondary }]}>Just take the <Text style={{ color: palette.accent }}>NEXT</Text> step.</Text>
    </ScrollView>
    <View style={ui.footer}><PrimaryButton label="Begin" onPress={() => { dispatch({ type: 'begin' }); router.replace('/philosophy'); }} /><Text style={ui.caption}>Build your universe, one NEXT at a time.</Text></View>
  </ScreenShell>;
}
export function PhilosophyScreen() {
  const { state } = useExperience();
  const router = useRouter();
  if (!state.begun) return <Redirect href="/" />;
  return <CinematicSequence frames={philosophy} onComplete={() => router.replace({ pathname: '/onboarding/[step]', params: { step: '1' } })} />;
}
export function PersonalizingScreen() {
  const { state, dispatch, settings } = useExperience();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pulse = useRef(new Animated.Value(0.65)).current;
  useEffect(() => {
    const answers = completeAnswers(state.answers);
    if (!answers || !state.begun || !settings.active) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setError(false);
    const delay = new Promise<void>((resolve) => { timer = setTimeout(resolve, 2200); });
    Promise.all([personalizeLocally(answers, controller.signal), delay]).then(([result]) => {
      if (controller.signal.aborted) return;
      dispatch({ type: 'result', value: result });
      router.replace('/first-next');
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => { controller.abort(); clearTimeout(timer); };
  }, [state.answers, state.begun, settings.active, dispatch, router, attempt]);
  useEffect(() => {
    if (settings.reducedMotion || !settings.active) { pulse.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 0.45, duration: 1100, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [settings.reducedMotion, settings.active, pulse]);
  if (!state.begun) return <Redirect href="/" />;
  if (!completeAnswers(state.answers)) return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: String(firstUnanswered(state.answers)) } }} />;
  return <ScreenShell stars><View style={ui.center}>
    <Animated.View style={{ opacity: pulse }}><OrbitMark /></Animated.View>
    <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[ui.heading, { fontSize: 27, lineHeight: 36, textAlign: 'center', marginTop: 30 }]}>{error ? "Let's try that again." : 'Finding your first step...'}</Text>
    <Text style={[ui.body, { textAlign: 'center', marginTop: 15 }]}>{error ? 'Your answers are still here.' : 'Building the beginning of your universe...'}</Text>
  </View>{error && <View style={ui.footer}><PrimaryButton label="Try again" onPress={() => setAttempt((value) => value + 1)} /></View>}</ScreenShell>;
}
export function FirstNextScreen() {
  const { state } = useExperience();
  const router = useRouter();
  if (!state.begun) return <Redirect href="/" />;
  if (!state.firstNext) return <Redirect href="/personalizing" />;
  return <ScreenShell stars>
    <View style={ui.header}><BackButton onPress={() => router.replace({ pathname: '/onboarding/[step]', params: { step: '5' } })} /><Wordmark small /></View>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}>
      <Text style={ui.eyebrow}>YOUR FIRST NEXT</Text>
      <View style={{ width: 32, height: 1, backgroundColor: palette.accent, marginVertical: 28 }} />
      <Text accessibilityRole="header" style={[ui.heading, { fontSize: 37, lineHeight: 46 }]}>{state.firstNext.title}</Text>
      <Text style={[ui.body, { marginTop: 24, fontSize: 17, lineHeight: 28 }]}>{state.firstNext.description}</Text>
      <Text style={[ui.eyebrow, { marginTop: 28 }]}>{state.firstNext.estimatedMinutes} MINUTES · ONE SMALL BEGINNING</Text>
    </ScrollView>
    <View style={ui.footer}><PrimaryButton label="Enter my universe" onPress={() => router.replace('/universe-intro')} /></View>
  </ScreenShell>;
}
export function UniverseIntroScreen() {
  const { state, dispatch } = useExperience();
  const router = useRouter();
  if (!state.begun) return <Redirect href="/" />;
  if (!state.firstNext) return <Redirect href="/personalizing" />;
  return <CinematicSequence stars frames={universeNarrative} onComplete={() => { dispatch({ type: 'enter' }); router.replace('/universe'); }} />;
}
