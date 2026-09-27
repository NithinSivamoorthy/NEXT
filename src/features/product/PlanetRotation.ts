/** Direct manipulation is independent of the camera. Values live outside React renders. */
export class PlanetRotation {
 x=0;y=0;private vx=0;private vy=0;private down=false;private idle=true;private lastX=0;private lastY=0;private stamp=0;
 begin(x:number,y:number,now=Date.now()){this.down=true;this.idle=true;this.lastX=x;this.lastY=y;this.stamp=now;this.vx=this.vy=0;}
 move(x:number,y:number,now=Date.now()){
  if(!this.down)return;const dt=Math.max(.016,Math.min(.1,(now-this.stamp)/1000));
  const dx=Math.max(-.22,Math.min(.22,(x-this.lastX)*.008)),dy=Math.max(-.16,Math.min(.16,(y-this.lastY)*.006));
  this.y+=dx;this.x=Math.max(-.65,Math.min(.65,this.x+dy));this.vx=Math.max(-1.2,Math.min(1.2,dy/dt));this.vy=Math.max(-1.8,Math.min(1.8,dx/dt));this.lastX=x;this.lastY=y;this.stamp=now;
 }
 release(){this.down=false;if(Date.now()-this.stamp>100)this.vx=this.vy=0;}
 cancel(){this.down=false;this.idle=false;this.vx=this.vy=0;}
 step(dt:number,reduced:boolean){if(reduced){this.vx=this.vy=0;return;}if(this.down)return;dt=Math.min(dt,.05);this.x=Math.max(-.65,Math.min(.65,this.x+this.vx*dt));this.y+=this.vy*dt+(this.idle?dt*.012:0);const decay=Math.exp(-dt*5);this.vx*=decay;this.vy*=decay;this.y%=Math.PI*2;}
 nudge(direction:number){this.y+=direction*.15;this.vx=this.vy=0;}
}
