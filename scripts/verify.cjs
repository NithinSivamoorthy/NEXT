// Uses the installed TypeScript compiler; no test dependencies or application hooks.
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
global.__DEV__=false;
const {experienceReducer:reduce,initialExperience,completeAnswers}=require('../src/features/experience/model.ts');
const {decode}=require('../src/features/product/persistence.ts');
const {generateNext,validContent,localNext}=require('../src/features/product/next.ts');
const answers={movingFrom:'Putting off work',reason:'More time with family',progressVision:'Finishing one task calmly',dailyCommitment:15,challengeLevel:'balanced'};
(async()=>{
 let state=initialExperience;
 for(const [field,value] of Object.entries(answers))state=reduce(state,{type:'answer',field,value});
 assert.deepEqual(completeAnswers(state.answers),answers);
 for(const dailyCommitment of [5,15,30,60])for(const challengeLevel of ['gentle','balanced','push'])assert(validContent(localNext({...answers,dailyCommitment,challengeLevel}),dailyCommitment));
 delete process.env.EXPO_PUBLIC_NEXT_API_URL;
 const generated=await generateNext(answers);assert.equal(generated.source,'local');
 state=reduce(state,{type:'generated',value:generated});assert.equal(state.onboardingComplete,true);
 assert.equal(reduce(state,{type:'complete-next',id:generated.id}),state);
 state=reduce(state,{type:'begin-next',id:generated.id});assert.equal(state.currentNext.status,'active');
 const active=decode(JSON.stringify({version:1,revision:1,state}));assert.equal(active.state.currentNext.status,'active');
 state=reduce(state,{type:'complete-next',id:generated.id,at:'2026-09-27T10:00:00Z'});assert.equal(state.history.length,1);assert.equal(state.currentNext,null);
 assert.equal(reduce(state,{type:'complete-next',id:generated.id}),state);
 assert.deepEqual(decode(JSON.stringify({version:1,revision:2,state})).state,state);
 assert.equal(decode('{bad'),null);assert.equal(decode(JSON.stringify({version:1,revision:3,state:{...state,answers:{...answers,dailyCommitment:999}}})),null);
 assert.equal(decode(JSON.stringify({version:1,revision:3,state:{...state,history:[generated]}})),null);
 assert.deepEqual(reduce(state,{type:'reset'}),initialExperience);
 const {validUsername}=require('../src/features/product/profile.ts');
 assert(validUsername('Nova'));assert(!validUsername(' '));assert(!validUsername('a'));assert(!validUsername('x'.repeat(25)));
 const profile=reduce(state,{type:'profile',username:' Nova '});assert.equal(profile.username,'Nova');assert.equal(profile.profileCreated,true);assert.equal(profile.history.length,1);
 assert.equal(decode(JSON.stringify({version:1,revision:4,state:profile})).state.username,'Nova');
 const legacy={...state};delete legacy.username;delete legacy.profileCreated;
 const migrated=decode(JSON.stringify({version:1,revision:5,state:legacy}));assert.equal(migrated.state.username,'Traveler');assert.equal(migrated.state.onboardingComplete,true);assert.deepEqual(migrated.state.history,state.history);
 assert.equal(reduce(profile,{type:'reset'}).profileCreated,false);
 assert(!('password' in profile));

 // Expansion: old saves, credential stripping, user-authored memories/capsules and rotation.
 const oldSave={...profile};delete oldSave.capsules;
 assert.deepEqual(decode(JSON.stringify({version:1,revision:6,state:oldSave})).state.capsules,[]);
 const imported={...profile,password:'DISCARD_ME',answers:{...profile.answers,password:'DISCARD_ME'}};
 assert(!JSON.stringify(decode(JSON.stringify({version:1,revision:7,state:imported}))).includes('DISCARD_ME'));
 let memoryState=reduce(initialExperience,{type:'generated',value:generated});
 memoryState=reduce(memoryState,{type:'begin-next',id:generated.id});
 assert.equal(reduce(memoryState,{type:'complete-next',id:generated.id,photoUri:'https://remote.test/photo'}),memoryState);
 memoryState=reduce(memoryState,{type:'complete-next',id:generated.id,memory:' I took a quiet step. ',photoUri:'file:///local/demo-photo.jpg',at:'2026-09-27T12:00:00Z'});
 assert.equal(memoryState.history[0].memory,'I took a quiet step.');
 const capsule={id:'capsule-test',text:' Keep going. ',createdAt:'2026-09-27T12:00:00Z',nextId:generated.id};
 memoryState=reduce(memoryState,{type:'seal-capsule',value:capsule});
 assert.equal(memoryState.capsules[0].text,'Keep going.');
 assert.equal(reduce(memoryState,{type:'seal-capsule',value:capsule}),memoryState);
 assert.equal(reduce(memoryState,{type:'seal-capsule',value:{...capsule,id:'other',nextId:'missing'}}),memoryState);
 assert.equal(reduce(memoryState,{type:'seal-capsule',value:{...capsule,id:'empty',text:'  '}}),memoryState);
 // Populate valid answers so the completed-onboarding save satisfies the existing contract.
 memoryState={...memoryState,answers};
 assert.deepEqual(decode(JSON.stringify({version:1,revision:8,state:memoryState})).state,memoryState);
 assert.equal(reduce(memoryState,{type:'reset'}).capsules.length,0);
 const {PlanetRotation}=require('../src/features/product/PlanetRotation.ts');
 const rotation=new PlanetRotation();rotation.begin(0,0);rotation.move(10000,10000);assert(rotation.x<=.65);assert(rotation.y<=.22);rotation.release();rotation.step(.016,false);assert(Number.isFinite(rotation.y));rotation.cancel();const stopped=rotation.y;rotation.step(1,false);assert.equal(rotation.y,stopped);
 rotation.begin(0,0);rotation.move(20,10);rotation.release();const direct=rotation.y;rotation.step(.05,true);assert.equal(rotation.y,direct);

 process.env.EXPO_PUBLIC_NEXT_API_URL='http://mock';
 const originalFetch=global.fetch;
 global.fetch=async()=>({ok:true,json:async()=>localNext(answers)});assert.equal((await generateNext(answers)).source,'gemini');
 for(const mock of [async()=>{throw Error('offline');},async()=>({ok:false}),async()=>({ok:true,json:async()=>({bad:true})})]){global.fetch=mock;assert.equal((await generateNext(answers)).source,'local');}
 global.fetch=(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout'))));
 const start=Date.now();assert.equal((await generateNext(answers)).source,'local');assert(Date.now()-start>=9900);
 const cancel=new AbortController();cancel.abort();await assert.rejects(()=>generateNext(answers,cancel.signal));global.fetch=originalFetch;
 const {generate,validAnswers}=await import('../server/gemini.mjs');assert(validAnswers(answers));assert(!validAnswers({...answers,reason:''}));
 let request;
 const value=await generate(answers,{key:'TEST_ONLY',fetcher:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(localNext(answers))}]}}]})};}});
 assert(validContent(value));assert(request.url.includes('gemini-3.5-flash-lite'));assert.equal(request.options.headers['x-goog-api-key'],'TEST_ONLY');assert(JSON.parse(request.options.body).generationConfig.responseFormat.text.schema);assert.equal(JSON.parse(request.options.body).generationConfig.responseFormat.text.mimeType,'APPLICATION_JSON');
 await assert.rejects(()=>generate(answers,{key:'TEST_ONLY',fetcher:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"title":"bad"}'}]}}]})})}));
 console.log('PASS: profile migration, credential stripping, memory/capsule validation and restoration, bounded rotation, answer reuse, fallback constraints, lifecycle, duplicate prevention, restoration, corruption, reset, Gemini contract/validation, offline/invalid/timeout fallback, cancellation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
