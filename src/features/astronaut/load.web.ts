import { Asset } from 'expo-asset';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
let loaded:Promise<GLTF>|undefined;
export function loadAstronaut(){
  return loaded ??= new GLTFLoader().loadAsync(Asset.fromModule(require('../../../assets/astronaut/astronaut.glb')).uri);
}
