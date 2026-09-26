import { useCallback } from 'react';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BackHandler, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useExperience } from './ExperienceProvider';
import { firstUnanswered, questionAnswered, questions } from './content';
import { BackButton, palette, PrimaryButton, ScreenShell, ui } from './ui';

export default function QuestionScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const router = useRouter();
  const { state, dispatch } = useExperience();
  const number = Number(step);
  const valid = Number.isInteger(number) && number >= 1 && number <= questions.length;
  const question = questions[valid ? number - 1 : 0];
  const back = useCallback(() => {
    Keyboard.dismiss();
    if (number > 1) router.replace({ pathname: '/onboarding/[step]', params: { step: String(number - 1) } });
    else router.replace('/entry');
  }, [number, router]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => subscription.remove();
  }, [back]));
  if (!state.begun) return <Redirect href="/" />;
  const allowed = firstUnanswered(state.answers);
  if (!valid || number > allowed) return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: String(allowed) } }} />;
  const next = () => {
    Keyboard.dismiss();
    if (number === questions.length) router.replace('/personalizing');
    else router.replace({ pathname: '/onboarding/[step]', params: { step: String(number + 1) } });
  };
  return <ScreenShell keyboard>
    <View style={ui.header}><BackButton onPress={back} /><Text accessibilityLabel={`Question ${number} of ${questions.length}`} style={ui.eyebrow}>0{number} / 0{questions.length}</Text></View>
    <View accessible={false} style={styles.progress}>{questions.map((_, i) => <View key={i} style={[styles.segment, i < number && styles.segmentActive]} />)}</View>
    <ScrollView key={number} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={ui.heading}>{question.title}</Text>
      <Text style={[ui.body, { marginTop: 18, marginBottom: 30 }]}>{question.support}</Text>
      {question.kind === 'text' ? <TextInput
        accessibilityLabel={question.title} accessibilityHint={question.support}
        multiline textAlignVertical="top" value={state.answers[question.field]} maxLength={2000}
        onChangeText={(value) => dispatch({ type: 'answer', field: question.field, value })}
        placeholder={question.placeholder} placeholderTextColor={palette.faint}
        selectionColor={palette.accent} style={styles.input} /> :
        <View style={{ gap: 10 }}>{question.choices.map((choice) => {
          const selected = state.answers[question.field] === choice.value;
          return <Pressable key={choice.value} accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected} accessibilityLabel={`${choice.label}. ${choice.detail}`} onPress={() => {
            if (question.kind === 'time' && typeof choice.value === 'number') dispatch({ type: 'answer', field: 'dailyCommitment', value: choice.value });
            if (question.kind === 'challenge' && typeof choice.value === 'string') dispatch({ type: 'answer', field: 'challengeLevel', value: choice.value });
          }} style={({ pressed }) => [styles.choice, selected && styles.selected, pressed && { opacity: 0.75 }]}>
            <View style={{ flex: 1 }}><Text style={styles.choiceTitle}>{choice.label}</Text><Text style={styles.choiceDetail}>{choice.detail}</Text></View>
            <View style={[styles.radio, selected && styles.radioSelected]} />
          </Pressable>;
        })}</View>}
    </ScrollView>
    <View style={ui.footer}><PrimaryButton label="Continue" disabled={!questionAnswered(question, state.answers)} onPress={next} /></View>
  </ScreenShell>;
}
const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 5, marginBottom: 12 },
  segment: { flex: 1, height: 1, backgroundColor: palette.line },
  segmentActive: { backgroundColor: palette.accent },
  content: { paddingTop: 24, paddingBottom: 24 },
  input: { color: palette.text, fontSize: 19, lineHeight: 29, minHeight: 148, paddingVertical: 18, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: palette.line },
  choice: { borderWidth: 1, borderColor: palette.line, borderRadius: 6, minHeight: 76, padding: 17, flexDirection: 'row', gap: 16, alignItems: 'center' },
  selected: { borderColor: palette.accent, backgroundColor: '#181612' },
  choiceTitle: { color: palette.text, fontSize: 17, lineHeight: 24 },
  choiceDetail: { color: palette.secondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  radio: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: palette.faint },
  radioSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
});
