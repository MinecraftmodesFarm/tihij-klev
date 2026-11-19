(function(){
'use strict';
const $=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t,rnd=(a,b)=>a+Math.random()*(b-a);
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const hash=(x,y)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h)};
function vn(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return lerp(lerp(hash(ix,iy),hash(ix+1,iy),u),lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v)}
function fbm(x,y){let s=0,a=.5;for(let i=0;i<4;i++){s+=a*vn(x,y);x*=2.03;y*=2.03;a*=.5}return s}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ---------- водоёмы ---------- */
const LOCS=[
{id:'river',code:'R',h0:9,name:'Лесная река',desc:'Течение, сосны, плотва и голавль',top:0x5f9bd0,hor:0xdde9ee,sun:[-.5,.38,-.8],sunCol:0xfff0cf,cloud:.55,fog:0xcfdfe5,fogD:.0075,deep:0x1d4547,shal:0x4a7b68,flow:[1,0],cur:.35,
 grass:[.28,.44,.17],grass2:[.4,.55,.21],hemi:[0xbcd8f0,0x4a5a38,.95],sunI:1.0,pine:130,birch:80,reeds:240,lilies:0,fireflies:0,
 fish:[['roach',9],['perch',6],['chub',5],['bream',4],['pike',3],['catfish',1]],P:{x:0,z:0,deck:null}},
{id:'lake',code:'L',h0:13,name:'Хрустальное озеро',desc:'Помост, остров, лещ и карп',top:0x3f86c9,hor:0xcfe3f2,sun:[.45,.55,-.7],sunCol:0xfff6dc,cloud:.4,fog:0xc4dcec,fogD:.006,deep:0x0e3a5e,shal:0x2f7f93,flow:[0,0],cur:0,
 grass:[.33,.5,.2],grass2:[.45,.58,.25],hemi:[0xcfe6ff,0x55633f,1],sunI:1.1,pine:110,birch:60,reeds:240,lilies:60,fireflies:0,
 fish:[['carp',6],['bream',7],['roach',8],['perch',5],['pike',3],['catfish',1]],P:{x:0,z:-7,deck:.95}},
{id:'pond',code:'P',h0:18.7,name:'Закатная заводь',desc:'Кувшинки, тишина, карась и сом',top:0x6a4f8c,hor:0xffb878,sun:[-.2,.1,-1],sunCol:0xffa24d,cloud:.7,fog:0xe8b58a,fogD:.0085,deep:0x2a3a3a,shal:0x58623f,flow:[0,0],cur:0,
 grass:[.3,.38,.14],grass2:[.42,.45,.17],hemi:[0xffc79a,0x4a4030,.85],sunI:1.25,pine:60,birch:110,reeds:420,lilies:230,fireflies:1,
 fish:[['crucian',10],['carp',5],['perch',4],['pike',3],['catfish',2]],P:{x:0,z:0,deck:null}}];
LOCS.push(
{id:'rapids',code:'B',h0:8,name:'Каменный перекат',desc:'Быстрая вода, валуны и речной усач',top:0x5388ad,hor:0xc7d7d4,sun:[-.6,.3,-.7],sunCol:0xffebc3,cloud:.35,fog:0xb8c9c4,fogD:.008,deep:0x25434b,shal:0x52766a,flow:[1,.15],cur:.72,grass:[.3,.36,.2],grass2:[.42,.47,.23],hemi:[0xc3d7e5,0x4b5040,.9],sunI:1.05,pine:80,birch:45,reeds:130,lilies:0,fireflies:0,P:{x:0,z:0,deck:null}},
{id:'marsh',code:'M',h0:17,name:'Тихое болото',desc:'Камышовые заводи, туман и хищная щука',top:0x668d8c,hor:0xc9d2c2,sun:[-.35,.25,-.8],sunCol:0xffe6b1,cloud:.72,fog:0xb5c4b1,fogD:.012,deep:0x243b35,shal:0x526447,flow:[.2,.1],cur:.08,grass:[.28,.36,.18],grass2:[.38,.46,.2],hemi:[0xc9d7c8,0x414838,.75],sunI:.8,pine:45,birch:90,reeds:520,lilies:160,fireflies:1,P:{x:0,z:0,deck:null}},
{id:'reservoir',code:'S',h0:11,name:'Сосновое водохранилище',desc:'Глубокая гладь под соснами, судак и белый амур',top:0x4d91bd,hor:0xd3e4e6,sun:[.35,.5,-.75],sunCol:0xfff1d0,cloud:.3,fog:0xc1d5d7,fogD:.0055,deep:0x12374c,shal:0x39716c,flow:[.1,0],cur:.04,grass:[.29,.43,.2],grass2:[.4,.53,.24],hemi:[0xd0e6f0,0x4e5e45,1],sunI:1.12,pine:190,birch:35,reeds:100,lilies:25,fireflies:0,P:{x:0,z:0,deck:null}},
{id:'north',code:'N',h0:7,name:'Северное озеро',desc:'Холодная вода, гранитный берег и арктический голец',top:0x6694b5,hor:0xd3e0e5,sun:[-.2,.42,-.8],sunCol:0xf5f2e7,cloud:.58,fog:0xc4d0d5,fogD:.007,deep:0x16344b,shal:0x52717b,flow:[0,0],cur:0,grass:[.31,.38,.29],grass2:[.4,.47,.32],hemi:[0xd5e1e9,0x50564f,.9],sunI:.88,pine:85,birch:25,reeds:70,lilies:0,fireflies:0,P:{x:0,z:0,deck:null}},
{id:'peatland',code:'T',h0:19,name:'Торфяная топь',desc:'Тёмные омуты, ряска и ночной клёв',top:0x5b7667,hor:0xb5b39a,sun:[-.4,.18,-.9],sunCol:0xffc982,cloud:.82,fog:0xa9ad8e,fogD:.013,deep:0x222f2a,shal:0x414d39,flow:[0,0],cur:0,grass:[.32,.37,.16],grass2:[.41,.44,.18],hemi:[0xc0c7ae,0x393d2d,.72],sunI:.76,pine:35,birch:75,reeds:600,lilies:190,fireflies:1,P:{x:0,z:0,deck:null}},
{id:'mountain',code:'G',h0:10,name:'Горное озеро',desc:'Прозрачная глубина, каменистое дно и махсир',top:0x568cb6,hor:0xd8e8ed,sun:[.5,.4,-.7],sunCol:0xfff4d8,cloud:.25,fog:0xc5dce2,fogD:.005,deep:0x0d3553,shal:0x428090,flow:[.05,.1],cur:.12,grass:[.3,.42,.25],grass2:[.39,.51,.29],hemi:[0xd9e9ee,0x545e48,1],sunI:1.18,pine:100,birch:20,reeds:80,lilies:0,fireflies:0,P:{x:0,z:0,deck:null}},
{id:'lagoon',code:'C',h0:16,name:'Южная лагуна',desc:'Тёплые протоки, кувшинки и яркая тропическая рыба',top:0x5b9eb5,hor:0xf0d6aa,sun:[-.3,.35,-.85],sunCol:0xffd18a,cloud:.42,fog:0xd8c6a5,fogD:.009,deep:0x174c55,shal:0x4b8975,flow:[.4,.05],cur:.2,grass:[.34,.4,.19],grass2:[.46,.5,.22],hemi:[0xf0dfc5,0x514735,.96],sunI:1.28,pine:20,birch:135,reeds:300,lilies:140,fireflies:0,P:{x:-34,z:0,deck:null}}
);
const H={
river(x,z){const zc=-40+7*Math.sin(x*.025)+3*Math.sin(x*.07+1),hw=30+5*Math.sin(x*.03+2),t=Math.abs(z-zc)/hw;
 let h=lerp(-3,1.1,sstep(.72,1.02,t));const far=sstep(1.1,3.5,t);
 h+=far*(fbm(x*.01+3,z*.01)*40-6)+(1-far)*sstep(1,1.3,t)*fbm(x*.06,z*.06)*1.4;
 const d=Math.hypot(x,z);if(h>0)h=lerp(h,Math.max(h,1.25),1-sstep(2,8,d));return h},
lake(x,z){const d=Math.hypot(x,(z+58)*.9);let h=lerp(-4,1.2,sstep(44,56,d));
 const di=Math.hypot(x+16,z+42);h=Math.max(h,lerp(-3,1.9,1-sstep(3,12,di)));
 h+=sstep(52,150,d)*(fbm(x*.008,z*.008+5)*55-4)+sstep(48,60,d)*fbm(x*.07,z*.07)*.8;return h},
pond(x,z){let d=Math.hypot(x/1.35,z+37)+fbm(x*.05,z*.05)*6;let h=lerp(-2.6,1.05,sstep(26,34,d));
 h+=sstep(36,100,d)*(fbm(x*.012,z*.012+9)*32-3);return h},
 rapids(x,z){const bed=-39+5*Math.sin(x*.04)+2*Math.sin(x*.11),bank=13+2*Math.sin(x*.07+1),d=Math.abs(z-bed)/bank;
  return lerp(-3.8,1.35,sstep(.82,1.12,d))+sstep(1.1,3,d)*(fbm(x*.025,z*.025+2)*13-3)},
 marsh(x,z){const d=Math.hypot((x+7)/1.2,z+38)+fbm(x*.045,z*.045)*3;let h=lerp(-1.9,.95,sstep(23,32,d));
  h+=sstep(31,60,d)*(fbm(x*.018,z*.018+4)*8-2);return h},
 reservoir(x,z){const d=Math.hypot(x*.84,(z+43)*1.12)+Math.sin(x*.08)*1.4;let h=lerp(-5.4,1.25,sstep(31,43,d));
  const island=Math.hypot(x-11,(z+42)*.9);h=Math.max(h,lerp(-2.8,2.1,1-sstep(4,11,island)));
  h+=sstep(46,110,d)*(fbm(x*.012,z*.012+8)*18-3);return h},
 north(x,z){const d=Math.hypot((x-3)*1.08,z+39)+fbm(x*.035,z*.035+7)*2;let h=lerp(-6.2,1.4,sstep(24,38,d));
  h+=sstep(39,90,d)*(fbm(x*.02,z*.02+12)*12-1.5);return h},
 peatland(x,z){const d=Math.hypot(x/1.25,z+36)+Math.sin(x*.12+z*.03)*2+fbm(x*.04,z*.04)*2;let h=lerp(-2.5,.9,sstep(25,34,d));
  h+=sstep(34,75,d)*(fbm(x*.025,z*.025+16)*6-1.2);return h},
 mountain(x,z){const d=Math.hypot(x*.92,(z+41)*1.08)+Math.sin(Math.atan2(z+41,x)*5)*2;let h=lerp(-7.5,1.45,sstep(28,43,d));
  const island=Math.hypot(x+15,z+41);h=Math.max(h,lerp(-3.4,2.8,1-sstep(5,13,island)));
  h+=sstep(47,105,d)*(fbm(x*.025,z*.025+21)*20+2);return h},
 lagoon(x,z){const channel=Math.abs(x-(8*Math.sin(z*.035)-5)),bank=24+3*Math.sin(z*.06),d=channel/bank;
  let h=lerp(-3.2,1.1,sstep(.8,1.08,d));h+=sstep(1.1,2.6,d)*(fbm(x*.02,z*.02+25)*9-2);
  const inlet=Math.hypot(x+22,z+28);h=Math.min(h,lerp(h,-2.4,1-sstep(14,24,inlet)));return h}
};

/* ---------- звук (мягкий, синтез) ---------- */
const AUD={ctx:null,on:true,init(){if(this.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;const c=this.ctx=new C();this.m=c.createGain();this.m.gain.value=this.on?.7:0;this.m.connect(c.destination);
 const len=c.sampleRate*2,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;l=(l+.04*w)/1.04;d[i]=l*9}this.nb=b;
 const amb=(f,q,g,lf)=>{const s=c.createBufferSource();s.buffer=b;s.loop=true;const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;const ga=c.createGain();ga.gain.value=g;s.connect(fl);fl.connect(ga);ga.connect(this.m);s.start();if(lf){const o=c.createOscillator();o.frequency.value=lf;const og=c.createGain();og.gain.value=g*.6;o.connect(og);og.connect(ga.gain);o.start()}};
 amb(700,.5,.05,.13);amb(250,.4,.04,.05);this.bird();this.music()}catch(e){this.ctx=null}},
bird(){if(!this.ctx)return;const c=this.ctx,n=2+(Math.random()*3|0);let t=c.currentTime+.05;const f0=rnd(2400,4200);for(let i=0;i<n;i++){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*rnd(.7,1.35),t+.09);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.11);o.connect(g);g.connect(this.m);o.start(t);o.stop(t+.13);t+=.13}setTimeout(()=>this.bird(),rnd(3000,9000))},
noise(f,q,g,dur,f2){if(!this.ctx)return;const c=this.ctx,s=c.createBufferSource();s.buffer=this.nb;const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.setValueAtTime(f,c.currentTime);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,c.currentTime+dur);fl.Q.value=q;const ga=c.createGain();ga.gain.setValueAtTime(0,c.currentTime);ga.gain.linearRampToValueAtTime(g,c.currentTime+.012);ga.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);s.connect(fl);fl.connect(ga);ga.connect(this.m);s.start();s.stop(c.currentTime+dur+.05)},
tone(f,f2,g,dur,type,delay){if(!this.ctx)return;const c=this.ctx,t=c.currentTime+(delay||0),o=c.createOscillator(),ga=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);ga.gain.setValueAtTime(0,t);ga.gain.linearRampToValueAtTime(g,t+.01);ga.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(ga);ga.connect(this.m);o.start(t);o.stop(t+dur+.05)},
splash(){this.noise(1800,.7,.3,.4,700)},cast(){this.noise(500,1,.1,.4,2200)},plop(){this.tone(620,200,.25,.16)},tick(){this.noise(3200,3,.05,.03)},snap(){this.noise(2500,.6,.3,.25)},
win(){[523,659,784,1047].forEach((f,i)=>this.tone(f,0,.13,.5,'triangle',i*.11))},
mute(v){this.on=v;if(this.m)this.m.gain.value=v?.7:0}};

/* ---------- музыка: генеративный лоу-фай ---------- */
AUD.musOn=store.get('tk_mus',true);
AUD.music=function(){const c=this.ctx;if(!c||this.mb)return;
 const bus=this.mb=c.createGain();bus.gain.value=this.musOn?.9:0;const lp=this.mf=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;lp.Q.value=.4;bus.connect(lp);lp.connect(this.m);
 const len=c.sampleRate*2.4,ib=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=ib.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4)}
 const cv=c.createConvolver();cv.buffer=ib;const wet=c.createGain();wet.gain.value=.38;lp.connect(cv);cv.connect(wet);wet.connect(this.m);
 const dl=c.createDelay(1);dl.delayTime.value=.405;const fb=c.createGain();fb.gain.value=.38;const dlp=c.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=1800;const dg=c.createGain();dg.gain.value=.5;
 dl.connect(dlp);dlp.connect(fb);fb.connect(dl);dlp.connect(dg);dg.connect(bus);
 const m2f=n=>440*Math.pow(2,(n-69)/12),BPM=74,sd=60/BPM/4,CH=[[48,52,55,59,62],[45,48,52,55,59],[41,45,48,52,55],[43,47,53,57,64]],PENT=[72,74,76,79,81,84,79,76];
 const env=(g,t,a,d,v)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0008,t+a+d)};
 const osc=(f,t,a,d,v,type,out,det)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;env(g,t,a,d,v);o.connect(g);g.connect(out||bus);o.start(t);o.stop(t+a+d+.1)};
 const nz=(t,f,q,v,d,type)=>{const s=c.createBufferSource();s.buffer=this.nb;const fl=c.createBiquadFilter();fl.type=type||'bandpass';fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();env(g,t,.002,d,v);s.connect(fl);fl.connect(g);g.connect(bus);s.start(t);s.stop(t+d+.05)};
 let step=0,next=c.currentTime+.2;
 const play=(i,t)=>{const bar=Math.floor(i/16)%4,s=i%16,ch=CH[bar],sw=(s%2)?sd*.22:0,T=t+sw;
  if(s===0)ch.forEach((n,k)=>{osc(m2f(n),T,.5,3.4,.034,'triangle',bus,k*4-8);osc(m2f(n+12),T,.8,3.2,.012,'sine',bus,6)});
  if(s===0||s===10)osc(m2f(ch[0]-12),T,.01,.55,.17,'sine');
  if(s===0||s===10){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,T);o.frequency.exponentialRampToValueAtTime(42,T+.14);env(g,T,.004,.2,.34);o.connect(g);g.connect(bus);o.start(T);o.stop(T+.3)}
  if(s===4||s===12)nz(T,1900,.7,.11,.13);
  if(s%2===0)nz(T,7500,1.2,.012+Math.random()*.018,.05,'highpass');
  if(s%2===0&&Math.random()<.34){const n=PENT[(Math.random()*PENT.length)|0]+(bar===3&&Math.random()<.3?-3:0),f=m2f(n),o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=f;env(g,T,.015,.9,.07);o.connect(g);g.connect(bus);g.connect(dl);o.start(T);o.stop(T+1)}};
 this.mt=setInterval(()=>{if(!this.ctx)return;while(next<c.currentTime+.3){play(step,next);next+=sd;step++}},80)};
AUD.setMusic=function(v){this.musOn=v;store.set('tk_mus',v);if(this.mb)this.mb.gain.value=v?.9:0};

/* ---------- сцена ---------- */
const stage=$('stage');
const renderer=new THREE.WebGLRenderer({antialias:true});
const QS=[
 {n:'Низкая',pr:.75,seg:96,d:.35,f:.45,shadows:false,water:1,effects:.45},
 {n:'Средняя',pr:1.25,seg:150,d:.7,f:.75,shadows:true,water:1,effects:.75},
 {n:'Высокая',pr:1.75,seg:220,d:1,f:1,shadows:true,water:2,effects:1},
 {n:'Ультра',pr:2,seg:300,d:1.25,f:1.25,shadows:true,water:3,effects:1.25}
];let Q=store.get('tk_q',1);if(!QS[Q])Q=1;
renderer.setPixelRatio(Math.min(devicePixelRatio||1,QS[Q].pr));stage.appendChild(renderer.domElement);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=QS[Q].shadows;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(60,1,.1,1500);camera.rotation.order='YXZ';scene.add(camera);
const hemi=new THREE.HemisphereLight(0xffffff,0x556644,1),sunL=new THREE.DirectionalLight(0xffffff,1);scene.add(hemi,sunL,sunL.target);
sunL.castShadow=QS[Q].shadows;
sunL.shadow.mapSize.set(Q===3?2048:1024,Q===3?2048:1024);
sunL.shadow.camera.left=-90;
sunL.shadow.camera.right=90;
sunL.shadow.camera.top=90;
sunL.shadow.camera.bottom=-90;
sunL.shadow.camera.near=.5;
sunL.shadow.camera.far=260;
sunL.shadow.bias=-0.00025;
const CV=c=>new THREE.Color(c);
const skyU={top:{value:CV(0)},hor:{value:CV(0)},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:CV(0)},cloud:{value:.5},time:{value:0},night:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,24,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
fragmentShader:`uniform vec3 top,hor,sunDir,sunCol;uniform float cloud,time,night;varying vec3 vP;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
void main(){vec3 d=normalize(vP);float y=max(d.y,0.);vec3 c=mix(hor,top,pow(y,.5));float s=max(dot(d,sunDir),0.);
c+=sunCol*(pow(s,700.)*3.+pow(s,14.)*.3+pow(s,3.)*.1);
vec2 uv=d.xz/(d.y+.3)*1.3+vec2(time*.01,0.);float cl=smoothstep(.45,.85,fbm(uv*1.6))*cloud*smoothstep(0.,.2,d.y);
c=mix(c,mix(vec3(1.),hor,.25)*(.75+.25*s)*(1.-night*.85),cl*.8);c+=vec3(step(.9975,h(floor(d.xz/(d.y+.4)*140.)))*night*smoothstep(0.,.3,d.y));if(d.y<0.)c=hor;gl_FragColor=vec4(c,1.);}`}));
sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);
const rip=[new THREE.Vector4(0,0,99,0),new THREE.Vector4(0,0,99,0),new THREE.Vector4(0,0,99,0)];let ripI=0;
const watU={time:{value:0},quality:{value:QS[Q].water},deep:{value:CV(0)},shal:{value:CV(0)},hor:skyU.hor,top:skyU.top,sunDir:skyU.sunDir,sunCol:skyU.sunCol,fogCol:{value:CV(0)},fogD:{value:.007},flow:{value:new THREE.Vector2()},rip:{value:rip}};
const water=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.ShaderMaterial({uniforms:watU,transparent:true,depthWrite:false,
vertexShader:'varying vec3 wp;void main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
fragmentShader:`uniform float time,fogD,quality;uniform vec3 deep,shal,hor,top,sunDir,sunCol,fogCol;uniform vec2 flow;uniform vec4 rip[3];varying vec3 wp;
vec2 wv(vec2 p,vec2 d,float k,float w,float a){return d*k*a*cos(dot(d,p)*k+time*w);}
void main(){vec2 p=wp.xz-flow*time*.6;vec2 g=vec2(0.);
g+=wv(p,normalize(vec2(1.,.3)),.6,1.1,.05);g+=wv(p,normalize(vec2(-.4,1.)),1.3,1.7,.03);
if(quality>.999){g+=wv(p,normalize(vec2(.7,-.8)),2.7,2.3,.015);}
if(quality>1.999){g+=wv(p,normalize(vec2(-1.,-.2)),5.1,3.1,.008);}
for(int i=0;i<3;i++){vec2 q=wp.xz-rip[i].xy;float d=length(q);float r=rip[i].z*2.2;float e=exp(-abs(d-r)*1.6)*exp(-rip[i].z*.8)*rip[i].w;g+=normalize(q+vec2(1e-4))*cos((d-r)*10.)*e*.6;}
vec3 N=normalize(vec3(-g.x,1.,-g.y));vec3 V=cameraPosition-wp;float dist=length(V);V/=dist;
float fr=.03+.9*pow(1.-max(dot(N,V),0.),4.);vec3 R=reflect(-V,N);
vec3 sk=mix(hor,top,pow(clamp(R.y,0.,1.),.5))+sunCol*pow(max(dot(R,sunDir),0.),250.)*1.5;
vec3 c=mix(mix(shal,deep,smoothstep(5.,60.,dist)),sk,fr);float a=clamp(.6+fr*.5+smoothstep(15.,90.,dist)*.35,0.,.98);
float f=1.-exp(-pow(fogD*dist,2.));gl_FragColor=vec4(mix(c,fogCol,f),a);}`}));
water.rotation.x=-Math.PI/2;water.renderOrder=2;scene.add(water);
function ripple(x,z,a){rip[ripI].set(x,z,0,a||1);ripI=(ripI+1)%3}

