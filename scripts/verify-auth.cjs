// Dependency-free contract/component tests for the dedicated auth screen, with mocked hooks and animation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})((id)=>id in mocks?mocks[id]:require(id),module,module.exports);return module.exports;}
const read=file=>fs.readFileSync(file,'utf8');
const SECRET='not-a-real-password';

// The screen is its own route and composition, never an overlay on the cinematic.
{
 assert(fs.existsSync('src/app/auth.tsx'),'a dedicated /auth route exists');
 assert(read('src/app/auth.tsx').includes('AuthScreen'),'the route renders the auth screen');
 assert(!fs.existsSync('src/features/product/IdentitySetup.tsx'),'the old overlay is gone');
 const cinematic=read('src/features/dev/personalization/PersonalizationScreen.tsx');
 assert(!/IdentitySetup/.test(cinematic),'the cinematic no longer renders an identity overlay');
 assert(/handoffAt/.test(cinematic)&&/onHandoff/.test(cinematic),'the cinematic hands off instead');
 const screen=read('src/features/product/AuthScreen.tsx');
 assert(!/PersonalizationScreen|ExperienceCanvas|CinematicScene/.test(screen),'the screen owns its own composition');
 assert(/KeyboardAvoidingView/.test(screen)&&/keyboardWillShow/.test(screen),'the screen owns its keyboard handling');
 // A password must not be able to leave this device by any route the screen controls.
 assert(!/console\./.test(screen),'the screen logs nothing');
 assert(!/fetch\(|generateNext|EXPO_PUBLIC_NEXT_API_URL|writeSlot/.test(screen),'the screen performs no network or storage write of its own');
 const launch=read('src/features/product/Screens.tsx');
 assert(/router\.replace\('\/auth'\)/.test(launch),'the launch navigates to the dedicated route');
}

// Render the real screen with small hook/native fakes, without a test renderer dependency.
function screen({reducedMotion=false,profileCreated=false,username='',authPreview=null}={}){
 const hooks=[];let cursor=0;
 const timings=[],dispatched=[],navigated=[],completed=[];
 const useState=(initial)=>{const i=cursor++;if(!(i in hooks))hooks[i]={value:typeof initial==='function'?initial():initial};const slot=hooks[i];return [slot.value,v=>{slot.value=typeof v==='function'?v(slot.value):v;}];};
 const useRef=(initial)=>{const i=cursor++;return hooks[i]??(hooks[i]={current:initial});};
 const useMemo=(fn,deps)=>{const i=cursor++;const prev=hooks[i];
  if(!prev||!deps||!prev.deps||deps.some((d,j)=>!Object.is(d,prev.deps[j]))){hooks[i]={deps,value:fn()};}return hooks[i].value;};
 const useEffect=(fn,deps)=>{const i=cursor++;const prev=hooks[i];
  if(!prev||!deps||!prev.deps||deps.length!==prev.deps.length||deps.some((d,j)=>!Object.is(d,prev.deps[j]))){prev?.cleanup?.();hooks[i]={deps,cleanup:fn()};}};
 const React={useState,useRef,useMemo,useEffect};
 const jsx=(type,props)=>({type,props});
 class Node{interpolate(){return new Node();}}
 class Value extends Node{constructor(v){super();this.value=v;}setValue(v){this.value=v;}}
 const timing=(_value,config)=>{const t={config,start(fn){this.finish=fn;},stop(){}};timings.push(t);return t;};
 const Animated={Value,View:'AnimatedView',Text:'AnimatedText',multiply:()=>new Node(),add:()=>new Node(),timing,
  loop:animation=>({start(){},stop(){}})};
 const rn={Animated,Easing:{out:()=>'out',inOut:()=>'inOut',quad:'quad',sin:'sin',linear:'linear'},
  StyleSheet:{create:x=>x,absoluteFill:{}},Keyboard:{dismiss(){},addListener:()=>({remove(){}})},Platform:{OS:'ios'},
  KeyboardAvoidingView:'KeyboardAvoidingView',ScrollView:'ScrollView',Pressable:'Pressable',Text:'Text',TextInput:'TextInput',View:'View',
  useWindowDimensions:()=>({width:390,height:844})};
 const experience={state:{profileCreated,username,history:[],capsules:[]},dispatch:a=>dispatched.push(a),
  settings:{reducedMotion},authPreview,completeAuth:()=>completed.push(true)};
 const module=load('src/features/product/AuthScreen.tsx',{'react':React,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},
  'react-native':rn,'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0,bottom:0})},'expo-status-bar':{StatusBar:'StatusBar'},
  'expo-router':{useRouter:()=>({replace:href=>navigated.push(href)})},'./Wordmark':{Wordmark:'Wordmark'},
  '../experience/ExperienceProvider':{useExperience:()=>experience},'./profile':require('../src/features/product/profile.ts'),
  './ui':{useProductFonts:()=>[true,null],ui:new Proxy({},{get:()=>({})})}});
 let tree;
 const render=()=>{cursor=0;tree=module.default();};
 const nodes=root=>{const out=[];(function walk(n){if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(walk);out.push(n);walk(n.props?.children);})(root===undefined?tree:root);return out;};
 const field=label=>nodes().find(n=>n.props?.label===label);
 const input=label=>field(label)?.props.children;
 const pressable=text=>nodes().filter(n=>n.type==='Pressable').find(p=>nodes(p).some(n=>n.props?.children===text));
 const liveStrings=()=>hooks.map(h=>h&&h.value).filter(v=>typeof v==='string');
 render();
 return {render,nodes,field,input,pressable,liveStrings,timings,dispatched,navigated,completed,
  type:(label,value)=>{input(label).props.onChangeText(value);render();},
  blur:label=>{input(label).props.onBlur();render();},
  tap:text=>{const p=pressable(text);assert(p,`no control labelled ${text}`);p.props.onPress();render();return p;},
  heading:()=>nodes().find(n=>n.props?.accessibilityRole==='header')?.props.children,
  alert:()=>nodes().find(n=>n.props?.accessibilityRole==='alert')?.props.children,
  strings:()=>JSON.stringify(nodes().map(n=>({...n.props,children:typeof n.props?.children==='string'?n.props.children:undefined,style:undefined}))),
 };
}

