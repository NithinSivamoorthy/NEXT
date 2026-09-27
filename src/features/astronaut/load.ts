import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

let loaded:Promise<GLTF>|undefined;
/** Called after the native Canvas adapter has initialized its texture/Blob support. */
export function loadAstronaut(){
  return loaded ??= (async()=>{
    const asset=await Asset.fromModule(require('../../../assets/astronaut/astronaut.glb')).downloadAsync();
    const bytes=await new File(asset.localUri ?? asset.uri).arrayBuffer();
    const gltf=await new GLTFLoader().parseAsync(bytes,'');
    // GLTFLoader can silently return null on texture failure. Treat that as a load error.
    const suit=gltf.scene.getObjectByName('Object_6') as import('three').Mesh;
    const material=suit?.material as import('three').MeshStandardMaterial;
    if(!material?.map || !material.normalMap)throw new Error('Astronaut textures did not load');
    return gltf;
  })();
}
