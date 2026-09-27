// Streak derivation and the Memory/Progress screens, with mocked hooks and animation.
process.env.TZ='America/New_York'; // A zone with DST, so day arithmetic is exercised properly.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})((id)=>id in mocks?mocks[id]:/\.(otf|ttf|glb|png)$/.test(id)?1:require(id),module,module.exports);return module.exports;}
const {deriveMomentum,momentumLevel,photoMemories,formatCompleted,dayKey,shiftKey}=require('../src/features/product/progress.ts');
const {experienceReducer,initialExperience}=require('../src/features/experience/model.ts');
const {decode}=require('../src/features/product/persistence.ts');

const at=(y,m,d,h=12)=>new Date(y,m-1,d,h,0,0).toISOString();
let seq=0;
const done=(iso,extra={})=>({id:`n${++seq}`,title:`Step ${seq}`,action:'Take one small step.',why:'Because it is small.',estimatedMinutes:5,
 category:'Small steps',reflection:'How did it feel?',status:'completed',createdAt:iso,completedAt:iso,source:'local',...extra});
const NOW=new Date(2026,8,27,18,0,0); // 27 Sep 2026, local.

// ---------------------------------------------------------------- the streak rule
{
 const empty=deriveMomentum([],NOW);
 assert.deepEqual([empty.total,empty.current,empty.longest],[0,0,0],'nothing is invented before a completion');
 assert.equal(empty.lastDay,null);
 assert.equal(empty.days.length,14);
 assert(empty.days.every(d=>d.before&&d.count===0),'with no record, no day reads as missed');

 const first=deriveMomentum([done(at(2026,9,27))],NOW);
 assert.deepEqual([first.total,first.current,first.longest],[1,1,1],'the first completion starts the streak');

 const sameDay=deriveMomentum([done(at(2026,9,27,9)),done(at(2026,9,27,21))],NOW);
 assert.deepEqual([sameDay.total,sameDay.current,sameDay.longest],[2,1,1],'two in a day count twice, but advance the streak once');

 const run=deriveMomentum([done(at(2026,9,25)),done(at(2026,9,26)),done(at(2026,9,27))],NOW);
 assert.deepEqual([run.total,run.current,run.longest],[3,3,3],'consecutive days build the streak');

 const alive=deriveMomentum([done(at(2026,9,25)),done(at(2026,9,26))],NOW);
 assert.equal(alive.current,2,'a run ending yesterday is still alive: today is not over');

 const broken=deriveMomentum([done(at(2026,9,23)),done(at(2026,9,24))],NOW);
 assert.equal(broken.current,0,'a missed day breaks the active streak');
 assert.equal(broken.longest,2,'but the longest run is kept');

 const mixed=deriveMomentum([done(at(2026,9,1)),done(at(2026,9,2)),done(at(2026,9,3)),done(at(2026,9,4)),done(at(2026,9,20)),done(at(2026,9,27))],NOW);
 assert.deepEqual([mixed.total,mixed.current,mixed.longest],[6,1,4],'the longest run is found anywhere in the record');

 // Local calendar days, not fixed 24h offsets: this run crosses the end of DST.
 const dst=deriveMomentum([done(at(2026,10,31)),done(at(2026,11,1)),done(at(2026,11,2))],new Date(2026,10,2,18));
 assert.deepEqual([dst.current,dst.longest],[3,3],'a streak survives a daylight-saving change');

 const corrupt=deriveMomentum([done(at(2026,9,27)),{...done('not-a-date')},{...done(at(2026,9,26)),status:'active',completedAt:undefined}],NOW);
 assert.deepEqual([corrupt.total,corrupt.current],[1,1],'unreadable or unfinished records are skipped, not counted');

 const days=deriveMomentum([done(at(2026,9,26)),done(at(2026,9,27))],NOW).days;
 assert.equal(days.at(-1).key,dayKey(NOW),'the window ends today');
 assert.equal(days.at(-1).count,1);assert.equal(days.at(-2).count,1);
 assert(days.slice(0,12).every(d=>d.before),'days before the first completion are marked, never shown as missed');
 assert.equal(shiftKey('2026-01-01',-1),'2025-12-31','day arithmetic crosses a year boundary');
 assert.equal(shiftKey('2026-03-01',-1),'2026-02-28');

 // Reload derives identical figures from the persisted record.
 const history=[done(at(2026,9,26)),done(at(2026,9,27))];
 const state={...initialExperience,profileCreated:true,username:'Nova',history,onboardingComplete:true,
  answers:{movingFrom:'a',reason:'b',progressVision:'c',dailyCommitment:15,challengeLevel:'balanced'}};
 const restored=decode(JSON.stringify({version:1,revision:1,state}));
 assert(restored,'the record survives persistence');
 assert.deepEqual(deriveMomentum(restored.state.history,NOW),deriveMomentum(history,NOW),'reload derives the same momentum');
 // Nothing extra is stored: the figures are always derived.
 assert(!('streak' in restored.state)&&!('longestStreak' in restored.state)&&!('momentum' in restored.state),'no counter is persisted to drift');
}

