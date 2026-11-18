'use strict';
/* Jimothy Timothy Vol. 2: The Lantern Picnic
   Original night-picnic tune and sound effects (WebAudio, no samples).
   Music bus stays at 0.21, the same level as the other Jimothy games.
   Touch: swipe and hold to move, swipe up to jump, ACTION flicks the tail.
   Keyboard: arrows/WASD, Space jump, X action, P pause, M mute. */
var state='boot', G=null, SESSION={score:0};
const AU=(function(){
const A={ctx:null,muted:false,cur:null,next:0,step:0,timer:null,song:null};
const mf=m=>440*Math.pow(2,(m-69)/12);
A.MUSIC_GAIN=0.21;
A.init=function(){if(this.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=this.ctx=new C();
 this.master=c.createGain();this.master.gain.value=this.muted?0:0.8;
 const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;this.master.connect(comp);comp.connect(c.destination);
 this.mus=c.createGain();this.mus.gain.value=A.MUSIC_GAIN;this.mus.connect(this.master);
 this.sfx=c.createGain();this.sfx.gain.value=0.75;this.sfx.connect(this.master);
 const n=c.sampleRate;this.noise=c.createBuffer(1,n,n);const d=this.noise.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}catch(e){this.ctx=null}};
A.unlock=function(){this.init();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume().catch(()=>{})};
A.setMuted=function(m){this.muted=m;if(this.master)this.master.gain.setTargetAtTime(m?0:0.8,this.ctx.currentTime,0.05)};
function env(g,t,a,peak,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)}
function osc(type,f,t,dur,peak,out){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);env(g,t,0.01,peak,dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+0.05);return o}
function tone(m,t,d,v,out){osc('sine',mf(m),t,d,0.16*v,out);osc('triangle',mf(m)*2,t,d*0.4,0.04*v,out)}
function bass(m,t,d,out){osc('triangle',mf(m),t,d,0.2,out)}
function nz(t,d,v,fq,out){const c=A.ctx,s=c.createBufferSource(),g=c.createGain(),fl=c.createBiquadFilter();s.buffer=A.noise;fl.type='bandpass';fl.frequency.value=fq;env(g,t,0.005,v,d);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+d+0.02)}
/* original lantern-picnic melodies: pentatonic, not the Hair Mob swing charts */
const SONGS={
 title:{bpm:96,root:65,lead:[0,4,7,4, 12,7,4,2, 0,2,4,7, 4,2,0,null]},
 play:{bpm:118,root:67,lead:[0,4,7,11, 7,4,7,12, 11,7,4,2, 4,7,4,0]},
 win:{bpm:124,root:72,lead:[0,4,7,12, 7,12,16,12, 7,4,7,11, 12,7,4,0]}
};
function tick(){const c=A.ctx;if(!c||!A.song)return;const S=A.song,sp=60/S.bpm/2;
 while(A.next<c.currentTime+0.18){const t=A.next,i=A.step%16,out=A.mus;
  if(i%4===0)bass(S.root-12+(i%8===4?7:0),t,sp*3.2,out);
  if(i%8===0){tone(S.root,t,sp*3,0.7,out);tone(S.root+4,t,sp*3,0.45,out);tone(S.root+7,t,sp*2.4,0.35,out)}
  const m=S.lead[i];if(m!=null)tone(S.root+12+m,t,sp*1.3,1,out);
  if(i%2===0)nz(t,0.04,i%4===0?0.05:0.03,7000,out);
  A.next+=sp;A.step++}}
A.music=function(name){this.init();if(!this.ctx)return;if(this.cur===name)return;this.cur=name;this.song=SONGS[name]||null;this.step=0;this.next=this.ctx.currentTime+0.05;
 if(this.song&&!this.timer)this.timer=setInterval(tick,40)};
A.stop=function(){this.cur=null;this.song=null};
const FX={
 jump(t,o){const x=osc('square',420,t,0.1,0.06,o);x.frequency.exponentialRampToValueAtTime(760,t+0.09)},
 land(t,o){osc('sine',140,t,0.08,0.12,o)},
 lantern(t,o){[76,79,84].forEach((m,i)=>tone(m,t+i*0.05,0.25,1.1,o))},
 moon(t,o){[84,88,91,96].forEach((m,i)=>tone(m,t+i*0.06,0.3,1.2,o))},
 berry(t,o){tone(91,t,0.12,1,o);tone(96,t+0.06,0.14,0.8,o)},
 boop(t,o){osc('sine',280,t,0.1,0.16,o);osc('sine',520,t+0.05,0.08,0.08,o)},
 hurt(t,o){const x=osc('square',320,t,0.2,0.08,o);x.frequency.exponentialRampToValueAtTime(120,t+0.18)},
 splash(t,o){nz(t,0.3,0.22,900,o);osc('sine',180,t,0.2,0.1,o)},
 flick(t,o){nz(t,0.12,0.12,1800,o);osc('triangle',640,t,0.08,0.06,o)},
 clear(t,o){[72,76,79,84].forEach((m,i)=>tone(m,t+i*0.08,0.2,1.2,o))},
 win(t,o){[72,76,79,84,88,91,96].forEach((m,i)=>tone(m,t+i*0.09,0.22,1.15,o))},
 nope(t,o){osc('square',220,t,0.1,0.06,o);osc('square',180,t+0.12,0.14,0.06,o)},
 menu(t,o){tone(84,t,0.12,0.7,o)}
};
A.fx=function(n){if(!this.ctx||this.muted)return;const f=FX[n];if(f)try{f(this.ctx.currentTime+0.005,this.sfx)}catch(e){}};
return A})();
try{Object.defineProperty(window,'muted',{configurable:true,get:function(){return !!AU.muted}})}catch(e){}

const $=id=>document.getElementById(id);
const cv=$('cv'),c=cv.getContext('2d');
const TAU=Math.PI*2,clamp=(v,a,b)=>v<a?a:v>b?b:v;
const TS=40,GRAV=1700,RUN=205,JUMP=-700;
const SAVE_KEY='pa-test-jtlp_save';
var save={};
try{save=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{}}catch(e){save={}}
if(!save||typeof save!=='object')save={};
save.reached=save.reached|0;save.best=save.best|0;save.cleared=!!save.cleared;save.muted=!!save.muted;
save.levelBest=save.levelBest&&typeof save.levelBest==='object'?save.levelBest:{};
save.run=save.run&&typeof save.run.i==='number'?{i:save.run.i|0,score:save.run.score|0}:null;
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({reached:save.reached,best:save.best,cleared:save.cleared,muted:save.muted,levelBest:save.levelBest,run:save.run}))}catch(e){}}
AU.muted=!!save.muted;

let W=0,H=0,DPR=1,S=1,VV=400,viewW=800,gameH=400,portrait=false,SAFE={t:0,r:0,b:0,l:0};
function readSafe(){const p=$('sp');if(!p)return;const cs=getComputedStyle(p);SAFE={t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0}}
function viewWH(){const vv=window.visualViewport,de=document.documentElement;let w=innerWidth||de.clientWidth,h=innerHeight||de.clientHeight;
 if(de.clientHeight>0)h=Math.min(h,de.clientHeight);if(vv&&vv.scale>0.99&&vv.scale<1.01){w=Math.min(w,vv.width)||w;h=Math.min(h,vv.height)||h}return[Math.max(1,Math.round(w)),Math.max(1,Math.round(h))]}
function resize(){[W,H]=viewWH();DPR=Math.min(devicePixelRatio||1,2);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);portrait=H>W*1.05;readSafe();
 if(portrait){const vw=clamp(W,360,480);S=W/vw;gameH=Math.round(H*0.62);VV=gameH/S}
 else{VV=400;S=H/VV;gameH=H}
 viewW=W/S;layoutPad();document.body.classList.toggle('portrait',portrait)}
