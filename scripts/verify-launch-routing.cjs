// Traces the native launch branch and the cinematic handoff, with mocked hooks and animation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
global.__DEV__=false;
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})((id)=>id in mocks?mocks[id]:/\.(otf|ttf|glb|png)$/.test(id)?1:require(id),module,module.exports);return module.exports;}
const {initialExperience,experienceReducer}=require('../src/features/experience/model.ts');

function hooks(){
 const slots=[];let cursor=0;
 const api={
  useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]={value:typeof initial==='function'?initial():initial};const slot=slots[i];return [slot.value,v=>{slot.value=typeof v==='function'?v(slot.value):v;}];},
  useRef:initial=>{const i=cursor++;return slots[i]??(slots[i]={current:initial});},
  useMemo:(fn,deps)=>{const i=cursor++;const p=slots[i];if(!p||!deps||!p.deps||deps.some((d,j)=>!Object.is(d,p.deps[j])))slots[i]={deps,value:fn()};return slots[i].value;},
  useCallback:(fn)=>{cursor++;return fn;},
  useEffect:(fn,deps)=>{const i=cursor++;const p=slots[i];if(!p||!deps||!p.deps||deps.length!==p.deps.length||deps.some((d,j)=>!Object.is(d,p.deps[j]))){p?.cleanup?.();slots[i]={deps,cleanup:fn()};}},
  Component:class{},
  // JSX carrying a key compiles to createElement rather than the jsx runtime.
  createElement:(type,props,...children)=>({type,props:{...props,...(children.length?{children:children.length===1?children[0]:children}:{})}}),
 };
 api.useLayoutEffect=api.useEffect;
 return {api,reset:()=>{cursor=0;},slots};
}
const jsx=(type,props)=>({type,props});
const walk=root=>{const out=[];(function go(n){if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(go);out.push(n);go(n.props?.children);})(root);return out;};
class ANode{interpolate(){return new ANode();}}
class AValue extends ANode{constructor(v){super();this.value=v;}setValue(v){this.value=v;}}
class AValueXY extends ANode{constructor(v){super();this.value=v;}setValue(v){this.value=v;}getTranslateTransform(){return [];}}

// ---------------------------------------------------------------- launch branch
function launchModule(){
 const timings=[];
 const state={experience:null,router:null};
 const Animated={Value:AValue,ValueXY:AValueXY,View:'AnimatedView',Text:'AnimatedText',multiply:()=>new ANode(),add:()=>new ANode(),
  timing:(_v,config)=>{const t={config,start(fn){this.finish=fn;},stop(){}};timings.push(t);return t;}};
 const rn={Animated,StyleSheet:{create:x=>x,absoluteFill:{},hairlineWidth:1},Keyboard:{dismiss(){},addListener:()=>({remove(){}}),scheduleLayoutAnimation(){}},
  Platform:{OS:'ios'},AccessibilityInfo:{announceForAccessibility(){},addEventListener:()=>({remove(){}}),isReduceMotionEnabled:async()=>false,isScreenReaderEnabled:async()=>false,setAccessibilityFocus(){}},
  Alert:{alert:(_t,_m,buttons)=>buttons.find(b=>b.style==='destructive')?.onPress?.()},AppState:{currentState:'active',addEventListener:()=>({remove(){}})},
  findNodeHandle:()=>1,useWindowDimensions:()=>({width:390,height:844}),
  KeyboardAvoidingView:'KeyboardAvoidingView',ScrollView:'ScrollView',Pressable:'Pressable',Text:'Text',TextInput:'TextInput',View:'View'};
 const h=hooks();
 const module=load('src/features/product/Screens.tsx',{
  'react':h.api,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':rn,
  'expo-router':{Redirect:'Redirect',useRouter:()=>state.router,useFocusEffect:()=>{}},
  'expo-status-bar':{StatusBar:'StatusBar'},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},
  '../dev/personalization/PersonalizationScreen':{default:'PersonalizationScreen'},
  '../experience/ExperienceProvider':{useExperience:()=>state.experience},
  '../experience/model':require('../src/features/experience/model.ts'),
  '../experience/content':{firstUnanswered:()=>1,questionAnswered:()=>true,questions:[{title:'q',support:'',kind:'text',field:'movingFrom'}]},
  './next':{generateNext:async()=>({})},'./ProductSpace':{ProductSpace:'ProductSpace'},'./MemoryUI':{CompletionComposer:'Composer',HistoryArchive:'Archive'},
  './Wordmark':{Wordmark:'Wordmark'},'./Reveal':{Reveal:'Reveal'},
  './ui':{Action:'Action',useProductFonts:()=>[true,null],ui:new Proxy({},{get:()=>({})})},
 });
 return {module,state,timings,hooks:h};
}

