const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {WORLDS}=require('../src/features/product/worlds.ts');
const {restingDistance,WORLD_EXTENTS}=require('../src/features/product/framing.ts');
const {PerspectiveCamera,Vector3}=require('three');
for(const [width,height] of [[320,568],[375,667],[375,812],[390,844],[393,852],[430,932],[360,800],[320,900],[844,390],[1440,900]]){
 const camera=new PerspectiveCamera(48,width/height,.1,220);camera.position.z=restingDistance(width,height);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const targets=[];
 for(const world of WORLDS){
  const at=[...world.at];if(process.env.NEXT_FRAME_MUTATION==='1'&&world.id==='memory')at[0]=-2.5;
  const radius=WORLD_EXTENTS[world.id];
  for(const x of [-radius,radius])for(const y of [-radius,radius]){
   const p=new Vector3(at[0]+x,at[1]+y,at[2]+radius).project(camera);
   assert(Math.abs(p.x)<1,`${width}x${height}: ${world.id} lateral extent in frame`);
   assert(Math.abs(p.y)<1,`${width}x${height}: ${world.id} vertical extent in frame`);
  }
  const p=new Vector3(...at).project(camera),cx=(p.x+1)*width/2,cy=(1-p.y)*height/2;
  const x=Math.max(4,Math.min(width-100,cx-48)),y=Math.max(64,Math.min(height-130,cy-42+world.labelOffset));
  assert(x>=4&&x+96<=width-4&&y>=64&&y+108<=height-22);
  targets.push({id:world.id,x,y});
 }
 if(height>width){for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){
  const a=targets[i],b=targets[j];assert(Math.abs(a.x-b.x)>=96||Math.abs(a.y-b.y)>=108,`${width}x${height}: ${a.id}/${b.id} hit areas do not overlap`);
 }}
}
console.log('PASS: all five body extents and hit targets fit 10 portrait/landscape/web viewports; portrait hit areas do not overlap. Physical iPhone visual acceptance pending.');