function layoutPad(){const pad=$('pad'),ba=$('bAct'),bj=$('bJump'),hint=$('swipeHint');if(!pad)return;
 if(portrait){const top=gameH,ph=H-top;pad.style.top=top+'px';pad.style.height=ph+'px';pad.style.pointerEvents='auto';
  const big=Math.round(clamp(ph*0.36,92,124)),sm=Math.round(big*0.84),bot=Math.round(clamp(ph*0.14,18,46))+SAFE.b;
  Object.assign(bj.style,{width:sm+'px',height:sm+'px',left:'',right:(16+SAFE.r)+'px',bottom:bot+'px'});
  Object.assign(ba.style,{width:sm+'px',height:sm+'px',left:'',right:((16+SAFE.r)+sm+18)+'px',bottom:bot+'px'});
  bj.style.setProperty('font-size',Math.round(Math.min(25,sm*0.27))+'px','important');
  ba.style.setProperty('font-size',Math.round(Math.min(18,sm*0.19))+'px','important');
  hint.style.display='';Object.assign(hint.style,{top:'12px',left:(14+SAFE.l)+'px',right:'14px'})}
 else{pad.style.top='0';pad.style.height=H+'px';pad.style.pointerEvents='none';
  const big=Math.round(clamp(H*0.21,72,96)),sm=Math.round(big*0.82);
  Object.assign(bj.style,{width:sm+'px',height:sm+'px',left:'',right:(14+SAFE.r)+'px',bottom:(12+SAFE.b)+'px',pointerEvents:'auto'});
  Object.assign(ba.style,{width:sm+'px',height:sm+'px',left:'',right:((14+SAFE.r)+sm+16)+'px',bottom:(12+SAFE.b)+'px',pointerEvents:'auto'});
  bj.style.setProperty('font-size',Math.round(Math.min(25,sm*0.27))+'px','important');
  ba.style.setProperty('font-size',Math.round(Math.min(18,sm*0.19))+'px','important');
  hint.style.display='none'}
 if(portrait){bj.style.pointerEvents='auto';ba.style.pointerEvents='auto'}}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,160));
if(window.visualViewport)visualViewport.addEventListener('resize',resize);
setInterval(()=>{const [a,b]=viewWH();if(a!==W||b!==H)resize()},400);

const K={L:0,R:0,U:0,D:0,J:0,A:0},KP={J:0,A:0},VIRT={jump:0,act:0},VIRTP={jump:0,act:0},TOUCH=new Map();
let swipeJump=0,lastJ=0,lastA=0;
const inp={L:0,R:0,jump:0,jumpP:0,act:0,actP:0};
const KEYMAP={ArrowLeft:'L',KeyA:'L',ArrowRight:'R',KeyD:'R',ArrowUp:'U',KeyW:'U',ArrowDown:'D',KeyS:'D',Space:'J',KeyZ:'J',KeyX:'A',KeyJ:'A'};
addEventListener('keydown',e=>{AU.unlock();if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
 const k=KEYMAP[e.code];
 if(document.body.classList.contains('uiopen')){if(!e.repeat)uiKey(e);if(k||e.code==='Enter'||e.code==='Space')e.preventDefault();return}
 if(k){if(!K[k]&&k in KP)KP[k]=1;K[k]=1;e.preventDefault()}
 if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat&&state==='play')pauseGame();
 if(e.code==='KeyM'&&!e.repeat)toggleMute()});
addEventListener('keyup',e=>{const k=KEYMAP[e.code];if(k)K[k]=0});
function swipeDir(t){const dx=t.x-t.ax,dy=t.y-t.ay,d=Math.hypot(dx,dy),o={};if(d<14)return o;if(d>44){t.ax=t.x-dx/d*44;t.ay=t.y-dy/d*44}
 const s=Math.round(Math.atan2(dy,dx)/(Math.PI/4));if(s===0||s===1||s===-1)o.R=1;if(s===4||s===-4||s===3||s===-3)o.L=1;if(s===2||s===1||s===3)o.D=1;if(s===-2||s===-1||s===-3)o.U=1;return o}
function tStart(id,x,y){AU.unlock();TOUCH.set(id,{x,y,ax:x,ay:y,z:{}})}
function tMove(id,x,y){const t=TOUCH.get(id);if(!t)return;t.x=x;t.y=y;const before=t.z.U;t.z=swipeDir(t);if(t.z.U&&!before)swipeJump=1}
function tEnd(id){TOUCH.delete(id)}
function clearInput(){TOUCH.clear();for(const k in K)K[k]=0;for(const k in KP)KP[k]=0;VIRT.jump=VIRT.act=VIRTP.jump=VIRTP.act=0;swipeJump=0;document.querySelectorAll('#pad .big.on').forEach(b=>b.classList.remove('on'))}
function bindSurface(el){el.addEventListener('touchstart',e=>{if(state!=='play')return;if(e.target.closest&&e.target.closest('#pad .big'))return;e.preventDefault();for(const t of e.changedTouches)tStart(t.identifier,t.clientX,t.clientY)},{passive:false});
 el.addEventListener('touchmove',e=>{if(state!=='play')return;e.preventDefault();for(const t of e.changedTouches)tMove(t.identifier,t.clientX,t.clientY)},{passive:false});
 el.addEventListener('touchend',e=>{for(const t of e.changedTouches)tEnd(t.identifier)},{passive:false});
 el.addEventListener('touchcancel',e=>{for(const t of e.changedTouches)tEnd(t.identifier)});
 let md=false;el.addEventListener('mousedown',e=>{if(state!=='play')return;if(e.target.closest&&e.target.closest('#pad .big'))return;md=true;tStart('m',e.clientX,e.clientY)});
 addEventListener('mousemove',e=>{if(md)tMove('m',e.clientX,e.clientY)});
 addEventListener('mouseup',()=>{if(md){md=false;tEnd('m')}})}
function bindBtn(el,k){const on=e=>{e.preventDefault();e.stopPropagation();AU.unlock();if(!VIRT[k])VIRTP[k]=1;VIRT[k]=1;el.classList.add('on')},off=e=>{e.preventDefault();e.stopPropagation();VIRT[k]=0;el.classList.remove('on')};
 el.addEventListener('touchstart',on,{passive:false});el.addEventListener('touchend',off,{passive:false});el.addEventListener('touchcancel',off,{passive:false});
 el.addEventListener('mousedown',on);el.addEventListener('mouseup',off);el.addEventListener('mouseleave',off);el.addEventListener('contextmenu',e=>e.preventDefault())}
addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(state==='play')pauseGame()}});
const GP={on:false,L:0,R:0,U:0,D:0,J:0,A:0,prev:{}};
function pollPad(){let pads=[];try{pads=navigator.getGamepads?navigator.getGamepads():[]}catch(e){}let p=null;for(const q of pads||[])if(q&&q.connected!==false&&q.buttons&&q.buttons.length){p=q;break}
 if(!p){if(GP.on){GP.on=false;toast('Controller disconnected')}GP.L=GP.R=GP.U=GP.D=GP.J=GP.A=0;return}
 if(!GP.on){GP.on=true;toast('Controller connected');refreshCtl()}
 const b=i=>!!(p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>0.5)),ax=i=>p.axes&&p.axes.length>i?p.axes[i]:0;
 const x=ax(0),y=ax(1);GP.L=b(14)||x<-0.4?1:0;GP.R=b(15)||x>0.4?1:0;GP.U=b(12)||y<-0.55?1:0;GP.D=b(13)||y>0.55?1:0;
 GP.J=b(0)?1:0;GP.A=(b(2)||b(1))?1:0;
 const now={st:b(9),a:b(0),u:GP.U,d:GP.D},pr=GP.prev,edge=k=>now[k]&&!pr[k];GP.prev=now;
 if(edge('st')){if(state==='play')pauseGame();else if(state==='pause')resumeGame()}
 if(document.body.classList.contains('uiopen')){if(edge('u'))gpFocus(gpIdx-1);if(edge('d'))gpFocus(gpIdx+1);
  if(edge('a')){const t=document.querySelector('#ui .gpf')||document.querySelector('#ui [data-a]');if(t)t.click()}}}
