import type { ChallengeLevel, DailyCommitment, OnboardingDraft } from './model';

type TextQuestion = { kind: 'text'; field: 'movingFrom' | 'reason' | 'progressVision'; title: string; support: string; placeholder: string };
type TimeQuestion = { kind: 'time'; field: 'dailyCommitment'; title: string; support: string; choices: readonly { value: DailyCommitment; label: string; detail: string }[] };
type ChallengeQuestion = { kind: 'challenge'; field: 'challengeLevel'; title: string; support: string; choices: readonly { value: ChallengeLevel; label: string; detail: string }[] };
export type Question = TextQuestion | TimeQuestion | ChallengeQuestion;

export const questions: readonly Question[] = [
  { kind: 'text', field: 'movingFrom', title: 'What are you ready to move forward from?', support: 'This can be a habit, a relationship, a setback, or anything you want to leave behind.', placeholder: 'Start wherever you are.' },
  { kind: 'text', field: 'reason', title: 'Why does moving forward matter to you?', support: "We'll use this to keep your NEXTs connected to what matters.", placeholder: 'What makes this worth trying?' },
  { kind: 'text', field: 'progressVision', title: 'What would progress look like to you?', support: 'Think about how life would feel or look if you were moving in the right direction.', placeholder: 'A little more of… A little less of…' },
  { kind: 'time', field: 'dailyCommitment', title: 'How much can you realistically give to your NEXT each day?', support: 'Choose what fits your life as it is today.', choices: [
    { value: 5, label: '5 minutes', detail: 'A small opening' },
    { value: 15, label: '15 minutes', detail: 'A little space' },
    { value: 30, label: '30 minutes', detail: 'Time to settle in' },
    { value: 60, label: '1 hour+', detail: 'Room to explore' },
  ] },
  { kind: 'challenge', field: 'challengeLevel', title: 'How should NEXT challenge you?', support: 'There is no right pace. There is your pace.', choices: [
    { value: 'gentle', label: 'Start gently', detail: 'Small steps. Space to find my footing.' },
    { value: 'balanced', label: 'Keep me balanced', detail: 'A little stretch, with room to breathe.' },
    { value: 'push', label: 'Push me', detail: 'Give me something to rise to.' },
  ] },
];

export function questionAnswered(question: Question, answers: OnboardingDraft) {
  const value = answers[question.field];
  return typeof value === 'string' ? value.trim().length > 0 : value !== null;
}
export function firstUnanswered(answers: OnboardingDraft) {
  const index = questions.findIndex((question) => !questionAnswered(question, answers));
  return index === -1 ? questions.length : index + 1;
}

export type NarrativeFrame = { text: string; emphasis?: string; after?: string; holdMs: number };
export const philosophy: readonly NarrativeFrame[] = [
  { text: "You can't change\nthe past.", holdMs: 1700 },
  { text: 'But you can change\nwhat happens ', emphasis: 'NEXT.', holdMs: 2200 },
];
export const universeNarrative: readonly NarrativeFrame[] = [
  { text: 'Every journey begins\nin the dark.', holdMs: 1800 },
  { text: 'Every ', emphasis: 'NEXT', after: ' brings\nsomething new to life.', holdMs: 2200 },
];
