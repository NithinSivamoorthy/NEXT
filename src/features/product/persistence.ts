import { validCapsule, validMemory } from './memories';
import { validUsername } from './profile';
import { initialExperience, completeAnswers, type ExperienceState } from '../experience/model';
import { validContent, type NextRecord } from './next';
export type Envelope={version:1;revision:number;state:ExperienceState};
function record(value:unknown,completed:boolean):value is NextRecord {
  if(!validContent(value)||!validMemory(value))return false;
  const v=value as NextRecord;
  return typeof v.id==='string' && !!v.id && ['gemini','local'].includes(v.source) && Number.isFinite(Date.parse(v.createdAt)) && (completed ? v.status==='completed' && typeof v.completedAt==='string' && Number.isFinite(Date.parse(v.completedAt)) : ['available','active'].includes(v.status));
}
export function decode(raw:string|null):Envelope|null {
  try {
    if(!raw)return null;
    const e=JSON.parse(raw),s=e.state,a=s?.answers;
    if(e.version!==1 || !Number.isSafeInteger(e.revision) || e.revision<0 || !a)return null;
    if(!['movingFrom','reason','progressVision'].every(k=>typeof a[k]==='string'&&a[k].length<=2000))return null;
    if(![null,5,15,30,60].includes(a.dailyCommitment)||![null,'gentle','balanced','push'].includes(a.challengeLevel))return null;
    if(!['begun','enteredUniverse','firstConsequenceComplete','onboardingComplete'].every(k=>typeof s[k]==='boolean'))return null;
    if(!Array.isArray(s.history)||!s.history.every((v:unknown)=>record(v,true))||new Set(s.history.map((v:NextRecord)=>v.id)).size!==s.history.length)return null;
    if(s.currentNext!==null&&(!record(s.currentNext,false)||s.history.some((v:NextRecord)=>v.id===s.currentNext.id)))return null;
    if(s.onboardingComplete && !completeAnswers(a))return null;
    // Migrate the working pre-profile saves without replaying their personalization.
    const legacy=s.profileCreated===undefined;
    const profileCreated=legacy ? Boolean(s.onboardingComplete||s.firstConsequenceComplete) : s.profileCreated;
    const username=legacy ? (profileCreated?'Traveler':'') : s.username;
    if(typeof profileCreated!=='boolean'||typeof username!=='string'||(profileCreated&&!validUsername(username))||(!profileCreated&&username!==''))return null;
    const capsules=s.capsules??[];
    if(!Array.isArray(capsules)||!capsules.every(validCapsule)||new Set(capsules.map(c=>c.id)).size!==capsules.length||capsules.some(c=>c.nextId&&!s.history.some((n:NextRecord)=>n.id===c.nextId)))return null;
    // Older version-1 saves predate the visibility rule: retain their letters as sealed.
    const openedCapsuleIds=s.openedCapsuleIds??[];
    if(!Array.isArray(openedCapsuleIds)||!openedCapsuleIds.every((id:unknown)=>typeof id==='string'&&capsules.some(c=>c.id===id))||new Set(openedCapsuleIds).size!==openedCapsuleIds.length)return null;
    // Whitelist persisted fields: credentials and unrelated imported keys never survive hydration.
    const cleanRecord=(n:any)=>({id:n.id,title:n.title,action:n.action,why:n.why,estimatedMinutes:n.estimatedMinutes,category:n.category,reflection:n.reflection,status:n.status,createdAt:n.createdAt,source:n.source,...(n.completedAt?{completedAt:n.completedAt}:{}),...(n.memory?{memory:n.memory}:{}),...(n.photoUri?{photoUri:n.photoUri}:{})});
    return {version:1,revision:e.revision,state:{...initialExperience,profileCreated,username,begun:s.begun,enteredUniverse:s.enteredUniverse,firstConsequenceComplete:s.firstConsequenceComplete,onboardingComplete:s.onboardingComplete,answers:{movingFrom:a.movingFrom,reason:a.reason,progressVision:a.progressVision,dailyCommitment:a.dailyCommitment,challengeLevel:a.challengeLevel},firstNext:s.firstNext?{title:s.firstNext.title,description:s.firstNext.description,estimatedMinutes:s.firstNext.estimatedMinutes}:null,currentNext:s.currentNext?cleanRecord(s.currentNext):null,history:s.history.map(cleanRecord),capsules:capsules.map(c=>({id:c.id,text:c.text,createdAt:c.createdAt,...(c.nextId?{nextId:c.nextId}:{})})),openedCapsuleIds:[...openedCapsuleIds]}};
  }catch{return null;}
}
