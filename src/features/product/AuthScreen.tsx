import { Wordmark } from './Wordmark';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExperience } from '../experience/ExperienceProvider';
import { validUsername } from './profile';
import { useProductFonts } from './ui';

export const MIN_PASSWORD = 8;
export type AuthMode = 'create' | 'signin';
/** Entrance resolves in one pass; departure is a single clock so the beats cannot drift. */
const ARRIVE = 1300, QUIET_ARRIVE = 260, DEPART = 1100, QUIET_DEPART = 300;

/** Residual space left behind by the travel. Its own values, never shared with the form. */
function StarField({ progress, reducedMotion }: { progress: Animated.Value; reducedMotion: boolean }) {
  const { width, height } = useWindowDimensions();
  const drift = useRef(new Animated.Value(0)).current;
  const motes = useMemo(() => Array.from({ length: 34 }, (_, i) => {
    const r = (n: number) => ((Math.sin((i + 1) * n) + 1) / 2);
    return { x: r(12.9898) * width, y: r(78.233) * height, size: .7 + r(43.11) * 1.7, level: .16 + r(7.31) * .5, span: 6 + r(19.7) * 12, phase: r(31.4) };
  }), [width, height]);
  useEffect(() => {
    if (reducedMotion) return;
    // Returns to its start, so the loop never snaps. Transform/opacity only: safe to drive natively.
    const loop = Animated.loop(Animated.timing(drift, { toValue: 1, duration: 32000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }));
    loop.start(); return () => loop.stop();
  }, [drift, reducedMotion]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: progress }]}>
    <View style={[s.glow, { left: width * .16, top: height * .2 }]} />
    <View style={[s.glow, s.glowCool, { left: width * .74, top: height * .66 }]} />
    {motes.map((mote, i) => <Animated.View key={i} style={{
      position: 'absolute', left: mote.x, top: mote.y, width: mote.size, height: mote.size, borderRadius: mote.size / 2,
      backgroundColor: i % 9 === 0 ? '#ffeccd' : '#dce6f5', opacity: reducedMotion ? mote.level : drift.interpolate({
        inputRange: [0, .3, .65, 1], outputRange: [mote.level, mote.level * (mote.phase > .5 ? 1.7 : .45), mote.level * (mote.phase > .5 ? .5 : 1.5), mote.level],
      }),
      transform: reducedMotion ? [] : [{ translateY: drift.interpolate({ inputRange: [0, .5, 1], outputRange: [0, mote.phase > .5 ? mote.span : -mote.span, 0] }) }],
    }} />)}
    {/* The last two bright stars the travel left within reach. */}
    <View style={[s.near, { left: width * .27, top: height * .31 }]} />
    <View style={[s.near, { left: width * .81, top: height * .18, width: 2.4, height: 2.4 }]} />
  </Animated.View>;
}

type FieldProps = {
  label: string; hint?: string; opacity: Animated.AnimatedInterpolation<number>; lift: Animated.AnimatedInterpolation<number>;
  focused: boolean; reducedMotion: boolean; children: React.ReactNode;
};
/** Nearly invisible surface, thin outline, and a contained glow only where the user is. */
function AuthField({ label, hint, opacity, lift, focused, reducedMotion, children }: FieldProps) {
  const focus = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(focus, { toValue: focused ? 1 : 0, duration: reducedMotion ? 0 : 240, easing: Easing.out(Easing.quad), useNativeDriver: false });
    animation.start(); return () => animation.stop();
  }, [focused, reducedMotion, focus]);
  return <Animated.View style={{ marginTop: 20, opacity, transform: [{ translateY: lift }] }}>
    <Animated.Text style={[s.label, { color: focus.interpolate({ inputRange: [0, 1], outputRange: ['#79828f', '#e9dcc2'] }) }]}>{label}</Animated.Text>
    <Animated.View style={[s.field, {
      borderColor: focus.interpolate({ inputRange: [0, 1], outputRange: ['#2b313b', '#efdcba'] }),
      backgroundColor: focus.interpolate({ inputRange: [0, 1], outputRange: ['rgba(6,8,12,0.50)', 'rgba(13,17,24,0.72)'] }),
      shadowOpacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0, .3] }),
      shadowRadius: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }),
    }]}>{children}</Animated.View>
    {hint ? <Text accessibilityLiveRegion="polite" style={s.hint}>{hint}</Text> : null}
  </Animated.View>;
}

/**
 * The dedicated place between lightspeed and the astronaut. Demo identity only: no account is
 * created anywhere, and the password lives in this component's state and nowhere else.
 */