addEventListener('gamepadconnected',()=>pollPad());
let gpIdx=0,kbUsed=false;
addEventListener('keydown',()=>{kbUsed=true},{once:true});
function gpFocus(i,ns){const bs=[...document.querySelectorAll('#ui [data-a]')];if(!bs.length)return;gpIdx=(i+bs.length)%bs.length;bs.forEach((b,j)=>b.classList.toggle('gpf',j===gpIdx));if(!ns){try{bs[gpIdx].scrollIntoView({block:'nearest'})}catch(e){}AU.fx('menu')}}
function uiKey(e){const nav={ArrowDown:1,ArrowRight:1,KeyS:1,KeyD:1,ArrowUp:-1,ArrowLeft:-1,KeyW:-1,KeyA:-1}[e.code];
 if(nav)gpFocus(gpIdx+(document.querySelector('#ui .gpf')?nav:0));
 else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyZ'){const t=document.querySelector('#ui .gpf')||document.querySelector('#ui [data-a]');if(t)t.click()}
 else if(e.code==='Escape'||e.code==='Backspace'||e.code==='KeyP'){const bk=document.querySelector('#ui [data-a="back"],#ui [data-a="resume"]');if(bk)bk.click()}}
function readInput(){pollPad();let L=K.L||GP.L,R=K.R||GP.R;
 for(const t of TOUCH.values()){if(t.z.L)L=1;if(t.z.R)R=1}
 inp.L=L&&!R?1:0;inp.R=R&&!L?1:0;
 const j=!!(K.J||GP.J||VIRT.jump||VIRTP.jump||KP.J);inp.jumpP=((j&&!lastJ)||swipeJump||KP.J||VIRTP.jump)?1:0;inp.jump=j||swipeJump?1:0;lastJ=j;swipeJump=0;
 const a=!!(K.A||GP.A||VIRT.act||VIRTP.act||KP.A);inp.actP=(a&&!lastA)||KP.A||VIRTP.act?1:0;inp.act=a?1:0;lastA=a;
 VIRTP.jump=VIRTP.act=0;KP.J=KP.A=0}

const IMG={},META={};
function loadArt(onp){return fetch('art/meta.json?v='+VERSION).then(r=>r.json()).then(m=>{Object.assign(META,m);const ns=Object.keys(m);let done=0;
 return Promise.all(ns.map(n=>new Promise(res=>{const im=new Image();im.onload=()=>{IMG[n]=im;done++;onp&&onp(done/ns.length);res()};im.onerror=()=>{done++;onp&&onp(done/ns.length);res()};im.src='art/'+n+'.webp?v='+VERSION})))}).catch(()=>{})}
function spr(n,x,y,sc,flip,rot,ay){const im=IMG[n];if(!im)return;const w=im.width*0.5*sc,h=im.height*0.5*sc;ay=ay==null?1:ay;
 c.save();c.translate(x,y);if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(im,-w/2,-h*ay,w,h);c.restore();return h}

const THEMES={
 meadow:{sky:['#101848','#3a4e96','#f0a070'],hill:'#1c6b40',hill2:'#134e30',grass:'#3cba58',dirt:'#7a4a28',pad:'wood',trees:1},
 creek:{sky:['#0c1438','#244888','#68a0c8'],hill:'#143828',hill2:'#0e2418',grass:'#2f9a48',dirt:'#6a4428',pad:'lily',trees:1,water:1},
 orchard:{sky:['#241440','#6a3a58','#e88858'],hill:'#3a2818',hill2:'#2a1808',grass:'#4aaa40',dirt:'#6a3a20',pad:'wood',trees:1},
 wind:{sky:['#101830','#305080','#88a8c0'],hill:'#2a4860',hill2:'#1a3048',grass:'#3a9850',dirt:'#5a4030',pad:'wood',trees:0},
 grove:{sky:['#1a1038','#503070','#e08090'],hill:'#204030',hill2:'#143028',grass:'#36a858',dirt:'#6a4030',pad:'lily',trees:1,lights:1}
};
const LEVELS=[
 {id:'1',name:'Meadow Glow',theme:'meadow',song:'play',par:45,
  plan:['The wind dropped paper lanterns in the grass.','Light every one, then step on the picnic blanket.','One lantern sits on a little rise. Jump to reach it.'],
  done:'The meadow is glowing. Noodles saved you a warm spot.',
  w:40,h:12,ground:10,player:3,goal:36,
  holes:[],plats:[[16,9,2]],
  lanterns:[[6,10],[11,10],[17,9],[24,10],[30,10],[35,10]],
  berries:[[13,10],[31,10]]},
 {id:'2',name:'Creek Hop',theme:'creek',song:'play',par:60,
  plan:['Lily pads cross the night creek.','The frogs are excited, not mean. Hop over them or boop them with ACTION.','Light the lanterns on the pads too.'],
  done:'The creek sparkles. The frogs say goodnight.',
  w:46,h:12,ground:10,player:3,goal:43,
  holes:[[12,2],[24,2],[34,2]],plats:[[12,9,2],[24,9,2],[34,9,2]],
  frogs:[{x:19,left:17,right:21}],
  lanterns:[[6,10],[13,9],[18,10],[25,9],[30,10],[35,9],[40,10]],
  berries:[[9,10],[38,10]]},
 {id:'3',name:'Orchard Roll',theme:'orchard',song:'play',par:60,
  plan:['Apples are rolling through the orchard.','Jump them, or flick them dizzy with ACTION.','Some lanterns sit up in the branches.'],
  done:'The orchard smells like pie. Almost blanket time.',
  w:46,h:12,ground:10,player:3,goal:43,
  plats:[[14,8,3],[31,8,2]],
  apples:[{x:11,left:8,right:16,spd:62},{x:30,left:26,right:36,spd:62}],
  frogs:[{x:21,left:19,right:23}],
  lanterns:[[7,10],[15,8],[20,10],[27,10],[32,8],[36,10],[41,10]],
  berries:[[10,10],[34,10]]},
 {id:'4',name:'Windy Hill',theme:'wind',song:'play',par:65,
  plan:['The hill wind pushes. Hold your swipe to walk through it.','A cloud can give you a ride over the gap.','You can also take a running jump.'],
  done:'You made it over the hill. The grove is close.',
  w:46,h:12,ground:10,player:3,goal:43,
  holes:[[18,2],[36,2]],plats:[[18,9,2],[36,9,2]],
  winds:[{x:8,len:8,v:70},{x:26,len:8,v:-60}],
  clouds:[{tx:19,row:8,from:16.5,to:21.5,speed:36}],
  lanterns:[[6,10],[12,10],[19,9],[24,10],[30,10],[37,9],[42,10]],
  berries:[[10,10],[28,10]]},
 {id:'5',name:'Picnic Grove',theme:'grove',song:'play',par:75,
  plan:['This is the picnic grove. Light the path.','The moon lantern is a bonus if you can reach the branch.','Then step on the blanket. Noodles has the pie.'],
  done:'Every lantern is awake. The picnic can begin!',
  w:52,h:12,ground:10,player:3,goal:48,
  holes:[[14,2],[30,2]],plats:[[14,9,2],[30,9,2],[44,8,3]],
  apples:[{x:22,left:19,right:26,spd:58}],
  frogs:[{x:37,left:35,right:40}],
  winds:[{x:20,len:6,v:50}],
  clouds:[{tx:15,row:8,from:13.2,to:17.4,speed:34}],
  lanterns:[[6,10],[11,10],[15,9],[21,10],[26,10],[31,9],[36,10],[43,10]],
  moon:[45,8],
  berries:[[9,10],[24,10],[40,10]]}
];

