import type { OnboardingAnswers } from '../experience/model';
import { buildLocalNext } from '../experience/personalization';
export type NextContent = { title:string; action:string; why:string; estimatedMinutes:number; category:string; reflection:string };
export type NextRecord = NextContent & { id:string; status:'available'|'active'|'completed'; createdAt:string; completedAt?:string; source:'gemini'|'local' };
export function validContent(value:unknown, maxMinutes=60): value is NextContent {
  if (!value || typeof value !== 'object') return false;
  const v=value as Record<string,unknown>;
  return Object.entries({title:120,action:1200,why:600,category:60,reflection:300}).every(([key,max])=>typeof v[key]==='string' && (v[key] as string).trim().length>0 && (v[key] as string).length<=max)
    && Number.isInteger(v.estimatedMinutes) && Number(v.estimatedMinutes)>0 && Number(v.estimatedMinutes)<=maxMinutes;
}
export function localNext(answers:OnboardingAnswers):NextContent {
  const next=buildLocalNext(answers);
  return {title:next.title,action:next.description,estimatedMinutes:next.estimatedMinutes,why:`A small, bounded action gives you a place to begin. You said what matters is: “${answers.reason.slice(0,240)}”.`,category:'Small steps',reflection:'What felt different after taking this step?'};
}
export async function generateNext(answers:OnboardingAnswers, signal?:AbortSignal):Promise<NextRecord> {
  let content=localNext(answers),source:NextRecord['source']='local';
  // Expo inlines only a static dot-notation public environment reference.
  const endpoint=process.env.EXPO_PUBLIC_NEXT_API_URL?.trim();
  if(__DEV__)console.info(`NEXT API URL: ${endpoint || '(missing)'}`);
  const controller=new AbortController();
  let timedOut=false;
  const cancel=()=>controller.abort(); signal?.addEventListener('abort',cancel);
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},10000);
  let failure='network/fetch rejection';
  try {
    if(signal?.aborted)throw new Error('Cancelled');
    if(!endpoint){failure='missing API URL';throw new Error('Missing configuration');}
    const target=`${endpoint.replace(/\/$/,'')}/next`;
    if(__DEV__)console.info(`NEXT: remote generation requested POST ${target}`);
    const response=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers}),signal:controller.signal});
    if(!response.ok){failure=`backend HTTP ${response.status}`;throw new Error('Unavailable');}
    failure='invalid response JSON';
    const result:unknown=await response.json();
    failure='response failed NEXT schema validation';
    if(!validContent(result,answers.dailyCommitment))throw new Error('Invalid response');
    content=result;source='gemini';
    if(__DEV__)console.info('NEXT: using Gemini generation.');
  } catch {
    if(__DEV__ && !signal?.aborted){
      console.info(`NEXT: remote generation failed: ${timedOut?'timeout after 10000ms':failure}`);
      console.info('NEXT: using local generation.');
    }
  }
  finally {clearTimeout(timeout);signal?.removeEventListener('abort',cancel);}
  if(signal?.aborted)throw new Error('Cancelled');
  return {...content,id:`${Date.now()}-${Math.random().toString(36).slice(2,10)}`,status:'available',createdAt:new Date().toISOString(),source};
}