export default function AuthScreen() {
  const { state, dispatch, settings, authPreview, completeAuth } = useExperience();
  const router = useRouter(); const insets = useSafeAreaInsets(); const [fontsLoaded] = useProductFonts();
  const reducedMotion = settings.reducedMotion;
  const [mode, setMode] = useState<AuthMode>(() => authPreview ?? (state.profileCreated ? 'signin' : 'create'));
  const [name, setName] = useState(() => mode === 'signin' && state.profileCreated ? state.username : '');
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [focused, setFocused] = useState<'name' | 'password' | 'confirm' | null>(null);
  const [touched, setTouched] = useState({ name: false, password: false, confirm: false });
  const [refused, setRefused] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const starsIn = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const depart = useRef(new Animated.Value(0)).current;
  const compact = useRef(new Animated.Value(0)).current;
  const energy = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const scroller = useRef<ScrollView>(null);
  const passwordField = useRef<TextInput>(null), confirmField = useRef<TextInput>(null);

  const creating = mode === 'create';
  const nameValid = validUsername(name), passwordValid = password.length >= MIN_PASSWORD;
  const confirmValid = !creating || confirm === password;
  const valid = nameValid && passwordValid && confirmValid;

  useEffect(() => {
    const animation = Animated.timing(starsIn, { toValue: 1, duration: reducedMotion ? 240 : 700, easing: Easing.out(Easing.quad), useNativeDriver: false });
    animation.start(); return () => animation.stop();
  }, [starsIn, reducedMotion]);
  useEffect(() => {
    // A mode change re-resolves the composition from part way, rather than rebuilding the screen.
    const animation = Animated.timing(reveal, { toValue: 1, duration: reducedMotion ? QUIET_ARRIVE : ARRIVE, easing: Easing.out(Easing.quad), useNativeDriver: false });
    animation.start(); return () => animation.stop();
  }, [reveal, reducedMotion, mode]);
  useEffect(() => {
    const animation = Animated.timing(compact, { toValue: keyboardOpen ? 1 : 0, duration: reducedMotion ? 0 : 220, easing: Easing.out(Easing.quad), useNativeDriver: false });
    animation.start(); return () => animation.stop();
  }, [keyboardOpen, reducedMotion, compact]);
  useEffect(() => {
    if (leaving) return;
    const animation = Animated.timing(energy, { toValue: valid ? 1 : 0, duration: reducedMotion ? 0 : 420, easing: Easing.out(Easing.quad), useNativeDriver: false });
    animation.start(); return () => animation.stop();
  }, [valid, leaving, reducedMotion, energy]);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useEffect(() => () => running.current?.stop(), []);

  const switchMode = (next: AuthMode) => {
    if (leaving) return;
    setPassword(''); setConfirm(''); setRefused('');
    setTouched({ name: false, password: false, confirm: false });
    setMode(next);
    if (next === 'create' && state.profileCreated === false) setName(value => value);
    reveal.setValue(reducedMotion ? 1 : .32);
  };

  const enter = () => {
    if (!valid || leaving) return;
    const username = name.trim();
    // Demo identity: this device holds one. Real account authentication is future production work.
    if (!creating && !(state.profileCreated && state.username.toLowerCase() === username.toLowerCase())) {
      setRefused(state.profileCreated ? 'No identity by that name on this device.' : 'This device has no identity yet. Create one to begin.');
      return;
    }
    // Discarded before anything else runs. Never stored, logged, or sent to Gemini or the backend.
    setPassword(''); setConfirm(''); setRefused('');
    setLeaving(true); Keyboard.dismiss();
    if (creating) dispatch({ type: 'profile', username });
    const animation = Animated.timing(depart, { toValue: 1, duration: reducedMotion ? QUIET_DEPART : DEPART, easing: Easing.linear, useNativeDriver: false });
    running.current = animation;
    animation.start(({ finished }) => { if (!finished) return; completeAuth(); router.replace('/'); });
  };

  const span = (from: number, to: number) => reducedMotion ? reveal.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
    : reveal.interpolate({ inputRange: [from, to], outputRange: [0, 1], extrapolate: 'clamp' });
  const fade = depart.interpolate({ inputRange: [0, .18, .59, 1], outputRange: [1, 1, 0, 0] });
  const shown = (from: number, to: number) => Animated.multiply(span(from, to), fade);
  const lift = (from: number, to: number) => reducedMotion ? new Animated.Value(0) as unknown as Animated.AnimatedInterpolation<number>
    : span(from, to).interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const glow = (peak: number, rest: number) => Animated.add(
    energy.interpolate({ inputRange: [0, 1], outputRange: [0, rest] }),
    depart.interpolate({ inputRange: [0, .23, .6, 1], outputRange: [0, peak, 0, 0] }));

  const nameHint = touched.name && !nameValid ? (name.trim() ? 'Use 2–24 characters, starting with a letter or number.' : 'Your universe needs a name for you.') : undefined;
  const passwordHint = touched.password && !passwordValid ? `${MIN_PASSWORD} characters or more.` : undefined;
  const confirmHint = touched.confirm && !confirmValid ? 'Both entries need to match.' : undefined;
  const heading = creating ? 'CREATE YOUR IDENTITY' : 'WELCOME BACK.';

  return <View style={s.screen}>
    <StatusBar hidden />
    <StarField progress={starsIn} reducedMotion={reducedMotion} />
    {fontsLoaded && <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scroller} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingTop: insets.top + 36, paddingBottom: insets.bottom + 28 }}>
        <View style={{ maxWidth: 440, width: '100%', alignSelf: 'center' }}>
          <Animated.View style={{
            opacity: shown(.15, .55), alignItems: 'flex-start',
            transform: [{ translateY: lift(.15, .55) }, { scale: compact.interpolate({ inputRange: [0, 1], outputRange: [1, .86] }) }],
            marginBottom: compact.interpolate({ inputRange: [0, 1], outputRange: [26, 10] }),
          }}><Wordmark size={30} /></Animated.View>
          <Animated.Text accessibilityRole="header" style={[s.title, { opacity: shown(.27, .68), transform: [{ translateY: lift(.27, .68) }] }]}>{heading}</Animated.Text>
          <Animated.View style={{
            overflow: 'hidden', opacity: Animated.multiply(shown(.35, .72), compact.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
            maxHeight: compact.interpolate({ inputRange: [0, 1], outputRange: [44, 0] }),
          }}><Text style={s.tagline}>{creating ? 'YOUR UNIVERSE STARTS WITH YOU.' : 'YOUR UNIVERSE IS WHERE YOU LEFT IT.'}</Text></Animated.View>

          <AuthField label="USERNAME" hint={nameHint} opacity={shown(.45, .80)} lift={lift(.45, .80)} focused={focused === 'name'} reducedMotion={reducedMotion}>
            <TextInput accessibilityLabel="Username" accessibilityHint="2 to 24 letters, numbers, spaces, periods, underscores or hyphens"
              value={name} onChangeText={value => { setName(value); setRefused(''); }} maxLength={24} editable={!leaving}
              onFocus={() => setFocused('name')} onBlur={() => { setFocused(null); setTouched(v => ({ ...v, name: true })); }}
              autoCapitalize="none" autoCorrect={false} autoComplete="off" textContentType="none" keyboardAppearance="dark"
              returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordField.current?.focus()}
              placeholder={creating ? 'How should your universe know you?' : 'Your name in this universe'} placeholderTextColor="#69717d"
              selectionColor="#e6d5b4" style={s.input} />
          </AuthField>

          <AuthField label="PASSWORD" hint={passwordHint} opacity={shown(.53, .88)} lift={lift(.53, .88)} focused={focused === 'password'} reducedMotion={reducedMotion}>
            <TextInput ref={passwordField} accessibilityLabel="Password, demo only" accessibilityHint={`At least ${MIN_PASSWORD} characters. Discarded on entry; no account is created.`}
              secureTextEntry value={password} onChangeText={value => { setPassword(value); setRefused(''); }} maxLength={128} editable={!leaving}
              onFocus={() => setFocused('password')} onBlur={() => { setFocused(null); setTouched(v => ({ ...v, password: true })); }}
              autoCapitalize="none" autoCorrect={false} autoComplete="off" textContentType="none" keyboardAppearance="dark"
              returnKeyType={creating ? 'next' : 'go'} submitBehavior="submit"
              onSubmitEditing={() => creating ? confirmField.current?.focus() : enter()}
              placeholder={`${MIN_PASSWORD} or more characters`} placeholderTextColor="#69717d"
              selectionColor="#e6d5b4" style={s.input} />
          </AuthField>

          {creating && <AuthField label="CONFIRM PASSWORD" hint={confirmHint} opacity={shown(.61, .95)} lift={lift(.61, .95)} focused={focused === 'confirm'} reducedMotion={reducedMotion}>
            <TextInput ref={confirmField} accessibilityLabel="Confirm password" accessibilityHint="Repeat the password you just chose."
              secureTextEntry value={confirm} onChangeText={value => { setConfirm(value); setRefused(''); }} maxLength={128} editable={!leaving}
              onFocus={() => { setFocused('confirm'); setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 120); }}
              onBlur={() => { setFocused(null); setTouched(v => ({ ...v, confirm: true })); }}
              autoCapitalize="none" autoCorrect={false} autoComplete="off" textContentType="none" keyboardAppearance="dark"
              returnKeyType="go" submitBehavior="submit" onSubmitEditing={enter}
              placeholder="Once more" placeholderTextColor="#69717d" selectionColor="#e6d5b4" style={s.input} />
          </AuthField>}

          {refused ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={s.refused}>{refused}</Text> : null}

          <Animated.View style={{ marginTop: 30, opacity: shown(.70, 1), transform: [{ translateY: lift(.70, 1) }] }}>
            <Animated.View style={[s.enter, {
              borderColor: energy.interpolate({ inputRange: [0, 1], outputRange: ['#333944', '#f2dfbc'] }),
              backgroundColor: energy.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0.22)', 'rgba(26,21,13,0.46)'] }),
              shadowOpacity: glow(.55, .32), shadowRadius: glow(16, 16),
            }]}>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || leaving }} disabled={!valid || leaving} onPress={enter} style={s.press}>
                <Animated.Text style={[s.enterLabel, { color: energy.interpolate({ inputRange: [0, 1], outputRange: ['#8b94a0', '#fbf3e3'] }) }]}>{creating ? 'ENTER YOUR UNIVERSE' : 'ENTER NEXT'}</Animated.Text>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Animated.View style={{ marginTop: 26, opacity: shown(.78, 1) }}>
            <Text style={s.switchLead}>{creating ? 'ALREADY HAVE AN IDENTITY?' : 'NEW HERE?'}</Text>
            <Pressable accessibilityRole="button" disabled={leaving} onPress={() => switchMode(creating ? 'signin' : 'create')} style={s.switchPress}>
              <Text style={s.switchLabel}>{creating ? 'SIGN IN' : 'CREATE YOUR IDENTITY'}</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={{
            overflow: 'hidden', opacity: Animated.multiply(shown(.78, 1), compact.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
            maxHeight: compact.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }),
          }}><Text style={s.note}>Demo identity, held on this device only. Use a made-up password, never a real one — it is discarded the moment you enter, and no account is created.</Text></Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>}

    {/* The interface darkens, the light gathers to a point, then the point opens into depth. */}
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000002', opacity: depart.interpolate({ inputRange: [0, .18, .6, 1], outputRange: [0, 0, .72, 1] }) }]} />
    {leaving && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <Animated.View style={[s.point, {
        opacity: depart.interpolate({ inputRange: [0, .36, .5, .85, 1], outputRange: [0, 0, 1, .3, 0] }),
        transform: [{ scale: reducedMotion ? 1 : depart.interpolate({ inputRange: [0, .36, .55, 1], outputRange: [2.2, 2.2, .3, 9] }) }],
      }]} />
    </View>}
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000002' },
  glow: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#070a12', shadowColor: '#2f4470', shadowOpacity: .55, shadowRadius: 110, shadowOffset: { width: 0, height: 0 } },
  glowCool: { shadowColor: '#3b2f57', shadowOpacity: .4, shadowRadius: 90 },
  near: { position: 'absolute', width: 1.8, height: 1.8, borderRadius: 1.2, backgroundColor: '#fff6e6', shadowColor: '#ffe6bb', shadowOpacity: .85, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  title: { fontFamily: 'Contact-Clash', fontSize: 28, lineHeight: 35, letterSpacing: -.2, color: '#f2eee7' },
  tagline: { fontFamily: 'Contact-Space', fontSize: 10, letterSpacing: 2, color: '#8b93a0', marginTop: 12 },
  label: { fontFamily: 'Contact-Space', fontSize: 10, letterSpacing: 2, marginBottom: 9 },
  field: { borderWidth: 1, borderRadius: 2, shadowColor: '#e8cfa5', shadowOffset: { width: 0, height: 0 } },
  input: { fontFamily: 'Contact-Inter', fontSize: 17, lineHeight: 22, color: '#eef1f5', paddingHorizontal: 14, height: 54 },
  hint: { fontFamily: 'Contact-Inter', fontSize: 12, lineHeight: 18, color: '#9a8f7c', marginTop: 8 },
  refused: { fontFamily: 'Contact-Inter', fontSize: 13, lineHeight: 20, color: '#c8a98a', marginTop: 22 },
  enter: { borderWidth: 1, borderRadius: 2, shadowColor: '#f0d9ab', shadowOffset: { width: 0, height: 0 } },
  press: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  enterLabel: { fontFamily: 'Contact-Space', fontSize: 12, letterSpacing: 2.2 },
  switchLead: { fontFamily: 'Contact-Space', fontSize: 10, letterSpacing: 1.8, color: '#6f7783' },
  switchPress: { minHeight: 44, justifyContent: 'center' },
  switchLabel: { fontFamily: 'Contact-Space', fontSize: 12, letterSpacing: 1.8, color: '#cbb894' },
  note: { fontFamily: 'Contact-Inter', fontSize: 12, lineHeight: 19, color: '#6d7681', marginTop: 20 },
  point: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff6e6', shadowColor: '#ffe6bb', shadowOpacity: .9, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
});
