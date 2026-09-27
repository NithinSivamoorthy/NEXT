import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ts from 'typescript';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
function moduleAt(path,mocks){const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext(`(function(require,module,exports){${js}\n})`,{filename:path})(id=>{if(id in mocks)return mocks[id];throw Error(`Unexpected import ${id}`);},module,module.exports);return module.exports;}
const bytes=fs.readFileSync('assets/astronaut/astronaut.glb');
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'522c23ca1c75b63e55f44fc5cc185ddee6061bd33e453879f9e09a91cc60b46c');
const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert.equal(json.asset.extras.license,'CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)');assert(!json.extensionsRequired?.length);assert.equal(json.skins[0].joints.length,43);assert.equal(json.animations?.length??0,0);assert(json.buffers.every(b=>!b.uri));assert(json.images.every(i=>i.bufferView!==undefined));
// Node verifies parsing/pose; a browser verifies actual JPEG decoding and GPU output separately.
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const pose=moduleAt('src/features/astronaut/pose.ts',{'three':THREE,'three/examples/jsm/utils/SkeletonUtils.js':{clone}});
const original=gltf.scene.getObjectByName('Bip001_L_UpperArm_010').quaternion.clone();
const a=pose.createAstronautInstance(gltf.scene),b=pose.createAstronautInstance(gltf.scene);a.group.updateMatrixWorld(true);
assert(gltf.scene.getObjectByName('Bip001_L_UpperArm_010').quaternion.equals(original));
assert.notEqual(a.group.getObjectByName('Bip001_L_UpperArm_010'),b.group.getObjectByName('Bip001_L_UpperArm_010'));
let triangles=0,meshes=0;
a.group.traverse(o=>{if(!o.isSkinnedMesh)return;meshes++;triangles+=o.geometry.index.count/3;assert.equal(o.material.side,THREE.FrontSide);assert.equal(o.material.transparent,false);assert.equal(o.material.opacity,1);assert.equal(o.geometry,gltf.scene.getObjectByName(o.name).geometry);assert.notEqual(o.material,gltf.scene.getObjectByName(o.name).material);assert.equal(o.material.map,gltf.scene.getObjectByName(o.name).material.map);for(let i=0;i<o.geometry.attributes.position.count;i++)assert(o.getVertexPosition(i,new THREE.Vector3()).toArray().every(Number.isFinite));});
assert.equal(meshes,3);assert.equal(triangles,10808);
const bounds=new THREE.Box3().setFromObject(a.group),size=bounds.getSize(new THREE.Vector3());assert(Math.abs(size.y-2.46)<.001);assert(size.x<1.6);assert(size.z<1.5);
for(const [arm,hand] of [['Bip001_L_UpperArm_010','Bip001_L_Hand_012'],['Bip001_R_UpperArm_021','Bip001_R_Hand_023']]){const upper=a.group.getObjectByName(arm).getWorldPosition(new THREE.Vector3()),lower=a.group.getObjectByName(hand).getWorldPosition(new THREE.Vector3());assert(upper.y-lower.y>.45,'Hands must hang below shoulders, not T-pose');}
const visor=a.materials.find(m=>m.name==='steklo');assert.equal(visor.roughness,.18);assert.equal(visor.metalness,.42);
let downloads=0,parses=0,reads=0;
const native=moduleAt('src/features/astronaut/load.ts',{'expo-asset':{Asset:{fromModule:()=>({downloadAsync:async()=>{downloads++;return {localUri:'file:///cache/astronaut.glb'};}})}},'expo-file-system':{File:class{async arrayBuffer(){reads++;return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);}}},'three/examples/jsm/loaders/GLTFLoader.js':{GLTFLoader:class{async parseAsync(data){parses++;assert.equal(data.byteLength,1818528);return gltf;}}},'../../../assets/astronaut/astronaut.glb':1});
const p=native.loadAstronaut();assert.equal(native.loadAstronaut(),p);assert.equal(await p,gltf);assert.equal(downloads,1);assert.equal(reads,1);assert.equal(parses,1);
a.dispose();b.dispose();
console.log('PASS: unchanged licensed GLB, exact counts, real loader parsing, finite posed skin vertices, relaxed arms, proxy-sized bounds, isolated skeleton/material clones with shared geometry/textures, opaque visor, cached native asset/download/read/parse contract. Expo Go GPU/runtime remains a physical-device acceptance gate.');