/** Renders the real launch for one experience state and reports the branch it takes. */
function launch(overrides={}){
 const {module,state,hooks:h}=launchModule();
 const calls={replaced:[],dismissed:0,dispatched:[],begun:[],finished:0,replays:[]};
 state.router={replace:href=>calls.replaced.push(href),push:href=>calls.replaced.push(href),canDismiss:()=>true,dismissAll:()=>{calls.dismissed++;}};
 state.experience={hydrated:true,entranceComplete:false,authPreview:null,cinematicResumeAt:null,storageError:false,
  settings:{reducedMotion:false,ready:true,screenReader:false,active:true},
  state:{...initialExperience},dispatch:a=>calls.dispatched.push(a),beginAuth:s=>calls.begun.push(s),
  finishEntrance:()=>{calls.finished++;},replayEntrance:o=>calls.replays.push(o??null),completeAuth:()=>{},retrySave(){},
  ...overrides,state:{...initialExperience,...(overrides.state??{})}};
 h.reset();
 const outer=module.ProductLaunch();
 assert.equal(typeof outer.type,'function','ProductLaunch renders the restored launch');
 h.reset();
 const tree=outer.type();
 const nodes=walk(tree);
 const cinematic=nodes.find(n=>n.type==='PersonalizationScreen');
 const redirect=nodes.find(n=>n.type==='Redirect');
 return {calls,cinematic,redirect,props:cinematic?.props,module,state,hooks:h};
}

// 1 & 7 — a genuinely fresh device goes to the auth screen, and is not classed as returning.
{
 const fresh=launch();
 assert(fresh.cinematic,'a fresh launch runs the cinematic');
 assert.equal(fresh.props.handoffAt,12.6,'it is armed to hand off after lightspeed');
 assert.equal(typeof fresh.props.onHandoff,'function');
 assert.equal(fresh.props.arrivalOnly,undefined,'a fresh user is not treated as returning');
 assert.equal(fresh.props.initialTime,undefined);
 // 4 — the handoff really navigates to the dedicated route.
 fresh.props.onHandoff(12.6);
 assert.deepEqual(fresh.calls.begun,[12.6],'the resume point is recorded before leaving');
 assert.deepEqual(fresh.calls.replaced,['/auth'],'navigation targets the dedicated route');
}

// 1 — an existing identity is the reason the auth screen is skipped. This is the expected path.
{
 const returning=launch({state:{profileCreated:true,username:'Nova',onboardingComplete:true,firstConsequenceComplete:true,
  answers:{movingFrom:'a',reason:'b',progressVision:'c',dailyCommitment:15,challengeLevel:'balanced'}}});
 assert(returning.cinematic,'a returning launch still plays the entrance');
 assert.equal(returning.props.handoffAt,undefined,'and never visits the auth screen');
 assert.equal(returning.props.arrivalOnly,true);
}

// 2 — reset clears the exact field the branch reads, and restores the auth path.
{
 const used=experienceReducer({...initialExperience,profileCreated:true,username:'Nova',onboardingComplete:true},{type:'reset'});
 assert.equal(used.profileCreated,false,'reset clears the field the branch reads');
 const after=launch({state:used});
 assert.equal(after.props.handoffAt,12.6,'a reset device is routed to the auth screen again');
}

// Dev preview reaches the auth screen without erasing anything.
{
 const preview=launch({state:{profileCreated:true,username:'Nova',onboardingComplete:true,firstConsequenceComplete:true,
  answers:{movingFrom:'a',reason:'b',progressVision:'c',dailyCommitment:15,challengeLevel:'balanced'}},authPreview:'create'});
 assert.equal(preview.props.handoffAt,12.6,'preview replays the cinematic into the auth screen');
 assert.equal(preview.props.arrivalOnly,undefined,'preview is not short-circuited by the returning path');
}

