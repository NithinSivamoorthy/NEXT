import { readSlot, writeSlot } from '../product/storage';
import { decode } from '../product/persistence';
import { clearPhotosAfterReset } from '../product/photos';
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { experienceReducer, initialExperience, type ExperienceAction, type ExperienceState } from './model';

type Settings = { ready: boolean; reducedMotion: boolean; screenReader: boolean; active: boolean };
export type AuthMode='create'|'signin';
const ExperienceContext = createContext<{ state: ExperienceState; dispatch: Dispatch<ExperienceAction>; settings: Settings; hydrated:boolean; storageError:boolean; retrySave:()=>void; entranceComplete:boolean; authPreview:AuthMode|null; cinematicResumeAt:number|null; finishEntrance:()=>void; replayEntrance:(options?:{auth?:AuthMode})=>void; beginAuth:(seconds:number)=>void; completeAuth:()=>void } | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(experienceReducer, initialExperience);
  // Session-only: never persisted. Every new app process/reload gets its identity entrance.
  const [entranceComplete,setEntranceComplete]=useState(false);
  // Development-only: opens the dedicated auth screen for a profile that already exists.
  const [authPreview,setAuthPreview]=useState<AuthMode|null>(null);
  // Where the cinematic handed off, so it continues into the astronaut rather than replaying.
  const [handoffAt,setHandoffAt]=useState<number|null>(null);
  const [cinematicResumeAt,setCinematicResumeAt]=useState<number|null>(null);
  const clearEntrance=(preview:AuthMode|null)=>{setAuthPreview(preview);setHandoffAt(null);setCinematicResumeAt(null);setEntranceComplete(false);};
  const finishEntrance=useCallback(()=>{setAuthPreview(null);setHandoffAt(null);setCinematicResumeAt(null);setEntranceComplete(true);},[]);
  const replayEntrance=useCallback((options?:{auth?:AuthMode})=>clearEntrance(options?.auth??null),[]);
  const beginAuth=useCallback((seconds:number)=>setHandoffAt(seconds),[]);
  const completeAuth=useCallback(()=>setCinematicResumeAt(value=>value??handoffAt??0),[handoffAt]);
  const resetPhotosPending=useRef(false);
  const dispatch=useCallback((action:ExperienceAction)=>{if(action.type==='reset'){resetPhotosPending.current=true;clearEntrance(null);}rawDispatch(action);},[]);
  const [hydrated,setHydrated]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const revision=useRef(0);
  const save=()=>{try {const next=revision.current+1;const serialized=JSON.stringify({version:1,revision:next,state});writeSlot(next%2,serialized);if(state===initialExperience){writeSlot((next+1)%2,serialized);if(resetPhotosPending.current){clearPhotosAfterReset();resetPhotosPending.current=false;}}revision.current=next;setStorageError(false);}catch{setStorageError(true);}};
  useEffect(()=>{let alive=true;Promise.allSettled([readSlot(0),readSlot(1)]).then(results=>{
    if(!alive)return;
    const valid=results.flatMap(r=>{const value=r.status==='fulfilled'?decode(r.value):null;return value?[value]:[];}).sort((a,b)=>b.revision-a.revision);
    if(valid[0]){revision.current=valid[0].revision;dispatch({type:'hydrate',value:valid[0].state});}
    setStorageError(results.some(r=>r.status==='rejected'));setHydrated(true);
  });return()=>{alive=false;};},[]);
  useEffect(()=>{if(hydrated)save();},[state,hydrated]);
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
  return <ExperienceContext.Provider value={{ state, dispatch, settings, hydrated, storageError, retrySave:save, entranceComplete, authPreview, cinematicResumeAt, finishEntrance, replayEntrance, beginAuth, completeAuth }}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) throw new Error('Experience screens require ExperienceProvider');
  return context;
}