function surfaceY(grid,tx){if(tx<0||tx>=grid[0].length)return null;for(let ty=0;ty<grid.length;ty++)if(grid[ty][tx]===1)return ty*TS;return null}
function buildLevel(spec){
 const H=spec.h,W=spec.w,GR=spec.ground,grid=[];
 for(let y=0;y<H;y++){const row=new Array(W).fill(0);if(y>=GR)for(let x=0;x<W;x++)row[x]=1;grid.push(row)}
 for(const [x,len] of spec.holes||[])for(let i=0;i<len;i++)for(let y=GR;y<H;y++)grid[y][x+i]=3;
 for(const [x,row,w] of spec.plats||[])for(let i=0;i<w;i++)if(grid[row]&&x+i>0&&x+i<W-1)grid[row][x+i]=2;
 const ents=[],px=t=>(t+0.5)*TS;
 const add=(k,tx,row,extra)=>{ents.push(Object.assign({k,x:px(tx),y:row*TS-20,got:0,dizzy:0,scored:0},extra||{}))};
 for(const [tx,row] of spec.lanterns||[])add('lantern',tx,row);
 if(spec.moon)add('moon',spec.moon[0],spec.moon[1]);
 for(const [tx,row] of spec.berries||[])add('berry',tx,row);
 for(const f of spec.frogs||[])ents.push({k:'frog',x:px(f.x),y:GR*TS,left:px(f.left),right:px(f.right),dir:1,vy:0,hop:0.4,dizzy:0,scored:0,onG:true});
 for(const a of spec.apples||[])ents.push({k:'apple',x:px(a.x),y:GR*TS-16,left:px(a.left),right:px(a.right),dir:1,vy:0,rot:0,dizzy:0,scored:0,spd:a.spd||64});
 for(const cl of spec.clouds||[])ents.push({k:'cloud',x:px(cl.tx),y:cl.row*TS,x0:cl.from*TS,x1:cl.to*TS,dir:1,spd:cl.speed,vx:0,hw:54});
 const goal={k:'goal',x:px(spec.goal),y:GR*TS};
 const winds=(spec.winds||[]).map(w=>({x0:w.x*TS,x1:(w.x+w.len)*TS,v:w.v}));
 return {grid,w:W,h:H,ground:GR,ents,goal,winds,mapW:W*TS,mapH:H*TS};
}

let pending=null;
function startLevel(i,practice,score){
 const spec=LEVELS[i];if(!spec)return;
 const L=buildLevel(spec);
 const gy=spec.ground*TS;
 G={si:i,spec,L,practice:!!practice,t:0,hearts:3,lit:0,need:spec.lanterns.length,banner:3.2,scoreAt:score||0,
  levelStart:score||0,chain:0,lastLit:-9,boops:0,berries:0,moons:0,gotMoon:0,won:0,fail:0,
  parts:[],texts:[],cam:{x:0,y:0},shake:0,nagged:0,checkpoint:{x:(spec.player+0.5)*TS,y:gy},cpT:0};
 SESSION.score=G.levelStart;
 G.p=makePlayer((spec.player+0.5)*TS,gy);
 if(!practice){save.run={i,score:G.levelStart};persist()}
 hideUI();state='play';clearInput();AU.music('play');last=performance.now();snapCam(true);
}
function makePlayer(x,y){return {x,y,vx:0,vy:0,w:30,h:54,face:1,onG:false,coy:0,buf:0,cut:false,inv:0,flick:0,flickCd:0,runDist:0,hurt:0,prevY:y,riding:null}}

function cellAt(grid,tx,ty){if(tx<0||tx>=grid[0].length)return 1;if(ty<0)return 0;if(ty>=grid.length)return 0;return grid[ty][tx]}
function hits(p,x,y,pred){const x0=Math.floor((x-p.w/2)/TS),x1=Math.floor((x+p.w/2-0.01)/TS),y0=Math.floor((y-p.h)/TS),y1=Math.floor((y-0.01)/TS),out=[];
 for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const t=cellAt(G.L.grid,tx,ty);if(pred(t))out.push({tx,ty,t})}return out}
function resolveX(p){for(let n=0;n<4;n++){const hs=hits(p,p.x,p.y,t=>t===1);if(!hs.length)return;const h=hs[0];
 if(p.vx>0||p.x>(h.tx+0.5)*TS)p.x=h.tx*TS-p.w/2-0.05;else p.x=(h.tx+1)*TS+p.w/2+0.05;p.vx=0}}
function resolveY(p,prevY){p.onG=false;p.riding=null;
 if(p.vy<0){const hs=hits(p,p.x,p.y,t=>t===1);
  if(hs.length){let bot=-1e9;for(const h of hs)bot=Math.max(bot,(h.ty+1)*TS);p.y=bot+p.h+0.05;p.vy=0}}
 if(p.vy>=0){const x0=Math.floor((p.x-p.w/2)/TS),x1=Math.floor((p.x+p.w/2-0.01)/TS);let land=null;
  for(let tx=x0;tx<=x1;tx++)for(let ty=0;ty<G.L.h;ty++){const t=cellAt(G.L.grid,tx,ty);if(t!==1&&t!==2)continue;const top=ty*TS;
   if(prevY<=top+1&&p.y>=top-0.5&&p.y-p.h<top-1){if(land==null||top<land)land=top}}
  if(land!=null){p.y=land;p.vy=0;p.onG=true;p.coy=0.12}
  else{const hs=hits(p,p.x,p.y,t=>t===1);if(hs.length){let top=1e9;for(const h of hs)top=Math.min(top,h.ty*TS);p.y=top;p.vy=0;p.onG=true;p.coy=0.12}}}}
function windAt(x){let v=0;for(const w of G.L.winds)if(x>=w.x0&&x<=w.x1)v+=w.v;return v}
function updatePlayer(p,dt){if(G.won||p.dead){p.vx*=0.8;p.vy=Math.min(900,p.vy+GRAV*dt);return}
 const prevY=p.y;p.prevY=prevY;
 const wind=windAt(p.x);
 let target=(inp.R?RUN:0)-(inp.L?RUN:0);
 if(inp.R||inp.L)target+=wind;else target=wind*0.12;
 const acc=(p.onG?1500:980)*dt;p.vx+=clamp(target-p.vx,-acc,acc);
 if(inp.R)p.face=1;else if(inp.L)p.face=-1;
 if(inp.jumpP)p.buf=0.14;
 p.buf-=dt;p.coy-=dt;p.inv=Math.max(0,p.inv-dt);p.flick=Math.max(0,p.flick-dt);p.flickCd=Math.max(0,p.flickCd-dt);p.hurt=Math.max(0,p.hurt-dt);
 if(p.buf>0&&(p.onG||p.coy>0)){p.vy=JUMP;p.onG=false;p.coy=0;p.buf=0;p.cut=false;p.riding=null;AU.fx('jump')}
 if(!inp.jump&&p.vy<0&&!p.cut){if(p.vy<-460)p.vy=-460;p.cut=true}
 if(inp.actP&&p.flickCd<=0)doFlick(p);
 p.vy=Math.min(860,p.vy+GRAV*dt);
 p.x+=p.vx*dt;resolveX(p);
 const minX=22,maxX=G.L.mapW-22;if(p.x<minX){p.x=minX;if(p.vx<0)p.vx=0}if(p.x>maxX){p.x=maxX;if(p.vx>0)p.vx=0}
 p.y+=p.vy*dt;resolveY(p,prevY);
 for(const e of G.L.ents)if(e.k==='cloud'){const top=e.y,hw=e.hw;
  if(p.vy>=0&&prevY<=top+2&&p.y>=top-1&&p.y<=top+24&&Math.abs(p.x-e.x)<hw+p.w*0.35){p.y=top;p.vy=0;p.onG=true;p.coy=0.1;p.riding=e}}
 if(p.riding){p.x+=p.riding.vx*dt;resolveX(p)}
 if(p.onG){p.runDist+=Math.abs(p.vx)*dt;
  const tx=Math.floor(p.x/TS),under=surfaceY(G.L.grid,tx);
  if(under!=null&&Math.abs(p.y-under)<8){G.cpT-=dt;if(G.cpT<=0){G.cpT=0.35;G.checkpoint={x:p.x,y:under}}}}
 if(!p.onG&&p.y>G.L.ground*TS+70)pit(p)}
function doFlick(p){p.flick=0.18;p.flickCd=0.4;AU.fx('flick');const ox=p.x+p.face*46,oy=p.y-30;
 burst(ox,oy,7,['#ffe080','#fff']);
 for(const e of G.L.ents){if(e.got)continue;const dx=e.x-ox,dy=(e.k==='cloud'?e.y:e.y)-oy;if(dx*dx+dy*dy>78*78)continue;
  if(e.k==='lantern'||e.k==='moon'||e.k==='berry')collect(e);
  else if((e.k==='frog'||e.k==='apple')&&e.dizzy<=0)boop(e,p.face)}}