/* частицы брызг */
const PN=90,pPos=new Float32Array(PN*3),pVel=new Float32Array(PN*3),pLife=new Float32Array(PN);
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffffff,size:.16,transparent:true,opacity:.85,depthWrite:false}));pts.frustumCulled=false;scene.add(pts);
for(let i=0;i<PN;i++)pPos[i*3+1]=-99;let pI=0;
function splash(x,z,n,pw){ripple(x,z,1);for(let k=0;k<n;k++){const i=pI;pI=(pI+1)%PN;pPos[i*3]=x;pPos[i*3+1]=.05;pPos[i*3+2]=z;const a=Math.random()*6.28,s=rnd(.3,1.6)*(pw||1);pVel[i*3]=Math.cos(a)*s;pVel[i*3+1]=rnd(2,4.5)*(pw||1);pVel[i*3+2]=Math.sin(a)*s;pLife[i]=1}}
function updParts(dt){for(let i=0;i<PN;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;pVel[i*3+1]-=9*dt;pPos[i*3]+=pVel[i*3]*dt;pPos[i*3+1]+=pVel[i*3+1]*dt;pPos[i*3+2]+=pVel[i*3+2]*dt;if(pPos[i*3+1]<0||pLife[i]<=0){pLife[i]=0;pPos[i*3+1]=-99}}pg.attributes.position.needsUpdate=true}

/* ---------- мир ---------- */
let world=null,L=LOCS[0],Hf=H.river,P={x:0,y:2.9,z:0},fireflies=null;
const lamb=new THREE.MeshLambertMaterial({vertexColors:true});
 lamb.userData.shared=true;
function disposeObject(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{
 if(o.geometry&&!geometries.has(o.geometry)){geometries.add(o.geometry);o.geometry.dispose()}
 const list=Array.isArray(o.material)?o.material:o.material?[o.material]:[];
 for(const m of list)if(!m.userData.shared&&!materials.has(m)){materials.add(m);if(m.map)m.map.dispose();m.dispose()}
})}
function merge(parts){const A=[],N=[],C=[];for(const pt of parts){let g=pt.g.index?pt.g.toNonIndexed():pt.g;if(pt.m)g=g.clone().applyMatrix4(pt.m);const p=g.attributes.position.array,nn=g.attributes.normal.array;for(let i=0;i<p.length;i++){A.push(p[i]);N.push(nn[i])}for(let i=0;i<p.length/3;i++)C.push(pt.c[0],pt.c[1],pt.c[2])}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(A,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));G.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return G}
const T=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z);
function jit(g,a){g=g.index?g.toNonIndexed():g;const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(hash(x*12.9+z*3.1,y*7.7+x)-.5)*a;p.setXYZ(i,x*k,y*k,z*k)}g.computeVertexNormals();return g}
function inst(geo,count,place,mat){const m=new THREE.InstancedMesh(geo,mat||lamb,count),d=new THREE.Object3D();let k=0,tr=0;
 while(k<count&&tr<count*80){tr++;const r=place();if(!r)continue;d.position.set(r.x,r.y,r.z);d.rotation.set(r.rx||0,Math.random()*6.28,r.rz||0);d.scale.set(r.sx||r.s,r.sy||r.s,r.sz||r.s);d.updateMatrix();m.setMatrixAt(k++,d.matrix)}
 m.count=k;m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;
 m.castShadow=Q>=1&&QS[Q].shadows;
 m.receiveShadow=Q>=1;
 return m}
const dist2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function buildWorld(loc){
 if(world){scene.remove(world);disposeObject(world)}
 L=loc;TOD.h=loc.h0;Hf=H[loc.id];world=new THREE.Group();scene.add(world);fireflies=null;MP.av.clear();
 skyU.top.value.set(L.top);skyU.hor.value.set(L.hor);skyU.sunDir.value.set(...L.sun).normalize();skyU.sunCol.value.set(L.sunCol);skyU.cloud.value=L.cloud;
 watU.deep.value.set(L.deep);watU.shal.value.set(L.shal);watU.fogCol.value.set(L.fog);watU.fogD.value=L.fogD;watU.flow.value.set(L.flow[0]*L.cur,L.flow[1]*L.cur);
 scene.fog=new THREE.FogExp2(L.fog,L.fogD);hemi.color.set(L.hemi[0]);hemi.groundColor.set(L.hemi[1]);hemi.intensity=L.hemi[2];sunL.color.set(L.sunCol);sunL.intensity=L.sunI;sunL.position.copy(skyU.sunDir.value).multiplyScalar(100);
 /* рельеф */
 const g=new THREE.PlaneGeometry(520,520,QS[Q].seg,QS[Q].seg);g.rotateX(-Math.PI/2);g.translate(0,0,-70);const p=g.attributes.position,col=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=Hf(x,z);p.setY(i,h);const sl=Math.abs(Hf(x+1.5,z)-h)+Math.abs(Hf(x,z+1.5)-h),n=fbm(x*.08,z*.08);let c;
  if(h<-.35)c=[.27+n*.06,.25+n*.05,.17];else if(h<.4)c=[.6,.53,.36];else{c=h>16?[.45,.45,.43]:(n>.55?L.grass2:L.grass);const k=(sl>1.6?.62:1)*(.85+n*.3);c=[c[0]*k,c[1]*k,c[2]*k]}
  col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2]}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
 const terrain=new THREE.Mesh(g,lamb);terrain.receiveShadow=Q>=1;world.add(terrain);
 const ok=(x,z,hmin,hmax)=>{const h=Hf(x,z);return h>hmin&&h<hmax?h:null};
 /* деревья */
 const treePart=(geo,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0)=>({g:geo,m:new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz)),c:color});
 const pineParts=[{g:new THREE.CylinderGeometry(.17,.3,7.2,10),m:T(0,3.5,0),c:[.27,.17,.1]}],pineLeaf=new THREE.IcosahedronGeometry(1,1);
 for(const [y,r,h]of[[2.1,2.35,3.2],[3.75,1.95,2.9],[5.3,1.45,2.45],[6.7,.92,2.05]]){
  pineParts.push({g:jit(new THREE.ConeGeometry(r,h,10,3),.12),m:T(0,y,0),c:[.08,.27+Math.random()*.06,.13]});
  for(let j=0;j<4;j++){const a=j*Math.PI/2+y*.2,x=Math.cos(a)*r*.42,z=Math.sin(a)*r*.42;
   pineParts.push(treePart(pineLeaf,x,y-h*.12,z,r*.4,h*.17,r*.38,[.09,.31+Math.random()*.08,.14],.08*Math.sin(a),a,.06*Math.cos(a)))}
 }
 const pineG=merge(pineParts);
 const birchParts=[{g:new THREE.CylinderGeometry(.12,.2,5.4,10),m:T(0,2.65,0),c:[.88,.86,.81]}],birchLeaf=new THREE.IcosahedronGeometry(1,1);
 for(const [x,y,z,s]of[[0,5.3,0,1.8],[1.05,5.9,.45,1.35],[-1,5.8,-.5,1.5],[.25,6.7,.45,1.3],[-.2,4.9,.75,1.1],[.3,7.45,-.15,.85]]){
  birchParts.push(treePart(jit(birchLeaf.clone(),.2),x,y,z,s,s*.8,s*.85,[.34+Math.random()*.1,.54+Math.random()*.08,.19],.1,x*.3,.08));
  if(y<6.2)birchParts.push(treePart(new THREE.CylinderGeometry(.035,.06,1.5,6),x*.5,y-.25,z*.5,.8,1,.8,[.48,.37,.22],z*.22,0,-x*.35))
 }
 const birchG=merge(birchParts);
 const place=()=>{const x=rnd(-220,220),z=rnd(-250,60),h=ok(x,z,1.5,18);if(h===null||Math.hypot(x,z)<14)return null;if(Math.abs(Hf(x+2,z)-h)>1.2)return null;if(fbm(x*.03,z*.03)<.35)return null;const s=rnd(.8,1.7);return{x,y:h-.3,z,s}};
 world.add(inst(pineG,L.pine*QS[Q].d|0,place),inst(birchG,L.birch*QS[Q].d|0,place));
 /* камыш */
 const reedParts=[];for(let i=0;i<8;i++){const a=Math.random()*6.28,r=rnd(0,.5),hh=rnd(1.4,2.3),gg=new THREE.CylinderGeometry(.004,.022,hh,4);const m=new THREE.Matrix4().makeRotationZ(rnd(-.18,.18)).premultiply(T(Math.cos(a)*r,hh/2,Math.sin(a)*r));reedParts.push({g:gg,m,c:[.35,.5,.2]});if(i%3===0)reedParts.push({g:new THREE.CylinderGeometry(.04,.04,.28,6),m:T(Math.cos(a)*r,hh*.8,Math.sin(a)*r),c:[.3,.18,.1]})}
 world.add(inst(merge(reedParts),((L.reeds||240)*QS[Q].d|0),()=>{const x=rnd(-100,100),z=rnd(-120,12),h=ok(x,z,-.9,.1);if(h===null||Math.hypot(x,z)<7)return null;return{x,y:h-.05,z,s:rnd(.7,1.3)}}));
 /* камни */
 world.add(inst(jit(new THREE.IcosahedronGeometry(1,1),.4),50,()=>{const x=rnd(-80,80),z=rnd(-110,15),h=ok(x,z,-1,1.2);if(h===null)return null;const s=rnd(.3,1);return{x,y:h-.1,z,sx:s*1.3,sy:s*.7,sz:s}},new THREE.MeshLambertMaterial({color:0x8a8a82,flatShading:true})));
 /* трава и цветы у игрока */
 const tuft=merge([0,1,2].map(i=>({g:new THREE.ConeGeometry(.05,.5,3),m:new THREE.Matrix4().makeRotationZ((i-1)*.35).premultiply(T((i-1)*.07,.22,0)),c:[.3+i*.05,.5,.2]})));
 world.add(inst(tuft,900*QS[Q].d|0,()=>{const x=rnd(-45,45),z=rnd(-20,45),h=ok(x,z,.45,3);if(h===null)return null;return{x,y:h-.02,z,s:rnd(.8,1.6)}}));
 const fl=merge([{g:new THREE.SphereGeometry(.07,6,4),m:T(0,.35,0),c:[1,1,1]}]);
 world.add(inst(fl,((L.id==='pond'||L.id==='peatland'?250:140)*QS[Q].d|0),()=>{const x=rnd(-40,40),z=rnd(-15,40),h=ok(x,z,.5,3);if(h===null)return null;return{x,y:h,z,s:rnd(.8,1.3)}},new THREE.MeshLambertMaterial({color:L.id==='pond'||L.id==='peatland'?0xffd0e0:0xfff3a0})));
 /* кувшинки */
 if(L.lilies){const pad=new THREE.CircleGeometry(.65,14,0,5.5);pad.rotateX(-Math.PI/2);
  world.add(inst(pad,L.lilies,()=>{const x=rnd(-60,60),z=rnd(-70,0),h=ok(x,z,-2.4,-.5);if(h===null||Math.hypot(x,z)<8)return null;const s=rnd(.6,1.4);return{x,y:.03,z,s,sy:1}},new THREE.MeshLambertMaterial({color:0x2f6b2a,side:THREE.DoubleSide})))}
 /* помост */
 if(L.P.deck){const w=new THREE.Group(),pm=new THREE.MeshLambertMaterial({color:0x8b6b43}),pd=new THREE.MeshLambertMaterial({color:0x4d3a24});
  for(let z=4;z>-8.5;z-=.3){const b=new THREE.Mesh(new THREE.BoxGeometry(1.9,.08,.27),pm);b.position.set(0,L.P.deck,z);w.add(b)}
  for(let z=3.5;z>-9;z-=2.4)for(const sx of[-.85,.85]){const q=new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,6,8),pd);q.position.set(sx,L.P.deck-2.9,z);w.add(q)}
  world.add(w)}
 if(L.fireflies){const n=60,fp=new Float32Array(n*3),fg=new THREE.BufferGeometry();for(let i=0;i<n;i++){fp[i*3]=rnd(-25,25);fp[i*3+1]=rnd(.5,3);fp[i*3+2]=rnd(-30,10)}fg.setAttribute('position',new THREE.BufferAttribute(fp,3));
  fireflies=new THREE.Points(fg,new THREE.PointsMaterial({color:0xffee88,size:.22,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));fireflies.frustumCulled=false;world.add(fireflies)}
 P.x=L.P.x;P.z=L.P.z;P.y=(L.P.deck!==null?L.P.deck:Hf(P.x,P.z))+1.7;
}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

/* ---------- день и ночь ---------- */
const TOD={h:9,mode:store.get('tk_tm','auto')};
const NT=CV(0x070c22),NH=CV(0x1b2a4a),DU=CV(0xff8f55),MC=CV(0xa9c0ff),_c=CV(0);
const lantern=new THREE.PointLight(0xffd9a0,0,22);lantern.position.set(0,.3,0);camera.add(lantern);
function applyTime(dt){
 if(TOD.mode==='auto')TOD.h=(TOD.h+dt/45)%24;else TOD.h=TOD.mode==='day'?13:TOD.mode==='night'?23.5:(TOD.fix||12);
 const a=(TOD.h-6)/24*Math.PI*2,el=Math.sin(a),day=sstep(-.14,.3,el),night=1-day,dusk=Math.max(0,1-Math.abs(el)*3.2)*(1-night*.6),az=Math.hypot(L.sun[0],L.sun[2])||1,cs=Math.sqrt(1-el*el),sg=el>=0?1:-1;
 skyU.top.value.copy(NT).lerp(_c.set(L.top),day);skyU.hor.value.copy(NH).lerp(_c.set(L.hor),day);skyU.hor.value.lerp(DU,dusk*.5);skyU.night.value=night*.95;
 skyU.sunDir.value.set(L.sun[0]/az*cs*sg,Math.abs(el),L.sun[2]/az*cs*sg).normalize();
 skyU.sunCol.value.set(L.sunCol).lerp(DU,dusk*.5).lerp(MC,night);
 hemi.color.set(L.hemi[0]).lerp(NH,night*.8);hemi.groundColor.set(L.hemi[1]).multiplyScalar(.35+.65*day);hemi.intensity=L.hemi[2]*(.3+.7*day);
 sunL.color.copy(skyU.sunCol.value);sunL.intensity=L.sunI*(el>0?day:.28*night);sunL.position.copy(skyU.sunDir.value).multiplyScalar(100);
 watU.deep.value.set(L.deep).multiplyScalar(.2+.8*day);watU.shal.value.set(L.shal).multiplyScalar(.2+.8*day);watU.fogCol.value.copy(skyU.hor.value);scene.fog.color.copy(skyU.hor.value);
 lantern.intensity=night*1.4;if(AUD.mf)AUD.mf.frequency.value=900+2400*day}