// Create an identity: full hierarchy, confirmation, and the cinematic handback.
{
 const s=screen();
 assert.equal(s.heading(),'CREATE YOUR IDENTITY');
 assert(s.strings().includes('YOUR UNIVERSE STARTS WITH YOU.'));
 assert(s.field('USERNAME')&&s.field('PASSWORD')&&s.field('CONFIRM PASSWORD'),'account creation asks for all three');
 assert(s.pressable('ENTER YOUR UNIVERSE'));
 assert(s.strings().includes('ALREADY HAVE AN IDENTITY?'));

 assert.equal(s.pressable('ENTER YOUR UNIVERSE').props.disabled,true,'empty fields are rejected');
 s.type('USERNAME','Nova');assert.equal(s.pressable('ENTER YOUR UNIVERSE').props.disabled,true);
 s.type('PASSWORD','short');assert.equal(s.pressable('ENTER YOUR UNIVERSE').props.disabled,true,'a short password is rejected');
 s.type('PASSWORD',SECRET);assert.equal(s.pressable('ENTER YOUR UNIVERSE').props.disabled,true,'confirmation is required');
 s.type('CONFIRM PASSWORD',SECRET+'x');assert.equal(s.pressable('ENTER YOUR UNIVERSE').props.disabled,true,'a mismatch is rejected');
 s.blur('CONFIRM PASSWORD');assert.equal(s.field('CONFIRM PASSWORD').props.hint,'Both entries need to match.');
 s.type('CONFIRM PASSWORD',SECRET);assert.equal(s.pressable('ENTER YOUR UNIVERSE').props.disabled,false);

 // Both secrets are masked and excluded from autofill and the keychain.
 for(const label of ['PASSWORD','CONFIRM PASSWORD']){
  assert.equal(s.input(label).props.secureTextEntry,true,`${label} is masked`);
  assert.equal(s.input(label).props.autoComplete,'off');
  assert.equal(s.input(label).props.textContentType,'none');
 }
 assert.equal(s.input('USERNAME').props.secureTextEntry,undefined);
 assert(s.liveStrings().includes(SECRET),'the harness can observe the secret while it is typed');

 s.tap('ENTER YOUR UNIVERSE');
 assert.deepEqual(s.dispatched,[{type:'profile',username:'Nova'}],'only the username is committed');
 assert(!JSON.stringify(s.dispatched).includes(SECRET),'no password reaches the reducer');
 assert.deepEqual(s.liveStrings().filter(v=>v.includes(SECRET)),[],'both secrets are discarded on entry');
 assert(!s.strings().includes(SECRET),'no secret remains in the tree');
 assert.deepEqual(s.navigated,[],'nothing navigates before the departure finishes');
 const depart=s.timings.at(-1);
 assert.equal(depart.config.duration,1100,'the departure runs its full cinematic length');
 depart.finish({finished:true});
 assert.deepEqual(s.completed,[true],'the cinematic is told where to resume');
 assert.deepEqual(s.navigated,['/'],'control returns to the cinematic, not to a new screen');
}