function boop(e,face){e.dizzy=1.5;e.vy=-260;e.dir=face||e.dir||1;if(!e.scored){e.scored=1;G.boops++;G.scoreAdd=40;addScore(40);floatText(e.x,e.y-30,'BOOP!','#fff');AU.fx('boop')}else AU.fx('boop')}
function addScore(n){SESSION.score+=n}
function collect(e){if(e.got)return;e.got=1;
 if(e.k==='lantern'){G.lit++;const chain=G.t-G.lastLit<3.2;G.chain=chain?G.chain+1:1;G.lastLit=G.t;const bonus=20*Math.max(0,G.chain-1);addScore(100+bonus);floatText(e.x,e.y-16,bonus?('+'+ (100+bonus)):'+100','#ffe080');AU.fx('lantern');burst(e.x,e.y,10,['#ffd060','#fff4c0','#ffaa30']);
  if(G.lit>=G.need){toast('All lanterns lit! Find the blanket.');AU.fx('clear')}}
 else if(e.k==='moon'){G.gotMoon=1;G.moons++;addScore(300);floatText(e.x,e.y-16,'MOON +300','#fff6c0');AU.fx('moon');burst(e.x,e.y,14,['#fff6c0','#ffe080'])}
 else if(e.k==='berry'){G.berries++;if(G.hearts<3){G.hearts++;floatText(e.x,e.y-16,'+ HEART','#ffb0c8')}else{addScore(50);floatText(e.x,e.y-16,'+50','#d0b0ff')}AU.fx('berry');burst(e.x,e.y,8,['#c080ff','#fff'])}}
function hurt(p,fromX){if(p.inv>0||G.won||p.dead)return;G.hearts--;p.inv=1.45;p.hurt=0.45;p.vy=-300;p.vx=fromX<p.x?240:-240;p.onG=false;G.shake=7;AU.fx('hurt');
 if(G.hearts<=0){p.dead=1;G.fail=0.7}}
function pit(p){if(p.inv>0||G.won)return;hurt(p,p.x+10);AU.fx('splash');burst(p.x,G.L.ground*TS,8,['#8fd0ff','#fff']);
 if(G.hearts>0){p.x=G.checkpoint.x;p.y=G.checkpoint.y;p.vx=0;p.vy=0;p.inv=1.3;toast('Splash! Back to safe grass.')}}
function floatText(x,y,txt,col){G.texts.push({x,y,txt,col,l:0.85})}
function burst(x,y,n,colors){for(let i=0;i<n;i++)G.parts.push({x,y,vx:(Math.random()-0.5)*180,vy:-40-Math.random()*160,g:500,l:0.4+Math.random()*0.35,s:2+Math.random()*3,c:colors[i%colors.length]})}
function near(ax,ay,bx,by,r){const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy<r*r}
function updateEnts(dt){const p=G.p,grid=G.L.grid,GR=G.L.ground*TS;
 for(const e of G.L.ents){if(e.k==='cloud'){e.x+=e.dir*e.spd*dt;e.vx=e.dir*e.spd;if(e.x<e.x0||e.x>e.x1){e.dir*=-1;e.x=clamp(e.x,e.x0,e.x1);e.vx=e.dir*e.spd}continue}
  if(e.got)continue;e.dizzy=Math.max(0,e.dizzy-dt);
  if(e.k==='apple'){if(e.dizzy>0){e.vy=Math.min(700,e.vy+GRAV*dt);e.y+=e.vy*dt;const gy=surfaceY(grid,Math.floor(e.x/TS));if(gy!=null&&e.y>gy-16){e.y=gy-16;e.vy=0}e.rot+=dt*6}
   else{const nx=e.x+e.dir*e.spd*dt;if(nx<e.left||nx>e.right||surfaceY(grid,Math.floor(nx/TS))==null)e.dir*=-1;e.x+=e.dir*e.spd*dt;const gy=surfaceY(grid,Math.floor(e.x/TS));e.y=(gy==null?GR:gy)-16;e.rot+=e.dir*dt*5}}
  else if(e.k==='frog'){e.hop-=dt;if(e.dizzy<=0&&e.onG&&e.hop<=0){e.vy=-300;e.onG=false;e.hop=1.15+Math.random()*0.5;if(e.x<e.left+8)e.dir=1;else if(e.x>e.right-8)e.dir=-1}
   if(e.dizzy>0)e.vy=Math.min(700,(e.vy||0)+GRAV*dt);
   else if(!e.onG)e.vy=Math.min(700,e.vy+GRAV*dt);
   const nx=e.x+(e.dizzy>0?e.dir*40:e.dir*70)*dt;if(nx>e.left&&nx<e.right&&surfaceY(grid,Math.floor(nx/TS))!=null)e.x=nx;else e.dir*=-1;
   if(!e.onG||e.dizzy>0)e.y+=e.vy*dt;const gy=surfaceY(grid,Math.floor(e.x/TS));
   if(gy!=null&&e.y>=gy){e.y=gy;e.vy=0;e.onG=true}else e.onG=false}
  if((e.k==='lantern'||e.k==='moon'||e.k==='berry')&&!e.got){const dx=Math.abs(p.x-e.x),reach=e.k==='berry'?28:46;
   if(dx<reach&&e.y<p.y+16&&e.y>p.y-120)collect(e)}
  if((e.k==='frog'||e.k==='apple')&&e.dizzy<=0&&!p.dead&&!G.won){const hw=e.k==='frog'?26:16,hh=e.k==='frog'?22:16,top=e.y-(e.k==='apple'?16:hh);
   const xHit=Math.abs(p.x-e.x)<p.w/2+hw-6;if(xHit&&p.vy>40&&p.prevY<=top+8&&p.y>=top){p.vy=-520;p.onG=false;p.cut=false;boop(e,p.face);AU.fx('jump')}
   else if(xHit&&p.inv<=0&&Math.abs((p.y-p.h*0.45)-(e.y-10))<30)hurt(p,e.x)}}}
function updateGoal(){const p=G.p,g=G.L.goal;if(G.won||p.dead)return;
 if(Math.abs(p.x-g.x)<36&&Math.abs(p.y-g.y)<28){if(G.lit<G.need){if(G.nagged<=0){G.nagged=1.4;toast('Still some lanterns in the dark!');AU.fx('nope');p.vx=-p.face*160}}else{G.won=1;G.wonT=0.85;AU.fx('win');burst(g.x,g.y-20,18,['#ffd060','#fff','#ff8a3a'])}}}
function finishLevel(){const spec=G.spec,elapsed=G.t,timeBonus=Math.max(0,Math.round((spec.par-elapsed)*8)),heartBonus=G.hearts*80;
 addScore(timeBonus+heartBonus);G.timeBonus=timeBonus;G.heartBonus=heartBonus;
 const gained=SESSION.score-G.levelStart;save.levelBest[spec.id]=Math.max(save.levelBest[spec.id]|0,gained);
 if(!G.practice){save.reached=Math.max(save.reached,Math.min(LEVELS.length-1,G.si+1));
  if(G.si>=LEVELS.length-1){save.cleared=true;save.run=null;if(SESSION.score>save.best)save.best=SESSION.score}else save.run={i:G.si+1,score:SESSION.score}}
 persist();
 if(!G.practice&&G.si>=LEVELS.length-1)endingScreen();else clearScreen()}
function failLevel(){SESSION.score=G.levelStart;if(!G.practice&&save.run)save.run.score=G.levelStart;persist();
 state='fail';AU.music('title');show(`<h2>LANTERNS WAIT</h2><p class="big">The picnic is still there. Take a breath and try this path again.</p><p class="sub">Hearts refill. Your picnic score from earlier paths stays.</p>
 <div class="tbtns"><button class="btn go" data-a="retry">TRY AGAIN</button><button class="btn alt" data-a="levels">PATHS</button><button class="btn dim" data-a="title">TITLE</button></div>`,'menu')}