/* ---------- рыбы: 50 видов ---------- */
const ARCH={A:{hr:.30,tr:.16,a:1.5,fork:1},B:{hr:.27,tr:.17,a:1.4,fork:0},C:{hr:.17,tr:.14,a:1.0,fork:0,sn:.06},D:{hr:.42,tr:.17,a:1.4,fork:0},E:{hr:.44,tr:.15,a:1.5,fork:1},F:{hr:.33,tr:.22,a:1.4,fork:0},G:{hr:.2,tr:.26,a:1.2,fork:0,whisk:1},H:{hr:.27,tr:.2,a:1.4,fork:1},I:{hr:.09,tr:.09,a:1.0,fork:0},J:{hr:.16,tr:.2,a:1.1,fork:1,sn:.12},K:{hr:.22,tr:.15,a:1.3,fork:1},L:{hr:.26,tr:.22,a:1.2,fork:1}};
const PAL={silv:['#5f7f78','#bcc9ca','#eef2ee',0xe0583d],green:['#3d5a2a','#a9b447','#eee9b8',0xe5502f],sand:['#7a6a44','#c9b98a','#f0e8d0',0xb0905a],chub:['#4a5c3a','#b9b78a','#efecd8',0xd85a3c],ide:['#6a6a50','#d2c79a','#f2ecd8',0xe8803a],brown:['#5d5648','#b8a98a','#e4dcc4',0x6c6a66],gold:['#6b5a2a','#c9a64a','#e8d9a0',0xc9784a],gold2:['#a87a1e','#f0c030','#fff0a0',0xf08a30],tench:['#2f4a2a','#6a8a3a','#c8d098',0x4a6a3a],carp:['#5a4a1e','#c29a35','#eadba0',0xa8672f],gcarp:['#4a6a40','#a8b890','#e8f0e0',0x7a8a60],rudd:['#6a6a40','#d8c070','#f0e8c0',0xe03020],olive:['#3c4a22','#7d8a3a','#e8e6c0',0x9a7a2c],zan:['#5a5a40','#a0a078','#e0e0c8',0x70705a],dark:['#2b2f22','#55583a','#b7b58a',0x3b3d2a],trout:['#4a5a3a','#a6b39a','#f0ece0',0xc9604a],blue:['#2f4a6a','#8fa8bd','#e8eef0',0x6a8aa8],taim:['#5a4a3a','#a08a70','#e8dcc8',0xd04a2a],sturg:['#4a4a3e','#8a8670','#ddd8c0',0x3a3a30],sturg2:['#3a3e4a','#7a8090','#dcdcd0',0x3a3e4a],eelc:['#3a3d24','#6b6a3a','#c8c690',0x4a4a2a],koi:['#f2efe8','#f6f3ec','#ffffff',0xf2a060],albino:['#e8d8d0','#f3e6e0','#ffffff',0xd9b0a8],black:['#1f2a2a','#45534a','#9aa59a',0x2a3530],salm:['#3a4a5a','#a8b4be','#f0f0ec',0x5a6a7a]};
const RAR=['Обычная','Необычная','Редкая','Эпическая','Легендарная'],RCOL=['#9fb9b1','#79e0a0','#6ab7ff','#c58bff','#ffb347'],RP=[35,80,200,600,2000];
const BM={w:'worm',d:'dough',l:'live'};
const SP={};
`roach|Плотва|.1|1.1|.36|A|silv|0|wd|0|RL
bleak|Уклейка|.02|.12|.3|A|silv|0|wd|0|RL
gudgeon|Пескарь|.02|.15|.3|A|sand|blot|w|0|R
perch|Окунь|.1|1.6|.33|B|green|stripe|wl|0|RLP
ruff|Ёрш|.02|.2|.28|B|sand|blot|w|0|RP
chub|Голавль|.2|3|.4|H|chub|scale|wdl|1|R
ide|Язь|.2|3.5|.4|H|ide|scale|wd|1|RL
bream|Лещ|.3|3.5|.4|E|brown|0|wd|1|RL
silverbream|Густера|.1|.8|.35|E|silv|0|wd|0|LP
crucian|Карась|.1|1.4|.3|D|gold|scale|wd|0|LP
goldcruc|Золотой карась|.2|2|.3|D|gold2|scale|wd|2|LP
tench|Линь|.2|3|.38|F|tench|0|wd|1|LP
carp|Карп|.8|16|.45|F|carp|scale|wd|1|LP
mirror|Зеркальный карп|1|20|.45|F|carp|scale|wd|2|LP
grasscarp|Белый амур|2|30|.5|F|gcarp|scale|wd|2|LP
silvercarp|Толстолобик|2|35|.5|E|silv|0|d|2|L
rudd|Красноперка|.1|.9|.33|D|rudd|0|wd|0|LP
pike|Щука|.6|9|.62|C|olive|spots|l|1|RLP
zander|Судак|.5|14|.55|C|zan|stripe|l|2|RL
asp|Жерех|.5|8|.5|H|silv|0|l|2|R
burbot|Налим|.4|10|.5|I|eelc|blot|wl|2|R
catfish|Сом|2|40|.75|G|dark|blot|l|2|RLP
trout|Форель|.2|6|.45|K|trout|spots|wl|2|RL
grayling|Хариус|.1|1.5|.4|K|blue|spots|w|1|R
taimen|Таймень|3|45|.7|K|taim|spots|l|3|R
sterlet|Стерлядь|.5|6|.55|J|sturg|scale|w|3|R
sturgeon|Осётр|5|80|.8|J|sturg|scale|wl|3|R
beluga|Белуга|20|300|.95|J|sturg2|scale|l|4|R
eel|Угорь|.3|4|.6|I|eelc|0|wl|2|LP
loach|Вьюн|.03|.3|.4|I|sand|blot|w|0|P
whitefish|Сиг|.3|4|.42|K|silv|0|wd|2|L
koi|Кои|.8|15|.45|F|koi|koi|d|3|LP
albcat|Сом-альбинос|5|50|.75|G|albino|0|l|4|P
bitterling|Горчак|.01|.06|.3|D|silv|0|w|0|P
minnow|Гольян|.01|.08|.3|A|silv|stripe|w|0|RP
topmouth|Верховка|.01|.04|.28|A|silv|0|w|0|P
dace|Елец|.05|.4|.33|A|silv|0|wd|1|R
vimba|Рыбец|.2|1.2|.36|A|brown|0|wd|1|RL
bluebream|Синец|.15|.9|.35|E|blue|0|wd|0|LR
nase|Подуст|.2|1.5|.38|H|silv|0|wd|1|R
snakehead|Змееголов|1|10|.55|C|black|blot|l|3|P
salmon|Лосось|2|30|.6|K|salm|spots|wl|3|RL
sabrefish|Чехонь|.1|.7|.4|A|silv|0|wd|1|RL
berch|Берш|.2|1.2|.33|B|zan|stripe|wl|1|RL
stone|Голец|.02|.2|.3|I|sand|blot|w|0|R
goldtench|Золотой линь|.5|4|.38|F|gold2|0|wd|3|P
blackcarp|Чёрный амур|3|30|.5|F|black|scale|d|3|L
vendace|Ряпушка|.05|.4|.35|K|silv|0|w|1|L
malma|Мальма|.3|5|.45|K|trout|spots|wl|2|R
goldbream|Золотой лещ|.5|6|.4|E|gold2|0|wd|4|L
barbel|Усач|.1|8|.43|H|brown|scale|wl|1|BR|1|8|evening|rush
bluegill|Солнечный окунь|.02|.35|.32|D|blue|stripe|wd|0|PM|.2|2|day|dart
largemouth|Большеротый окунь|.2|10|.48|C|olive|blot|l|2|MC|.8|6|dawn|surge
smallmouth|Малоротый окунь|.2|5|.4|C|zan|stripe|l|1|BR|.5|5|day|rush
walleye|Стеклоглазый судак|.3|9|.5|C|zan|stripe|l|2|LN|2|12|night|heavy
sauger|Согер|.1|3|.38|C|brown|blot|l|1|LN|1|8|night|rush
muskie|Маскинонг|3|30|.72|C|olive|stripe|l|4|N|2|15|dawn|surge
pumpkinseed|Тыквенный солнечник|.02|.25|.3|D|gold2|spots|wd|0|PC|.2|2|day|dart
blackcrappie|Чёрный краппи|.05|2.5|.36|D|black|blot|wd|1|NS|1|8|dawn|steady
whitecrappie|Белый краппи|.05|2.2|.36|D|silv|blot|wd|1|LS|1|7|evening|steady
channelcat|Канальный сом|.4|25|.72|G|dark|blot|l|3|MT|1|15|night|heavy
flatheadcat|Плоскоголовый сом|1|55|.86|G|brown|blot|l|4|MC|2|18|night|surge
bluecat|Голубой сом|1|60|.9|G|blue|blot|l|4|RL|2|20|evening|heavy
bowfin|Амиа|.3|10|.58|C|black|blot|l|2|MT|.5|8|night|surge
paddlefish|Веслонос|5|80|.88|J|sturg|scale|d|3|SC|4|25|day|steady
longnosegar|Длиннорылый панцирник|1|35|.78|C|olive|stripe|l|3|MC|.5|9|evening|surge
alligatorgar|Миссисипский панцирник|10|120|1.1|C|sturg2|scale|l|4|LC|1|15|night|heavy
whitebass|Белый басс|.2|3|.4|H|silv|stripe|wl|1|SL|1|8|dawn|rush
stripedbass|Полосатый басс|.5|30|.65|H|blue|stripe|l|3|BC|1|15|evening|surge
tilapia|Нильская тиляпия|.1|5|.42|D|gold|spots|d|1|CL|.5|6|day|steady
gourami|Гигантский гурами|.1|5|.42|D|gcarp|scale|wd|1|CM|.5|5|morning|dart
arapaima|Арапайма|10|200|1.25|J|salm|scale|l|4|C|2|18|evening|heavy
piranha|Красная пиранья|.1|1.5|.36|B|rudd|stripe|l|2|C|1|6|evening|rush
tambaqui|Тамбаки|1|40|.72|F|brown|scale|d|3|C|1|12|day|heavy
arowana|Серебряная арована|.5|5|.55|K|silv|scale|l|3|C|.2|5|night|dart
peacockbass|Павлиний окунь|.5|12|.62|C|gold2|spots|l|3|C|1|10|morning|surge
tigerfish|Тигровая рыба|.5|15|.62|H|silv|stripe|l|3|BC|1|10|day|surge
mahseer|Махсир|1|50|.85|H|gold|scale|wl|4|BG|2|16|dawn|heavy
rohu|Роху|.2|25|.65|F|brown|scale|d|2|CS|1|12|day|steady
catla|Катла|.5|40|.75|E|silv|scale|d|3|CS|2|15|day|steady
mrigal|Мригал|.2|15|.58|E|brown|scale|wd|2|CS|1|10|morning|steady
siamcarp|Сиамский гигантский карп|3|100|.92|F|gold2|scale|d|4|C|2|20|day|heavy
pangasius|Гигантский пангасиус|1|40|.8|G|silv|0|l|3|CS|2|20|night|heavy
basa|Баса|.5|20|.7|G|brown|0|d|2|CS|1|15|night|steady
walkingcat|Клариевый сом|.1|8|.55|G|dark|blot|w|2|MT|.2|6|night|rush
lungfish|Африканский протоптер|.5|20|.68|I|brown|blot|l|3|MT|1|10|night|steady
bichir|Многопёр сенегальский|.2|7|.52|J|sturg|blot|l|2|M|1|8|evening|dart
freshdrum|Пресноводный горбыль|.2|15|.6|E|brown|scale|wl|2|SL|2|15|evening|heavy
whitesucker|Белый чукучан|.1|5|.45|A|silv|scale|w|1|BN|1|6|morning|steady
buffalo|Большеротый буффало|.5|35|.7|D|brown|scale|d|3|MS|1|12|day|heavy
lakechub|Озёрный голец|.02|.5|.31|A|blue|stripe|w|0|NB|.5|4|day|dart
cisco|Кисуч|.05|1|.38|K|silv|0|wd|1|NS|3|20|evening|steady
redtailcat|Краснохвостый сом|1|45|.83|G|black|0|l|4|C|1|15|night|heavy
electriceel|Электрический угорь|.5|20|.64|I|dark|0|l|3|M|1|10|night|rush
swampeel|Болотный угорь|.1|3|.5|I|tench|0|w|2|MT|.2|4|night|dart
shad|Американская сельдь|.1|2.5|.43|A|silv|scale|w|1|BL|1|8|dawn|rush
murraycod|Муррейская треска|1|110|.95|C|brown|blot|l|4|SC|2|20|night|heavy
goldenperch|Золотой окунь|.1|3|.42|B|gold|spots|wl|1|SC|1|8|evening|rush
silverperch|Серебряный окунь|.1|2|.39|B|silv|stripe|w|1|SC|1|8|day|dart
pejelagarto|Пехелагарто|.3|8|.7|C|olive|scale|l|3|C|1|10|evening|surge`.split('\n').forEach(l=>{const a=l.split('|'),ar=ARCH[a[5]],p=PAL[a[6]],minDepth=a[11]===undefined ? .2+Math.min(+a[9],3)*.55 : +a[11],maxDepth=a[12]===undefined ? 1.5+Math.min(+a[9],4)*2 : +a[12];
 SP[a[0]]=Object.assign({id:a[0],n:a[1],model:a[5],w:[+a[2],+a[3]],k:+a[4],back:p[0],side:p[1],belly:p[2],fin:p[3],pat:a[7]==='0'?0:a[7],bait:a[8].split('').map(c=>BM[c]),r:+a[9],loc:a[10],depth:[minDepth,maxDepth],activity:a[13]||'any',fight:a[14]||['steady','dart','rush','surge','heavy'][Math.min(4,+a[9]+(a[5]==='G'?1:0))]},ar)});
const FIGHT_STYLES={steady:{label:'Ровное сопротивление',power:.85,runChance:.3},dart:{label:'Короткие рывки',power:.9,runChance:.48},rush:{label:'Частые рывки',power:1,runChance:.66},surge:{label:'Длинные сильные рывки',power:1.2,runChance:.72},heavy:{label:'Тяжёлое сопротивление',power:1.35,runChance:.42}};
const ACTIVITY_LABELS={any:'Весь день',morning:'Утро',day:'День',evening:'Вечер',night:'Ночь',dawn:'Рассвет'};
const HABITAT_LABELS={R:'Лесная река',L:'Хрустальное озеро',P:'Закатная заводь',B:'Каменный перекат',M:'Тихое болото',S:'Сосновое водохранилище',N:'Северное озеро',T:'Торфяная топь',G:'Горное озеро',C:'Южная лагуна'};
const MODEL_LABELS={A:'Стройная стайная рыба',B:'Высокотелый окунь',C:'Хищная вытянутая рыба',D:'Высокотелая рыба',E:'Широкотелая рыба',F:'Крупная карповая рыба',G:'Донная усатая рыба',H:'Стройная речная рыба',I:'Угреобразная рыба',J:'Осетровая рыба',K:'Лососёвая рыба',L:'Овальная озёрная рыба'};
const PATTERN_LABELS={0:'Однотонная окраска',stripe:'Полосатая окраска',spots:'Пятнистая окраска',blot:'Мраморная окраска',koi:'Окраска кои',scale:'Чешуйчатый рисунок'};
for(const s of Object.values(SP)){
 if(s.activity==='any')s.activity=s.bait.some(b=>b==='live')?'night':s.bait.some(b=>b==='worm')?'morning':'day';
}
const texCache={};
function fishTex(id){if(texCache[id])return texCache[id];const s=SP[id],W=128,Hh=256,c=document.createElement('canvas');c.width=W;c.height=Hh;const x=c.getContext('2d');
 const bk=new THREE.Color(s.back),sd=new THREE.Color(s.side),bl=new THREE.Color(s.belly),t=new THREE.Color();
 for(let i=0;i<W;i++){const q=(-Math.sin(i/W*6.2832)+1)/2;if(q>.5)t.copy(sd).lerp(bk,Math.min(1,(q-.5)*2.4));else t.copy(bl).lerp(sd,Math.min(1,q*2.2));x.fillStyle='#'+t.getHexString();x.fillRect(i,0,1,Hh)}
 x.strokeStyle='rgba(232,240,226,.11)';x.lineWidth=.8;
 for(let y=8;y<Hh-8;y+=11)for(let i=(y/11|0)%2?5:0;i<W;i+=10){x.beginPath();x.arc(i,y,5.5,.12,Math.PI-.12);x.stroke()}
 if(s.pat==='stripe')for(const b of[.3,.42,.54,.66,.78])for(let i=0;i<W;i++){const up=-Math.sin(i/W*6.2832);x.fillStyle='rgba(25,35,15,'+clamp((up+.2)/.9,0,.7)+')';x.fillRect(i,(1-b)*Hh,1,Hh*.06)}
 if(s.pat==='spots'||s.pat==='blot'){const blot=s.pat==='blot';for(let k=0;k<(blot?60:90);k++){const i=Math.random()*W,up=-Math.sin(i/W*6.2832);if(up<-.3)continue;x.fillStyle=blot?'rgba(10,12,6,.4)':'rgba(225,235,150,.55)';x.beginPath();x.ellipse(i,Math.random()*Hh,blot?8:3,blot?14:5,0,0,6.3);x.fill()}}
 if(s.pat==='koi'){for(let k=0;k<14;k++){x.fillStyle=k%4?'rgba(232,84,28,.9)':'rgba(15,15,15,.85)';x.beginPath();x.ellipse(Math.random()*W,Math.random()*Hh,14,26,0,0,6.3);x.fill()}}
 if(s.pat==='scale'){x.strokeStyle='rgba(60,40,10,.22)';x.lineWidth=1.5;for(let y=6;y<Hh;y+=13)for(let i=(y/13|0)%2?6:0;i<W;i+=12){x.beginPath();x.arc(i,y,7,0,Math.PI);x.stroke()}}
 const gloss=x.createLinearGradient(0,0,W,0);gloss.addColorStop(0,'rgba(255,255,255,.13)');gloss.addColorStop(.42,'rgba(255,255,255,0)');gloss.addColorStop(.7,'rgba(0,0,0,.06)');gloss.addColorStop(1,'rgba(0,0,0,.18)');x.fillStyle=gloss;x.fillRect(0,0,W,Hh);
 x.fillStyle='rgba(0,0,0,.16)';x.fillRect(W*.968,0,2,Hh);x.fillRect(W*.532,0,2,Hh);
 const texture=new THREE.CanvasTexture(c);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return texCache[id]=texture}
const prof=(s,t)=>Math.max(.012,Math.pow(Math.sin(Math.PI*Math.pow(t,s.a)),.55))*.5;
const fishBodyMaterials={},fishDetailMaterials={},fishFinMaterials=new Map();
const fishRibMaterial=new THREE.LineBasicMaterial({color:0xe8ecdf,transparent:true,opacity:.28});
const fishEyeSocketMaterial=new THREE.MeshPhongMaterial({color:0x17201c,shininess:35});
const fishEyeMaterial=new THREE.MeshPhongMaterial({color:0xe6e1d2,shininess:100,specular:0xffffff});
const fishPupilMaterial=new THREE.MeshBasicMaterial({color:0x101514});
for(const m of[fishRibMaterial,fishEyeSocketMaterial,fishEyeMaterial,fishPupilMaterial])m.userData.shared=true;
function fishBodyMaterial(id){if(!fishBodyMaterials[id]){fishBodyMaterials[id]=new THREE.MeshPhongMaterial({map:fishTex(id),shininess:95,specular:0x8a9ba8});fishBodyMaterials[id].userData.shared=true}return fishBodyMaterials[id]}
function fishDetailMaterial(id){if(!fishDetailMaterials[id]){fishDetailMaterials[id]=new THREE.LineBasicMaterial({color:new THREE.Color(SP[id].side).multiplyScalar(.62),transparent:true,opacity:.78});fishDetailMaterials[id].userData.shared=true}return fishDetailMaterials[id]}
function fin(pts,col){
 const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);
 const group=new THREE.Group(),key=new THREE.Color(col).getHex();
 if(!fishFinMaterials.has(key)){const material=new THREE.MeshPhongMaterial({color:key,side:THREE.DoubleSide,transparent:true,opacity:.84,depthWrite:false,shininess:80,specular:0x667788});material.userData.shared=true;fishFinMaterials.set(key,material)}
 group.add(new THREE.Mesh(new THREE.ShapeGeometry(sh),fishFinMaterials.get(key)));
 const rays=[];for(let i=1;i<pts.length;i++)rays.push(pts[0][0],pts[0][1],0,pts[i][0],pts[i][1],0);
 const border=pts.flatMap((p,i)=>[p[0],p[1],0,pts[(i+1)%pts.length][0],pts[(i+1)%pts.length][1],0]);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([...rays,...border],3));
 group.add(new THREE.LineSegments(geo,fishRibMaterial));return group
}
function fishBodyGeometry(s){
 const rings=28,sides=24,positions=[],uvs=[],indices=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings,profile=prof(s,t),x=.5-t;
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;positions.push(x,Math.cos(a)*profile*s.hr,Math.sin(a)*profile*s.tr);uvs.push(j/sides,t)}
 }
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+1,c=a+sides+1,d=c+1;indices.push(a,c,b,b,c,d)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry
}
function makeFish(id){const s=SP[id],g=new THREE.Group(),hh=s.hr*.5,eel=s.hr<.12;
 g.add(new THREE.Mesh(fishBodyGeometry(s),fishBodyMaterial(id)));
 const tail=new THREE.Group();tail.position.set(-.47,0,0);tail.add(fin(eel?[[0,0],[-.12,.05],[-.12,-.05]]:s.fork?[[0,0],[-.2,.17],[-.12,0],[-.2,-.17]]:[[0,0],[-.1,.14],[-.2,.1],[-.2,-.1],[-.1,-.14]],s.fin));g.add(tail);
 g.add(fin(eel?[[-.45,hh*.9],[-.3,hh+.04],[.3,hh+.04],[.4,hh*.5]]:[[-.2,hh*.9],[-.1,hh+.11],[.08,hh+.07],[.12,hh*.95]],s.fin));
 if(!eel){g.add(fin([[-.2,-hh*.9],[-.12,-hh-.06],[-.02,-hh*.9]],s.fin));const pv=fin([[0,0],[-.07,-.06],[-.1,0]],s.fin);pv.position.set(.1,-hh*.8,0);g.add(pv)}
 const detail=[];
 for(const side of[-1,1]){
  const tEye=.2,eyeX=.5-tEye,eyeY=hh*.23,eyeZ=side*(s.tr*prof(s,tEye)*.97);
  const socket=new THREE.Mesh(new THREE.SphereGeometry(.038,12,10),fishEyeSocketMaterial);socket.scale.set(.72,.86,.55);socket.position.set(eyeX,eyeY,eyeZ);g.add(socket);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.027,12,10),fishEyeMaterial);eye.scale.set(.74,.82,.52);eye.position.set(eyeX+.006,eyeY,eyeZ+side*.012);g.add(eye);
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.014,10,8),fishPupilMaterial);pupil.position.set(eyeX+.01,eyeY,eyeZ+side*.025);g.add(pupil);
  const glint=new THREE.Mesh(new THREE.SphereGeometry(.005,6,6),fishEyeMaterial);glint.position.set(eyeX+.014,eyeY+.008,eyeZ+side*.032);g.add(glint);
  let prev=null;for(let k=0;k<=8;k++){const u=k/8,y=hh*(.38-u*.9),tGill=.28,rad=prof(s,tGill),z=side*s.tr*rad*Math.sqrt(Math.max(.12,1-(y/(s.hr*rad))**2))*1.012,x=.5-tGill-.035*Math.sin(u*Math.PI),p=[x,y,z];if(prev)detail.push(...prev,...p);prev=p}
  prev=null;for(let k=0;k<=12;k++){const t=.28+k*.052,rad=prof(s,t),p=[.5-t,hh*.025,side*s.tr*rad*.98];if(prev)detail.push(...prev,...p);prev=p}
  const pc=fin([[0,0],[-.11,-.03],[-.13,.025]],s.fin);pc.position.set(.22,-hh*.38,side*s.tr*.3);pc.rotation.x=side*1;g.add(pc);
  if(s.whisk)for(let k=0;k<2;k++){const w=new THREE.Mesh(new THREE.CylinderGeometry(.003,.0015,.13,5),fishEyeSocketMaterial);w.rotation.z=-1.3;w.rotation.x=side*(.7+k*.4);w.position.set(.45,-hh*.1,side*(.025+k*.03));g.add(w)}
 }
 const lip=new THREE.Mesh(new THREE.SphereGeometry(.024,8,6),fishBodyMaterial(id));lip.scale.set(1,.38,.55);lip.position.set(.49,-.015,0);g.add(lip);
 const detailGeo=new THREE.BufferGeometry();detailGeo.setAttribute('position',new THREE.Float32BufferAttribute(detail,3));g.add(new THREE.LineSegments(detailGeo,fishDetailMaterial(id)));
 g.userData.tail=tail;return g}

