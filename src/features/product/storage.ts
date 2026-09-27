import { File, Paths } from 'expo-file-system';
export async function readSlot(slot:number):Promise<string|null>{const file=new File(Paths.document,`next-state-${slot}.json`);return file.exists ? file.text() : null;}
export function writeSlot(slot:number,value:string){new File(Paths.document,`next-state-${slot}.json`).write(value);}
