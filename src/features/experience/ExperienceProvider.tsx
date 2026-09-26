import { createContext, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { experienceReducer, initialExperience, type ExperienceAction, type ExperienceState } from './model';

type Settings = { ready: boolean; reducedMotion: boolean; screenReader: boolean; active: boolean };
const ExperienceContext = createContext<{ state: ExperienceState; dispatch: Dispatch<ExperienceAction>; settings: Settings } | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(experienceReducer, initialExperience);
  const [settings, setSettings] = useState<Settings>({ ready: false, reducedMotion: true, screenReader: false, active: AppState.currentState !== 'background' });
  useEffect(() => {
    let mounted = true;
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (reducedMotion) => setSettings((value) => ({ ...value, reducedMotion })));
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', (screenReader) => setSettings((value) => ({ ...value, screenReader })));
    const activity = AppState.addEventListener('change', (state) => setSettings((value) => ({ ...value, active: state === 'active' })));
    Promise.allSettled([AccessibilityInfo.isReduceMotionEnabled(), AccessibilityInfo.isScreenReaderEnabled()]).then(([motionResult, readerResult]) => {
      if (mounted) setSettings((value) => ({ ...value, ready: true, reducedMotion: motionResult.status === 'fulfilled' ? motionResult.value : true, screenReader: readerResult.status === 'fulfilled' ? readerResult.value : false }));
    });
    return () => { mounted = false; motion.remove(); reader.remove(); activity.remove(); };
  }, []);
  return <ExperienceContext.Provider value={{ state, dispatch, settings }}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) throw new Error('Experience screens require ExperienceProvider');
  return context;
}