function update(dt){const p=G.p;G.t+=dt;G.banner=Math.max(0,G.banner-dt);G.nagged=Math.max(0,G.nagged-dt);G.shake=Math.max(0,G.shake-dt*18);
 if(G.fail>0){G.fail-=dt;if(G.fail<=0)failLevel();return}
 if(!G.won)updatePlayer(p,dt);else{G.wonT-=dt;p.face=1;p.vx*=0.8}
 if(state!=='play')return;
 updateEnts(dt);updateGoal();
 for(const q of G.parts){q.l-=dt;q.vy+=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt}G.parts=G.parts.filter(q=>q.l>0);
 for(const t of G.texts){t.l-=dt;t.y-=36*dt}G.texts=G.texts.filter(t=>t.l>0);
 if(G.won&&G.wonT<=0)finishLevel()}

function snapCam(instant){const p=G.p,pad=portrait?0:110/S;const playH=VV-pad;
 let ty=G.L.ground*TS+36-(playH*0.78);const minY=Math.min(0,G.L.mapH-VV),maxY=Math.max(0,G.L.mapH-VV);
 ty=clamp(ty,minY,maxY);const tx=clamp(p.x-viewW*0.36,0,Math.max(0,G.L.mapW-viewW));
 if(instant){G.cam.x=tx;G.cam.y=ty}else{G.cam.x+=(tx-G.cam.x)*0.18;G.cam.y+=(ty-G.cam.y)*0.12}}

function drawSky(){const th=THEMES[G.spec.theme],g=c.createLinearGradient(0,0,0,portrait?gameH:H);
 g.addColorStop(0,th.sky[0]);g.addColorStop(0.55,th.sky[1]);g.addColorStop(1,th.sky[2]);c.fillStyle=g;c.fillRect(0,0,W,portrait?gameH:H);
 const skyH=portrait?gameH:H;c.fillStyle='#fff8dc';
 for(let i=0;i<40;i++){const x=((i*97)%W),y=((i*53)%Math.max(20,skyH*0.45));if((i+Math.floor(G.t*2))%5===0)c.globalAlpha=0.45;c.fillRect(x,y,2,2);c.globalAlpha=1}
 const mx=W*(portrait?0.62:0.78),my=SAFE.t+(portrait?46:34),mr=portrait?18:26;c.fillStyle='#fff3c4';c.beginPath();c.arc(mx,my,mr,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(mx-mr*0.28,my-mr*0.28,mr*0.28,0,TAU);c.fill();
 const base=(G.L.ground*TS-150-G.cam.y)*S;
 c.fillStyle=th.hill2;c.beginPath();c.moveTo(0,skyH);
 for(let sx=0;sx<=W;sx+=20){const wx=G.cam.x*0.25+sx/S;const wy=base+Math.sin(wx*0.008+1)*26;c.lineTo(sx,wy)}c.lineTo(W,skyH);c.fill();
 c.fillStyle=th.hill;c.beginPath();c.moveTo(0,skyH);
 for(let sx=0;sx<=W;sx+=20){const wx=G.cam.x*0.45+sx/S;const wy=base+70+Math.sin(wx*0.011)*20;c.lineTo(sx,wy)}c.lineTo(W,skyH);c.fill()}
function drawWorld(){const L=G.L,th=THEMES[G.spec.theme],x0=Math.max(0,Math.floor(G.cam.x/TS)-1),x1=Math.min(L.w-1,Math.floor((G.cam.x+viewW)/TS)+1);
 if(th.trees){for(let tx=x0;tx<=x1;tx++){if((tx*3)%7>2)continue;if(cellAt(L.grid,tx,L.ground)!==1)continue;const x=(tx+0.5)*TS,y=L.ground*TS;c.fillStyle='#5a381c';c.fillRect(x-6,y-78,12,78);c.fillStyle='#148848';c.beginPath();c.arc(x,y-90,28,0,TAU);c.fill();c.beginPath();c.arc(x-16,y-70,20,0,TAU);c.fill();c.beginPath();c.arc(x+16,y-68,18,0,TAU);c.fill()}}
 if(th.lights){c.strokeStyle='#3a2414';c.lineWidth=2;c.beginPath();for(let x=40;x<L.mapW;x+=20){const y=150+Math.sin(x*0.02)*16;if(x===40)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke();
  for(let x=60;x<L.mapW-40;x+=70){const y=150+Math.sin(x*0.02)*16;c.fillStyle='#ffb43a';c.fillRect(x,y,10,16)}}
 if(L.winds.length){for(const w of L.winds){c.globalAlpha=0.45;c.fillStyle=w.v>0?'#e8f7ff':'#ffe4c8';
  for(let i=0;i<6;i++){const span=w.x1-w.x0;const x=w.x0+((i*span/6)+(G.t*(w.v>0?70:-70))%span+span)%span;const y=L.ground*TS-56-i*8;c.fillRect(x,y,18,3)}}c.globalAlpha=1}
 for(let ty=0;ty<L.h;ty++)for(let tx=x0;tx<=x1;tx++){const t=L.grid[ty][tx];if(!t)continue;const x=tx*TS,y=ty*TS;
  if(t===3&&ty===L.ground){c.fillStyle='#1a68b0';c.fillRect(x,y+8,TS,TS*3);c.fillStyle='rgba(180,230,255,.45)';c.fillRect(x,y+10+Math.sin(G.t*3+tx)*2,TS,4)}
  else if(t===1){c.fillStyle=th.dirt;c.fillRect(x,y,TS+0.5,TS+0.5);if(ty===0||L.grid[ty-1][tx]!==1){c.fillStyle=th.grass;c.fillRect(x,y,TS+0.5,18);c.fillStyle='#c6f8a0';c.fillRect(x,y,TS,4);
   if((tx*5+ty)%4===0){c.fillStyle=(tx%2?'#ffd0e0':'#ffe080');c.beginPath();c.arc(x+12,y-2,3,0,TAU);c.fill()}}}
  else if(t===2){if(th.pad==='lily'){c.fillStyle='#2f9a40';c.beginPath();c.ellipse(x+TS/2,y+TS*0.55,TS*0.55,TS*0.28,0,0,TAU);c.fill();c.fillStyle='#ff8ab0';c.beginPath();c.arc(x+TS*0.7,y+8,5,0,TAU);c.fill()}
   else{c.fillStyle='#c48840';c.fillRect(x+2,y+10,TS-4,14);c.strokeStyle='#6a4018';c.lineWidth=2;c.strokeRect(x+2,y+10,TS-4,14)}}}
 for(const e of L.ents){if(e.k==='cloud'){spr('cloud',e.x,e.y+28,0.72,false,0,1);continue}if(e.got)continue;
  if(e.k==='lantern'){const bob=Math.sin(G.t*2+e.x)*4;c.globalAlpha=0.35;c.fillStyle='#ffd060';c.beginPath();c.arc(e.x,e.y+bob,16,0,TAU);c.fill();c.globalAlpha=1;spr('lantern',e.x,e.y+18+bob,0.55,false,0,1)}
  else if(e.k==='moon'){const bob=Math.sin(G.t*2+2)*5;c.globalAlpha=0.4;c.fillStyle='#fff0b0';c.beginPath();c.arc(e.x,e.y+bob,18,0,TAU);c.fill();c.globalAlpha=1;spr('moon',e.x,e.y+20+bob,0.55)}
  else if(e.k==='berry'){spr('berry',e.x,e.y+Math.sin(G.t*3+e.x)*3+10,0.7)}
  else if(e.k==='frog'){spr('frog',e.x,e.y+2,0.62,e.dir<0,e.dizzy?Math.sin(G.t*20)*0.2:0)}
  else if(e.k==='apple'){spr('apple',e.x,e.y,0.62,false,e.rot,0.5)}}
 const g=L.goal,pulse=1+Math.sin(G.t*4)*0.04;if(G.lit>=G.need){c.globalAlpha=0.35+0.25*Math.sin(G.t*5);c.fillStyle='#ffe080';c.beginPath();c.ellipse(g.x,g.y-6,40*pulse,16,0,0,TAU);c.fill();c.globalAlpha=1}
 spr('blanket',g.x,g.y+4,0.8);
 drawPlayer(G.p);
 for(const q of G.parts){c.globalAlpha=Math.max(0,q.l*2);c.fillStyle=q.c;c.beginPath();c.arc(q.x,q.y,q.s,0,TAU);c.fill()}c.globalAlpha=1;
 for(const t of G.texts){c.globalAlpha=Math.max(0,t.l);c.fillStyle=t.col;c.font="16px 'Lilita One',system-ui";c.textAlign='center';c.fillText(t.txt,t.x,t.y);c.globalAlpha=1}
 drawArrow()}
function drawPlayer(p){c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(p.x,p.y-2,16,5,0,0,TAU);c.fill();
 let name='jt_idle';
 if(p.hurt>0)name='jt_dizzy';
 else if(G.won)name='jt_point';
 else if(!p.onG)name='jt_jump';
 else if(p.flick>0)name='jt_point';
 else if(Math.abs(p.vx)>24){const fr=['jt_run1','jt_run2','jt_run3','jt_run4'];name=fr[Math.floor(p.runDist/12)%4]}
 if(p.inv>0&&Math.floor(p.inv*14)%2===0)c.globalAlpha=0.45;
 const squash=p.onG&&p.hurt<=0?1:1;
 spr(name,p.x,p.y+2,0.86,p.face<0,0,1);c.globalAlpha=1;
 if(p.flick>0){c.strokeStyle='#ffe080';c.lineWidth=3;c.beginPath();c.arc(p.x+p.face*20,p.y-28,22,-0.8*p.face,0.8);c.stroke()}}
function drawArrow(){const p=G.p;let target=null,best=1e9;
 for(const e of G.L.ents)if(e.k==='lantern'&&!e.got){const d=Math.abs(e.x-p.x);if(d<best){best=d;target=e}}
 if(!target&&G.lit>=G.need)target=G.L.goal;if(!target)return;
 const sx=(target.x-G.cam.x)*S,sy=(target.y-G.cam.y)*S,lim=portrait?gameH:H;
 if(sx>36&&sx<W-36&&sy>36&&sy<lim-36)return;
 const ax=clamp(sx,48,W-48),ay=clamp(sy,48,lim-48);c.save();c.translate(ax,ay);c.rotate(Math.atan2(sy-ay,sx-ax));c.globalAlpha=0.85;c.fillStyle='#fff6d0';c.strokeStyle='#c07010';c.lineWidth=2;
 c.beginPath();c.moveTo(14,0);c.lineTo(-8,-9);c.lineTo(-8,-3);c.lineTo(-14,-3);c.lineTo(-14,3);c.lineTo(-8,3);c.lineTo(-8,9);c.closePath();c.fill();c.stroke();c.restore()}
 function hudText(text,x,y,fill,size){c.font=size+"px 'Lilita One',system-ui";c.lineWidth=4;c.strokeStyle='rgba(10,12,28,.8)';c.strokeText(text,x,y);c.fillStyle=fill;c.fillText(text,x,y)}
function drawHUD(){const top=SAFE.t+14,left=SAFE.l+14;c.textAlign='left';
 for(let i=0;i<3;i++){heart(left+i*26,top+4,i<G.hearts)}
 hudText(SESSION.score.toLocaleString(),left,top+48,'#fff','20');
 if(IMG.lantern){c.save();c.translate(left+108,top+42);c.scale(0.2,0.2);c.drawImage(IMG.lantern,-40,-80);c.restore()}
 hudText(G.lit+'/'+G.need,left+126,top+48,'#ffe080','20');
 hudText(G.spec.id+'  '+G.spec.name,left,top+70,'#ffe8c0','15');
 if(G.banner>0){c.globalAlpha=Math.min(1,G.banner);c.textAlign='center';c.lineWidth=4;c.strokeStyle='rgba(10,12,28,.75)';c.font="18px 'Lilita One',system-ui";const by=(portrait?gameH:H)*(portrait?0.28:0.16);c.strokeText('Light every lantern, then find the blanket',W/2,by);c.fillStyle='#fff6d0';c.fillText('Light every lantern, then find the blanket',W/2,by);c.globalAlpha=1;c.textAlign='left'}}
function heart(x,y,full){c.save();c.translate(x,y);c.scale(0.7,0.7);c.beginPath();c.moveTo(0,6);c.bezierCurveTo(-12,-4,-12,-14,-6,-14);c.bezierCurveTo(-2,-14,0,-10,0,-8);c.bezierCurveTo(0,-10,2,-14,6,-14);c.bezierCurveTo(12,-14,12,-4,0,6);c.fillStyle=full?'#ff5a7a':'#3a3040';c.fill();c.restore()}
function render(){c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);
 if((state==='play'||state==='pause')&&G){drawSky();c.save();if(portrait){c.beginPath();c.rect(0,0,W,gameH);c.clip()}
  const sh=(G.shake>0?(Math.random()-0.5)*G.shake:0);c.translate(sh,0);c.scale(S,S);c.translate(-G.cam.x,-G.cam.y);drawWorld();c.restore();
  if(state==='play'||state==='pause')drawHUD()}}

const ui=$('ui');
const LOGO=`<div class="logo"><div class="l1">JIMOTHY TIMOTHY</div><div class="l2">VOL. 2</div><div class="l3">The Lantern Picnic</div></div>`;
const PARENT='This is a pretend night picnic. Real picnics are with a grown-up, and raccoons are best watched from far away.';
 function show(html,cls){if(window.SkipBtn)SkipBtn.hide();const old=$('toast');if(old)old.classList.remove('on');ui.innerHTML='<div class="scr '+(cls||'')+'">'+html+'</div>';document.body.classList.add('uiopen');gpIdx=0;
 ui.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();AU.unlock();AU.fx('menu');act(b.dataset.a,b.dataset.v)}));
 if(GP.on||kbUsed)setTimeout(()=>gpFocus(0,1),30);
 const bg=$('bgart');if(bg)bg.hidden=!(cls&&(cls.indexOf('title')>=0));
 const dock=$('dock');if(dock)dock.classList.toggle('on',cls==='title')}
