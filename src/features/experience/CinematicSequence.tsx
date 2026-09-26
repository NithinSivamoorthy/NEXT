import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { useExperience } from './ExperienceProvider';
import type { NarrativeFrame } from './content';
import { palette, PrimaryButton, ScreenShell, ui, Wordmark } from './ui';

export function CinematicSequence({ frames, onComplete, launch = false, stars = false }: { frames: readonly NarrativeFrame[]; onComplete: () => void; launch?: boolean; stars?: boolean }) {
  const { settings } = useExperience();
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const advance = () => index + 1 < frames.length ? setIndex(index + 1) : complete.current();
  useEffect(() => {
    if (!settings.ready || !settings.active) return;
    opacity.setValue(settings.reducedMotion ? 1 : 0);
    tagline.setValue(settings.reducedMotion ? 1 : 0);
    const duration = settings.reducedMotion ? 0 : 650;
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(tagline, { toValue: 1, duration: launch ? duration : 0, useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay(frames[index].holdMs),
      ...(settings.screenReader ? [] : [Animated.timing(opacity, { toValue: 0, duration: settings.reducedMotion ? 0 : 350, useNativeDriver: Platform.OS !== 'web' })]),
    ]);
    animation.start(({ finished }) => {
      if (finished && !settings.screenReader) {
        if (index + 1 < frames.length) setIndex(index + 1);
        else complete.current();
      }
    });
    return () => animation.stop();
  }, [frames, index, launch, opacity, settings.ready, settings.active, settings.reducedMotion, settings.screenReader, tagline]);
  const frame = frames[index];
  return <ScreenShell stars={stars}>
    <View style={ui.center}>
      <Animated.View style={{ opacity, width: '100%', alignItems: 'center', transform: [{ translateY: settings.reducedMotion ? 0 : opacity.interpolate({ inputRange: [0, 1], outputRange: [7, 0] }) }] }}>
        {launch ? <><Wordmark /><Animated.Text style={[ui.body, { opacity: tagline, textAlign: 'center', marginTop: 22, maxWidth: 270 }]}>{frame.text}</Animated.Text></> : <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[ui.heading, { textAlign: 'center', fontSize: 31, lineHeight: 43 }]}>{frame.text}<Text style={{ color: palette.accent }}>{frame.emphasis}</Text>{frame.after}</Text>}
      </Animated.View>
    </View>
    {settings.screenReader && <View style={ui.footer}><PrimaryButton label="Continue" onPress={advance} /></View>}
  </ScreenShell>;
}
