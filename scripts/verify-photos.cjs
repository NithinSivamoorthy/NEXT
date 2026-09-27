// Dependency-free contract/component tests with mocked native picker, file system and animation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule((process.env.NEXT_PHOTO_MUTATION==='1'&&file.endsWith('/photos.ts')?fs.readFileSync(file,'utf8').replace('await source.copy(destination);','source.copy(destination);'):fs.readFileSync(file,'utf8')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})((id)=>id in mocks?mocks[id]:require(id),module,module.exports);return module.exports;}
const disk=new Map(),root='file:///documents/next-memory-photos';let failCopy=false,failDelete=false;
class Directory{constructor(...parts){this.uri=parts.map(p=>p.uri??p).join('/');}get exists(){return [...disk.keys()].some(p=>p.startsWith(this.uri+'/'));}create(){}delete(){if(failDelete)throw Error('disk');for(const path of disk.keys())if(path.startsWith(this.uri+'/'))disk.delete(path);}}
class File{constructor(...parts){this.uri=parts.map(p=>p.uri??p).join('/');}get exists(){return disk.has(this.uri);}get size(){return disk.get(this.uri)?.length??0;}async copy(to){await new Promise(resolve=>setTimeout(resolve,5));disk.set(to.uri,Buffer.from(disk.get(this.uri)));if(failCopy)throw Error('disk');}delete(){disk.delete(this.uri);}write(s){disk.set(this.uri,Buffer.from(s));}async text(){return disk.get(this.uri).toString();}}
const nativeFS={Directory,File,Paths:{document:'file:///documents'}};
let permission={granted:true},result={canceled:true},pickerCalls=0,options;
const picker={requestMediaLibraryPermissionsAsync:async()=>permission,launchImageLibraryAsync:async value=>{pickerCalls++;options=value;return result;},UIImagePickerPreferredAssetRepresentationMode:{Compatible:'compatible'}};
const platform={OS:'ios'};
const photos=load('src/features/product/photos.ts',{'expo-file-system':nativeFS,'expo-image-picker':picker,'react-native':{Platform:platform}});
const asset={uri:'file:///cache/photo.jpg',width:1200,height:900,fileSize:4};disk.set(asset.uri,Buffer.from('JPEG'));
const select=()=>{result={canceled:false,assets:[asset]};};
(async()=>{
 permission={granted:false,accessPrivileges:'none'};assert.equal((await photos.selectPhoto()).kind,'unavailable');assert.equal(pickerCalls,0);
 permission={granted:true};assert.equal((await photos.selectPhoto()).kind,'canceled');assert.equal([...disk.keys()].length,1);
 select();const chosen=await photos.selectPhoto();assert.equal(chosen.kind,'selected');assert(chosen.uri.startsWith(root+'/memory-'));assert.equal(disk.get(chosen.uri).toString(),'JPEG');assert(disk.has(asset.uri));assert.deepEqual(options.mediaTypes,['images']);assert.equal(options.exif,false);assert.equal(options.base64,false);assert.equal(options.allowsMultipleSelection,false);
 permission={granted:false,accessPrivileges:'limited'};assert.equal((await photos.selectPhoto()).kind,'selected');
 permission={granted:false};platform.OS='android';assert.equal((await photos.selectPhoto()).kind,'selected');platform.OS='ios';permission={granted:true};
 photos.discardPhoto(asset.uri);assert(disk.has(asset.uri));photos.discardPhoto(chosen.uri);assert(!disk.has(chosen.uri));
 const second=await photos.selectPhoto('id/with spaces');const third=await photos.selectPhoto('id/with spaces');assert.notEqual(second.uri,third.uri);assert(second.uri.includes('id-with-spaces'));
 const count=disk.size;failCopy=true;assert.equal((await photos.selectPhoto()).kind,'unavailable');assert.equal(disk.size,count);failCopy=false;
 result={canceled:false,assets:[{...asset,width:10000,height:10000}]};assert.equal((await photos.selectPhoto()).kind,'unavailable');
 result={canceled:false,assets:[{...asset,fileSize:21*1024*1024}]};assert.equal((await photos.selectPhoto()).kind,'unavailable');
 result={canceled:false,assets:[{...asset,uri:'https://example.test/image'}]};assert.equal((await photos.selectPhoto()).kind,'unavailable');
 failDelete=true;assert.throws(()=>photos.clearPhotosAfterReset());failDelete=false;photos.clearPhotosAfterReset();assert.equal(disk.size,1);assert(disk.has(asset.uri));
 const web=load('src/features/product/photos.web.ts');assert.equal((await web.selectPhoto()).kind,'unavailable');

 // Render the real composer with small hook/native fakes, without a test renderer dependency.
 function composer(){
  const hooks=[],cleanups=[];let cursor=0,animation,commits=[],removed=[],selection={kind:'canceled'},pending;
  const useState=(initial)=>{const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return [hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v];};
  const React={useState,useRef:initial=>{const i=cursor++;return hooks[i]??(hooks[i]={current:initial});},useEffect:fn=>{const i=cursor++;if(!(i in hooks)){hooks[i]=true;cleanups.push(fn());}}};
  const jsx=(type,props)=>({type,props});class Value{interpolate(){return 1;}}
  const rn={Animated:{Value,View:'AnimatedView',timing:(_value,config)=>{animation={config,start:fn=>animation.finish=fn,stop(){}};return animation;}},StyleSheet:{create:x=>x},Keyboard:{dismiss(){}},View:'View',Text:'Text',Image:'Image',TextInput:'TextInput',Pressable:'Pressable'};
  const ui={Action:'Action',ui:new Proxy({},{get:()=>({})})};
  const module=load('src/features/product/MemoryUI.tsx',{'react':React,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':rn,'../experience/ExperienceProvider':{useExperience:()=>({settings:{reducedMotion:false}})},'./ui':ui,'./Reveal':{Reveal:'Reveal'},'./photos':{selectPhoto:()=>pending??Promise.resolve(selection),discardPhoto:uri=>{if(uri)removed.push(uri);}}});
  let tree;const render=()=>{cursor=0;tree=module.CompletionComposer({item:{title:'Test',action:'Take a step'},onCancel:()=>{},onCommit:value=>commits.push(value)});};
  const nodes=()=>{const out=[];function walk(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(walk);return;}out.push(n);walk(n.props?.children);}walk(tree);return out;};
  render();return {render,nodes,action:label=>nodes().find(n=>n.type==='Action'&&n.props.label===label),setSelection:v=>selection=v,setPending:p=>pending=p,commits,removed,unmount:()=>cleanups.forEach(fn=>fn?.()),animation:()=>animation};
 }
 let c=composer();await c.action('ADD A PHOTO').props.onPress();c.render();assert(c.action('SUBMIT NEXT'));c.action('SUBMIT NEXT').props.onPress();assert.equal(c.commits.length,0);assert.equal(c.animation().config.duration,2100);c.animation().finish({finished:true});assert.deepEqual(c.commits,[{memory:''}]);
 c=composer();c.setSelection({kind:'unavailable',message:'Denied'});await c.action('ADD A PHOTO').props.onPress();c.render();assert(c.nodes().some(n=>n.props?.children==='Denied'));assert(!c.action('SUBMIT NEXT').props.disabled);
 c=composer();c.setSelection({kind:'selected',uri:'file:///documents/next-memory-photos/memory-test.jpg'});await c.action('ADD A PHOTO').props.onPress();c.render();assert(c.nodes().some(n=>n.props?.uri?.endsWith('memory-test.jpg')));c.nodes().find(n=>n.type==='TextInput').props.onChangeText(' A quiet step ');c.render();c.action('SUBMIT NEXT').props.onPress();assert.equal(c.commits.length,0);c.animation().finish({finished:true});assert.equal(c.commits[0].photoUri,'file:///documents/next-memory-photos/memory-test.jpg');assert.equal(c.commits[0].memory,'A quiet step');c.unmount();assert.equal(c.removed.length,0);
 c=composer();c.setSelection({kind:'selected',uri:'file:///draft.jpg'});await c.action('ADD A PHOTO').props.onPress();c.render();c.action('REMOVE PHOTO').props.onPress();assert.deepEqual(c.removed,['file:///draft.jpg']);c.render();c.action('SUBMIT NEXT').props.onPress();c.animation().finish({finished:true});assert.equal(c.commits[0].photoUri,undefined);
 c=composer();c.setSelection({kind:'selected',uri:'file:///draft.jpg'});await c.action('ADD A PHOTO').props.onPress();c.unmount();assert.deepEqual(c.removed,['file:///draft.jpg']);
 c=composer();let finishPicker;c.setPending(new Promise(resolve=>finishPicker=resolve));const pick=c.action('ADD A PHOTO').props.onPress();c.render();assert(c.action('SUBMIT NEXT').props.disabled);c.unmount();finishPicker({kind:'selected',uri:'file:///late.jpg'});await pick;assert.deepEqual(c.removed,['file:///late.jpg']);

 c=composer();c.setSelection({kind:'selected',uri:'file:///old.jpg'});await c.action('ADD A PHOTO').props.onPress();c.render();c.setSelection({kind:'selected',uri:'file:///new.jpg'});await c.action('CHANGE PHOTO').props.onPress();c.render();assert.deepEqual(c.removed,['file:///old.jpg']);c.action('SUBMIT NEXT').props.onPress();c.animation().finish({finished:true});assert.equal(c.commits[0].photoUri,'file:///new.jpg');

 // Real state reducer + serializer + native slot implementation with mocked disk.
 require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
 const {experienceReducer:reduce,initialExperience}=require('../src/features/experience/model.ts');
 const {decode}=require('../src/features/product/persistence.ts');
 const {photoMemories}=require('../src/features/product/progress.ts');
 const storage=load('src/features/product/storage.ts',{'expo-file-system':nativeFS});
 const answers={movingFrom:'Delay',reason:'Family',progressVision:'Finish calmly',dailyCommitment:15,challengeLevel:'balanced'};
 const task={id:'photo-next',status:'active',createdAt:new Date().toISOString(),source:'local',title:'Step',action:'Take a step',why:'Move forward',reflection:'How was it?',category:'growth',estimatedMinutes:15};
 select();const durable=await photos.selectPhoto();let state=reduce({...initialExperience,answers,onboardingComplete:true,currentNext:task},{type:'complete-next',id:task.id,photoUri:durable.uri,memory:'A memory',at:new Date().toISOString()});
 storage.writeSlot(0,JSON.stringify({version:1,revision:1,state}));disk.delete(asset.uri);
 const restored=decode(await storage.readSlot(0));assert.equal(restored.state.history[0].photoUri,durable.uri);assert(disk.has(durable.uri));assert.equal(photoMemories(restored.state.history)[0].photoUri,durable.uri);
 const withoutPhoto=reduce({...state,currentNext:{...task,id:'no-photo'}},{type:'complete-next',id:'no-photo',at:new Date().toISOString()});assert.equal(withoutPhoto.history.length,2);assert.equal(photoMemories(withoutPhoto.history).length,1);
 disk.set(asset.uri,Buffer.from('JPEG'));select();const another=await photos.selectPhoto('another');const multiple=reduce({...withoutPhoto,currentNext:{...task,id:'another'}},{type:'complete-next',id:'another',photoUri:another.uri,at:new Date().toISOString()});assert.equal(photoMemories(multiple.history).length,2);assert.notEqual(another.uri,durable.uri);
 state=reduce(state,{type:'reset'});for(const slot of [0,1])storage.writeSlot(slot,JSON.stringify({version:1,revision:2,state}));photos.clearPhotosAfterReset();assert(!disk.has(durable.uri));for(const slot of [0,1])assert.equal(decode(await storage.readSlot(slot)).state.history.length,0);
 // Guard the production reset ordering and the unchanged animation/deferred commit.
 const provider=fs.readFileSync('src/features/experience/ExperienceProvider.tsx','utf8');assert(provider.indexOf('writeSlot((next+1)%2,serialized)')<provider.indexOf('clearPhotosAfterReset();'));
 console.log('PASS: mocked iOS denial/limited access, Android picker, cancellation, selection/copy, size limits, copy failure, draft cleanup, late result/unmount, preview wiring, no-photo/photo submission after 2100ms, local slot reload after cache removal, reset cleanup, web fallback. Physical-device behavior still requires Expo Go.');
})().catch(e=>{console.error(e);process.exitCode=1;});
