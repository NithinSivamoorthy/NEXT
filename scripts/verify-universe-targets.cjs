// Projection/overlay synchronisation, and a parser-level sweep for stray text children.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule((process.env.NEXT_TARGET_MUTATION==='1'&&file.endsWith('/ProductSpace.tsx')?fs.readFileSync(file,'utf8').replace('last:WORLDS.map','last:WORLDS.slice(0,3).map'):fs.readFileSync(file,'utf8')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})((id)=>id in mocks?mocks[id]:/\.(otf|ttf|glb|png)$/.test(id)?1:require(id),module,module.exports);return module.exports;}
const {WORLDS,ROTATABLE}=require('../src/features/product/worlds.ts');
const {initialExperience}=require('../src/features/experience/model.ts');

// ---------------------------------------------------------------- one list, one set of targets
{
 assert(WORLDS.length>=5,'every navigable body is in the shared list');
 assert.deepEqual([...new Set(WORLDS.map(w=>w.id))],WORLDS.map(w=>w.id),'world ids are unique');
 const scene=fs.readFileSync('src/features/product/ProductScene.tsx','utf8');
 assert(/WORLDS\.forEach\(\(world,index\)=>\{/.test(scene),'the scene projects the shared list, not a private copy');
 assert(!/const locations=\[/.test(scene),'no second list of locations survives in the scene');
 const space=fs.readFileSync('src/features/product/ProductSpace.tsx','utf8');
 assert(/WORLDS\.map\(world=>new Animated\.ValueXY/.test(space),'one Animated value per world');
 assert(/last:WORLDS\.map\(\(\)=>\(\{x:0,y:0\}\)\)/.test(space),'one cached position per world');
 assert(/WORLDS\.map\(\(world,index\)=>/.test(space),'one hit target per world');
 assert(!/new PlanetRotation\(\),new PlanetRotation\(\)/.test(space),'rotation controllers are derived, not hand-counted');
 assert(/ROTATABLE\.map\(\(\)=>new PlanetRotation/.test(space));
}

// Render the real overlay and drive every projection index the scene can emit.
function overlay({focus=null,history=[],handlers=true}={}){
 const slots=[];let cursor=0;
 const useState=initial=>{const i=cursor++;if(!(i in slots))slots[i]={value:typeof initial==='function'?initial():initial};const slot=slots[i];return [slot.value,v=>{slot.value=typeof v==='function'?v(slot.value):v;}];};
 const React={useState,useRef:initial=>{const i=cursor++;return slots[i]??(slots[i]={current:initial});},
  useMemo:(fn,deps)=>{const i=cursor++;const p=slots[i];if(!p||!deps||!p.deps||deps.some((d,j)=>!Object.is(d,p.deps[j])))slots[i]={deps,value:fn()};return slots[i].value;},
  useCallback:fn=>{cursor++;return fn;},
  useEffect:(fn,deps)=>{const i=cursor++;const p=slots[i];if(!p||!deps||!p.deps||deps.length!==p.deps.length||deps.some((d,j)=>!Object.is(d,p.deps[j]))){p?.cleanup?.();slots[i]={deps,cleanup:fn()};}},
  Component:class{}};
 const jsx=(type,props)=>({type,props});
 const applied=[];
 class ValueXY{constructor(v){this.value=v;}setValue(v){applied.push(v);this.value=v;}getTranslateTransform(){return [];}}
 const rn={Animated:{ValueXY,View:'AnimatedView'},PanResponder:{create:()=>({panHandlers:{}})},
  Pressable:'Pressable',Text:'Text',View:'View',useWindowDimensions:()=>({width:390,height:844})};
 const opened=[];
 const module=load('src/features/product/ProductSpace.tsx',{'react':React,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},
  'react-native':rn,'expo-router':{useFocusEffect:fn=>fn()},
  '../universe/camera':{UniverseCamera:class{cancel(){}sample(){}release(){}zoom(){}}},
  '../experience/ExperienceProvider':{useExperience:()=>({state:{...initialExperience,history},settings:{ready:true,active:true,reducedMotion:false}})},
  './ProductCanvas':{default:'ProductCanvas'},'./PlanetRotation':require('../src/features/product/PlanetRotation.ts'),
  './progress':require('../src/features/product/progress.ts'),'./worlds':require('../src/features/product/worlds.ts'),
  './ui':{ui:new Proxy({},{get:()=>({})})}});
 const props={focus,...(handlers?Object.fromEntries(['onToday','onHistory','onProfile','onMemory','onStar'].map(name=>[name,()=>opened.push(name)])):{})};
 let tree;const render=()=>{cursor=0;tree=module.ProductSpace(props);};
 const nodes=()=>{const out=[];(function go(n){if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(go);out.push(n);go(n.props?.children);})(tree);return out;};
 render();
 return {render,nodes,applied,opened,
  canvas:()=>nodes().find(n=>n.type==='ProductCanvas'),
  buttons:()=>nodes().filter(n=>n.type==='Pressable')};
}

{
 const space=overlay();
 const canvas=space.canvas();
 assert(canvas,'the canvas mounts');
 assert.equal(typeof canvas.props.onProject,'function');

 // Every index the scene emits must land, with no undefined cache entry and no exception.
 for(let index=0;index<WORLDS.length;index++){
  space.applied.length=0;
  canvas.props.onProject(index,100+index*10,200+index*10);
  assert.equal(space.applied.length,1,`world ${WORLDS[index].id} (index ${index}) places its target`);
 }
 // Repeating the same position is filtered, so this stays cheap per frame.
 space.applied.length=0;
 canvas.props.onProject(0,100,200);
 assert.equal(space.applied.length,0,'an unchanged projection does no work');

 // An index past the end is survivable rather than fatal: this is the crash that was reported.
 for(const index of [WORLDS.length,WORLDS.length+3,-1,99])
  assert.doesNotThrow(()=>canvas.props.onProject(index,10,10),`index ${index} does not crash the frame`);

 assert.equal(space.buttons().length,WORLDS.length,'one hit target per world');
 const labels=space.nodes().filter(n=>n.type==='Text').map(n=>n.props.children);
 for(const label of ['TODAY’S NEXT','PREVIOUS NEXTS','YOUR IDENTITY','MEMORIES','YOUR MOMENTUM'])
  assert(labels.includes(label),`${label} is reachable`);
 // Each target opens its own destination.
 space.buttons().forEach(button=>button.props.onPress());
 assert.deepEqual(space.opened,['onToday','onHistory','onProfile','onMemory','onStar'],'each world opens its own destination, in scene order');
}

// Focus hides the targets, and only rotatable worlds get a controller.
{
 for(const world of WORLDS){
  const focused=overlay({focus:world.id});
  assert.equal(focused.buttons().length,0,`targets are hidden while ${world.id} is focused`);
  const dragger=focused.nodes().filter(n=>n.type==='View').find(n=>n.props.accessibilityRole==='adjustable');
  assert.equal(!!dragger,world.rotates,`${world.id} ${world.rotates?'accepts':'does not accept'} direct rotation`);
 }
 assert.deepEqual([...ROTATABLE],['today','history','memory'],'Today, History and Memory rotate; the astronaut and the star do not');
}

// ---------------------------------------------------------------- stray text children
/**
 * React Native throws "Text strings must be rendered within a <Text> component" for any string
 * child of a non-Text element. JSX keeps whitespace between two expressions on the same line,
 * so `{a} {b}` inside a <View> is a crash waiting on a condition. Parse for it rather than grep.
 */
{
 const files=[];
 (function walkDir(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walkDir(full);else if(entry.name.endsWith('.tsx'))files.push(full);
 }})('src');
 assert(files.length>20,'the sweep actually found the screens');
 const TEXTUAL=/^(Text|Animated\.Text|ui\.Text)$/;
 const offences=[];
 for(const file of files){
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
  (function visit(node){
   if(ts.isJsxElement(node)){
    const name=node.openingElement.tagName.getText(source);
    if(!TEXTUAL.test(name)){
     for(const child of node.children){
      if(!ts.isJsxText(child))continue;
      // The raw span, not getText(): a whitespace-only JsxText reads as leading trivia and
      // getText() returns empty for exactly the case this is looking for.
      const raw=source.text.slice(child.pos,child.end);
      // JSX drops whitespace runs containing a newline; anything else survives as a string child.
      if(raw.trim()==='' && !raw.includes('\n') && raw.length>0){
       offences.push(`${file}:${source.getLineAndCharacterOfPosition(child.getStart(source)).line+1} whitespace child under <${name}>`);
      } else if(raw.trim()!==''){
       offences.push(`${file}:${source.getLineAndCharacterOfPosition(child.getStart(source)).line+1} literal text "${raw.trim().slice(0,40)}" under <${name}>`);
      }
     }
    }
   }
   ts.forEachChild(node,visit);
  })(source);
 }
 assert.deepEqual(offences,[],`text rendered outside <Text> would crash on device:\n${offences.join('\n')}`);
}

console.log(`PASS: one shared world list drives scene projections, Animated values, cached positions, rotation controllers and hit targets (${WORLDS.length} worlds, ${ROTATABLE.length} rotatable); every in-range index places its target, repeats are filtered, and out-of-range indices cannot crash the frame; each world opens its own destination and focus hides the targets; and no .tsx file renders a text or whitespace child outside <Text>.`);