/* популяция */
const FISH=[];
function activityFactor(activity){const h=TOD.h,active=activity==='any'||activity==='dawn'&&h>=4&&h<8||activity==='morning'&&h>=5&&h<11||activity==='day'&&h>=9&&h<18||activity==='evening'&&h>=16&&h<22||activity==='night'&&(h>=20||h<5);return active?1:.12}
function rollW(s){return s.w[0]+(s.w[1]-s.w[0])*Math.pow(Math.random(),5)}
function pickTg(f){for(let i=0;i<10;i++){const a=Math.random()*6.28,r=rnd(6,26),x=f.x+Math.cos(a)*r,z=f.z+Math.sin(a)*r;if(Hf(x,z)<-1.1&&z<P.z-5){f.tg={x,z};f.rt=rnd(6,14);return}}f.tg={x:f.x+rnd(-3,3),z:f.z+rnd(-3,3)};f.rt=3}
function spawnFish(id){const s=SP[id];for(let i=0;i<80;i++){const x=rnd(-60,60),z=rnd(P.z-90,P.z-8);if(Hf(x,z)<-1.2){const w=rollW(s),len=s.k*Math.cbrt(w),m=makeFish(id);m.scale.setScalar(len);
 const f={sp:s,w,len,mesh:m,x,z,y:-1,ty:-rnd(s.depth[0],s.depth[1]),hd:rnd(0,6.28),speed:rnd(.5,1)*(.6+Math.min(len,1.5)*.4),mode:'wander',cool:rnd(0,6),ph:rnd(0,6),tg:null,rt:0,nib:0,nt:0,ft:0};pickTg(f);FISH.push(f);world.add(m);return f}}return null}
function populate(){FISH.length=0;const lc=L.code;
 for(const id in SP){const s=SP[id];if(s.loc.indexOf(lc)<0)continue;let n=[3,2,1.2,.8,.45][s.r]*QS[Q].f;n=Math.floor(n)+(Math.random()<n%1?1:0);for(let i=0;i<n;i++)spawnFish(id)}}

/* ---------- экономика, чат, мультиплеер ---------- */
let ME=store.get('tk_sess',null);const ukey=k=>k+'_'+(ME?ME.name:'guest');
const ROD_CATALOG=[
 {id:'starter',name:'Удочка №1 · Начальная',price:0,cast:1,strength:.9,reel:.9,color:0x8a5a2b},
 {id:'river',name:'Удочка №2 · Речная',price:900,cast:1.12,strength:1.05,reel:1.08,color:0x2f7770},
 {id:'carp',name:'Удочка №3 · Карповая',price:2800,cast:1.02,strength:1.35,reel:.92,color:0xa98236},
 {id:'match',name:'Удочка №4 · Дальнобойная',price:6200,cast:1.3,strength:1.12,reel:1.22,color:0x4f668e}
];
const ROD_BY_ID=new Map(ROD_CATALOG.map(r=>[r.id,r]));
function ownedRods(value){const ids=new Set(Array.isArray(value)?value.filter(id=>ROD_BY_ID.has(id)):[]);ids.add('starter');return ROD_CATALOG.filter(r=>ids.has(r.id)).map(r=>r.id)}
const NET=Object.assign({money:0,fish:[],up:{line:0,cast:0},rods:['starter'],equippedRod:'starter',drag:.55},store.get(ukey('tk_net'),{}));NET.up=Object.assign({line:0,cast:0},NET.up);NET.rods=ownedRods(NET.rods);if(!NET.rods.includes(NET.equippedRod))NET.equippedRod=NET.rods[0];NET.drag=clamp(Number.isFinite(Number(NET.drag))?Number(NET.drag):.55,.2,.9);
const activeRod=()=>ROD_BY_ID.get(NET.equippedRod)||ROD_BY_ID.get('starter');
const saveNet=()=>store.set(ukey('tk_net'),NET);
const money=n=>Math.round(n).toLocaleString('ru-RU')+' ₴';
const priceOf=(s,w)=>{const rr=(w-s.w[0])/(s.w[1]-s.w[0]);return Math.max(1,Math.round(w*RP[s.r]*(rr>=.8?4:rr>=.45?2:1)))};
const tierOf=(s,w)=>{const rr=(w-s.w[0])/(s.w[1]-s.w[0]);return rr>=.8?2:rr>=.45?1:0};
const MP={room:null,name:ME?ME.name:store.get('tk_nick','Рыбак'+(100+(Math.random()*900|0))),hue:Math.random()*360|0,av:new Map(),sent:0,warned:false};
function addChat(d,mine){if(!d||typeof d.t!=='string')return;const log=$('chatLog'),r=document.createElement('div');r.className='cl'+(d.sys?' sys':'');
 const b=document.createElement('b');b.textContent=(d.k?'['+String(d.k).slice(0,2)+'] ':'')+String(d.n||'?').slice(0,20)+': ';b.style.color=d.sys?'#ffb347':'hsl('+((+d.c||0)%360)+',70%,70%)';const s=document.createElement('span');s.textContent=d.t.slice(0,200);const tm=document.createElement('i');const dd=new Date();tm.textContent=String(dd.getHours()).padStart(2,'0')+':'+String(dd.getMinutes()).padStart(2,'0')+' ';tm.style.cssText='opacity:.5;font-style:normal';if(!mine&&d.t.toLowerCase().indexOf(MP.name.toLowerCase())>=0)r.style.background='rgba(255,179,71,.3)';r.append(tm,b,s);log.appendChild(r);
 while(log.children.length>40)log.removeChild(log.firstChild);log.scrollTop=log.scrollHeight}
function sendChat(t,sys){t=String(t||'').trim().slice(0,160);if(!t)return;if(t[0]==='/'&&!sys){adminCmd(t);return}const d={n:sys?'★':MP.name,t,c:MP.hue,sys:sys?1:0},R=MP.room;
 if(R&&R.connected()){R.emit('chat',d).catch(()=>{addChat(d);if(!MP.warned){MP.warned=true;addChat({n:'система',t:'Писать в общий чат могут только участники с правом Contributor и выше.',sys:1})}})}else addChat(d)}
const ANN=t=>{if(window.TK_ONLINE)return;sendChat(t,true)};
async function mpInit(){try{let R=null;if(window.TK_ONLINE){R=netRoom()}else{if(!window.claude||!claude.use)throw 0;R=await claude.use('room');if(!R)throw 0}MP.room=R;R.on('chat',m=>addChat(m.data,m.isMe));R.onPeers(()=>refreshOnline());
  if(!window.TK_ONLINE)addChat({n:'система',t:'Подключено. Игроки с доступом к этой странице видят друг друга и общий чат.',sys:1})}catch(e){addChat({n:'система',t:'Мультиплеер недоступен в этом окне, чат только локальный.',sys:1})}}
function nameSprite(txt,hue){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='600 30px sans-serif';x.textAlign='center';x.fillStyle='rgba(5,16,19,.65)';x.fillRect(0,8,256,48);x.fillStyle='hsl('+hue+',75%,75%)';x.fillText(txt.slice(0,16),128,43);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));sp.scale.set(1.8,.45,1);sp.position.y=2.35;return sp}
const CHARACTER_DEFAULT={
 hair:'natural',hairColor:'#4a3324',face:'natural',jacket:'olive',jacketColor:'#65756c',
 pants:'charcoal',boots:'charcoal'
};
function characterKey(){return ME&&ME.name?'tk_character_'+ME.name:'tk_character_guest'}
let CHARACTER=Object.assign({},CHARACTER_DEFAULT,store.get(characterKey(),{}));
const FACE_COLORS={natural:0xe6b996,warm:0xd89b75,pale:0xf0cbb0,tan:0xbc7b54};
const avatarMaterials=new Map();
function avatarMaterial(color,shininess){const c=new THREE.Color(color),key=c.getHex()+'-'+(shininess||45);if(!avatarMaterials.has(key)){const material=new THREE.MeshPhongMaterial({color:c,shininess:shininess||45,specular:0x30383a});material.userData.shared=true;avatarMaterials.set(key,material)}return avatarMaterials.get(key)}
function makeAvatar(name,hue,profile){const g=new THREE.Group(),c=profile||CHARACTER;
 const skin=avatarMaterial(FACE_COLORS[c.face]||FACE_COLORS.natural,28);
 const pantsColors={charcoal:0x2d3a4a,blue:0x244c73,beige:0x77684d};
 const pants=avatarMaterial(pantsColors[c.pants]||pantsColors.charcoal,24);
 const bootColors={charcoal:0x1b2023,brown:0x5a3e2b,black:0x101214};
 const boots=avatarMaterial(bootColors[c.boots]||bootColors.charcoal,36);
 const jacket=avatarMaterial(c.jacketColor||'#65756c',42),trim=avatarMaterial(0x26332f,32);
 const bodyProfile=[[.16,0],[.21,.08],[.2,.31],[.24,.55],[.31,.79],[.29,.94],[.17,1.04],[.08,1.06]].map(p=>new THREE.Vector2(...p));
 const body=new THREE.Mesh(new THREE.LatheGeometry(bodyProfile,16),jacket);body.position.y=.48;g.add(body);
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.085,.105,.17,12),skin);neck.position.y=1.49;g.add(neck);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.23,20,16),skin);head.position.y=1.73;head.scale.set(.92,1.08,.9);g.add(head);
 const earGeo=new THREE.SphereGeometry(.055,10,8);
 for(const side of[-1,1]){const ear=new THREE.Mesh(earGeo,skin);ear.position.set(side*.205,1.72,0);ear.scale.set(.55,1,.6);g.add(ear)}
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.032,.105,10),skin);nose.position.set(0,1.69,-.205);nose.rotation.x=-Math.PI/2;g.add(nose);
 const white=avatarMaterial(0xe8e5d8,70),dark=avatarMaterial(0x24201b,18);
 for(const side of[-1,1]){
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.026,10,8),white);eye.position.set(side*.075,1.755,-.192);eye.scale.set(1,.76,.5);g.add(eye);
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),dark);pupil.position.set(side*.075,1.754,-.207);g.add(pupil);
  const brow=new THREE.Mesh(new THREE.BoxGeometry(.075,.018,.025),dark);brow.position.set(side*.075,1.792,-.19);brow.rotation.z=side*-.08;g.add(brow)
 }
 const mouth=new THREE.Mesh(new THREE.BoxGeometry(.055,.012,.014),dark);mouth.position.set(0,1.61,-.207);g.add(mouth);
 const hairColor=c.hairColor||CHARACTER_DEFAULT.hairColor,hairMat=avatarMaterial(hairColor,20);
 const hairHeight=c.hair==='short'?Math.PI*.38:c.hair==='long'?Math.PI*.66:c.hair==='buzz'?Math.PI*.25:Math.PI*.48;
 const hair=new THREE.Mesh(new THREE.SphereGeometry(c.hair==='buzz'?.22:.24,18,12,0,Math.PI*2,0,hairHeight),hairMat);hair.position.y=c.hair==='long'?1.78:1.86;g.add(hair);
 if(c.hair==='long')for(const side of[-1,1]){const lock=new THREE.Mesh(new THREE.SphereGeometry(.085,10,8),hairMat);lock.position.set(side*.17,1.59,-.015);lock.scale.set(.82,1.8,.85);g.add(lock)}
 const zipper=new THREE.Mesh(new THREE.BoxGeometry(.012,.58,.012),trim);zipper.position.set(0,1.04,-.257);g.add(zipper);
 for(const side of[-1,1]){const pocket=new THREE.Mesh(new THREE.BoxGeometry(.105,.14,.025),trim);pocket.position.set(side*.145,1.11,-.246);g.add(pocket);
  const flap=new THREE.Mesh(new THREE.BoxGeometry(.12,.035,.03),jacket);flap.position.set(side*.145,1.185,-.248);g.add(flap)}
 const leftArm=new THREE.Group(),rightArm=new THREE.Group();
 for(const [side,arm]of[[-1,leftArm],[1,rightArm]]){
  arm.position.set(side*.34,1.37,-.015);
  const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.085,.07,.4,10),jacket);sleeve.position.y=-.2;arm.add(sleeve);
  const forearm=new THREE.Mesh(new THREE.CylinderGeometry(.068,.058,.29,10),jacket);forearm.position.y=-.52;arm.add(forearm);
  const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.062,.066,.055,10),trim);cuff.position.y=-.675;arm.add(cuff);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(.061,10,8),skin);hand.position.set(0,-.74,-.008);hand.scale.set(.82,1,.8);arm.add(hand);
  arm.rotation.z=side*-.08;g.add(arm)
 }
 const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
 for(const [side,leg]of[[-1,leftLeg],[1,rightLeg]]){
  leg.position.set(side*.15,.54,0);
  const thigh=new THREE.Mesh(new THREE.CylinderGeometry(.12,.105,.34,10),pants);thigh.position.y=-.17;leg.add(thigh);
  const knee=new THREE.Mesh(new THREE.SphereGeometry(.102,10,8),pants);knee.position.y=-.34;leg.add(knee);
  const shin=new THREE.Mesh(new THREE.CylinderGeometry(.085,.095,.3,10),pants);shin.position.y=-.41;leg.add(shin);
  const boot=new THREE.Mesh(new THREE.BoxGeometry(.22,.13,.36),boots);boot.position.set(0,-.405,-.075);leg.add(boot);
  const sole=new THREE.Mesh(new THREE.BoxGeometry(.225,.025,.365),trim);sole.position.set(0,-.48,-.075);leg.add(sole);g.add(leg)
 }
 g.userData.animation={leftArm,rightArm,leftLeg,rightLeg,head};
 const rodMat=avatarMaterial(0x32281b,72),rd=new THREE.Mesh(new THREE.CylinderGeometry(.006,.018,1.9,8),rodMat);rd.rotation.x=-1.05;rd.position.set(.34,1.25,-.68);g.add(rd);
 for(let i=0;i<4;i++){const guide=new THREE.Mesh(new THREE.TorusGeometry(.025-i*.003,.003,5,10),avatarMaterial(0xaaa18a,85));guide.rotation.x=.52;guide.position.set(.34,1.25-i*.34,-.68+i*.31);g.add(guide)}
 g.add(nameSprite(name,hue));return g}
function updAvatarsLegacy(dt){const R=MP.room;const seen=new Set();
 if(R){for(const p of R.peers()){if(p.isMe||p.kind!=='viewer')continue;const d=p.presence;if(!d||d.l!==LI||typeof d.x!=='number'||typeof d.z!=='number')continue;seen.add(p.peer);
  let a=MP.av.get(p.peer);const nm=String(d.n||'Рыбак').slice(0,16);if(!a||a.nm!==nm){if(a)world.remove(a.g);a={g:makeAvatar(nm,+d.c||0),nm,x:d.x,z:d.z,b:+d.b||0};world.add(a.g);MP.av.set(p.peer,a)}
  a.x+=(d.x-a.x)*Math.min(1,dt*6);a.z+=(d.z-a.z)*Math.min(1,dt*6);a.b+=(+d.b-a.b)*Math.min(1,dt*6)||0;const gy=Math.max(L.P.deck!==null&&Math.abs(a.x)<.95&&a.z<4&&a.z>-8.3?L.P.deck:-9,Hf(a.x,a.z));a.g.position.set(a.x,gy,a.z);a.g.rotation.y=-a.b}}
 for(const [k,a] of MP.av)if(!seen.has(k)){world.remove(a.g);MP.av.delete(k)}
 MP.sent-=dt;if(R&&MP.sent<=0&&R.connected()){MP.sent=.2;R.presence({n:MP.name,c:MP.hue,l:LI,x:+P.x.toFixed(2),z:+P.z.toFixed(2),b:+bearing().toFixed(2)}).catch(()=>{})}}

/* ---------- настоящий онлайн через Socket.IO (сервер на Render) ---------- */
function netRoom(){
 const qs=new URLSearchParams(location.search).get('server');let url=(qs||window.TK_SERVER_URL||'').trim();
 if(!url&&/^https?:$/.test(location.protocol))url=location.origin;
 const R={_p:new Map(),_h:{},_pc:[],id:null,pres:{},_s:null,
  on(t,f){(this._h[t]=this._h[t]||[]).push(f);return()=>{}},
  emit(t,d){if(this._s&&this._s.connected)this._s.emit(t,t==='chat'?{t:d.t}:d);return Promise.resolve()},
  announce(d){if(this._s&&this._s.connected)this._s.emit('announce',d)},
  presence(patch){Object.assign(this.pres,patch);for(const k in patch)if(patch[k]===null)delete this.pres[k];if(this._s&&this._s.connected)this._s.volatile.emit('state',patch);return Promise.resolve()},
  peers(){return[...this._p.values()]},
  onPeers(f){this._pc.push(f);return()=>{}},
  connected(){return!!(this._s&&this._s.connected)}};
 const sys=t=>addChat({n:'система',t,sys:1});
 if(!url||typeof io!=='function'){setTimeout(()=>sys('Укажите адрес сервера в config.js'),0);return R}
 const s=R._s=io(url,{transports:['websocket','polling'],reconnection:true,reconnectionDelay:700,reconnectionDelayMax:5000,timeout:10000});
 const fire=()=>R._pc.forEach(f=>f({peers:R.peers()})),ent=(id,p,me)=>({peer:id,isMe:me,sameTab:me,kind:'viewer',guest:false,presence:p,updatedAt:Date.now()});
 let was=false;sys('Подключение к серверу…');
 s.on('connect',()=>{Object.assign(R.pres,{n:MP.name,k:COUNTRY,c:MP.hue,l:LI});s.emit('join',R.pres);if(was)sys('Соединение восстановлено.');was=true});
 s.on('disconnect',()=>{R._p.clear();fire();sys('Соединение потеряно. Переподключение…')});
 s.on('full',()=>sys('Сервер переполнен, попробуйте позже.'));
 s.on('welcome',m=>{R.id=m.id;R._p.clear();for(const p of m.peers)R._p.set(p.id,ent(p.id,p.p,false));R._p.set(m.id,ent(m.id,R.pres,true));if(!was||!R._hist){R._hist=1;sys('Подключено к серверу. Игроки онлайн видят вас и общий чат.');(m.history||[]).forEach(h=>addChat(h,false))}fire()});
 s.on('peer:join',m=>{R._p.set(m.id,ent(m.id,m.p||{},false));fire()});
 s.on('peer:state',m=>{const e=R._p.get(m.id);if(!e){R._p.set(m.id,ent(m.id,m.p||{},false));fire();return}const np=Object.assign({},e.presence,m.p);for(const k in m.p)if(m.p[k]===null)delete np[k];e.presence=np});
 s.on('peer:leave',id=>{R._p.delete(id);fire()});
 s.on('chat',m=>(R._h.chat||[]).forEach(f=>f({data:{n:m.n,t:m.t,c:m.c,k:m.k},isMe:m.id===R.id,sameTab:m.id===R.id})));
 s.on('announce',a=>{const f=SP[a.sp];if(!f)return;addChat({n:'★',t:a.n+' поймал '+(a.tier===2?'редкий трофей: ':a.tier===1?'трофей: ':'')+f.n+' — '+(+a.w).toFixed(1).replace('.',',')+' кг!',sys:1},false)});
 return R}
function makeBobberModel(hue){const g=new THREE.Group(),top=new THREE.LatheGeometry([[.001,.1],[.06,.06],[.085,0],[.001,0]].map(a=>new THREE.Vector2(a[0],a[1])),12),bot=new THREE.LatheGeometry([[.001,-.12],[.05,-.08],[.085,0],[.001,0]].map(a=>new THREE.Vector2(a[0],a[1])),12);
 const tm=new THREE.MeshPhongMaterial({color:0xe03c2c,side:THREE.DoubleSide});tm.color.setHSL(((hue||0)%360)/360,.85,.5);
 g.add(new THREE.Mesh(top,tm),new THREE.Mesh(bot,new THREE.MeshPhongMaterial({color:0xf5f5f0,side:THREE.DoubleSide})));
 const st=new THREE.Mesh(new THREE.CylinderGeometry(.012,.014,.55,6),new THREE.MeshBasicMaterial({color:0xffa31a}));st.position.y=.35;g.add(st);g.scale.setScalar(1.6);return g}