function hideUI(){if(window.SkipBtn)SkipBtn.hide();ui.innerHTML='';document.body.classList.remove('uiopen');const bg=$('bgart');if(bg)bg.hidden=true;const dock=$('dock');if(dock)dock.classList.remove('on')}
function ctlLine(){return GP.on?'Stick or D-pad moves · A jumps · X or B is ACTION · Start pauses':'Swipe & hold to move · swipe up to jump · tap ACTION'}
function refreshCtl(){const h=document.querySelector('#ui .ctl');if(h)h.innerHTML=ctlLine()}
function titleScreen(){state='title';G=null;AU.music('title');const cont=!!(save.run&&save.run.i<LEVELS.length);
 const playLabel=cont?'CONTINUE':(save.cleared?'PLAY AGAIN':'PLAY');
 show(`${LOGO}<div class="tbtns"><button class="btn go" data-a="play">${playLabel}</button>${cont||save.cleared?'<button class="btn alt" data-a="new">NEW PICNIC</button>':''}
 <button class="btn alt2" data-a="levels">PATHS</button><button class="btn dim" data-a="how">HOW TO PLAY</button></div>
 <p class="tag">"Light the night, then find the blanket!"</p>${save.best?'<p class="sub">Best picnic: '+save.best.toLocaleString()+'</p>':''}<p class="ctl sub">${ctlLine()}</p>`,'title')}
function storyScreen(){if(window.SkipBtn&&SkipBtn.seen('jtlp-intro')){planScreen(0,false,0);return}
 state='story';show(`<img class="story" src="art/title_wide.webp?v=${VERSION}" alt="Jimothy Timothy under paper lanterns"><p class="big">The moon is up and the pie is warm, but the wind scattered the paper lanterns.</p><p>Jimothy Timothy hops out to light the path back to the blanket. Noodles the ferret is saving his slice.</p><button class="btn go" data-a="storygo">LET'S GO</button>`,'menu');
 AU.music('title');if(window.SkipBtn)SkipBtn.show(()=>{SkipBtn.seen('jtlp-intro',1);planScreen(0,false,0)},{top:portrait})}
