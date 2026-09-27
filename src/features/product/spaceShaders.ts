export const surfaceVertex=`varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNormal;
void main(){vLocal=position;vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*p;}`;
const noise=`float hash(vec3 p){p=fract(p*.3183099+vec3(.17,.31,.57));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
export const livingStarFragment=`uniform float time,energy,momentum;varying vec3 vLocal,vWorld,vNormal;
${noise}
void main(){vec3 p=vLocal*6.;float broad=noise3(p+vec3(0,time*.023,0));float cells=noise3(p*3.8+broad);float veins=pow(1.-abs(cells*2.-1.),4.);float heat=.55*broad+.3*cells+.15*veins;
float facing=max(0.,dot(normalize(vNormal),normalize(cameraPosition-vWorld)));
// Momentum widens the hot region and lifts the core, both bounded: never a white blob.
vec3 warm=mix(vec3(.78,.46,.21),vec3(1.48,1.06,.52),smoothstep(.2-momentum*.12,.75-momentum*.20,heat));
warm*=(.78+.22*pow(facing,.3))*(1.+momentum*.22);warm+=vec3(.9,.7,.4)*pow(1.-facing,4.)*(.25+momentum*.14);
gl_FragColor=vec4(warm*energy,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export const haloVertex=`varying vec2 uvH;void main(){uvH=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const haloFragment=`uniform float time,energy,momentum,flare;varying vec2 uvH;
void main(){vec2 p=(uvH-.5)*5.8;float r=length(p),a=atan(p.y,p.x);if(r>2.8)discard;
float t=sin(a*13.+sin(a*7.+time*.09)*1.8+r*5.);float edge=max(0.,r-1.);float inner=exp(-edge*12.)*.32;
// Corona gains structure with momentum; the flare term is a brief, CPU-scheduled lift.
float corona=exp(-edge*(6.-momentum*1.4))*(.025+(.035+momentum*.030)*pow(.5+.5*t,3.));
corona+=exp(-edge*4.)*flare*.045*pow(.5+.5*t,2.);
float haze=exp(-r*r*(.85-momentum*.10))*(.055+momentum*.030);
float power=(inner+corona)*smoothstep(.94,1.03,r)+haze;power*=1.-smoothstep(2.,2.8,r);
gl_FragColor=vec4(vec3(1.,.85,.64)*power*energy,1.);}`;

/** Memory keeps light rather than burning it: a dark body holding what the user preserved. */
export const memoryFragment=`uniform vec3 starPosition,tint;uniform float selected,time,presence,stored;varying vec3 vLocal,vWorld,vNormal;
${noise}
void main(){vec3 n=normalize(vNormal),l=normalize(starPosition-vWorld),v=normalize(cameraPosition-vWorld);
float light=max(0.,dot(n,l));float grain=noise3(vLocal*11.);
float strata=noise3(vLocal*2.6+vec3(0.,grain*.5,0.));float rim=pow(1.-max(0.,dot(n,v)),3.2);
float cells=noise3(vLocal*17.+grain);
// Preserved light: sparse points beneath the surface, present only once memories are kept.
float held=smoothstep(.80,.95,cells)*stored;
float breathe=.72+.28*sin(time*.45+cells*34.);
vec3 body=tint*(.022+light*(.10+smoothstep(.30,.80,strata)*.34));
body+=vec3(1.,.70,.36)*held*breathe*(.45+light*.55);
body+=mix(vec3(.30,.26,.55),vec3(.55,.53,.88),selected)*rim*(.30+light*.50+selected*.28);
body+=vec3(.32,.22,.44)*rim*rim*.24;
gl_FragColor=vec4(body*presence,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export const planetFragment=`uniform vec3 starPosition,tint;uniform float selected,time,presence;varying vec3 vLocal,vWorld,vNormal;
${noise}
void main(){vec3 n=normalize(vNormal),l=normalize(starPosition-vWorld),v=normalize(cameraPosition-vWorld);float light=max(0.,dot(n,l));float grain=noise3(vLocal*9.);float terrain=noise3(vLocal*3.4+grain*.4);float rim=pow(1.-max(0.,dot(n,v)),3.8);float crust=smoothstep(.28,.72,terrain);vec3 base=tint*(.035+light*(.15+crust*.67));base+=vec3(1.,.83,.58)*pow(light,3.)*.08;base+=mix(vec3(.16,.24,.34),vec3(.55,.66,.77),selected)*rim*(.24+light*.72+selected*.3);gl_FragColor=vec4(base*presence,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