function rmAv(a){if(a.g){world.remove(a.g);disposeObject(a.g)}if(a.bg){world.remove(a.bg);disposeObject(a.bg)}if(a.ln){world.remove(a.ln);disposeObject(a.ln)}}
/* другие игроки: позиция, удочка, заброс, поплавок и леска в реальном времени */
function updAvatars(dt){const R=MP.room,seen=new Set(),t=G.t;
 if(R){for(const p of R.peers()){if(p.isMe||p.kind!=='viewer')continue;const d=p.presence;if(!d||d.l!==LI||typeof d.x!=='number'||typeof d.z!=='number')continue;seen.add(p.peer);
  let a=MP.av.get(p.peer);const nm=(d.k?'['+String(d.k).slice(0,2)+'] ':'')+String(d.n||'Рыбак').slice(0,16);
  if(!a||a.nm!==nm){if(a)rmAv(a);a={g:makeAvatar(nm,+d.c||0),nm,x:d.x,z:d.z,b:+d.b||0,s:'idle',dip:0,bg:null,ln:null,bx:0,by:0,bz:0};world.add(a.g);MP.av.set(p.peer,a)}
  const k=Math.min(1,dt*8);a.x+=(d.x-a.x)*k;a.z+=(d.z-a.z)*k;a.b+=Math.atan2(Math.sin((+d.b||0)-a.b),Math.cos((+d.b||0)-a.b))*k;
  const onDeck=L.P.deck!==null&&Math.abs(a.x)<.95&&a.z<4&&a.z>-8.3,gy=Math.max(onDeck?L.P.deck:-9,Hf(a.x,a.z));a.g.position.set(a.x,gy,a.z);a.g.rotation.y=-a.b;
  const st=typeof d.s==='string'?d.s:'idle';
  const anim=a.g.userData.animation;if(anim){
   const moving=Math.hypot(d.x-a.x,d.z-a.z)>.08;
   const phase=t*(moving?7:1.5);
   const walk=Math.sin(phase)*.34*(moving?1:.15);
   anim.leftLeg.rotation.x=walk;anim.rightLeg.rotation.x=-walk;
   anim.leftArm.rotation.x=-walk*.55;anim.rightArm.rotation.x=walk*.55;
   anim.head.rotation.y=Math.sin(t*.55)*.04;
   if(st==='fight'||st==='bite'){anim.rightArm.rotation.x=-1.05;anim.leftArm.rotation.x=-.45}
  }
  const bo=typeof d.bx==='number'&&typeof d.bz==='number'&&st!=='idle'&&st!=='charge'&&st!=='catch';
  if(bo){if(!a.bg){a.bg=makeBobberModel(+d.c||0);world.add(a.bg);const lg2=new THREE.BufferGeometry();lg2.setAttribute('position',new THREE.BufferAttribute(new Float32Array(14*3),3));a.ln=new THREE.Line(lg2,new THREE.LineBasicMaterial({color:0xf4f4f0,transparent:true,opacity:.7}));a.ln.frustumCulled=false;world.add(a.ln);a.bx=d.bx;a.by=+d.by||0;a.bz=d.bz}
   const kk=Math.min(1,dt*10);a.bx+=(d.bx-a.bx)*kk;a.by+=((+d.by||0)-a.by)*kk;a.bz+=(d.bz-a.bz)*kk;a.dip+=((+d.dp||0)-a.dip)*Math.min(1,dt*9);
   const air=st==='cast';a.bg.position.set(a.bx,air?a.by:.02+Math.sin(t*2.2+a.x)*.012-a.dip*.5,a.bz);
   if(a.s==='cast'&&st!=='cast')splash(a.bx,a.bz,12);if(st==='bite'&&a.s!=='bite')ripple(a.bx,a.bz,1.2);if(st==='fight'&&Math.random()<dt*2.2)splash(a.bx,a.bz,3,.5);
   const tx=a.x+Math.sin(a.b)*1.3,ty=gy+2.3,tz=a.z-Math.cos(a.b)*1.3,pp=a.ln.geometry.attributes.position,sag=Math.hypot(a.bx-tx,a.bz-tz)*.04*(st==='fight'?.2:1)+.1;
   for(let i=0;i<14;i++){const u=i/13;let y=lerp(ty,a.bg.position.y+.5,u)-Math.sin(u*Math.PI)*sag;if(u>.8&&!air)y=Math.max(y,.03);pp.setXYZ(i,lerp(tx,a.bx,u),y,lerp(tz,a.bz,u))}pp.needsUpdate=true;a.bg.visible=a.ln.visible=true}
  else if(a.bg){a.bg.visible=a.ln.visible=false}
  a.s=st}}
 for(const[k,a]of MP.av)if(!seen.has(k)){rmAv(a);MP.av.delete(k)}
 MP.sent-=dt;if(R&&MP.sent<=0&&R.connected()){MP.sent=.1;const bv=bob.visible&&G.state!=='idle'&&G.state!=='catch',b=bearing();
  R.presence({n:MP.name,k:COUNTRY,c:MP.hue,l:LI,x:+P.x.toFixed(2),z:+P.z.toFixed(2),b:+Math.atan2(Math.sin(b),Math.cos(b)).toFixed(2),s:G.state,bx:bv?+bob.position.x.toFixed(2):null,by:bv?+bob.position.y.toFixed(2):null,bz:bv?+bob.position.z.toFixed(2):null,dp:bv?+G.dip.toFixed(2):null}).catch(()=>{})}}

/* ---------- аккаунты, админ-команды, боты, список онлайн ---------- */
const cyrb=s=>{let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)};
const hp=(n,p)=>cyrb('tk:'+n.toLowerCase()+':'+p);
const ADMIN_H='197yjipu1it';
let MODE=store.get('tk_mode','multi');
const isAdmin=()=>!!(ME&&ME.admin);
function loadNet(){const d=store.get(ukey('tk_net'),{});NET.money=Number.isFinite(Number(d.money))?Number(d.money):0;NET.fish=Array.isArray(d.fish)?d.fish:[];NET.up=Object.assign({line:0,cast:0},d.up||{});NET.rods=ownedRods(d.rods);NET.equippedRod=NET.rods.includes(d.equippedRod)?d.equippedRod:NET.rods[0];NET.drag=clamp(Number.isFinite(Number(d.drag))?Number(d.drag):.55,.2,.9);if(typeof hudNet==='function')hudNet();if(typeof hudRod==='function')hudRod()}
function accUI(){const o=!!ME;$('accIn').hidden=o;$('accOut').hidden=!o;$('aName').textContent=o?('Вы вошли как '+ME.name+(ME.admin?' · админ':'')):'';const nk=$('nick');nk.disabled=o;if(o)nk.value=ME.name}
function setUser(u){ME=u;store.set('tk_sess',u);loadNet();MP.name=u?u.name:store.get('tk_nick',MP.name);CHARACTER=Object.assign({},CHARACTER_DEFAULT,store.get(characterKey(),{}));accUI();if(charScene)rebuildCharacterPreview()}
function accMsg(t,bad){const m=$('aMsg');m.textContent=t;m.style.color=bad?'#ff8a7a':'#79e0a0'}
function initAcct(){accUI();
 $('aReg').onclick=()=>{const n=$('aUser').value.trim(),p=$('aPass').value;if(!/^[A-Za-zА-Яа-яЁё0-9_]{3,16}$/.test(n))return accMsg('Ник: 3–16 символов, буквы, цифры, _',1);if(p.length<3)return accMsg('Пароль минимум 3 символа',1);
  const A=store.get('tk_acc',{}),k=n.toLowerCase();if(k==='catx'||A[k])return accMsg('Такой ник уже занят',1);A[k]={name:n,h:hp(n,p)};store.set('tk_acc',A);setUser({name:n,admin:false});accMsg('Аккаунт создан, вы вошли');$('aPass').value=''};
 $('aLogin').onclick=()=>{const n=$('aUser').value.trim(),p=$('aPass').value,k=n.toLowerCase();
  if(k==='catx'){if(hp('CATx',p)===ADMIN_H){setUser({name:'CATx',admin:true});accMsg('Вход выполнен, режим админа');$('aPass').value='';return}return accMsg('Неверный пароль',1)}
  const a=store.get('tk_acc',{})[k];if(!a)return accMsg('Аккаунт не найден. Нажми «Регистрация»',1);if(a.h!==hp(a.name,p))return accMsg('Неверный пароль',1);setUser({name:a.name,admin:false});accMsg('Вход выполнен');$('aPass').value=''};
 $('aLogout').onclick=()=>{setUser(null);accMsg('Вы вышли')};
 for(const id of['aUser','aPass'])$(id).addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')$('aLogin').click()})}
/* админ-команды и /me */
function adminCmd(t){const a=t.slice(1).trim().split(/\s+/),c=(a.shift()||'').toLowerCase(),rest=a.join(' '),say=s=>addChat({n:'система',t:s,sys:1});
 if(c==='me'&&rest){sendChat('* '+MP.name+' '+rest);return}
 if(!isAdmin()){say('Нет прав. Команды доступны администратору.');return}
 const give=(sp,w)=>{const pr=priceOf(sp,w),tr=tierOf(sp,w);NET.fish.push({id:sp.id,w:+w.toFixed(3),p:pr,t:tr});saveNet();hudNet();return pr};
 if(c==='help')say('/money N, /give рыба [кг], /trophy [rare], /time day|night|auto|0-23, /tp x z, /bots 0-14, /announce текст, /clear, /me текст');
 else if(c==='money'&&!isNaN(+a[0])){NET.money=Math.max(0,NET.money+(+a[0]));saveNet();hudNet();say('Баланс: '+money(NET.money))}
 else if(c==='give'){const kg=parseFloat(a[a.length-1]),hasKg=a.length>1&&!isNaN(kg),q=(hasKg?a.slice(0,-1):a).join(' ').toLowerCase(),sp=Object.values(SP).find(s=>s.id===q||s.n.toLowerCase().indexOf(q)>=0);
  if(!sp)say('Рыба не найдена');else{const w=hasKg?kg:rollW(sp);say('Выдано: '+sp.n+' '+w.toFixed(2)+' кг за '+money(give(sp,w)))}}
 else if(c==='trophy'){const lc=LOCS[LI].code,pool=Object.values(SP).filter(s=>s.loc.indexOf(lc)>=0&&s.r>=(a[0]==='rare'?3:1)),sp=pool[Math.random()*pool.length|0]||SP.pike,w=sp.w[0]+(sp.w[1]-sp.w[0])*rnd(.82,1);give(sp,w);ANN(MP.name+' поймал редкий трофей: '+sp.n+' — '+w.toFixed(1).replace('.',',')+' кг!')}
 else if(c==='time'){const v=a[0];if(v==='day'||v==='night'||v==='auto'){TOD.mode=v}else if(!isNaN(+v)){TOD.mode='fix';TOD.fix=((+v%24)+24)%24}else say('/time day|night|auto|0-23');say('Время изменено')}
 else if(c==='tp'&&a.length>=2){const x=+a[0],z=+a[1];if(canStand(x,z)){P.x=x;P.z=z;P.y=groundY(x,z)+1.7}else say('Туда нельзя (вода или далеко)')}
 else if(c==='bots'){botN=clamp(Math.round(+a[0]||0),0,BOTS.length);clearAv();say('Ботов: '+botN)}
 else if(c==='announce'&&rest)sendChat(rest,!window.TK_ONLINE);
 else if(c==='clear')$('chatLog').innerHTML='';
 else say('Неизвестная команда. /help')}
/* боты (помечены [бот]) */
const BOTN=['Щукарь','Дед_Мазай','Поплавок77','Сомыч','РыбаКит','Карасик','Тихий_Омут','Леший','Спиннинг','Белуга_Оля','Сазан_Борис','Хариус_Макс','НочнойЖерех','Утренний_Клёв'];
const BOTS=BOTN.map((n,i)=>({name:n,hue:(i*47)%360,loc:i%LOCS.length,x:0,z:0,tx:0,tz:0,g:null,t:rnd(15,70),ct:rnd(20,90),n:0,kg:0,lt:rnd(120,300)}));
const BLINES=['клюёт на червя!','кто на озере?','ну и туман на реке','щука сегодня огонь','тесто лучше червя, проверено','ночью лещ идёт','кого поймали?','сорвалась, зараза'];
let botN=8,botsOn=false;
function botSay(b,t,sys){addChat({n:(sys?'★ ':'')+b.name+' [бот]',t,c:b.hue,sys:sys?1:0})}
function botCatch(b){const lc=LOCS[b.loc].code,pool=Object.values(SP).filter(s=>s.loc.indexOf(lc)>=0),wts=pool.map(s=>[6,3,1.5,.7,.25][s.r]);let r=Math.random()*wts.reduce((a,c)=>a+c,0),sp=pool[0];for(let i=0;i<pool.length;i++){r-=wts[i];if(r<=0){sp=pool[i];break}}
 const w=rollW(sp),tr=tierOf(sp,w);b.n++;b.kg+=w;if(tr>0||sp.r>=3)botSay(b,'поймал '+(tr===2?'редкий трофей: ':tr===1?'трофей: ':'')+sp.n+' — '+w.toFixed(1).replace('.',',')+' кг ('+LOCS[b.loc].name+')',true)}
function clearAv(){for(const[k,a]of MP.av)rmAv(a);MP.av.clear();for(const b of BOTS){if(b.g){if(b.g.parent)b.g.parent.remove(b.g);disposeObject(b.g)}b.g=null}}
function botSpot(b){for(let i=0;i<30;i++){const x=rnd(-35,35),z=rnd(-10,28);if(Hf(x,z)>.4&&Math.hypot(x-P.x,z-P.z)>5){b.tx=x;b.tz=z;return}}b.tx=b.x;b.tz=b.z}
function updBots(dt){BOTS.forEach((b,i)=>{const on=botsOn&&i<botN;
 if(!on){if(b.g){if(b.g.parent)b.g.parent.remove(b.g);disposeObject(b.g);b.g=null}return}
 b.t-=dt;if(b.t<=0){b.t=rnd(25,110);botCatch(b)}b.ct-=dt;if(b.ct<=0){b.ct=rnd(70,220);botSay(b,BLINES[Math.random()*BLINES.length|0])}b.lt-=dt;if(b.lt<=0){b.lt=rnd(150,360);b.loc=Math.random()*LOCS.length|0}
 if(b.loc!==LI){if(b.g){if(b.g.parent)b.g.parent.remove(b.g);disposeObject(b.g);b.g=null}return}
 if(b.g&&b.g.parent!==world)b.g=null;
 if(!b.g){botSpot(b);b.x=b.tx;b.z=b.tz;b.g=makeAvatar(b.name+' [бот]',b.hue);world.add(b.g);botSpot(b)}
 const dx=b.tx-b.x,dz=b.tz-b.z,d=Math.hypot(dx,dz);if(d<.5){if(Math.random()<dt*.15)botSpot(b)}else{const s=Math.min(d,1.1*dt);b.x+=dx/d*s;b.z+=dz/d*s;b.g.rotation.y=-Math.atan2(dx,-dz)}
 b.g.position.set(b.x,Hf(b.x,b.z),b.z)})}
/* онлайн и список по Q */
function refreshOnline(){if(MODE!=='multi')return;const R=MP.room,real=R?Math.max(1,R.peers().filter(p=>p.kind==='viewer').length):1,bots=botsOn?botN:0;
 $('hudOn').textContent=(R&&!R.connected())?'Онлайн: переподключение…':'Онлайн: '+(real+bots)+(bots?' (ботов: '+bots+')':'');
 const pl=$('plist');if(pl.hidden)return;pl.innerHTML='';const h=document.createElement('div');h.className='ph';h.textContent='Онлайн: '+(real+bots)+' · игроков '+real+' · ботов '+bots;pl.appendChild(h);
 const row=(n,sub,col)=>{const r=document.createElement('div');r.className='pr';const b=document.createElement('b');b.textContent=n;if(col)b.style.color=col;const s=document.createElement('span');s.textContent=sub;r.append(b,s);pl.appendChild(r)};
 row((COUNTRY?'['+COUNTRY+'] ':'')+MP.name+' (вы)'+(isAdmin()?' ★':''),tr(LOCS[LI].name)+' · садок '+NET.fish.length,'#79e0a0');
 if(R)for(const p of R.peers()){if(p.isMe||p.kind!=='viewer')continue;const d=p.presence||{};row((d.k?'['+String(d.k).slice(0,2)+'] ':'')+String(d.n||'Рыбак').slice(0,16),LOCS[d.l]?tr(LOCS[d.l].name):'—','hsl('+((+d.c||0)%360)+',70%,70%)')}
 BOTS.slice(0,bots).forEach(b=>row(b.name+' [бот]',LOCS[b.loc].name+' · поймано '+b.n+' ('+b.kg.toFixed(1).replace('.',',')+' кг)','#9fb9b1'))}

/* ---------- язык и страна (RU / UK / EN) ---------- */
const _nl=(navigator.language||'').slice(0,2);
let LANG=store.get('tk_lang',null)||(_nl==='uk'?'uk':_nl==='ru'?'ru':'en');
let COUNTRY=store.get('tk_country',_nl==='ru'?'RU':_nl==='uk'?'UA':'XX');
const CTRY=[['UA','Украина','Україна','Ukraine'],['PL','Польша','Польща','Poland'],['DE','Германия','Німеччина','Germany'],['US','США','США','United States'],['GB','Великобритания','Великобританія','United Kingdom'],['CZ','Чехия','Чехія','Czechia'],['MD','Молдова','Молдова','Moldova'],['GE','Грузия','Грузія','Georgia'],['KZ','Казахстан','Казахстан','Kazakhstan'],['BY','Беларусь','Білорусь','Belarus'],['RU','Россия','Росія','Russia'],['TR','Турция','Туреччина','Türkiye'],['FR','Франция','Франція','France'],['IT','Италия','Італія','Italy'],['CA','Канада','Канада','Canada'],['XX','Другая страна','Інша країна','Other country']];
const FNT=`Плітка|Roach
Верховодка|Bleak
Пічкур|Gudgeon
Окунь|Perch
Йорж|Ruffe
Головень|Chub
В'язь|Ide
Лящ|Bream
Густера|Silver bream
Карась|Crucian carp
Золотий карась|Golden crucian
Лин|Tench
Короп|Carp
Дзеркальний короп|Mirror carp
Білий амур|Grass carp
Товстолоб|Silver carp
Краснопірка|Rudd
Щука|Pike
Судак|Zander
Жерех|Asp
Минь|Burbot
Сом|Catfish
Форель|Trout
Харіус|Grayling
Таймень|Taimen
Стерлядь|Sterlet
Осетр|Sturgeon
Білуга|Beluga
Вугор|Eel
В'юн|Loach
Сиг|Whitefish
Коі|Koi
Сом-альбінос|Albino catfish
Гірчак|Bitterling
Гольян|Minnow
Верховка|Topmouth gudgeon
Єлець|Dace
Рибець|Vimba
Синець|Blue bream
Підуст|Nase
Змієголов|Snakehead
Лосось|Salmon
Чехоня|Sabrefish
Йорж-носар|Zingel
Голець|Stone loach
Золотий лин|Golden tench
Чорний амур|Black carp
Рипус|Vendace
Мальма|Dolly Varden
Золотий лящ|Golden bream
Вусач|Barbel
Сонячний окунь|Bluegill
Великоротий окунь|Largemouth bass
Малоротий окунь|Smallmouth bass
Склястий судак|Walleye
Согер|Sauger
Маскінонг|Muskellunge
Гарбузовий сонячник|Pumpkinseed sunfish
Чорний краппі|Black crappie
Білий краппі|White crappie
Канальний сом|Channel catfish
Плоскоголовий сом|Flathead catfish
Блакитний сом|Blue catfish
Амія|Bowfin
Веслоніс|American paddlefish
Довгорилий панцирник|Longnose gar
Панцирник алігаторовий|Alligator gar
Білий бас|White bass
Смугастий бас|Striped bass
Нільська тиляпія|Nile tilapia
Гігантський гурамі|Giant gourami
Арапаїма|Arapaima
Червона піранья|Red-bellied piranha
Тамбаки|Tambaqui
Срібна арована|Silver arowana
Павичевий окунь|Peacock bass
Тигрова риба|African tigerfish
Махсір|Mahseer
Роху|Rohu
Катла|Catla
Мрігал|Mrigal
Сіамський гігантський короп|Siamese giant carp
Гігантський пангасіус|Giant pangasius
Баса|Basa
Кларієвий сом|Walking catfish
Африканський дводишник|African lungfish
Сенегальський багатопер|Senegal bichir
Прісноводний горбиль|Freshwater drum
Білий чукучан|White sucker
Великоротий буфало|Bigmouth buffalo
Озерний голець|Lake chub
Кісуч|Cisco
Червонохвостий сом|Redtail catfish
Електричний вугор|Electric eel
Болотний вугор|Swamp eel
Американський шед|American shad
Маррейська тріска|Murray cod
Золотий окунь|Golden perch
Срібний окунь|Silver perch
Пехелагарто|Tropical gar`.split('\n');
const DICT=`Тихий |Тихий |Quiet
клёв|клів|Bite
Забрось поплавок, дождись поклёвки и осторожно выведи рыбу к берегу.|Закинь поплавець, дочекайся клювання й обережно виведи рибу до берега.|Cast the float, wait for a bite, and carefully bring the fish to shore.
Водоём|Водойма|Water
Наживка|Наживка|Bait
Аккаунт|Акаунт|Account
Пароль минимум 3 символа|Пароль мінімум 3 символи|Password: at least 3 characters
Пароль|Пароль|Password
Ник: 3–16 символов, буквы, цифры, _|Нік: 3–16 символів, літери, цифри, _|Nick: 3–16 characters, letters, digits, _
Ник|Нік|Nick
Регистрация|Реєстрація|Register
Войти|Увійти|Log in
Выйти|Вийти|Log out
Настройки|Налаштування|Settings
Графика|Графіка|Graphics
Время|Час|Time
Время изменено|Час змінено|Time changed
Время |Час |Time
Музыка|Музика|Music
Режим|Режим|Mode
Язык|Мова|Language
Страна|Країна|Country
Низкая|Низька|Low
Средняя|Середня|Medium
Высокая|Висока|High
Авто|Авто|Auto
День|День|Day
Ночь|Ніч|Night
Вкл|Увімк|On
Выкл|Вимк|Off
Одиночная|Одиночна|Single
Мультиплеер|Мультиплеєр|Multiplayer
Начать рыбалку|Почати риболовлю|Start fishing
Дневник рыбака|Щоденник рибалки|Angler's journal
Дневник|Щоденник|Journal
Закрыть|Закрити|Close
Мышь|Миша|Mouse
 — осмотр (клик захватывает мышь), | — огляд (клік захоплює мишу), | — look around (click captures the mouse),
 — ходить, | — ходити, | — walk,
 — бег, | — біг, | — run,
 — поворот, | — поворот, | — turn,
 — кто онлайн, | — хто онлайн, | — who's online,
 — заброс и вываживание, колесо или| — закид і виважування, колесо або| — cast and retrieve, wheel or
 — зум, | — зум, | — zoom,
 — наживка, | — наживка, | — bait,
 — кафе, | — кафе, | — café,
 — чат, | — чат, | — chat,
 — меню.| — меню.| — menu.
ЛКМ|ЛКМ|LMB
Пробел|Пробіл|Space
Лесная река|Лісова річка|Forest River
Течение, сосны, плотва и голавль|Течія, сосни, плітка й головень|Current, pines, roach and chub
Хрустальное озеро|Кришталеве озеро|Crystal Lake
Помост, остров, лещ и карп|Поміст, острів, лящ і короп|Pier, island, bream and carp
Закатная заводь|Захід у затоці|Sunset Backwater
Кувшинки, тишина, карась и сом|Латаття, тиша, карась і сом|Lilies, silence, crucian and catfish
Каменный перекат|Кам'яний перекат|Stone Rapids
Быстрая вода, валуны и речной усач|Швидка вода, валуни й річковий вусач|Fast water, boulders and river barbel
Тихое болото|Тихе болото|Quiet Marsh
Камышовые заводи, туман и хищная щука|Очеретяні плеса, туман і хижа щука|Reed-lined pools, mist and predatory pike
Сосновое водохранилище|Соснове водосховище|Pine Reservoir
Глубокая гладь под соснами, судак и белый амур|Глибока гладь під соснами, судак і білий амур|Deep water beneath the pines, zander and grass carp
Северное озеро|Північне озеро|Northern Lake
Холодная вода, гранитный берег и арктический голец|Холодна вода, гранітний берег і арктичний голець|Cold water, granite shore and Arctic char
Торфяная топь|Торф'яна трясовина|Peatland
Тёмные омуты, ряска и ночной клёв|Темні плеса, ряска й нічне клювання|Dark pools, duckweed and night bites
Горное озеро|Гірське озеро|Mountain Lake
Прозрачная глубина, каменистое дно и махсир|Прозора глибина, кам'янисте дно й махсір|Clear depths, rocky bottom and mahseer
Южная лагуна|Південна лагуна|Southern Lagoon
Тёплые протоки, кувшинки и яркая тропическая рыба|Теплі протоки, латаття й яскрава тропічна риба|Warm channels, water lilies and colourful tropical fish
Виды: |Види: |Species:
Обитает: |Мешкає: |Habitat:
Глубина: |Глибина: |Depth:
Активность: |Активність: |Activity:
Наживка: |Наживка: |Bait:
Поведение: |Поведінка: |Fight:
Модель: |Модель: |Model:
Размер: |Розмір: |Size:
Вес: |Вага: |Weight:
Средняя цена: |Середня ціна: |Average price:
кг|кг|kg
м|м|m
см|см|cm
Весь день|Увесь день|All day
Утро|Ранок|Morning
День|День|Day
Вечер|Вечір|Evening
Ночь|Ніч|Night
Рассвет|Світанок|Dawn
Ровное сопротивление|Рівний опір|Steady resistance
Короткие рывки|Короткі ривки|Short bursts
Частые рывки|Часті ривки|Frequent runs
Длинные сильные рывки|Довгі сильні ривки|Long, powerful runs
Тяжёлое сопротивление|Важкий опір|Heavy resistance
Стройная стайная рыба|Струнка зграйна риба|Slender schooling fish
Высокотелый окунь|Високотілий окунь|Deep-bodied perch
Хищная вытянутая рыба|Хижа видовжена риба|Elongated predator
Высокотелая рыба|Високотіла риба|Deep-bodied fish
Широкотелая рыба|Широкотіла риба|Broad-bodied fish
Крупная карповая рыба|Велика коропова риба|Large carp-like fish
Донная усатая рыба|Донна вусата риба|Bottom-dwelling whiskered fish
Стройная речная рыба|Струнка річкова риба|Slender river fish
Угреобразная рыба|Вугреподібна риба|Eel-shaped fish
Осетровая рыба|Осетрова риба|Sturgeon-like fish
Лососёвая рыба|Лососева риба|Salmonid fish
Овальная озёрная рыба|Овальна озерна риба|Oval lake fish
Однотонная окраска|Однотонне забарвлення|Plain colouration
Полосатая окраска|Смугасте забарвлення|Striped colouration
Пятнистая окраска|Плямисте забарвлення|Spotted colouration
Мраморная окраска|Мармурове забарвлення|Mottled colouration
Окраска кои|Забарвлення коі|Koi colouration
Чешуйчатый рисунок|Лускатий візерунок|Scale pattern
Червь|Хробак|Worm
Тесто|Тісто|Dough
Живец|Живець|Live bait
Наживка: |Наживка: |Bait:
Монеты: |Монети: |Coins:
Продать улов: |Продати улов: |Sell catch:
 рыб на | риб на | fish,
  (клавиша B)|  (клавіша B)|  (key B)
Звук: вкл|Звук: увімк|Sound: on
Звук: выкл|Звук: вимк|Sound: off
Меню|Меню|Menu
Онлайн: переподключение…|Онлайн: перепідключення…|Online: reconnecting…
Онлайн: |Онлайн: |Online:
 (ботов: | (ботів: | (bots:
 · игроков | · гравців | · players
 · ботов | · ботів | · bots
 (вы)| (ви)| (you)
 · садок | · садок | · keepnet
 · поймано | · спіймано | · caught
ТЯНУТЬ|ТЯГНИ|REEL
НАЧАТЬ|ПОЧАТИ|START
МОТАТЬ|МОТАЙ|REEL IN
БРОСОК|ЗАКИД|CAST
Зажми ЛКМ или Пробел — замах, отпусти — заброс|Затисни ЛКМ або Пробіл — замах, відпусти — закид|Hold LMB or Space to wind up, release to cast
Отпусти, когда сила нужная|Відпусти, коли сила потрібна|Release at the right power
Жди поклёвку. Удерживай для подмотки|Чекай клювання. Утримуй для змотування|Wait for a bite. Hold to reel
Слишком далеко от поплавка — заброс завершён|Занадто далеко від поплавця — закид завершено|Too far from the float — cast ended
Держи — тянуть. Рыба рвётся — отпусти!|Тримай — тягти. Риба рветься — відпусти!|Hold to reel. If the fish runs, let go!
Мышь — осмотр, WASD — ходить, зажми ЛКМ — заброс|Миша — огляд, WASD — ходити, затисни ЛКМ — закид|Mouse to look, WASD to walk, hold LMB to cast
Мимо воды!|Повз воду!|Missed the water!
КЛЮЁТ! Нажми, чтобы начать вываживание|КЛЮЄ! Натисни, щоб почати виважування|BITE! Click to start reeling
Рыба на крючке!|Риба на гачку!|Fish on the line!
Леска лопнула!|Волосінь луснула!|Line snapped!
Рыба сошла|Риба зірвалась|The fish got away
Рано! Рыба испугалась|Рано! Риба злякалась|Too early! The fish got scared
Упустил клёв…|Проґавив клювання…|Missed the bite…
Продано: |Продано: |Sold:
До берега: |До берега: |To shore:
м|м|m
Рывок рыбы|Ривок риби|Fish is running
Усталость: |Втома: |Fatigue:
Рыба рвётся!|Риба рветься!|The fish is running!
Рыба устала|Риба втомилась|The fish is tired
Рыба отдыхает|Риба відпочиває|The fish is resting
Снасти|Снасті|Tackle
Удочка №1|Вудка №1|Rod No. 1
Удочка №2|Вудка №2|Rod No. 2
Удочка №3|Вудка №3|Rod No. 3
Удочка №4|Вудка №4|Rod No. 4
Удочка №1 · Начальная|Вудка №1 · Початкова|Rod No. 1 · Starter
Удочка №2 · Речная|Вудка №2 · Річкова|Rod No. 2 · River
Удочка №3 · Карповая|Вудка №3 · Коропова|Rod No. 3 · Carp
Удочка №4 · Дальнобойная|Вудка №4 · Далекобійна|Rod No. 4 · Long cast
Инвентарь снастей|Інвентар снастей|Tackle inventory
Фрикцион катушки|Фрикціон котушки|Reel drag
Куплено|Придбано|Owned
Установлена|Встановлена|Equipped
Выбрать|Обрати|Equip
Купить|Купити|Buy
Удочка выбрана: |Вудку обрано: |Rod equipped:
Удочка куплена и установлена|Вудку придбано й встановлено|Rod purchased and equipped
Эта удочка ещё не куплена|Цю вудку ще не придбано|This rod is not owned yet
Установлена: |Встановлена: |Equipped:
Дальность: |Дальність: |Casting distance:
Прочность: |Міцність: |Strength:
Подмотка: |Змотування: |Reel speed:
Рыба в садке|Риба в садку|Fish in the keepnet
Дальше|Далі|Next
РЕДКИЙ ТРОФЕЙ · |РІДКІСНИЙ ТРОФЕЙ · |RARE TROPHY ·
ТРОФЕЙ · |ТРОФЕЙ · |TROPHY ·
 · Новый рекорд!| · Новий рекорд!| · New record!
 · Новый вид!| · Новий вид!| · New species!
Обычная|Звичайна|Common
Необычная|Незвичайна|Uncommon
Редкая|Рідкісна|Rare
Эпическая|Епічна|Epic
Легендарная|Легендарна|Legendary
 кг| кг| kg
 см| см| cm
Всего поймано: |Всього спіймано: |Total caught:
. Видов в дневнике: |. Видів у щоденнику: |. Species logged:
 из | з | of
Поймано: |Спіймано: |Caught:
 · рекорд | · рекорд | · best
 · не поймана| · не спіймана| · not caught
Кафе «Тихий клёв»|Кафе «Тихий клів»|Café "Quiet Bite"
Продать всё|Продати все|Sell all
Баланс: |Баланс: |Balance:
 · в садке: | · у садку: | · in keepnet:
 / | / | /
Садок пуст. Лови рыбу и неси в кафе.|Садок порожній. Лови рибу й неси в кафе.|The keepnet is empty. Catch fish and bring it to the café.
 · нажми, чтобы продать| · натисни, щоб продати| · click to sell
Прочная леска ур.|Міцна волосінь рів.|Strong line lv.
Дальний заброс ур.|Далекий закид рів.|Long cast lv.
Леска — максимум|Волосінь — максимум|Line — max
Удилище — максимум|Вудлище — максимум|Rod — max
Enter — написать в общий чат|Enter — написати в загальний чат|Enter — write to global chat
система|система|system
Подключение к серверу…|Підключення до сервера…|Connecting to the server…
Подключено к серверу. Игроки онлайн видят вас и общий чат.|Підключено до сервера. Гравці онлайн бачать вас і загальний чат.|Connected. Players online can see you and the global chat.
Соединение потеряно. Переподключение…|З'єднання втрачено. Перепідключення…|Connection lost. Reconnecting…
Соединение восстановлено.|З'єднання відновлено.|Connection restored.
Укажите адрес сервера в config.js|Вкажіть адресу сервера в config.js|Set the server address in config.js
Сервер переполнен, попробуйте позже.|Сервер переповнений, спробуйте пізніше.|The server is full, try again later.
Мультиплеер недоступен в этом окне, чат только локальный.|Мультиплеєр недоступний у цьому вікні, чат лише локальний.|Multiplayer is unavailable here, chat is local only.
Нет прав. Команды доступны администратору.|Немає прав. Команди доступні адміністратору.|No permission. Commands are admin-only.
Такой ник уже занят|Такий нік уже зайнятий|This nick is taken
Аккаунт создан, вы вошли|Акаунт створено, ви увійшли|Account created, you are logged in
Неверный пароль|Невірний пароль|Wrong password
Вход выполнен, режим админа|Вхід виконано, режим адміна|Logged in, admin mode
Вход выполнен|Вхід виконано|Logged in
Аккаунт не найден. Нажми «Регистрация»|Акаунт не знайдено. Натисни «Реєстрація»|Account not found. Press "Register"
Вы вышли|Ви вийшли|You are logged out
Вы вошли как |Ви увійшли як |Logged in as
 · админ| · адмін| · admin
 поймал | зловив | caught
редкий трофей: |рідкісний трофей: |rare trophy:
трофей: |трофей: |trophy:
 кг!| кг!| kg!
Добро пожаловать|Ласкаво просимо|Welcome
Выбери язык и страну|Обери мову та країну|Choose your language and country
Продолжить|Продовжити|Continue
Тихий клёв…|Тихий клів…|Quiet Bite…`;
const FR=DICT.split('\n').map(l=>l.split('|')).filter(a=>a.length===3).map(a=>{const ld=a[0].match(/^\s*/)[0],tl=a[0].match(/\s*$/)[0];return[a[0],ld+a[1].trim()+tl,ld+a[2].trim()+tl]}).sort((a,b)=>b[0].length-a[0].length);
function tr(s){if(LANG==='ru'||!s)return s;const i=LANG==='uk'?1:2;let o=s;for(const f of FR){if(o.indexOf(f[0])>=0)o=o.split(f[0]).join(f[i])}return o}
function trNode(n){if(n.nodeType!==3)return;const p=n.parentNode;if(!p||p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||p.nodeName==='OPTION')return;
 if(n.__t===undefined||n.nodeValue!==n.__t)n.__o=n.nodeValue;const out=tr(n.__o);if(out!==n.nodeValue)n.nodeValue=out;n.__t=out}
function trTree(root){if(root.nodeType===3){trNode(root);return}const w=document.createTreeWalker(root,4);let n;while((n=w.nextNode()))trNode(n)}
function trAttrs(){document.querySelectorAll('[placeholder]').forEach(e=>{if(e.__ph===undefined)e.__ph=e.getAttribute('placeholder');e.setAttribute('placeholder',tr(e.__ph))})}
function setFish(){Object.keys(SP).forEach((id,i)=>{const s=SP[id];if(!s.nr)s.nr=s.n;const f=(FNT[i]||'').split('|');s.n=LANG==='uk'&&f[0]?f[0]:LANG==='en'&&f[1]?f[1]:s.nr})}
function ctryFill(sel){const i=LANG==='uk'?2:LANG==='en'?3:1;sel.innerHTML='';CTRY.forEach(c=>{const o=document.createElement('option');o.value=c[0];o.textContent=c[i];sel.appendChild(o)});sel.value=COUNTRY}
function langChips(){const codes=['ru','uk','en'],names=['Русский','Українська','English'];for(const id of['langList','stLang'])chips(id,names,codes.indexOf(LANG),i=>setLang(codes[i]))}
function setLang(l){LANG=l;store.set('tk_lang',l);document.documentElement.lang=l;setFish();trTree(document.body);trAttrs();ctryFill($('ctrySel'));ctryFill($('stCtry'));langChips();if($('locList').children.length)buildMenu();if(!$('hud').hidden&&typeof hudTop==='function'){hudTop();hudNet()}}
function setCountry(c){COUNTRY=c;store.set('tk_country',c);$('ctrySel').value=c;$('stCtry').value=c}
function initI18n(){setFish();ctryFill($('ctrySel'));ctryFill($('stCtry'));langChips();$('ctrySel').onchange=e=>setCountry(e.target.value);$('stCtry').onchange=e=>setCountry(e.target.value);
 if(!store.get('tk_start',false))$('start').hidden=false;$('stGo').onclick=()=>{store.set('tk_start',true);$('start').hidden=true};
 document.documentElement.lang=LANG;trTree(document.body);trAttrs();
 new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trNode(m.target);else m.addedNodes.forEach(n=>trTree(n))}}).observe(document.body,{childList:true,subtree:true,characterData:true})}