// 6 — the handoff position survives the trip and resumes the cinematic rather than replaying it.
{
 const back=launch({state:{profileCreated:true,username:'Nova'},cinematicResumeAt:13.32});
 assert.equal(back.props.handoffAt,undefined,'it does not hand off a second time');
 assert.equal(back.props.initialTime,13.32,'the cinematic resumes where it left');
}

// Reduce Motion still reaches the auth screen.
{
 const quiet=launch({settings:{reducedMotion:true,ready:true,screenReader:false,active:true}});
 assert.equal(quiet.props.handoffAt,13);
}

// 5 & 8 — nothing else redirects away from /auth, and only "/" ever owns a running entrance.
{
 const source=fs.readFileSync('src/features/product/Screens.tsx','utf8');
 assert(!/if\(!entranceComplete\)return <ProductLaunch\/>/.test(source),'no screen runs a second launch inside itself');
 const {module,state,hooks:h}=launchModule();
 state.router={replace(){},push(){},canDismiss:()=>false,dismissAll(){}};
 const base={hydrated:true,entranceComplete:false,authPreview:null,cinematicResumeAt:null,storageError:false,
  settings:{reducedMotion:false,ready:true,screenReader:false,active:true},state:{...initialExperience,onboardingComplete:true},
  dispatch(){},beginAuth(){},finishEntrance(){},replayEntrance(){},completeAuth(){},retrySave(){}};
 for(const screen of ['ProductUniverse','ReflectionScreen']){
  state.experience=base;h.reset();
  const tree=module[screen]();
  assert.equal(tree.type,'Redirect',`${screen} hands the entrance back instead of running one`);
  assert.equal(tree.props.href,'/','it hands it back to the launch route');
 }
 const layout=fs.readFileSync('src/app/_layout.tsx','utf8');
 assert(!/Redirect|href|profileCreated/.test(layout),'the router layout guards nothing');
 assert(!/Redirect|profileCreated|useExperience/.test(fs.readFileSync('src/app/auth.tsx','utf8')),'the auth route guards nothing');
}

// The dev controls leave no second screen mounted and reach the real route.
{
 const {module,state,hooks:h}=launchModule();
 const calls={replaced:[],dismissed:0,dispatched:[],replays:[]};
 state.router={replace:href=>calls.replaced.push(href),push(){},canDismiss:()=>true,dismissAll:()=>{calls.dismissed++;}};
 state.experience={state:{...initialExperience,profileCreated:true,username:'Nova'},dispatch:a=>calls.dispatched.push(a),
  replayEntrance:o=>calls.replays.push(o??null),entranceComplete:true,authPreview:null,cinematicResumeAt:null};
 h.reset();
 const nodes=walk(module.ResetScreen());
 const press=label=>{const a=nodes.find(n=>n.type==='Action'&&n.props.label===label);assert(a,`missing control: ${label}`);a.props.onPress();};
 const readout=nodes.map(n=>n.props?.children).find(c=>typeof c==='string'&&c.includes('AFTER LIGHTSPEED'));
 assert(readout,'the screen reports where the next launch goes');
 assert(readout.includes('IDENTITY CREATED · Nova'),'it names the identity that would skip the auth screen');
 assert(readout.includes('AFTER LIGHTSPEED → /reflect'),'and where that sends the next launch');

 press('PREVIEW CREATE ACCOUNT · KEEP PROGRESS');
 assert.deepEqual(calls.replays,[{auth:'create'}],'preview arms create mode');
 assert.equal(calls.dismissed,1,'the stack is cleared so no second entrance runs');
 assert.deepEqual(calls.replaced,['/'],'it replays the cinematic, which then hands off to /auth');
 assert.deepEqual(calls.dispatched,[],'progress is kept');

 press('PREVIEW SIGN IN · KEEP PROGRESS');
 assert.deepEqual(calls.replays.at(-1),{auth:'signin'});
 assert.deepEqual(calls.dispatched,[],'progress is kept');

 press('OPEN /auth NOW · SKIP CINEMATIC');
 assert.deepEqual(calls.replays.at(-1),{auth:'create'});
 assert.equal(calls.replaced.at(-1),'/auth','the skip control opens the real route directly');
 assert.deepEqual(calls.dispatched,[],'progress is kept');

 press('RESET & REPLAY ONBOARDING');
 assert.deepEqual(calls.dispatched,[{type:'reset'}]);
 assert.equal(calls.replaced.at(-1),'/');
}