function planScreen(i,practice,score){state='plan';pending={i,practice:!!practice,score:score||0};const s=LEVELS[i];
 show(`<div class="board"><div class="ct">PATH ${s.id} OF ${LEVELS.length}</div><h2>${s.name}</h2><div class="chalk"><div class="ct">THE PLAN</div>${s.plan.map((l,k)=>'<p>'+(k+1)+'. '+l+'</p>').join('')}</div></div>
 <button class="btn go" data-a="go">LET'S GO</button><button class="btn alt" data-a="back">BACK</button>`,'menu');AU.music('title')}
function clearScreen(){state='clear';const s=G.spec,last=!G.practice&&G.si>=LEVELS.length-1;
 show(`<h2>PATH LIT!</h2><p class="tag">J.T.: "${s.done}"</p>
 <table class="st"><tr><td>Lanterns</td><td>${G.lit}/${G.need}</td></tr><tr><td>Moonberries</td><td>${G.berries}</td></tr><tr><td>Boops</td><td>${G.boops}</td></tr>${G.gotMoon?'<tr><td>Moon lantern</td><td>yes</td></tr>':''}<tr><td>Time bonus</td><td>${G.timeBonus}</td></tr><tr><td>Heart bonus</td><td>${G.heartBonus}</td></tr><tr><td>Picnic score</td><td>${SESSION.score.toLocaleString()}</td></tr></table>
 <div class="tbtns">${G.practice?'<button class="btn go" data-a="levels">PATHS</button>':(last?'':'<button class="btn go" data-a="next">NEXT PATH</button>')}<button class="btn alt" data-a="title">TITLE</button></div>`,'menu');AU.music('win')}
function endingScreen(){state='ending';
 show(`<img class="story" src="art/ending.webp?v=${VERSION}" alt="The picnic blanket under the moon"><h2>THE PICNIC IS LIT!</h2>
 <p class="big">Every lantern is awake. Jimothy Timothy found the blanket, and the moonberry pie is still warm.</p>
 <table class="st"><tr><td>Picnic score</td><td>${SESSION.score.toLocaleString()}</td></tr><tr><td>Best</td><td>${save.best.toLocaleString()}</td></tr></table>
 <p class="sub">Parents: ${PARENT}</p>
 <div class="tbtns"><button class="btn go" data-a="new">PICNIC AGAIN</button><button class="btn alt" data-a="levels">PATHS</button><button class="btn dim" data-a="title">TITLE</button></div>`,'menu');AU.music('win')}
function levelsScreen(){state='levels';let h='<h2>PATHS</h2><div class="lvls">';
 LEVELS.forEach((s,i)=>{const lock=i>save.reached;const best=save.levelBest[s.id]|0;
  h+=`<button class="btn lv ${lock?'dim':''}" data-a="${lock?'locked':'lvl'}" data-v="${i}"><span class="n">${s.id}</span> ${s.name}<span class="st">${lock?'locked':(best?best.toLocaleString():'open')}</span></button>`});
 show(h+'</div><p class="sub">Play from the title keeps one picnic score across all five paths.</p><button class="btn alt" data-a="back">BACK</button>','menu')}
function howScreen(){state='how';show(`<h2>HOW TO PLAY</h2><ul class="how">
 <li><b>Move:</b> swipe and hold anywhere. Let go to stop.</li>
 <li><b>Jump:</b> swipe up, or tap <b>JUMP</b>. Let go early for a small hop. Hold for a higher one.</li>
 <li><b>ACTION:</b> flick your tail. It lights a close lantern and boops a frog or a rolling apple. Nobody gets hurt for real.</li>
 <li><b>Goal:</b> light every paper lantern on the path, then step on the picnic blanket.</li>
 <li>The moon lantern is a bonus. Moonberries refill a heart.</li>
 <li>Keyboard: arrows or WASD, Space jumps, X is ACTION, P pauses, M mutes.</li>
 <li>A controller works too: stick moves, A jumps, X or B is ACTION, Start pauses.</li></ul>
 <p class="sub">${PARENT}</p><button class="btn alt" data-a="back">BACK</button>`,'menu')}
function pauseGame(){if(state!=='play'||!G)return;state='pause';clearInput();
 show(`<h2>PAUSED</h2><p class="sub">Path ${G.spec.id} · ${G.spec.name}</p><div class="tbtns"><button class="btn go" data-a="resume">RESUME</button><button class="btn alt" data-a="retry">RESTART PATH</button><button class="btn alt2" data-a="levels">PATHS</button><button class="btn dim" data-a="title">TITLE</button></div><p class="ctl sub">${ctlLine()}</p>`,'menu')}
function resumeGame(){hideUI();state='play';clearInput();last=performance.now()}
function act(a,v){
 if(a==='play'){if(save.run)planScreen(save.run.i,false,save.run.score);else storyScreen()}
 else if(a==='new'){save.run=null;persist();if(window.SkipBtn)SkipBtn.seen('jtlp-intro',1);planScreen(0,false,0)}
 else if(a==='storygo'){if(window.SkipBtn)SkipBtn.seen('jtlp-intro',1);planScreen(0,false,0)}
 else if(a==='go'&&pending)startLevel(pending.i,pending.practice,pending.score);
 else if(a==='levels')levelsScreen();
 else if(a==='how')howScreen();
 else if(a==='lvl')planScreen(+v,true,0);
 else if(a==='locked'){AU.fx('nope');toast('Light the earlier path first.')}
 else if(a==='back'||a==='title')titleScreen();
 else if(a==='resume')resumeGame();
 else if(a==='retry'&&G)startLevel(G.si,G.practice,G.levelStart);
 else if(a==='next'&&G)planScreen(G.si+1,false,SESSION.score)}
function toggleMute(){AU.setMuted(!AU.muted);save.muted=AU.muted;persist();const b=$('bMute');if(b)b.textContent=AU.muted?'🔇':'🔊';toast(AU.muted?'Sound off':'Sound on')}
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),1600)}

let last=performance.now(),booted=false;
function loop(now){requestAnimationFrame(loop);let dt=Math.min(0.034,(now-last)/1000);last=now;
 if(state==='play'&&G){readInput();const n=dt>0.02?2:1;for(let i=0;i<n&&state==='play';i++){update(dt/n);inp.jumpP=0;inp.actP=0}snapCam(false)}
 else pollPad();
 render()}
function boot(){if(booted)return;booted=true;const l=$('load');if(l)l.remove();titleScreen()}
resize();bindSurface(cv);bindSurface($('pad'));bindBtn($('bJump'),'jump');bindBtn($('bAct'),'act');
const muteBtn=$('bMute');if(muteBtn){muteBtn.textContent=AU.muted?'🔇':'🔊';muteBtn.addEventListener('click',e=>{e.stopPropagation();AU.unlock();toggleMute()})}
const pauseBtn=$('bPause');if(pauseBtn)pauseBtn.addEventListener('click',e=>{e.stopPropagation();if(state==='play')pauseGame()});
loadArt(f=>{const b=document.querySelector('#load .bar i');if(b)b.style.width=Math.round(f*100)+'%'}).then(boot);
setTimeout(boot,8000);
requestAnimationFrame(loop);
window.__G=()=>G;window.__LEVELS=LEVELS;window.__start=(i,practice)=>startLevel(i||0,!!practice,0);
window.__probe=()=>{if(!G||!G.p)return{state};const p=G.p,ahead=[];
 for(const dx of [24,48,72,100,140,180]){const tx=Math.floor((p.x+dx)/TS);let solid=null,plat=null;
  if(tx>=0&&tx<G.L.w){for(let ty=0;ty<G.L.h;ty++){const t=G.L.grid[ty][tx];if(t===2&&plat==null)plat=ty*TS;if(t===1){solid=ty*TS;break}}}
  ahead.push({dx,solid,plat,tx})}
 return{state,si:G.si,x:p.x,y:p.y,vx:p.vx,vy:p.vy,onG:p.onG,hearts:G.hearts,lit:G.lit,need:G.need,won:!!G.won,fail:G.fail,dead:!!p.dead,face:p.face,score:SESSION.score,
  goal:G.L.goal.x,ground:G.L.ground*TS,ahead,
  ents:G.L.ents.filter(e=>!e.got&&e.k!=='cloud').map(e=>({k:e.k,x:e.x,y:e.y,dizzy:e.dizzy||0}))};};
