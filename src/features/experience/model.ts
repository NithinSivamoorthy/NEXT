export type DailyCommitment = 5 | 15 | 30 | 60;
export type ChallengeLevel = 'gentle' | 'balanced' | 'push';

export type OnboardingAnswers = {
  movingFrom: string;
  reason: string;
  progressVision: string;
  dailyCommitment: DailyCommitment;
  challengeLevel: ChallengeLevel;
};

export type OnboardingDraft = Omit<OnboardingAnswers, 'dailyCommitment' | 'challengeLevel'> & {
  dailyCommitment: DailyCommitment | null;
  challengeLevel: ChallengeLevel | null;
};

export type FirstNext = { title: string; description: string; estimatedMinutes: number };
export type ExperienceState = { begun: boolean; answers: OnboardingDraft; firstNext: FirstNext | null; enteredUniverse: boolean };
export const initialExperience: ExperienceState = {
  begun: false,
  answers: { movingFrom: '', reason: '', progressVision: '', dailyCommitment: null, challengeLevel: null },
  firstNext: null,
  enteredUniverse: false,
};

type AnswerAction = {
  [K in keyof OnboardingDraft]: { type: 'answer'; field: K; value: OnboardingDraft[K] }
}[keyof OnboardingDraft];
export type ExperienceAction = AnswerAction | { type: 'begin' | 'reset' | 'enter' } | { type: 'result'; value: FirstNext };
export function experienceReducer(state: ExperienceState, action: ExperienceAction): ExperienceState {
  switch (action.type) {
    case 'begin': return { ...state, begun: true };
    case 'reset': return initialExperience;
    case 'answer': return { ...state, answers: { ...state.answers, [action.field]: action.value }, firstNext: null, enteredUniverse: false };
    case 'result': return { ...state, firstNext: action.value };
    case 'enter': return state.firstNext ? { ...state, enteredUniverse: true } : state;
  }
}

export function completeAnswers(draft: OnboardingDraft): OnboardingAnswers | null {
  const movingFrom = draft.movingFrom.trim();
  const reason = draft.reason.trim();
  const progressVision = draft.progressVision.trim();
  if (!movingFrom || !reason || !progressVision || draft.dailyCommitment === null || draft.challengeLevel === null) return null;
  return { movingFrom, reason, progressVision, dailyCommitment: draft.dailyCommitment, challengeLevel: draft.challengeLevel };
}