// Sign in: its own hierarchy, and demo-local identity checking.
{
 const s=screen({profileCreated:true,username:'Nova',authPreview:'signin'});
 assert.equal(s.heading(),'WELCOME BACK.');
 assert.equal(s.field('CONFIRM PASSWORD'),undefined,'signing in does not confirm a password');
 assert.equal(s.input('USERNAME').props.value,'Nova','the known identity is offered');
 assert(s.pressable('ENTER NEXT'));
 assert(s.strings().includes('NEW HERE?'));
 s.type('PASSWORD',SECRET);
 s.type('USERNAME','Someone Else');
 s.tap('ENTER NEXT');
 assert.equal(s.alert(),'No identity by that name on this device.');
 assert.deepEqual(s.navigated,[],'a refused entry goes nowhere');
 s.type('USERNAME','nova');
 s.tap('ENTER NEXT');
 assert.equal(s.alert(),undefined);
 assert.deepEqual(s.dispatched,[],'signing in to an existing identity rewrites nothing');
 s.timings.at(-1).finish({finished:true});
 assert.deepEqual(s.navigated,['/']);
}

// Signing in on a device with no identity explains itself instead of failing silently.
{
 const s=screen({authPreview:'signin'});
 assert.equal(s.heading(),'WELCOME BACK.');
 s.type('USERNAME','Nova');s.type('PASSWORD',SECRET);
 s.tap('ENTER NEXT');
 assert.equal(s.alert(),'This device has no identity yet. Create one to begin.');
 assert.deepEqual(s.navigated,[]);
}

// Mode switching rebuilds the hierarchy and drops anything already typed.
{
 const s=screen();
 s.type('USERNAME','Nova');s.type('PASSWORD',SECRET);s.type('CONFIRM PASSWORD',SECRET);
 s.tap('SIGN IN');
 assert.equal(s.heading(),'WELCOME BACK.');
 assert.equal(s.field('CONFIRM PASSWORD'),undefined);
 assert.deepEqual(s.liveStrings().filter(v=>v.includes(SECRET)),[],'switching modes discards the secrets');
 assert.equal(s.input('USERNAME').props.value,'Nova','the username survives the switch');
 s.tap('CREATE YOUR IDENTITY');
 assert.equal(s.heading(),'CREATE YOUR IDENTITY');
 assert(s.field('CONFIRM PASSWORD'),'confirmation returns with account creation');
}

// Explanations appear only once a field has been left.
{
 const s=screen();
 assert.equal(s.field('USERNAME').props.hint,undefined);
 s.blur('USERNAME');assert.equal(s.field('USERNAME').props.hint,'Your universe needs a name for you.');
 s.type('USERNAME','!');s.blur('USERNAME');assert(s.field('USERNAME').props.hint.startsWith('Use 2–24'));
 s.type('USERNAME','Nova');s.blur('USERNAME');assert.equal(s.field('USERNAME').props.hint,undefined);
 s.blur('PASSWORD');assert.equal(s.field('PASSWORD').props.hint,'8 characters or more.');
}

// Reduce Motion keeps the screen and shortens its departure.
{
 const s=screen({reducedMotion:true});
 s.type('USERNAME','Nova');s.type('PASSWORD',SECRET);s.type('CONFIRM PASSWORD',SECRET);
 s.tap('ENTER YOUR UNIVERSE');
 const depart=s.timings.at(-1);
 assert.equal(depart.config.duration,300);
 depart.finish({finished:true});
 assert.deepEqual(s.navigated,['/']);
}

// State contract: a fresh device is sent to auth, a restored profile is not, reset sends it again.
{
 const {initialExperience,experienceReducer}=require('../src/features/experience/model.ts');
 const {decode}=require('../src/features/product/persistence.ts');
 assert.equal(initialExperience.profileCreated,false,'a fresh device reaches the auth screen');
 const created=experienceReducer(initialExperience,{type:'profile',username:'Nova'});
 assert.equal(created.profileCreated,true);assert.equal(created.username,'Nova');
 assert(!('password' in created)&&!('confirm' in created));
 const saved=JSON.stringify({version:1,revision:1,state:{...created,password:SECRET}});
 assert(saved.includes(SECRET));
 const restored=decode(saved).state;
 assert.equal(restored.profileCreated,true,'a returning launch skips the auth screen');
 assert(!JSON.stringify(restored).includes(SECRET),'no credential survives restoration');
 assert.equal(experienceReducer(created,{type:'reset'}).profileCreated,false,'reset sends it there again');
 assert.equal(experienceReducer(initialExperience,{type:'profile',username:' '}).profileCreated,false);
}

console.log('PASS: dedicated /auth route separate from the cinematic, create/sign-in hierarchies and mode switching, empty/short/mismatch rejection, masked non-autofill secrets, secrets discarded on entry with only the username dispatched, no logging or network from the screen, refused sign-in explained, hint timing, 1100ms departure then handback to the cinematic, Reduce Motion, fresh/restored/reset routing contract. Physical-device keyboard, layout and transition still require Expo Go.');