/* ---------- удочка, поплавок, леска ---------- */
const rod=new THREE.Group(),segs=[],NS=7,SL=.32;let prev=rod;
for(let i=0;i<NS;i++){const gp=new THREE.Group();gp.position.z=i?-SL:0;prev.add(gp);const r0=lerp(.02,.006,i/NS),r1=lerp(.02,.006,(i+1)/NS),cg=new THREE.CylinderGeometry(r1,r0,SL,8);cg.translate(0,SL/2,0);cg.rotateX(-Math.PI/2);
 gp.add(new THREE.Mesh(cg,new THREE.MeshPhongMaterial({color:i<2?0x8a5a2b:0x232323,shininess:40})));
 if(i>1){const ring=new THREE.Mesh(new THREE.TorusGeometry(.012,.002,5,8),new THREE.MeshBasicMaterial({color:0xcccccc}));ring.position.z=-SL*.9;gp.add(ring)}
 segs.push(gp);prev=gp}
const tip=new THREE.Object3D();tip.position.z=-SL;prev.add(tip);
const reelM=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.05,12),new THREE.MeshPhongMaterial({color:0x888888,shininess:80}));reelM.rotation.z=Math.PI/2;reelM.position.set(-.04,-.04,-.1);segs[0].add(reelM);
rod.position.set(.28,-.34,-.4);camera.add(rod);
function applyRodAppearance(){const r=activeRod();rod.scale.z=r.cast;segs.forEach((g,i)=>g.children[0].material.color.setHex(i<2?r.color:0x242424));reelM.material.color.setHex(r.color)}
applyRodAppearance();
const bob=new THREE.Group();{const top=new THREE.LatheGeometry([[.001,.1],[.06,.06],[.085,0],[.001,0]].map(a=>new THREE.Vector2(a[0],a[1])),12),bot=new THREE.LatheGeometry([[.001,-.12],[.05,-.08],[.085,0],[.001,0]].map(a=>new THREE.Vector2(a[0],a[1])),12);
 bob.add(new THREE.Mesh(top,new THREE.MeshPhongMaterial({color:0xe03c2c,side:THREE.DoubleSide})),new THREE.Mesh(bot,new THREE.MeshPhongMaterial({color:0xf5f5f0,side:THREE.DoubleSide})));
 const st=new THREE.Mesh(new THREE.CylinderGeometry(.012,.014,.55,6),new THREE.MeshBasicMaterial({color:0xffa31a}));st.position.y=.35;bob.add(st);
 const sp=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.12,6),new THREE.MeshBasicMaterial({color:0xff2a1a}));sp.position.y=.66;bob.add(sp);bob.scale.setScalar(1.6)}
bob.visible=false;scene.add(bob);
const LN=24,lp=new Float32Array(LN*3),lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));
const line=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xf4f4f0,transparent:true,opacity:.75}));line.frustumCulled=false;line.visible=false;scene.add(line);

/* ---------- игра ---------- */
const BAITS=[{id:'worm',n:'Червь'},{id:'dough',n:'Тесто'},{id:'live',n:'Живец'}];
const MAX_LINE_DISTANCE=85;
const G={state:'menu',bait:store.get('tk_bait','worm'),loc:store.get('tk_loc',0),base:0,mx:.5,my:.5,touch:false,pitch:-.08,power:0,hold:false,holdT:0,t:0,bobP:new THREE.Vector3(),dip:0,dipK:0,dipT:0,act:null,fl:null,fg:null,biteT:0,auto:0,net:{n:0,kg:0},tick:0,shoreT:0,shoreD:10,swing:0,rodYaw:0,bend:0,fov:60,tfov:60,caught:null};
let LI=Math.min(G.loc,LOCS.length-1);
const bearing=()=>G.base+(G.touch||G.locked?0:(G.mx-.5)*1.7);
const dirv=b=>({x:Math.sin(b),z:-Math.cos(b)});
const ui={msgT:0};
function msg(t,hot){const m=$('msg');m.textContent=t;m.className='on'+(hot?' hot':'');clearTimeout(ui.msgT);ui.msgT=setTimeout(()=>m.className='',hot?1600:2200)}
function setState(s){G.state=s;const h=$('hint'),pw=$('power'),tn=$('tens'),fi=$('fightInfo'),ac=$('act');pw.hidden=s!=='charge';tn.hidden=s!=='fight';fi.hidden=s!=='fight';
 const T={idle:'Зажми ЛКМ или Пробел — замах, отпусти — заброс',charge:'Отпусти, когда сила нужная',cast:'',wait:'Жди поклёвку. Удерживай для подмотки',bite:'Нажми, чтобы начать вываживание',fight:'Подматывай на паузах и ослабляй фрикцион при рывке',catch:''};h.textContent=tr(T[s]||'');
 ac.textContent=tr(s==='fight'?'ТЯНУТЬ':s==='bite'?'НАЧАТЬ':s==='wait'?'МОТАТЬ':'БРОСОК')}
