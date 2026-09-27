export async function readSlot(slot:number):Promise<string|null>{return localStorage.getItem(`next-state-${slot}`);}
export function writeSlot(slot:number,value:string){localStorage.setItem(`next-state-${slot}`,value);}