// ---------------------------------------------------------------- bounded star response
{
 assert.equal(momentumLevel(0),0,'no streak is the quiet baseline');
 let previous=-1;
 for(const streak of [0,1,2,3,4,5,6,7,8,12,20,60,500,10000]){
  const level=momentumLevel(streak);
  assert(level>=previous,'the response never falls back');
  assert(level<=1,`the response never exceeds its designed maximum at ${streak}`);
  previous=level;
 }
 // Strictly rising across the range a real streak occupies, then flat at the designed maximum.
 for(let streak=0;streak<20;streak++)assert(momentumLevel(streak+1)>momentumLevel(streak),`the response still rises at ${streak}`);
 assert(momentumLevel(8)>.9&&momentumLevel(3)>.5&&momentumLevel(3)<.7,'it approaches its designed maximum by roughly eight days');
 assert.equal(momentumLevel(10000),1,'and holds there rather than growing without limit');
 assert.equal(momentumLevel(-5),0,'a nonsense streak cannot darken or brighten it');
}

// ---------------------------------------------------------------- Memory is photos only
{
 const withPhoto=done(at(2026,9,27),{photoUri:'file:///documents/next-memory-photos/memory-1.jpg',memory:'A quiet morning.'});
 const withoutPhoto=done(at(2026,9,26));
 const history=[withPhoto,withoutPhoto];
 assert.deepEqual(photoMemories(history).map(r=>r.id),[withPhoto.id],'only completions carrying a photo become memories');
 assert.equal(history.length,2,'the completion without a photo stays in history');
 assert.equal(deriveMomentum(history,NOW).total,2,'and still counts toward momentum');
 assert.equal(formatCompleted(at(2026,9,27)),'SEP 27, 2026');
 assert.equal(formatCompleted(undefined),'');
 assert.equal(formatCompleted('nonsense'),'','an unreadable date renders nothing rather than "Invalid Date"');
 const active={...done(at(2026,9,27)),status:'active'};
 const committed=experienceReducer({...initialExperience,currentNext:active},
  {type:'complete-next',id:active.id,at:at(2026,9,27),photoUri:'file:///documents/next-memory-photos/memory-2.jpg'});
 assert.equal(photoMemories(committed.history).length,1,'a completion with a photo reaches the archive through the existing action');
}

