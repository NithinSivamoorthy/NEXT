/** Local, user-authored records. Never included in the Gemini request. */
export type TimeCapsule = { id:string; text:string; createdAt:string; nextId?:string };
export type CompletionMemory = { photoUri?:string; memory?:string };
export function validCapsule(value:unknown):value is TimeCapsule {
 if(!value||typeof value!=='object')return false;
 const v=value as TimeCapsule;
 return typeof v.id==='string'&&v.id.length>0&&v.id.length<120&&typeof v.text==='string'&&v.text.trim().length>0&&v.text.length<=2000&&typeof v.createdAt==='string'&&Number.isFinite(Date.parse(v.createdAt))&&(v.nextId===undefined||typeof v.nextId==='string');
}
export function validMemory(input:unknown){if(!input||typeof input!=='object')return false;const value=input as CompletionMemory;return (value.memory===undefined||(typeof value.memory==='string'&&value.memory.length<=2000))&&(value.photoUri===undefined||(typeof value.photoUri==='string'&&/^(file:|content:)/.test(value.photoUri)&&value.photoUri.length<4096));}
