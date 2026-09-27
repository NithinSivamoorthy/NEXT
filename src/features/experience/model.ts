import { validCapsule, validMemory, type TimeCapsule, type CompletionMemory } from '../product/memories';
import { validUsername } from '../product/profile';
import type { NextRecord } from '../product/next';
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
export type ExperienceState = { username:string; profileCreated:boolean; begun: boolean; answers: OnboardingDraft; firstNext: FirstNext | null; enteredUniverse: boolean; firstConsequenceComplete:boolean; onboardingComplete:boolean; currentNext:NextRecord|null; history:(NextRecord & CompletionMemory)[]; capsules:TimeCapsule[]; openedCapsuleIds:string[] };
export const initialExperience: ExperienceState = {
  username: '', profileCreated:false, capsules:[], openedCapsuleIds:[],
  begun: false, firstConsequenceComplete:false, onboardingComplete:false, currentNext:null, history:[],
  answers: { movingFrom: '', reason: '', progressVision: '', dailyCommitment: null, challengeLevel: null },
  firstNext: null,
  enteredUniverse: false,
};

type AnswerAction = {
  [K in keyof OnboardingDraft]: { type: 'answer'; field: K; value: OnboardingDraft[K] }
}[keyof OnboardingDraft];
export type ExperienceAction = {type:'seal-capsule';value:TimeCapsule} | {type:'profile';username:string} | AnswerAction | { type: 'begin' | 'reset' | 'enter' | 'moved-forward' } | { type: 'result'; value: FirstNext } | {type:'hydrate';value:ExperienceState} | {type:'first-consequence';answer:string} | {type:'generated';value:NextRecord} | {type:'begin-next'|'complete-next';id:string;at?:string;memory?:string;photoUri?:string};
export function experienceReducer(state: ExperienceState, action: ExperienceAction): ExperienceState {
  switch (action.type) {
    case 'seal-capsule': return validCapsule(action.value)&&!state.capsules.some(c=>c.id===action.value.id)&&(!action.value.nextId||state.history.some(n=>n.id===action.value.nextId)) ? {...state,capsules:[{id:action.value.id,text:action.value.text.trim(),createdAt:action.value.createdAt,...(action.value.nextId?{nextId:action.value.nextId}:{})},...state.capsules]} : state;
    // Snapshot the capsules present at this declaration. Later letters stay sealed until the
    // next declaration, regardless of device clock changes or the order in which they appear.
    case 'moved-forward': {
      const opened = new Set(state.openedCapsuleIds);
      state.capsules.forEach(capsule => opened.add(capsule.id));
      return opened.size === state.openedCapsuleIds.length ? state : {...state,openedCapsuleIds:[...opened]};
    }
    case 'profile': return validUsername(action.username) ? {...state,username:action.username.trim(),profileCreated:true} : state;
    case 'hydrate': return action.value;
    case 'first-consequence': return {...state,begun:true,firstConsequenceComplete:true,answers:{...state.answers,movingFrom:action.answer}};
    case 'generated': return state.currentNext ? state : {...state,onboardingComplete:true,enteredUniverse:true,currentNext:action.value,firstNext:{title:action.value.title,description:action.value.action,estimatedMinutes:action.value.estimatedMinutes}};
    case 'begin-next': return state.currentNext?.id===action.id && state.currentNext.status==='available' ? {...state,currentNext:{...state.currentNext,status:'active'}} : state;
    case 'complete-next': return state.currentNext?.id===action.id && state.currentNext.status==='active' && validMemory(action) ? {...state,currentNext:null,history:[{...state.currentNext,status:'completed',completedAt:action.at??new Date().toISOString(),...(action.memory?.trim()?{memory:action.memory.trim()}:{}),...(action.photoUri?{photoUri:action.photoUri}:{})},...state.history]} : state;
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