// ---------------------------------------------------------------- the screens
function screen(file,{history=[],capsules=[],reducedMotion=false,width=390,fontScale=1,extraMocks={}}={}){
 const slots=[];let cursor=0;
 const useState=initial=>{const i=cursor++;if(!(i in slots))slots[i]={value:typeof initial==='function'?initial():initial};const slot=slots[i];return [slot.value,v=>{slot.value=typeof v==='function'?v(slot.value):v;}];};
 const React={useState,useRef:initial=>{const i=cursor++;return slots[i]??(slots[i]={current:initial});},
  useMemo:(fn,deps)=>{const i=cursor++;const p=slots[i];if(!p||!deps||!p.deps||deps.some((d,j)=>!Object.is(d,p.deps[j])))slots[i]={deps,value:fn()};return slots[i].value;},
  useEffect:(fn,deps)=>{const i=cursor++;const p=slots[i];if(!p||!deps||!p.deps||deps.length!==p.deps.length||deps.some((d,j)=>!Object.is(d,p.deps[j]))){p?.cleanup?.();slots[i]={deps,cleanup:fn()};}}};
 const jsx=(type,props)=>({type,props});
 class ANode{interpolate(){return new ANode();}}
 class AValue extends ANode{constructor(v){super();this.value=v;}}
 const navigated=[];
 const rn={Animated:{Value:AValue,View:'AnimatedView',Text:'AnimatedText',timing:()=>({start(){},stop(){}}),loop:()=>({start(){},stop(){}})},
  Easing:{inOut:()=>'inOut',sin:'sin',out:()=>'out',quad:'quad'},StyleSheet:{create:x=>x,absoluteFill:{}},
  FlatList:'FlatList',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',useWindowDimensions:()=>({width,height:844,fontScale})};
 const module=load(file,{'react':React,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':rn,
  'expo-router':{useRouter:()=>({back:()=>navigated.push('back'),canGoBack:()=>true,replace:h=>navigated.push(h)})},
  'expo-status-bar':{StatusBar:'StatusBar'},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},
  '../experience/ExperienceProvider':{useExperience:()=>({state:{...initialExperience,history,capsules},settings:{reducedMotion}})},
  './progress':require('../src/features/product/progress.ts'),
  './Reveal':{Reveal:'Reveal'},'./MemoryUI':{LocalPhoto:'LocalPhoto',memoryUI:new Proxy({},{get:()=>({})})},
  './ui':{Action:'Action',useProductFonts:()=>[true,null],ui:new Proxy({},{get:()=>({})})},...extraMocks});
 let tree;
 const render=()=>{cursor=0;tree=module.default();};
 const nodes=()=>{const out=[];(function go(n){if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(go);out.push(n);go(n.props?.children);if(n.type==='FlatList'){go(n.props.ListHeaderComponent);go(n.props.ListFooterComponent);if(!n.props.data.length)go(n.props.ListEmptyComponent);n.props.data.forEach((item,index)=>go(n.props.renderItem({item,index})));}})(tree);return out;};
 render();
 return {render,nodes,navigated,
  // Interpolated text arrives as an array of strings and numbers; flatten it the way it reads.
  text:()=>nodes().map(n=>{const c=n.props?.children;
   if(typeof c==='string')return c;
   if(Array.isArray(c)&&c.every(part=>typeof part==='string'||typeof part==='number'))return c.join('');
   return null;}).filter(Boolean).join(' | '),
  photos:()=>nodes().filter(n=>n.type==='LocalPhoto').map(n=>n.props.uri),
  tap:label=>{const p=nodes().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===label);assert(p,`no control: ${label}`);p.props.onPress();render();},
  action:label=>{const a=nodes().find(n=>n.type==='Action'&&n.props.label===label);assert(a,`no action: ${label}`);a.props.onPress();render();},
 };
}

// Memory: empty state, archive, detail.
{
 const empty=screen('src/features/product/MemoryScreen.tsx');
 assert(empty.text().includes('MEMORIES'),'the empty archive still names itself');
 assert(empty.text().includes('YOUR UNIVERSE\nREMEMBERS WHAT YOU LIVED.'));
 assert(empty.text().includes('Complete a NEXT and leave a photo behind. It will be kept here.'));
 assert.deepEqual(empty.photos(),[],'no photo is invented');
 assert.equal(empty.nodes().find(n=>n.type==='FlatList').props.numColumns,2);
 for(const opts of [{width:320},{fontScale:1.5}])assert.equal(screen('src/features/product/MemoryScreen.tsx',opts).nodes().find(n=>n.type==='FlatList').props.numColumns,1,'small screens / larger text use one column');

 const photo='file:///documents/next-memory-photos/memory-7.jpg';
 const kept=done(at(2026,9,27),{photoUri:photo,memory:'The light was low.'});
 const plain=done(at(2026,9,26));
 const archive=screen('src/features/product/MemoryScreen.tsx',{history:[kept,plain],capsules:[{id:'c1',text:'Remember this.',createdAt:at(2026,9,27),nextId:kept.id}]});
 assert.deepEqual(archive.photos(),[photo],'the archive shows the real photo, once');
 assert(archive.text().includes(kept.title));
 assert(archive.text().includes('SEP 27, 2026'),'the stored completion date is formatted');
 assert(!archive.text().includes(plain.title),'a completion without a photo stays out of the photo archive');
 assert(archive.text().includes('1 PRESERVED'));

 archive.tap(`Open memory: ${kept.title}, SEP 27, 2026`);
 assert(archive.text().includes('WHAT THIS NEXT ASKED'),'the detail says what the NEXT asked');
 assert(archive.text().includes(kept.action));
 assert(archive.text().includes('The light was low.'),'the written memory is shown');
 assert(archive.text().includes('Remember this.'),'an associated capsule is shown');
 assert.deepEqual(archive.photos(),[photo]);
 archive.action('← ALL MEMORIES');
 assert(archive.text().includes('1 PRESERVED'),'and there is a way back');
 archive.action('← RETURN TO UNIVERSE');
 assert.deepEqual(archive.navigated,['back']);
}

