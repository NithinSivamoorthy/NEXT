import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export type PhotoSelection = { kind:'selected'; uri:string } | { kind:'canceled' } | { kind:'unavailable'; message:string; reason?:'permission'|'file'|'size' };
const directory = () => new Directory(Paths.document, 'next-memory-photos');
const maximumBytes = 20 * 1024 * 1024;

/** Only our own direct children may be removed. Never delete a library/cache source. */
export function discardPhoto(uri?:string) {
  if (!uri) return;
  const root = directory().uri.replace(/\/$/, '') + '/';
  const name = uri.startsWith(root) ? uri.slice(root.length) : '';
  if (!/^memory-[a-z0-9-]+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(name)) return;
  try { const file = new File(uri); if (file.exists) file.delete(); }
  catch { /* A canceled draft can be removed by the next Reset. */ }
}

/** Called only for an explicit Reset, AFTER both reset save slots have been written successfully. */
export function clearPhotosAfterReset() {
  const folder = directory();
  if (folder.exists) folder.delete();
}

export async function selectPhoto(nextId='next'):Promise<PhotoSelection> {
  let stage='permission',scheme='unknown';
  let destination:File|undefined;
  try {
    // Android's system photo picker grants access only to the chosen image.
    // iOS accepts both full and limited library access; denial never blocks completion.
    if (Platform.OS === 'ios') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted && permission.accessPrivileges !== 'limited') {
        return {kind:'unavailable',reason:'permission',message:'Photo access is off. You can allow it in Settings, or complete this NEXT without a photo.'};
      }
    }
    stage='picker';
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['images'], allowsMultipleSelection:false, allowsEditing:false,
      quality:0.7, exif:false, base64:false,
      preferredAssetRepresentationMode:ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return {kind:'canceled'};
    stage='asset-uri';
    const asset = result.assets[0];
    scheme=asset?.uri?.startsWith('file:')?'file':asset?.uri?.startsWith('content:')?'content':asset?.uri?.startsWith('ph:')?'ph':'unsupported';
    if (!asset || !/^(file:|content:)/.test(asset.uri)) throw new Error('Missing local image');
    // Bound memory/disk use without adding an image-processing dependency.
    if (asset.width * asset.height > 36_000_000 || (asset.fileSize ?? 0) > maximumBytes) {
      return {kind:'unavailable',reason:'size',message:'Please choose a smaller photo (up to 36 megapixels and 20 MB), or continue without one.'};
    }
    stage='source-info';
    const source = new File(asset.uri);
    if(!source.exists)throw new Error('Source unavailable');
    if (source.size > maximumBytes) return {kind:'unavailable',reason:'size',message:'Please choose a photo under 20 MB, or continue without one.'};
    const extension = /\.(jpg|jpeg|png|webp|heic|heif)$/i.exec(asset.uri.split(/[?#]/)[0])?.[1]?.toLowerCase() ?? ({'image/png':'png','image/webp':'webp','image/heic':'heic','image/heif':'heif'}[asset.mimeType??''] || 'jpg');
    stage='directory';
    const folder = directory();
    folder.create({idempotent:true,intermediates:true});
    const id=nextId.replace(/[^a-z0-9-]/gi,'-').slice(0,40)||'next';
    destination = new File(folder, `memory-${id}-${Date.now()}-${Math.random().toString(36).slice(2,12)}.${extension}`);
    stage='copy';
    // SDK 57 File.copy is Promise<void>. Verify only AFTER the native copy completes.
    await source.copy(destination);
    stage='verify-copy';
    if (!destination.exists || destination.size <= 0 || destination.size > maximumBytes) throw new Error('Incomplete copy');
    if(typeof __DEV__!=='undefined'&&__DEV__)console.info('[NEXT photo]',{stage:'durable-copy-ready',scheme});
    return {kind:'selected',uri:destination.uri};
  } catch {
    discardPhoto(destination?.uri);
    if(typeof __DEV__!=='undefined'&&__DEV__)console.warn('[NEXT photo]',{stage,scheme});
    return {kind:'unavailable',reason:'file',message:"WE COULDN’T ADD THAT PHOTO. TRY ANOTHER."};
  }
}
