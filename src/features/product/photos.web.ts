// Durable native document storage is the supported photo path for this checkpoint.
// Never save a browser blob URL that would silently break after reload.
export function discardPhoto(_uri?:string) {}
export function clearPhotosAfterReset() {}
export async function selectPhoto(_nextId?:string):Promise<{kind:'unavailable';message:string}> {
  return {kind:'unavailable',message:'Add photos in the iPhone or Android app. You can complete this NEXT here without a photo.'};
}