// 3 — the cinematic's own clock actually fires the handoff on the native path.
{
 const timings=[];
 const Animated={Value:AValue,ValueXY:AValueXY,View:'AnimatedView',Text:'AnimatedText',multiply:()=>new ANode(),add:()=>new ANode(),
  timing:(_v,config)=>{const t={config,start(fn){this.finish=fn;},stop(){}};timings.push(t);return t;}};
 const rn={Animated,StyleSheet:{create:x=>x,absoluteFill:{},hairlineWidth:1},
  Keyboard:{dismiss(){},addListener:()=>({remove(){}}),scheduleLayoutAnimation(){}},Platform:{OS:'ios'},
  AccessibilityInfo:{announceForAccessibility(){},setAccessibilityFocus(){}},findNodeHandle:()=>1,
  useWindowDimensions:()=>({width:390,height:844}),ScrollView:'ScrollView',Pressable:'Pressable',Text:'Text',TextInput:'TextInput',View:'View'};
 const h=hooks();
 const handoffs=[];
 const module=load('src/features/dev/personalization/PersonalizationScreen.tsx',{
  'react':h.api,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},'react-native':rn,
  'expo-font':{useFonts:()=>[true,null]},'expo-router':{useRouter:()=>({replace(){}}),useFocusEffect:()=>{}},
  'expo-status-bar':{StatusBar:'StatusBar'},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},
  '../../experience/ExperienceProvider':{useExperience:()=>({settings:{reducedMotion:false,ready:true,screenReader:false,active:true}})},
  './ExperienceCanvas':{default:'ExperienceCanvas'},'./SignalTarget':{default:'SignalTarget'},
  '../../experience/content':{questions:[{title:'What are you ready to move forward from?',support:'',kind:'text',field:'movingFrom'}]},
  './presentation':require('../src/features/dev/personalization/presentation.ts'),
  '../cinematic/timeline':require('../src/features/dev/cinematic/timeline.ts'),
  './interaction':require('../src/features/dev/personalization/interaction.ts'),
 });
 const props={handoffAt:12.6,onHandoff:s=>handoffs.push(s)};
 let tree;const render=()=>{h.reset();tree=module.default(props);h.reset();tree=tree.type({...tree.props});};
 render();
 // The canvas mounts only once the wordmark has measured, exactly as it does on device.
 const wordmark=walk(tree).find(n=>n.type==='Text'&&typeof n.props.onLayout==='function');
 assert(wordmark,'the measured wordmark drives canvas mounting');
 wordmark.props.onLayout({nativeEvent:{layout:{width:180}}});
 render();
 const canvas=walk(tree).find(n=>n.type==='ExperienceCanvas');
 assert(canvas,'the cinematic canvas mounts');
 assert.equal(typeof canvas.props.onClock,'function','the scene reports its clock to the screen');
 assert.equal(canvas.props.initialTime,0);
 canvas.props.onClock(9.4);
 assert.deepEqual(handoffs,[],'it does not leave before lightspeed has run out');
 canvas.props.onClock(12.61);
 assert.deepEqual(handoffs,[],'it fades first rather than cutting');
 const fade=timings.at(-1);
 assert.equal(fade.config.duration,700,'the darkness takes over across 700ms');
 fade.finish({finished:true});
 assert.deepEqual(handoffs,[12.61],'then it hands off at the position the clock reached');
 canvas.props.onClock(13.9);
 assert.equal(handoffs.length,1,'and only once');
}

console.log('PASS: fresh device routes to /auth after lightspeed, existing identity is the only thing that skips it, reset restores the auth path, dev preview reaches it without erasing progress, resume position survives the trip, Reduce Motion reaches it, no screen runs a second launch, no layout or route guard redirects /auth, dev controls clear the stack and reach the real route, and the cinematic clock fires the handoff once after a 700ms fade.');