// Progress: the new-user star, then real figures and recent days.
{
 const fresh=screen('src/features/product/ProgressScreen.tsx');
 assert(fresh.text().includes('YOUR MOMENTUM'));
 assert(fresh.text().includes('NEXTS COMPLETED'));
 assert(fresh.text().includes('YOUR FIRST NEXT\nCHANGES THIS STAR.'));
 assert(!/CURRENT STREAK/.test(fresh.text()),'no streak is shown before a completion');
 assert(!/LEVEL|XP|ACHIEVEMENT|🔥/.test(fresh.text()),'the copy stays reflective');

 const history=[done(at(2026,9,25)),done(at(2026,9,26)),done(at(2026,9,27)),done(at(2026,9,27)),done(at(2026,9,1))];
 const real=screen('src/features/product/ProgressScreen.tsx',{history});
 const text=real.text();
 assert(text.includes('CURRENT STREAK')&&text.includes('LONGEST STREAK')&&text.includes('NEXTS COMPLETED'));
 assert(text.includes('RECENT ACTIVITY'));
 assert(text.includes('KEEP MOVING.'));
 const figures=real.nodes().filter(n=>n.type==='Text'&&typeof n.props.children==='number').map(n=>n.props.children);
 assert.deepEqual(figures,[3,5,3],'current streak, total completions and longest streak are the derived values');
 assert(!/LEVEL|XP|ACHIEVEMENT|🔥/.test(text),'the copy stays reflective');
}

// ---------------------------------------------------------------- universe wiring
{
 const scene=fs.readFileSync('src/features/product/ProductScene.tsx','utf8');
 const {WORLDS}=require('../src/features/product/worlds.ts');
 assert(WORLDS.some(w=>w.id==='memory'),'Memory is a body in the universe');
 assert(WORLDS.some(w=>w.id==='star'),'the hero star is a navigable body');
 assert(/WORLDS\.forEach\(\(world,index\)=>/.test(scene),'every world is projected to a hit target');
 assert(/placeOf\('memory'\)/.test(scene)&&/placeOf\('star'\)/.test(scene),'the scene reads their positions from the shared list');
 assert(/memoryFragment/.test(scene)&&/planetFragment/.test(scene),'Memory has its own surface, distinct from Today and History');
 assert(/momentum:\{value:0\}/.test(scene),'the star takes a momentum uniform');
 assert(!/EffectComposer|Bloom|castShadow=\{true\}|shadowMap/.test(scene),'no postprocessing or shadow maps were added');
 const space=fs.readFileSync('src/features/product/ProductSpace.tsx','utf8');
 assert(/onMemory/.test(space)&&/onStar/.test(space),'both are tappable');
 const {ROTATABLE}=require('../src/features/product/worlds.ts');
 assert(ROTATABLE.includes('memory'),'Memory rotates like the other worlds');
 assert(/ROTATABLE\.map\(\(\)=>new PlanetRotation/.test(space),'one rotation controller per rotatable world, derived not hand-counted');
 assert(/momentumLevel\(momentum\.current\)/.test(space),'the star is driven by the derived streak');
 const screens=fs.readFileSync('src/features/product/Screens.tsx','utf8');
 assert(/depart\('memory','\/memory'\)/.test(screens)&&/depart\('star','\/progress'\)/.test(screens),'each opens its own screen');
 for(const route of ['src/app/memory.tsx','src/app/progress.tsx'])assert(fs.existsSync(route),`${route} exists`);
 for(const file of ['src/features/product/MemoryScreen.tsx','src/features/product/ProgressScreen.tsx']){
  const source=fs.readFileSync(file,'utf8');
  assert(!/Canvas|@react-three/.test(source),`${file} adds no second GL canvas`);
  assert(!/generateNext|fetch\(/.test(source),`${file} generates and sends nothing`);
 }
 assert(/HistoryArchive/.test(screens),'History is untouched and still reachable');
}

console.log('PASS: streak rule (empty, first, same-day, consecutive, alive-yesterday, broken, longest-anywhere, DST, corrupt records, 14-day window, reload-identical, nothing persisted), bounded and monotonic star response, Memory sourced only from completions carrying photos with History intact, Memory empty/archive/detail with real photo, title, date, note and capsule, Progress zero-state and derived figures with restrained copy, and universe wiring for both worlds without a second canvas, postprocessing or shadow maps.');