function hudRod(){const r=activeRod(),button=$('rodBar');if(button)button.textContent=tr(r.name.split(' · ')[0])+' · '+tr('Снасти')}
function hudNet(){let t=0;NET.fish.forEach(f=>t+=f.p);$('hudNet').textContent=tr('Монеты: ')+money(NET.money);$('shopTxt').textContent=tr('Продать улов: ')+NET.fish.length+tr(' рыб на ')+money(t)+tr('  (клавиша B)');hudRod()}
function hudTop(){$('hudLoc').textContent=tr(L.name);$('hudBait').textContent=tr('Наживка: ')+tr(BAITS.find(b=>b.id===G.bait).n)+' (1-3)'}
function resetLine(){bob.visible=false;line.visible=false;G.fg=null;G.fl=null;if(G.act){G.act.mode='wander';G.act.cool=8;G.act=null}G.dip=G.dipK=0}
function shoreDist(b){const d=dirv(b);for(let r=2;r<90;r+=1.5)if(Hf(P.x+d.x*r,P.z+d.z*r)<-.2)return r;return 3}
function press(){G.hold=true;G.holdT=0;if(G.state==='idle'){G.power=0;G.chd=1;setState('charge')}else if(G.state==='bite')hook()}
function release(){const was=G.hold;G.hold=false;if(!was)return;
 if(G.state==='charge'){if(G.power<.1)setState('idle');else doCast()}
 else if(G.state==='wait'&&G.holdT<.3){const f=G.act;if(f&&f.mode==='nibble'){f.mode='flee';f.ft=4;f.cool=14;G.act=null;msg('Рано! Рыба испугалась')}else splash(G.bobP.x,G.bobP.z,3,.4)}}
function doCast(){const b=bearing(),d=dirv(b),dist=7+G.power*(50*activeRod().cast+NET.up.cast*6)+rnd(-1,1);rod.getWorldPosition(G.bobP);tip.getWorldPosition(G.bobP);
 G.fl={t:0,dur:.55+dist/45,from:G.bobP.clone(),to:new THREE.Vector3(P.x+d.x*dist,0,P.z+d.z*dist),H:3+dist*.12};G.swing=1;bob.visible=true;line.visible=true;AUD.cast();setState('cast')}
function land(){const to=G.fl.to;G.bobP.set(to.x,0,to.z);G.fl=null;
 if(Hf(to.x,to.z)>-.25){msg('Мимо воды!');AUD.splash();resetLine();setState('idle');return}
 splash(to.x,to.z,16);AUD.splash();G.t0=G.t;setState('wait')}
function bite(){const f=G.act;if(!f)return;f.mode='bite';G.biteT=2;G.dipK=1;G.dipT=1.3;AUD.plop();ripple(G.bobP.x,G.bobP.z,1.2);msg(tr('КЛЮЁТ! Нажми, чтобы начать вываживание'),true);setState('bite');if(G.hold&&G.holdT>.3)G.auto=.15}
function hook(){const f=G.act;if(!f){setState('wait');return}const bx=G.bobP.x-P.x,bz=G.bobP.z-P.z;
 G.fg={f,dist:Math.hypot(bx,bz),ang:Math.atan2(bx,-bz),tens:35,stam:1,ph:'run',pt:rnd(1,1.8),sd:Math.random()<.5?1:-1,snap:0,slack:0,str:.45+.55*clamp(f.w/f.sp.w[1]*1.6,0,1)};
 f.mode='fight';G.dipK=0;G.dipT=0;splash(G.bobP.x,G.bobP.z,12,1.2);AUD.splash();msg(tr('Рыба на крючке!'),true);setState('fight')}
function fightEnd(why){const f=G.fg.f;f.mode='wander';f.cool=15;f.x=P.x+Math.sin(G.fg.ang)*G.fg.dist;f.z=P.z-Math.cos(G.fg.ang)*G.fg.dist;f.y=-1;G.act=null;
 if(why==='snap'){AUD.snap();msg('Леска лопнула!',true)}else msg('Рыба сошла',true);resetLine();setState('idle')}
function jrnl(){return store.get(ukey('tk_j'),{})}
function caught(){const f=G.fg.f,s=f.sp,J=jrnl(),r=J[s.id]||{n:0,best:0},rec=f.w>r.best,tier=tierOf(s,f.w),pr=priceOf(s,f.w);r.n++;if(rec)r.best=f.w;J[s.id]=r;store.set(ukey('tk_j'),J);
 NET.fish.push({id:s.id,w:+f.w.toFixed(3),p:pr,t:tier});saveNet();hudNet();
 G.caught=f;resetLine();f.mode='held';G.act=null;camera.add(f.mesh);const sc=Math.min(f.len,.8)/f.len;f.mesh.scale.setScalar(f.len*sc);f.mesh.position.set(0,-.12,-1.05);f.mesh.rotation.set(.2,-.5,0);f.mesh.visible=true;
 $('cName').textContent=(tier===2?'РЕДКИЙ ТРОФЕЙ · ':tier===1?'ТРОФЕЙ · ':'')+s.n;
 $('cStats').textContent=f.w.toFixed(2).replace('.',',')+' кг · '+Math.round(f.len*100)+' см';
 $('cNote').textContent=RAR[s.r]+' · '+money(pr)+(rec?(r.n>1?' · Новый рекорд!':' · Новый вид!'):'');$('cNote').style.color=RCOL[s.r];
 if(tier===2||s.r>=3)ANN(MP.name+' поймал '+(tier===2?'редкий трофей: ':'')+s.n+' — '+f.w.toFixed(1).replace('.',',')+' кг!');
 if(MP.room&&MP.room.announce&&(tier===2||s.r>=3))MP.room.announce({sp:s.id,w:f.w,tier});
 AUD.win();$('catch').hidden=false;setState('catch')}
function nextFish(){const f=G.caught;if(!f)return;camera.remove(f.mesh);disposeObject(f.mesh);const i=FISH.indexOf(f);if(i>=0)FISH.splice(i,1);spawnFish(f.sp.id);G.caught=null;$('catch').hidden=true;setState('idle')}

function updFish(dt){const bp=G.bobP,bobOn=G.state==='wait'&&G.act===null;
 for(const f of FISH){if(f.mode==='fight'||f.mode==='held')continue;f.cool=Math.max(0,f.cool-dt);let tx=f.x,tz=f.z,sp=f.speed;
  if(f.mode==='wander'){f.rt-=dt;if(!f.tg||f.rt<0||Math.hypot(f.tg.x-f.x,f.tg.z-f.z)<2)pickTg(f);tx=f.tg.x;tz=f.tg.z;
   if(bobOn&&f.cool<=0&&f.sp.bait.includes(G.bait)&&Math.hypot(bp.x-f.x,bp.z-f.z)<15&&Math.random()<dt*.16*activityFactor(f.sp.activity)){f.mode='approach';G.act=f}}
  else if(f.mode==='approach'){tx=bp.x;tz=bp.z;sp=1.5;if(Math.hypot(bp.x-f.x,bp.z-f.z)<1.3){f.mode='nibble';f.nib=1+(Math.random()*3|0);f.nt=rnd(.8,1.6)}}
  else if(f.mode==='nibble'){f.ph+=dt*2;tx=bp.x+Math.cos(f.ph)*.9;tz=bp.z+Math.sin(f.ph)*.9;sp=.5;f.nt-=dt;if(f.nt<=0){if(f.nib>0){f.nib--;f.nt=rnd(.9,1.8);G.dipK=.4;G.dipT=.35;ripple(bp.x,bp.z,.5)}else bite()}}
  else if(f.mode==='flee'){const a=Math.atan2(f.z-P.z,f.x-P.x);tx=f.x+Math.cos(a)*10;tz=f.z+Math.sin(a)*10;sp=3;f.ft-=dt;if(f.ft<=0)f.mode='wander'}
  if(f.mode==='bite')continue;
  const want=Math.atan2(tz-f.z,tx-f.x);let df=want-f.hd;df=Math.atan2(Math.sin(df),Math.cos(df));f.hd+=clamp(df,-2.5*dt,2.5*dt);
  const nx=f.x+Math.cos(f.hd)*sp*dt,nz=f.z+Math.sin(f.hd)*sp*dt;if(Hf(nx,nz)<-.35){f.x=nx;f.z=nz}else{f.hd+=1.5*dt*3;if(f.mode==='wander')f.rt=0}
  f.y=Math.max(f.ty,Hf(f.x,f.z)+.25);f.y=Math.min(f.y,-.12);f.ph+=dt*(3+sp*3);
  f.mesh.visible=Math.abs(f.x-P.x)+Math.abs(f.z-P.z)<85;f.mesh.position.set(f.x,f.y,f.z);f.mesh.rotation.y=-f.hd;f.mesh.userData.tail.rotation.y=Math.sin(f.ph*2)*.45}}

function updFight(dt){const F=G.fg,f=F.f,s=f.sp,style=FIGHT_STYLES[s.fight]||FIGHT_STYLES.steady,gear=activeRod();F.pt-=dt;
 if(F.pt<=0){if(F.ph==='run'){F.ph='rest';F.pt=rnd(1.2,2.8)}else{F.ph=Math.random()<style.runChance+F.stam*.25?'run':'rest';F.pt=F.ph==='run'?rnd(1.1,2.4)*(.4+F.stam*.6):rnd(1.2,2.6);if(F.ph==='run')F.sd=Math.random()<.5?1:-1}}
 const run=F.ph==='run',force=(run?1:.25)*F.str*(.35+.65*F.stam)*style.power,reel=G.hold,rawTens=(reel?28:4)+force*(reel?72:42)*NET.drag;
 const lineLimit=92+NET.up.line*2+Math.max(0,gear.strength-.9)*12,dragLimit=44+NET.drag*52,slip=Math.max(0,rawTens-dragLimit);
 F.tens+=(Math.min(rawTens,dragLimit+6)-F.tens)*Math.min(1,dt*(run?2.4:3.4));
 if(reel){if(run)F.dist+=(force*(1.1+NET.drag)-gear.reel*.35)*dt;else F.dist-=(1.8+gear.reel*1.6)*(1-NET.drag*.3)*dt}
 else F.dist+=force*(run?2.8:.7)*dt;
 if(slip>0)F.dist+=slip*(run?.055:.018)*dt;
 if(run)F.stam-=dt*(reel?.055:.035);else F.stam+=dt*(reel?.008:.025);F.stam=clamp(F.stam,0,1);
 const oa=F.ang;F.ang+=F.sd*(run?.45:.12)*dt*(.5+force);
 const sd=shoreDist(F.ang);F.dist=Math.max(F.dist,sd+1.2);let fx=P.x+Math.sin(F.ang)*F.dist,fz=P.z-Math.cos(F.ang)*F.dist;
 if(Hf(fx,fz)>-.4&&F.dist>sd+4){F.ang=oa;F.sd*=-1;F.dist-=1;fx=P.x+Math.sin(F.ang)*F.dist;fz=P.z-Math.cos(F.ang)*F.dist}
 F.snap=rawTens>lineLimit?F.snap+dt:Math.max(0,F.snap-dt*2);F.slack=F.tens<10?F.slack+dt:Math.max(0,F.slack-dt*2);
 if(F.snap>.5||F.dist>MAX_LINE_DISTANCE){fightEnd('snap');return}if(F.slack>2){fightEnd('slack');return}
 if(F.dist<sd+1.7){caught();return}
 const near=F.dist<sd+7;f.x=fx;f.z=fz;f.y=near?-.12+Math.sin(G.t*14)*.04:-.4;
 f.hd=Math.atan2(fz-P.z,fx-P.x)+(run?0:F.sd*1.2);f.mesh.visible=true;f.mesh.position.set(fx,f.y,fz);f.mesh.rotation.y=-f.hd;f.mesh.userData.tail.rotation.y=Math.sin(G.t*(run?26:14))*.7;
 G.bobP.set(fx+Math.sin(F.ang)*.4,0,fz-Math.cos(F.ang)*.4);G.dipK=run?.7:.25;
 if(near&&run&&Math.random()<dt*3)splash(fx,fz,3,.5);
 $('tFill').style.left=clamp(F.tens,0,100)+'%';$('fDist').textContent=tr('До берега: ')+Math.max(0,Math.round(F.dist-sd))+' '+tr('м');$('fStam').textContent=tr(run?'Рывок рыбы':(F.stam<.3?'Рыба устала':'Рыба отдыхает'))+' · '+tr('Усталость: ')+Math.round((1-F.stam)*100)+'%';
 if(reel){G.tick+=dt;if(G.tick>.09){G.tick=0;AUD.tick()}}
 G.rodYaw=clamp(F.sd*.0,-.1,.1);G.bend=F.tens/100/gear.strength}

function update(dt){G.t+=dt;const t=G.t;applyTime(dt);skyU.time.value=t;watU.time.value=t;
 for(const r of rip){if(r.z<50)r.z+=dt}
 if(G.state==='menu'){G.base=Math.sin(t*.12)*.7;G.mx=.5}
 /* прицел */
 if(G.state==='fight'&&G.fg){const d=G.fg.ang-G.base;G.base+=d*Math.min(1,dt*1.6)}
 walk(dt);
 if(G.state==='charge'){G.power+=G.chd*dt*.75;if(G.power>=1){G.power=1;G.chd=-1}if(G.power<=0){G.power=0;G.chd=1}$('powerFill').style.width=G.power*100+'%'}
 if(G.hold)G.holdT+=dt;
 if(G.state==='cast'&&G.fl){const F=G.fl;F.t+=dt;const u=Math.min(1,F.t/F.dur);G.bobP.lerpVectors(F.from,F.to,u);G.bobP.y=lerp(F.from.y,0,u)+F.H*4*u*(1-u);if(u>=1)land()}
 if(G.state==='wait'||G.state==='bite'){
  if(G.state==='wait'&&G.hold&&G.holdT>.3&&!(G.act&&G.act.mode==='nibble')){const dx=P.x-G.bobP.x,dz=P.z-G.bobP.z,d=Math.hypot(dx,dz),v=3*dt;if(d>0){G.bobP.x+=dx/d*v;G.bobP.z+=dz/d*v}G.tick+=dt;if(G.tick>.12){G.tick=0;AUD.tick()}
   if(Hf(G.bobP.x,G.bobP.z)>-.15||d<3){resetLine();setState('idle')}}
  else{G.bobP.x+=L.flow[0]*L.cur*dt*.6;G.bobP.z+=L.flow[1]*L.cur*dt*.6}
  if(G.state==='bite'){G.biteT-=dt;if(G.auto>0){G.auto-=dt;if(G.auto<=0)hook()}if(G.biteT<=0&&G.state==='bite'){const f=G.act;if(f){f.mode='flee';f.ft=5;f.cool=15}G.act=null;msg('Упустил клёв…');setState('wait')}}
 }
 updFish(dt);if(G.state==='fight'&&G.fg)updFight(dt);
 /* поплавок и леска */
 if(bob.visible){G.dipT-=dt;if(G.dipT<=0)G.dipK=G.state==='fight'?G.dipK:0;G.dip+=(G.dipK-G.dip)*Math.min(1,dt*9);
  const inAir=G.state==='cast';bob.position.set(G.bobP.x,inAir?G.bobP.y:.02+Math.sin(t*2.2)*.012-G.dip*.5,G.bobP.z);bob.rotation.z=inAir?.4:0}
 /* камера */
 G.fov+=(G.tfov-G.fov)*Math.min(1,dt*6);if(Math.abs(camera.fov-G.fov)>.05){camera.fov=G.fov;camera.updateProjectionMatrix()}
 const b=bearing(),sh=G.state==='fight'&&G.fg?Math.sin(t*40)*.0015*G.fg.tens/50:0;
 camera.position.set(P.x,P.y+(G.state==='menu'?0:Math.sin(t*.9)*.01),P.z);camera.rotation.set(G.pitch+sh,-b,0);
 /* удочка */
 G.swing=Math.max(0,G.swing-dt*3.5);const back=G.state==='charge'?G.power*.55:0,sw=G.swing>0?-Math.sin((1-G.swing)*3.14)*.5:0;
 rod.rotation.x=.55+back+sw;rod.rotation.y=.05+(G.state==='fight'&&G.fg?clamp((G.fg.ang-b)*.3,-.3,.3):0);
 const bt=(G.state==='fight'?G.bend:(G.state==='bite'?.15:.04))*(1.0)+(G.state==='wait'&&G.dip>.3?.1:0);
 for(let i=1;i<NS;i++)segs[i].rotation.x=-bt*.11;rod.visible=G.state!=='menu';
 camera.updateMatrixWorld(true);
 if(line.visible&&bob.visible){tip.getWorldPosition(rod.userData.tp||(rod.userData.tp=new THREE.Vector3()));const a=rod.userData.tp,e=bob.position,span=Math.hypot(e.x-a.x,e.z-a.z),tether=Math.hypot(G.bobP.x-P.x,G.bobP.z-P.z),tn=G.state==='fight'&&G.fg?G.fg.tens/100:G.state==='cast'?.9:G.state==='bite'?.52:clamp(.15+tether/MAX_LINE_DISTANCE*.25,.15,.4),sag=span*.05*(1-tn)+.1;
  for(let i=0;i<LN;i++){const u=i/(LN-1);let y=lerp(a.y,e.y+.5,u)-Math.sin(u*Math.PI)*sag;if(u>.8&&G.state!=='cast')y=Math.max(y,.03);lp[i*3]=lerp(a.x,e.x,u);lp[i*3+1]=y;lp[i*3+2]=lerp(a.z,e.z,u)}lg.attributes.position.needsUpdate=true}
 if(fireflies){const p=fireflies.geometry.attributes.position;for(let i=0;i<p.count;i++){p.setY(i,p.getY(i)+Math.sin(t*1.3+i)*.004);p.setX(i,p.getX(i)+Math.cos(t*.9+i*2)*.006)}p.needsUpdate=true}
 sky.position.copy(camera.position);updParts(dt)}

function canStand(x,z){const dk=L.P.deck;if(dk!==null&&Math.abs(x)<.95&&z<4&&z>-8.3)return true;return Hf(x,z)>.05&&Math.hypot(x,z)<140}
function groundY(x,z){const dk=L.P.deck;if(dk!==null&&Math.abs(x)<.95&&z<4&&z>-8.3)return Math.max(dk,Hf(x,z));return Hf(x,z)}
function walk(dt){if(G.state!=='idle'&&G.state!=='wait'&&G.state!=='bite'&&G.state!=='fight')return;const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(!f&&!s)return;
 const b=bearing(),sp=(keys.ShiftLeft?7:4)*dt,nx=P.x+(Math.sin(b)*f+Math.cos(b)*s)*sp,nz=P.z+(-Math.cos(b)*f+Math.sin(b)*s)*sp;
 const oldX=P.x,oldZ=P.z;
 if(canStand(nx,nz)){P.x=nx;P.z=nz}else if(canStand(nx,P.z))P.x=nx;else if(canStand(P.x,nz))P.z=nz;
 if(G.fg&&(P.x!==oldX||P.z!==oldZ)){
  const fishX=oldX+Math.sin(G.fg.ang)*G.fg.dist,fishZ=oldZ-Math.cos(G.fg.ang)*G.fg.dist;
  const dx=fishX-P.x,dz=fishZ-P.z;
  G.fg.dist=Math.hypot(dx,dz);G.fg.ang=Math.atan2(dx,-dz);
 }
 P.y=groundY(P.x,P.z)+1.7;
 if((G.state==='wait'||G.state==='bite')&&bob.visible&&Math.hypot(G.bobP.x-P.x,G.bobP.z-P.z)>MAX_LINE_DISTANCE){
  resetLine();setState('idle');msg(tr('Слишком далеко от поплавка — заброс завершён'));
 }}

/* ---------- интерфейс ---------- */
function hexCss(n){return '#'+new THREE.Color(n).getHexString()}
function chips(id,items,cur,on){const el=$(id);el.innerHTML='';items.forEach((n,i)=>{const b=document.createElement('button');b.className='chipb';b.textContent=n;b.setAttribute('aria-pressed',i===cur);b.onclick=()=>{[...el.children].forEach((e,k)=>e.setAttribute('aria-pressed',k===i));on(i)};el.appendChild(b)})}
function buildMenu(){const ll=$('locList');ll.innerHTML='';LOCS.forEach((l,i)=>{const b=document.createElement('button');b.className='loc';b.setAttribute('aria-pressed',i===LI);
 const species=Object.values(SP).filter(s=>s.loc.includes(l.code)).map(s=>s.n).join(', ');
 b.innerHTML='<i style="background:linear-gradient(180deg,'+hexCss(l.top)+','+hexCss(l.hor)+' 55%,'+hexCss(l.deep)+' 56%)"></i><div><strong>'+tr(l.name)+'</strong><span>'+tr(l.desc)+'</span><span>'+tr('Виды: ')+' '+species+'</span></div>';
 b.onclick=()=>{AUD.init();selectLoc(i)};ll.appendChild(b)});
 chips('baitList',BAITS.map(b=>b.n),BAITS.findIndex(b=>b.id===G.bait),i=>setBait(BAITS[i].id));
 chips('qList',QS.map(q=>q.n),Q,i=>{
  Q=i;store.set('tk_q',i);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,QS[i].pr));
  renderer.shadowMap.enabled=QS[i].shadows;
  sunL.castShadow=QS[i].shadows;
  sunL.shadow.mapSize.set(i===3?2048:1024,i===3?2048:1024);
  watU.quality.value=QS[i].water;
  resize();selectLoc(LI);
 });
 const tm=['auto','day','night'];chips('tmList',['Авто','День','Ночь'],Math.max(0,tm.indexOf(TOD.mode)),i=>{TOD.mode=tm[i];store.set('tk_tm',tm[i])});
 chips('musList',['Вкл','Выкл'],AUD.musOn?0:1,i=>{AUD.init();AUD.setMusic(i===0)});
 chips('modeList',['Одиночная','Мультиплеер'],MODE==='multi'?1:0,i=>{MODE=i?'multi':'single';store.set('tk_mode',MODE);clearAv()});initAcct();
 const nk=$('nick');nk.value=MP.name;nk.oninput=()=>{const v=nk.value.trim().slice(0,16);if(v){MP.name=v;store.set('tk_nick',v)}}}
function setBait(id){G.bait=id;store.set('tk_bait',id);[...$('baitList').children].forEach((e,i)=>e.setAttribute('aria-pressed',BAITS[i].id===id));hudTop()}
function selectLoc(i){LI=i;store.set('tk_loc',i);[...$('locList').children].forEach((e,k)=>e.setAttribute('aria-pressed',k===i));buildWorld(LOCS[i]);populate()}
function unlock(){try{document.exitPointerLock&&document.exitPointerLock()}catch(e){}}
let charScene=null,charCamera=null,charRenderer=null,charModel=null,charAngle=0;
function charOption(id,items,cur,on){
 const el=$(id);el.innerHTML='';
 items.forEach(item=>{const b=document.createElement('button');b.textContent=item.n;b.setAttribute('aria-pressed',item.id===cur);b.onclick=()=>{[...el.children].forEach(e=>e.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');on(item.id)};el.appendChild(b)});
}
function rebuildCharacterPreview(){
 if(!charScene||!charModel)return;
 charScene.remove(charModel);
 charModel=makeAvatar(MP.name,MP.hue,CHARACTER);
 charModel.position.y=-.15;
 charScene.add(charModel);
}
function initCharacterEditor(){
 if(!charRenderer){
  charScene=new THREE.Scene();
  charCamera=new THREE.PerspectiveCamera(35,1,.1,50);charCamera.position.set(0,1.1,4);charCamera.lookAt(0,.9,0);
  charRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  charRenderer.outputEncoding=THREE.sRGBEncoding;charRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  charRenderer.domElement.style.touchAction='none';
  $('charPreview').appendChild(charRenderer.domElement);
  charScene.add(new THREE.HemisphereLight(0xffffff,0x34434a,1.8));
  const light=new THREE.DirectionalLight(0xffe4c4,1.2);light.position.set(3,5,4);charScene.add(light);
  charModel=makeAvatar(MP.name,MP.hue,CHARACTER);charModel.position.y=-.15;charScene.add(charModel);
  let dragging=false,lastX=0;
  charRenderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;charRenderer.domElement.setPointerCapture(e.pointerId)});
  charRenderer.domElement.addEventListener('pointermove',e=>{if(dragging){charAngle+=(e.clientX-lastX)*.012;lastX=e.clientX}});
  charRenderer.domElement.addEventListener('pointerup',()=>dragging=false);
  charRenderer.domElement.addEventListener('pointercancel',()=>dragging=false);
  charRenderer.setAnimationLoop(()=>{
   const box=$('charPreview').getBoundingClientRect();
   if(box.width>0&&box.height>0){charRenderer.setSize(box.width,box.height,false);charCamera.aspect=box.width/box.height;charCamera.updateProjectionMatrix()}
   if(charModel)charModel.rotation.y=charAngle;
   charRenderer.render(charScene,charCamera);
  });
 }
 charOption('hairStyle',[{id:'natural',n:'Классика'},{id:'short',n:'Короткая'},{id:'long',n:'Длинная'},{id:'buzz',n:'Ёжик'}],CHARACTER.hair,id=>{CHARACTER.hair=id;rebuildCharacterPreview()});
 charOption('faceOptions',[{id:'natural',n:'Светлое'},{id:'warm',n:'Тёплое'},{id:'pale',n:'Бледное'},{id:'tan',n:'Загар'}],CHARACTER.face,id=>{CHARACTER.face=id;rebuildCharacterPreview()});
 charOption('jacketOptions',[{id:'olive',n:'Оливка'},{id:'blue',n:'Синяя'},{id:'orange',n:'Оранжевая'}],CHARACTER.jacket,id=>{CHARACTER.jacket=id;rebuildCharacterPreview()});
 charOption('pantsOptions',[{id:'charcoal',n:'Тёмные'},{id:'blue',n:'Джинсы'},{id:'beige',n:'Бежевые'}],CHARACTER.pants,id=>{CHARACTER.pants=id;rebuildCharacterPreview()});
 charOption('bootsOptions',[{id:'charcoal',n:'Чёрные'},{id:'brown',n:'Коричневые'},{id:'black',n:'Классика'}],CHARACTER.boots,id=>{CHARACTER.boots=id;rebuildCharacterPreview()});
 $('hairColor').value=CHARACTER.hairColor;$('outfitColor').value=CHARACTER.jacketColor;
 rebuildCharacterPreview();
}
function openCharacter(){unlock();initCharacterEditor();$('character').hidden=false}
function closeCharacter(){ $('character').hidden=true }
$('characterBtn').onclick=openCharacter;
$('closeCharacter').onclick=closeCharacter;
$('saveCharacter').onclick=()=>{CHARACTER=Object.assign({},CHARACTER,{hairColor:$('hairColor').value,jacketColor:$('outfitColor').value});store.set(characterKey(),CHARACTER);MP.hue=parseInt(CHARACTER.jacketColor.slice(1),16)%360;closeCharacter()};
$('hairColor').oninput=e=>{CHARACTER.hairColor=e.target.value;rebuildCharacterPreview()};
$('outfitColor').oninput=e=>{CHARACTER.jacketColor=e.target.value;rebuildCharacterPreview()};
function openJournal(){const J=jrnl(),g=$('jGrid');g.innerHTML='';let n=0;
 for(const id in SP){const s=SP[id],r=J[id],c=document.createElement('div');c.className='jc'+(r?'':' off');n+=r?r.n:0;
  const title=document.createElement('b'),dot=document.createElement('i');dot.style.background=RCOL[s.r];title.append(dot,document.createTextNode(s.n));c.appendChild(title);
  const details=[r?tr('Поймано: ')+r.n+tr(' · рекорд ')+r.best.toFixed(2).replace('.',',')+' '+tr('кг'):tr(RAR[s.r])+tr(' · не поймана'),
   tr('Обитает: ')+' '+s.loc.split('').map(code=>tr(HABITAT_LABELS[code]||code)).join(', '),
   tr('Вес: ')+' '+s.w[0]+'–'+s.w[1]+' '+tr('кг')+' · '+tr('Размер: ')+' '+Math.round(s.k*Math.cbrt(s.w[0])*100)+'–'+Math.round(s.k*Math.cbrt(s.w[1])*100)+' '+tr('см'),
   tr('Глубина: ')+' '+s.depth[0]+'–'+s.depth[1]+' '+tr('м')+' · '+tr('Активность: ')+' '+tr(ACTIVITY_LABELS[s.activity]),
   tr('Наживка: ')+' '+s.bait.map(id=>tr((BAITS.find(b=>b.id===id)||{}).n||id)).join(', ')+' · '+tr('Поведение: ')+' '+tr(FIGHT_STYLES[s.fight].label),
   tr('Модель: ')+' '+tr(MODEL_LABELS[s.model])+' · '+tr(PATTERN_LABELS[s.pat]||PATTERN_LABELS[0]),
   tr('Средняя цена: ')+' '+money(priceOf(s,(s.w[0]+s.w[1])/2))];
  for(const text of details){const span=document.createElement('span');span.textContent=text;c.appendChild(span)}g.appendChild(c)}
 $('jSum').textContent=tr('Всего поймано: ')+n+tr('. Видов в дневнике: ')+Object.keys(J).length+tr(' из ')+Object.keys(SP).length+'.';$('journal').hidden=false}
function renderTackle(){
 const list=$('rodInventory');list.innerHTML='';
 const equipped=activeRod();
 $('tackleSummary').textContent=tr('Установлена: ')+tr(equipped.name)+' · '+tr('Баланс: ')+money(NET.money);
 $('dragControl').value=String(Math.round(NET.drag*100));
 $('dragValue').textContent=Math.round(NET.drag*100)+'%';
 for(const r of ROD_CATALOG){
  const owned=NET.rods.includes(r.id),selected=NET.equippedRod===r.id,card=document.createElement('div');
  card.className='jc'+(owned?'':' off');
  const title=document.createElement('b');title.textContent=tr(r.name);card.appendChild(title);
  const stats=document.createElement('span');
  stats.textContent=tr('Дальность: ')+Math.round(r.cast*100)+'% · '+tr('Прочность: ')+Math.round(r.strength*100)+'% · '+tr('Подмотка: ')+Math.round(r.reel*100)+'%';
  card.appendChild(stats);
  const action=document.createElement('button');action.className='btn'+(selected?' primary':'');
  action.textContent=selected?tr('Установлена'):owned?tr('Выбрать'):tr('Купить')+' · '+money(r.price);
  action.disabled=selected||(!owned&&NET.money<r.price);
  action.onclick=()=>owned?selectRod(r.id):buyRod(r.id);
  card.appendChild(action);list.appendChild(card);
 }
}
function selectRod(id){
 if(!NET.rods.includes(id))return;
 NET.equippedRod=id;applyRodAppearance();saveNet();hudRod();renderTackle();
 AUD.init();AUD.tone(920,680,.08,.12,'sine');AUD.tone(1380,0,.06,.12,'triangle',.1);
 msg(tr('Удочка выбрана: ')+tr(activeRod().name.split(' · ')[0]),true);
}
function buyRod(id){
 const r=ROD_BY_ID.get(id);if(!r||NET.rods.includes(id)||NET.money<r.price)return;
 NET.money-=r.price;NET.rods=ownedRods([...NET.rods,id]);NET.equippedRod=id;
 saveNet();hudNet();coin();renderTackle();msg(tr('Удочка куплена и установлена'),true);
}
function openTackle(){unlock();AUD.init();renderTackle();$('tackle').hidden=false}
function closeTackle(){$('tackle').hidden=true}
/* кафе */
const coin=()=>{AUD.tone(1318,0,.1,.25,'triangle');AUD.tone(1760,0,.1,.3,'triangle',.08)};
function renderShop(){const l=$('shopList');l.innerHTML='';let tot=0;NET.fish.forEach(f=>tot+=f.p);
 for(let i=NET.fish.length-1,k=0;i>=0&&k<60;i--,k++){const f=NET.fish[i],s=SP[f.id];if(!s)continue;const b=document.createElement('button');b.className='jc';b.style.textAlign='left';
  b.innerHTML='<b><i style="background:'+RCOL[s.r]+'"></i>'+(f.t?(f.t===2?'★★ ':'★ '):'')+s.n+'</b><span>'+f.w.toFixed(2).replace('.',',')+' кг · '+money(f.p)+' · нажми, чтобы продать</span>';b.onclick=()=>{NET.money+=f.p;NET.fish.splice(i,1);saveNet();coin();hudNet();renderShop()};l.appendChild(b)}
 if(!NET.fish.length)l.innerHTML='<div class="sub" style="max-width:none">Садок пуст. Лови рыбу и неси в кафе.</div>';
 $('shopBal').textContent='Баланс: '+money(NET.money)+' · в садке: '+NET.fish.length+' / '+money(tot);
 const ul=NET.up.line,uc=NET.up.cast,cl=(ul+1)*400,cc=(uc+1)*400;
 $('upLine').textContent=ul>=5?'Леска — максимум':'Прочная леска ур.'+(ul+1)+' — '+money(cl);$('upCast').textContent=uc>=5?'Удилище — максимум':'Дальний заброс ур.'+(uc+1)+' — '+money(cc);
 $('upLine').onclick=()=>{if(ul<5&&NET.money>=cl){NET.money-=cl;NET.up.line++;saveNet();coin();hudNet();renderShop()}};
 $('upCast').onclick=()=>{if(uc<5&&NET.money>=cc){NET.money-=cc;NET.up.cast++;saveNet();coin();hudNet();renderShop()}}}
function openShop(){unlock();renderShop();$('shop').hidden=false}
$('shopBar').onclick=openShop;$('closeShop').onclick=()=>$('shop').hidden=true;
$('sellAll').onclick=()=>{let t=0;NET.fish.forEach(f=>t+=f.p);if(!t)return;NET.money+=t;NET.fish=[];saveNet();coin();hudNet();renderShop();msg('Продано: '+money(t),true)};
function adjustDrag(){NET.drag=clamp(Number($('dragControl').value)/100,.2,.9);$('dragValue').textContent=Math.round(NET.drag*100)+'%';saveNet()}
$('rodBar').onclick=openTackle;$('closeTackle').onclick=closeTackle;$('dragControl').addEventListener('input',adjustDrag);
let mpOn=false;
function startGame(){AUD.init();$('menu').hidden=true;$('hud').hidden=false;G.base=0;G.pitch=-.08;hudTop();hudNet();setState('idle');$('act').hidden=!G.touchUI;
 $('chat').hidden=MODE!=='multi';$('hudOn').hidden=MODE!=='multi';botsOn=MODE==='multi'&&!window.TK_ONLINE;if(MODE==='multi'&&!mpOn){mpOn=true;mpInit()}msg('Мышь — осмотр, WASD — ходить, зажми ЛКМ — заброс')}
function openMenu(){unlock();if(G.caught)nextFish();resetLine();G.hold=false;G.state='menu';$('hud').hidden=true;$('catch').hidden=true;$('shop').hidden=true;$('tackle').hidden=true;$('menu').hidden=false;camera.fov=60;G.fov=G.tfov=60;camera.updateProjectionMatrix()}
$('playBtn').onclick=startGame;$('journalBtn').onclick=openJournal;$('closeJournal').onclick=()=>$('journal').hidden=true;$('cBtn').onclick=nextFish;$('menuBtn').onclick=openMenu;
$('muteBtn').onclick=()=>{AUD.init();AUD.mute(!AUD.on);$('muteBtn').textContent='Звук: '+(AUD.on?'вкл':'выкл')};
const cv=renderer.domElement;let lx=0,ly=0;
addEventListener('pointerdown',()=>AUD.init(),{once:true});
cv.addEventListener('pointerdown',e=>{AUD.init();if(G.state==='menu')return;if(e.pointerType==='touch'){G.touch=true;G.touchUI=true;$('act').hidden=false;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId);return}
 if(!document.pointerLockElement){try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(x){}}if(e.button===0)press()});
addEventListener('pointerup',e=>{if(e.pointerType!=='touch')release()});
document.addEventListener('pointerlockchange',()=>{G.locked=document.pointerLockElement===cv});
document.addEventListener('mousemove',e=>{if(G.locked){G.base+=e.movementX*.0022;G.pitch=clamp(G.pitch-e.movementY*.0022,-1,.9)}});
cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch'){if(e.buttons){G.base+=(e.clientX-lx)*.005;G.pitch=clamp(G.pitch-(e.clientY-ly)*.003,-.5,.35);lx=e.clientX;ly=e.clientY}}else if(!G.locked){G.touch=false;G.mx=e.clientX/innerWidth;G.my=e.clientY/innerHeight;G.pitch=-.06-(G.my-.5)*.55}});
const act=$('act');act.addEventListener('pointerdown',e=>{e.preventDefault();act.setPointerCapture(e.pointerId);press()});act.addEventListener('pointerup',release);act.addEventListener('pointercancel',release);
cv.addEventListener('wheel',e=>{e.preventDefault();G.tfov=clamp(G.tfov+e.deltaY*.03,25,65)},{passive:false});
const ci=$('chatIn');ci.addEventListener('focus',()=>$('chat').classList.add('open'));ci.addEventListener('blur',()=>$('chat').classList.remove('open'));ci.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){sendChat(ci.value);ci.value='';ci.blur()}else if(e.key==='Escape')ci.blur()});
$('nick').addEventListener('keydown',e=>e.stopPropagation());
const keys={};
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;G.hold=false});
addEventListener('keydown',e=>{const ae=document.activeElement;if(ae===ci||ae===$('nick')||ae===$('aUser')||ae===$('aPass'))return;
 if(e.code==='Escape'){if(!$('tackle').hidden)closeTackle();else if(!$('shop').hidden)$('shop').hidden=true;else if(!$('journal').hidden)$('journal').hidden=true;else if(G.state!=='menu')openMenu();return}
 if(!$('tackle').hidden&&e.code!=='KeyI')return;
 if(G.state==='menu')return;
 if(e.code==='Enter'){e.preventDefault();unlock();ci.focus();return}
 if(e.code==='KeyB'){$('shop').hidden?openShop():$('shop').hidden=true;return}
 if(e.code==='KeyI'){$('tackle').hidden?openTackle():closeTackle();return}
 if(e.code==='KeyQ'){const pl=$('plist');pl.hidden=!pl.hidden;refreshOnline();return}
 if(/^F[1-4]$/.test(e.code)){e.preventDefault();const rod=ROD_CATALOG[Number(e.code.slice(1))-1];if(rod&&NET.rods.includes(rod.id))selectRod(rod.id);else msg(tr('Эта удочка ещё не куплена'));return}
 if(e.code==='Space'){e.preventDefault();if(G.state==='catch'){nextFish();return}if(!e.repeat)press();return}
 if(e.code==='KeyZ'&&!e.repeat)G.tfov=G.tfov>40?28:60;
 if(e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3'){if(G.state==='idle')setBait(BAITS[+e.code.slice(5)-1].id)}
 if(e.code.startsWith('Arrow'))e.preventDefault();
 keys[e.code]=true});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Space'&&G.state!=='menu')release()});
let last=performance.now(),clk='',olT=0;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
 const k=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0);if(k&&G.state!=='fight')G.base+=k*dt*1.4;
 update(dt);if(MODE==='multi'&&G.state!=='menu'){updAvatars(dt);updBots(dt)}olT-=dt;if(olT<=0){olT=1;refreshOnline()}
 const hh=Math.floor(TOD.h),mm=Math.floor((TOD.h-hh)*60/10)*10,c=(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;if(c!==clk){clk=c;$('hudTime').textContent='Время '+c}
 renderer.render(scene,camera)}
function setBoot(progress, stage, detail){
 const boot=$('boot');
 if(!boot)return;
 const safe=clamp(progress,0,100);
 $('bootFill').style.width=safe+'%';
 const track=$('bootFill').parentElement;
 if(track)track.setAttribute('aria-valuenow',String(safe));
 $('bootPercent').textContent=safe+'%';
 $('bootStage').textContent=stage;
 $('bootDetail').textContent=detail;
}
function finishBoot(){
 setBoot(100,'Мир готов','Подключение завершено');
 $('boot').classList.remove('error');
 $('boot').classList.add('done');
 setTimeout(()=>{$('boot').hidden=true},650);
}
function failBoot(err){
 console.error(err);
 setBoot(clamp(Number($('bootPercent').textContent.replace('%',''))||0,0,99),'Ошибка загрузки',err&&err.message?err.message:'Не удалось подготовить игру');
 $('boot').classList.add('error');
}
if($('bootRetry')){
 $('bootRetry').addEventListener('click',()=>location.reload());
}
let bootTimer=setTimeout(()=>failBoot(new Error('Превышено время загрузки')),30000);
const bootYield=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
async function bootSequence(){
 try{
  setBoot(8,'Загружаем мир','Подготавливаем Three.js-сцену');
  await bootYield();
  initI18n();
  setBoot(28,'Подготавливаем снасти','Проверяем интерфейс рыбалки');
  await bootYield();
  buildMenu();
  setBoot(48,'Загружаем локацию','Создаём выбранное окружение');
  await bootYield();
  selectLoc(LI);
  setBoot(72,'Подготавливаем снасти','Загружаем рыбалку');
  await bootYield();
  hudNet();
  setBoot(86,'Подключаемся к серверу',MODE==='multi'?'Подготавливаем сеть Socket.IO':'Локальный режим готов');
  await bootYield();
  clearTimeout(bootTimer);
  bootTimer=setTimeout(()=>failBoot(new Error('Превышено время загрузки')),30000);
  requestAnimationFrame(()=>{
   update(1/60);
   renderer.render(scene,camera);
   setBoot(100,'Мир готов','Игра готова');
   clearTimeout(bootTimer);
   finishBoot();
   requestAnimationFrame(loop);
  });
 }
 catch(err){clearTimeout(bootTimer);failBoot(err)}
}
bootSequence();
})();

