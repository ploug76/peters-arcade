/* Hope & Constable Duncan crossover.
   Copied from the original Constable Duncan game (js/game.js, style.css, index.html).
   The original files are not modified. Hope walks with the same rig, pad, HUD, and painted streets.
   The character you are not playing follows a few steps behind, smaller and dimmed. Only the leader takes input. */
import * as Follow from './follow.js';
'use strict';
const $=i=>document.getElementById(i);
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],TAU=Math.PI*2;
const cv=$('cv'),cx=cv.getContext('2d');
const G={W:0,H:0,dpr:1,land:false,mode:'loading',lv:0,game:null,keys:{},pad:{ax:0,ay:0,btn:{},prev:{}},ptr:new Map(),paused:false,t:0,img:{},auto:false,who:'duncan',partner:null,swap:null,
 stars:(()=>{try{return JSON.parse(localStorage.getItem('pa-test-cdx_stars')||'{}')}catch(e){return{}}})()};
function saveStars(){try{localStorage.setItem('pa-test-cdx_stars',JSON.stringify(G.stars))}catch(e){}}
/* Peter Oct 31 9:12 PM: iPhone cutoff fix - size to the VISIBLE viewport, re-check often */
function viewWH(){const vv=window.visualViewport,de=document.documentElement;let w=innerWidth||de.clientWidth,h=innerHeight||de.clientHeight;
 if(de.clientHeight>0)h=Math.min(h,de.clientHeight);if(vv&&vv.scale>0.99&&vv.scale<1.01){w=Math.min(w,vv.width)||w;h=Math.min(h,vv.height)||h}return[Math.max(1,Math.round(w)),Math.max(1,Math.round(h))]}
function resize(){G.dpr=Math.min(2,devicePixelRatio||1);[G.W,G.FH]=viewWH();G.land=G.W>G.FH;
 /* portrait play: game on top (62%), control panel below it (same split as Hair Mob) */
 G.H=(!G.land&&typeof padOn==='function'&&padOn())?Math.round(G.FH*0.62):G.FH;cv.style.height=G.H+'px';cv.width=Math.round(G.W*G.dpr);cv.height=Math.round(G.H*G.dpr);if(typeof layoutPad==='function')layoutPad();
 document.body.classList.toggle('land',G.land);document.body.classList.toggle('port',!G.land);if(G.game&&G.game.resize)G.game.resize()}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,120));resize();
if(window.visualViewport)visualViewport.addEventListener('resize',()=>resize());setInterval(()=>{const [a,b]=viewWH();if(a!==G.W||b!==G.FH)resize()},400);
/* ---------------- sound (WebAudio, all synthesized) ---------------- */
const Sound=(()=>{let ac=null,master=null,mus=null,on=true,musOn=false,nextT=0,step=0,timer=null,hiss=null,sirenN=null;
 try{on=localStorage.getItem('pa-test-cdx_sound')!=='0'}catch(e){}
 function unlock(){if(ac){if(ac.state==='suspended')ac.resume();return}try{ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=on?0.9:0;master.connect(ac.destination);mus=ac.createGain();mus.gain.value=0.5;mus.connect(master)}catch(e){ac=null}if(musOn)startMusic()}
 function env(g,t,a,d,v){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)}
 function tone(f,d,type,v,f2,dest){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);env(g,t,0.01,d,v||0.15);o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+d+0.05)}
 let nb=null;function noiseBuf(){if(nb)return nb;nb=ac.createBuffer(1,ac.sampleRate*1,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return nb}
 function noise(d,v,fq,q,type){if(!ac)return;const t=ac.currentTime,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf();s.loop=true;f.type=type||'bandpass';f.frequency.value=fq||1200;f.Q.value=q||0.8;env(g,t,0.005,d,v||0.2);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+d+0.05)}
 const S={
  pop(){noise(0.18,0.5,500,0.6);tone(180,0.25,'sine',0.35,60)},
  cuff(){tone(1800,0.05,'square',0.08);setTimeout(()=>tone(2400,0.06,'square',0.08),70)},
  bust(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.12,'square',0.07),i*60))},
  help(){[784,988,1175].forEach((f,i)=>setTimeout(()=>tone(f,0.16,'triangle',0.12),i*90))},
  hurt(){tone(300,0.3,'sawtooth',0.12,90)},
  jump(){tone(300,0.15,'square',0.06,600)},
  whistle(){tone(2600,0.09,'sine',0.12,2900);setTimeout(()=>tone(2600,0.22,'sine',0.12,2500),110)},
  crash(){noise(0.35,0.5,300,0.5,'lowpass');tone(90,0.3,'sawtooth',0.15,40)},
  honk(){tone(330,0.18,'square',0.06);tone(415,0.18,'square',0.05)},
  meow(){tone(700,0.25,'sawtooth',0.05,1100);setTimeout(()=>tone(1000,0.2,'sawtooth',0.04,600),200)},
  splat(){noise(0.15,0.35,800,1)},
  star(){tone(1320,0.15,'triangle',0.1);setTimeout(()=>tone(1760,0.25,'triangle',0.1),100)},
  win(){[523,659,784,1047,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'square',0.08),i*120))},
  lose(){[392,330,262].forEach((f,i)=>setTimeout(()=>tone(f,0.3,'triangle',0.12),i*200))},
  boom(){noise(0.6,0.6,200,0.4,'lowpass');tone(70,0.6,'sine',0.4,30)},
  click(){tone(900,0.04,'square',0.05)},
  siren(){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='sawtooth';for(let i=0;i<4;i++){o.frequency.setValueAtTime(700,t+i*0.35);o.frequency.linearRampToValueAtTime(1300,t+i*0.35+0.17);o.frequency.linearRampToValueAtTime(700,t+i*0.35+0.35)}
   g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.07,t+0.03);g.gain.setValueAtTime(0.07,t+1.3);g.gain.exponentialRampToValueAtTime(0.0001,t+1.4);const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=2500;o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+1.45)},
 };
 function setHiss(v){if(!ac)return;if(!hiss){const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf();s.loop=true;f.type='highpass';f.frequency.value=1800;g.gain.value=0;s.connect(f);f.connect(g);g.connect(master);s.start();hiss=g}
  hiss.gain.setTargetAtTime(v*0.06,ac.currentTime,0.05)}
 /* original jig in D mixolydian, pipes + drone, quiet */
 const N=n=>440*Math.pow(2,(n-69)/12);
 const MEL=[74,0,74,76,74,72, 71,0,72,74,0,71, 69,0,71,72,74,76, 78,0,76,74,0,0, 74,0,74,76,74,72, 71,0,69,67,0,71, 69,0,67,66,67,69, 67,0,0,67,0,0,
            79,0,78,76,0,74, 76,0,74,72,0,71, 72,0,74,76,0,78, 79,0,0,76,0,0, 79,0,78,76,0,74, 72,0,71,69,0,71, 72,0,71,69,0,66, 67,0,0,67,0,0];
 function sched(){if(!ac)return;while(nextT<ac.currentTime+0.25){const n=MEL[step%MEL.length],t=nextT,d=0.16;
   if(n){const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o2.type='square';o.frequency.value=N(n);o2.frequency.value=N(n)*1.003;f.type='lowpass';f.frequency.value=2200;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.035,t+0.012);g.gain.setValueAtTime(0.03,t+d*0.8);g.gain.exponentialRampToValueAtTime(0.0001,t+d*1.6);o.connect(f);o2.connect(f);f.connect(g);g.connect(mus);o.start(t);o2.start(t);o.stop(t+d*1.7);o2.stop(t+d*1.7)}
   if(step%6===0){const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=N(step%12===0?50:57);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.05,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+0.3);o.connect(g);g.connect(mus);o.start(t);o.stop(t+0.35)}
   nextT+=0.175;step++}}
 let drone=null;
 function startMusic(){musOn=true;if(!ac||timer)return;nextT=ac.currentTime+0.1;timer=setInterval(sched,60);
  if(!drone){const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o2.type='sawtooth';o.frequency.value=N(50);o2.frequency.value=N(38);f.type='lowpass';f.frequency.value=500;g.gain.value=0.018;o.connect(f);o2.connect(f);f.connect(g);g.connect(mus);o.start();o2.start();drone={o,o2,g}}}
 function stopMusic(){musOn=false;if(timer){clearInterval(timer);timer=null}if(drone){try{drone.o.stop();drone.o2.stop()}catch(e){}drone=null}}
 function set(v){on=v;try{localStorage.setItem('pa-test-cdx_sound',v?'1':'0')}catch(e){}if(master)master.gain.value=v?0.9:0}
 function play(n){if(on&&ac&&S[n])try{S[n]()}catch(e){}}
 return{unlock,play,set,isOn:()=>on,startMusic,stopMusic,setHiss}})();
/* ---------------- images ---------------- */
const IMGS={cover:'art/cover.webp',face:'art/face.webp',emblem:'art/emblem.png',street_day:'art/street_day.webp',street_dusk:'art/street_dusk.webp',house:'art/house.webp',square:'art/square.webp',park:'art/park.webp'};
function loadAll(cb){const ks=Object.keys(IMGS);let n=0;ks.forEach(k=>{const im=new Image();im.onload=im.onerror=()=>{n++;$('ldFill').style.width=(n/ks.length*100)+'%';if(n===ks.length)cb()};im.src=IMGS[k];G.img[k]=im})}
/* tartan (dark green + navy, Black Watch style) */
const tartan=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.fillStyle='#1d3b27';x.fillRect(0,0,32,32);
 x.fillStyle='rgba(22,30,62,.85)';x.fillRect(0,4,32,10);x.fillRect(4,0,10,32);x.fillStyle='rgba(10,12,20,.75)';x.fillRect(0,20,32,3);x.fillRect(20,0,3,32);x.fillRect(0,26,32,2);x.fillRect(26,0,2,32);
 x.fillStyle='rgba(40,70,110,.6)';x.fillRect(0,8,32,1);x.fillRect(8,0,1,32);return c})();
let tartanPat=null;function tpat(c){if(!tartanPat){tartanPat=c.createPattern(tartan,'repeat');try{tartanPat.setTransform(new DOMMatrix().scale(0.3))}catch(e){}}return tartanPat}
/* ---------------- gait rig: jointed knees/elbows, distance-driven (no foot slide) ----------------
   Cadence: walk ~1.7 steps/s (0.85 cycles/s), run ~2.8 steps/s (1.4 cycles/s). Planted foot moves back at exactly ground speed.
   Arms swing opposite the legs with bent elbows. 150 ms blend to standing. Units: person ~100 tall, feet at y=0, facing +x. */
function mkRig(o){const R=Object.assign({S:44,s0:0.62,vw:70,vr:190,cw:0.85,cr:1.4,L1:27,L2:26,hipH:54,ank:4,lift:9,kick:8,bob:1.6,sp:3,Am:0.5,Em:0.55},o);
 let c=0;while(c<30&&Math.hypot(R.S/2+R.sp,R.hipH-R.ank-c)>0.97*(R.L1+R.L2))c+=0.25;R.cr0=c;return R}
function cadence(R,v){const r=clamp((v-R.vw)/(R.vr-R.vw),0,1);return R.cw+(R.cr-R.cw)*r}
function mkGait(){return{u:0,v:0,A:0,D:60,mt:-9,air:0}}
/* dx = signed world units moved this frame (feet), on = feet on ground */
function stepGait(o,dx,dt,R,on){const ad=on?Math.abs(dx):0;if(dt>0)o.v+=((ad/dt)-o.v)*Math.min(1,dt*8);if(ad>0.01)o.mt=G.t;
 const mv=on&&G.t-o.mt<0.09,v=o.v;o.D=Math.max(R.S/R.s0,v/cadence(R,Math.max(v,1)));o.u=(o.u+ad/o.D)%1;
 const tg=mv?1:0;o.A+=Math.sign(tg-o.A)*Math.min(Math.abs(tg-o.A),dt/0.15);o.air+=((on?0:1)-o.air)*Math.min(1,dt*14)}
function ik(h,a,L1,L2){let d=Math.hypot(a[0]-h[0],a[1]-h[1]);d=clamp(d,Math.abs(L1-L2)+0.01,L1+L2-0.01);const b=Math.atan2(a[1]-h[1],a[0]-h[0]),off=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1));
 const k1=[h[0]+L1*Math.cos(b+off),h[1]+L1*Math.sin(b+off)],k2=[h[0]+L1*Math.cos(b-off),h[1]+L1*Math.sin(b-off)];const k=k1[0]>k2[0]?k1:k2;
 const ang=Math.atan2(a[1]-k[1],a[0]-k[0]);return{k,a:[k[0]+Math.cos(ang)*L2,k[1]+Math.sin(ang)*L2]}}
function pose(o,R){const A0=o.A,A=A0*A0*(3-2*A0),S=R.S,s=Math.min(R.s0,S/(o.D||S/R.s0)),u=o.u,run=Math.max(clamp((R.s0-s)/(R.s0*0.7),0,1)*(R.vfix?0:1),R.vfix?clamp(((o.v||0)-R.vw)/(R.vr-R.vw),0,1):0),air=o.air||0;
 const by=A*(R.cr0+R.bob*(0.5+0.5*Math.cos(TAU*u*2))*(1-run*0.5)-run*R.bob*0.6*Math.max(0,Math.sin(TAU*u*2)));
 const hy=-R.hipH+by,legs=[],arms=[];
 for(let i=0;i<2;i++){const q=((u+i*0.5)%1+1)%1;let X,Y=0,sw=0;
  if(q<s)X=S/2-S*q/s;else{const v=(q-s)/(1-s),e=v*v*(3-2*v);sw=Math.sin(Math.PI*v);X=-S/2+S*e-run*R.kick*Math.sin(Math.PI*Math.min(1,v*1.6));Y=-R.lift*(1+run*0.6)*sw}
  let ax=X*A+(1-A)*(i?-R.sp:R.sp),ay=-R.ank+Y*A;
  if(air>0.01){ax=lerp(ax,i?-7:9,air);ay=lerp(ay,i?-12:-20,air)}
  const h=[i?-1.5:1.5,hy-(air*4)],K=ik(h,[ax,ay],R.L1,R.L2);
  legs.push({h,k:K.k,a:K.a,fr:-0.35*sw*A,fwd:clamp(X/(S/2),-1,1)*A,stance:q<s})}
 for(let i=0;i<2;i++){const f=-legs[i].fwd;const Am=R.Am*(1+run*0.6);let sa=Am*f,ea=R.Em*(0.25+0.75*Math.max(0,f))*A+0.15+run*0.9*A;
  if(air>0.01){sa=lerp(sa,i?-0.6:1.2,air);ea=lerp(ea,0.9,air)}arms.push({sa,ea})}
 return{hy,legs,arms,run,A,lean:0.04*A+0.1*run*A}}
/* capsule limb */
function seg(c,a,b,r,col){c.strokeStyle=col;c.lineWidth=r*2;c.lineCap='round';c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}
function segO(c,a,b,r,col,ol){seg(c,a,b,r+0.9,ol||'#2a1a10');seg(c,a,b,r,col)}
function armPts(sh,sa,ea,L1,L2){const e=[sh[0]+Math.sin(sa)*L1,sh[1]+Math.cos(sa)*L1],fa=sa+ea,w=[e[0]+Math.sin(fa)*L2,e[1]+Math.cos(fa)*L2];return{e,w,fa}}
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;r=Math.round(r*f);g=Math.round(g*f);b=Math.round(b*f);return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function star5(c,x,y,r,col,ol){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*0.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath();c.fillStyle=col;c.fill();if(ol){c.lineWidth=0.6;c.strokeStyle=ol;c.stroke()}}
/* ---------------- Duncan ---------------- */
const RD=mkRig({vfix:1,S:52,vw:100,vr:280,cw:0.95,cr:1.42});/* Oct 30 v2: was walk 70 / run 190 (too slow to catch anyone). Longer stride keeps feet planted. */
const RH=mkRig({vfix:1,S:46,vw:100,vr:280,cw:1.02,cr:1.55,L1:26,L2:26,hipH:55,ank:3,lift:11,kick:6,bob:1.15,Am:0.68,Em:0.42,sp:2.1});
function heroRig(){return G.who==='hope'?RH:RD}
const DC={skin:'#eab48c',skinD:'#c98f68',shirt:'#b89d64',shirtD:'#8f7748',ol:'#2e2012',boot:'#18181a',hair:'#dccb9f',hairD:'#a8946a',beard:'#aaa59c'};
function duncanLegs(c,L,far){const sk=far?DC.skinD:DC.skin,bt=far?'#0d0d0e':DC.boot;
 segO(c,L.h,L.k,5,sk,DC.ol);
 const bt0=[lerp(L.k[0],L.a[0],0.55),lerp(L.k[1],L.a[1],0.55)];segO(c,L.k,L.a,4,sk,DC.ol);segO(c,bt0,L.a,4.6,bt,'#000');
 c.save();c.translate(L.a[0],L.a[1]);c.rotate(L.fr);c.fillStyle=bt;c.strokeStyle='#000';c.lineWidth=0.8;c.beginPath();c.moveTo(-4.5,-3.5);c.lineTo(4,-4);c.quadraticCurveTo(10,-2.5,10.5,1);c.lineTo(10.5,3.6);c.lineTo(-5,3.6);c.closePath();c.fill();c.stroke();
 c.fillStyle='#3a3a3a';c.fillRect(-5,2.4,15.5,1.4);c.restore()}
function duncanArm(c,P,i,hy,far,o){const sh=[0,hy-27];let {sa,ea}=P.arms[i];
 if(o.ov){const v=o.ov;if(v.t==='cuff'&&!far){sa=1.45;ea=0.15}else if(v.t==='cuff'&&far){sa=1.0;ea=0.6}else if(v.t==='blanket'){sa=far?1.25:1.45;ea=0.7}else if(v.t==='hose'&&!far){sa=1.1;ea=0.5}else if(v.t==='cheer'){sa=far?2.6:2.9;ea=0.2}else if(v.t==='point'&&!far){sa=1.55;ea=0.05}else if(v.t==='wave'&&!far){sa=2.7;ea=0.6+0.4*Math.sin(G.t*12)}}
 const p=armPts(sh,sa,ea,15,14),sk=far?DC.skinD:DC.skin;
 segO(c,sh,p.e,5.2,sk,DC.ol);segO(c,p.e,p.w,4.3,sk,DC.ol);
 const wb=[lerp(p.e[0],p.w[0],0.7),lerp(p.e[1],p.w[1],0.7)],wb2=[lerp(p.e[0],p.w[0],0.9),lerp(p.e[1],p.w[1],0.9)];seg(c,wb,wb2,4.8,'#111');
 const sl=[lerp(sh[0],p.e[0],0.5),lerp(sh[1],p.e[1],0.5)];segO(c,sh,sl,5.8,far?DC.shirtD:DC.shirt,DC.ol);
 c.fillStyle=sk;c.strokeStyle=DC.ol;c.lineWidth=0.9;c.beginPath();c.arc(p.w[0]+Math.sin(p.fa)*2.5,p.w[1]+Math.cos(p.fa)*2.5,4.2,0,TAU);c.fill();c.stroke();
 return p}
function drawDuncan(c,o){const P=pose(o,RD),hy=P.hy;o._P=P;
 c.save();duncanArm(c,P,1,hy,true,o);c.restore();
 duncanLegs(c,P.legs[1],true);duncanLegs(c,P.legs[0],false);
 /* kilt */
 const kf=Math.max(P.legs[0].k[0],P.legs[1].k[0]),kb=Math.min(P.legs[0].k[0],P.legs[1].k[0]),hemY=hy+20;
 const hf=clamp(kf*0.55+11,9,20),hb=clamp(kb*0.55-11,-20,-9);
 c.beginPath();c.moveTo(-10,hy-2);c.lineTo(10.5,hy-2);c.quadraticCurveTo(hf+1,hy+8,hf,hemY);c.lineTo(hb,hemY+1);c.quadraticCurveTo(hb-1,hy+8,-10,hy-2);c.closePath();
 c.fillStyle='#1d3b27';c.fill();c.fillStyle=tpat(c);c.fill();c.strokeStyle='#0a1410';c.lineWidth=1;c.stroke();
 c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=0.8;for(let i=1;i<6;i++){const t=i/6;c.beginPath();c.moveTo(lerp(-10,0,t),hy);c.lineTo(lerp(hb,hb+(hf-hb)*0.5,t),hemY)}c.stroke();
 c.strokeStyle='rgba(255,255,255,.12)';c.beginPath();c.moveTo(hf-3,hy+1);c.lineTo(hf-2,hemY);c.stroke();
 /* torso */
 c.save();c.translate(0,hy);c.rotate(P.lean);c.translate(0,-hy);
 c.beginPath();c.moveTo(-10,hy);c.quadraticCurveTo(-13,hy-16,-10,hy-30);c.quadraticCurveTo(-2,hy-34,6,hy-31);c.quadraticCurveTo(15,hy-25,12.5,hy-15);c.quadraticCurveTo(10,hy-6,10,hy);c.closePath();
 const gr=c.createLinearGradient(-10,0,13,0);gr.addColorStop(0,DC.shirtD);gr.addColorStop(0.6,DC.shirt);gr.addColorStop(1,'#cdb27a');c.fillStyle=gr;c.fill();c.strokeStyle=DC.ol;c.lineWidth=1;c.stroke();
 c.strokeStyle='rgba(60,40,15,.6)';c.lineWidth=0.7;c.beginPath();c.moveTo(9,hy-29);c.quadraticCurveTo(11,hy-14,9,hy-1);c.stroke();
 c.strokeRect(1,hy-21,6,5);c.beginPath();c.moveTo(1,hy-21);c.lineTo(4,hy-19);c.lineTo(7,hy-21);c.stroke();
 star5(c,4.5,hy-24.5,3.4,'#f2c437','#7a5a10');
 c.fillStyle='#141414';c.fillRect(-10.5,hy-2.5,22,4);c.fillStyle='#c9ccd2';c.fillRect(7,hy-3,4,5);c.fillStyle='#141414';c.fillRect(8,hy-2,2,3);
 /* sporran */
 c.save();c.translate(9.5+P.A*1.5*Math.sin(TAU*o.u*2),hy+3);c.fillStyle='#c9ccd2';c.beginPath();c.moveTo(-3.5,0);c.quadraticCurveTo(0,-2.5,3.5,0);c.lineTo(3,1.5);c.lineTo(-3,1.5);c.fill();
 const sg=c.createRadialGradient(0,6,1,0,6,7);sg.addColorStop(0,'#bfae96');sg.addColorStop(1,'#6f5e4c');c.fillStyle=sg;c.beginPath();c.ellipse(0,7,4.6,6.4,0,0,TAU);c.fill();c.strokeStyle='#3a2e22';c.lineWidth=0.6;c.stroke();
 c.fillStyle='#e8e8ea';for(const t of[-2,0,2]){c.beginPath();c.arc(t,11.5+Math.abs(t)*0.3,1,0,TAU);c.fill()}c.restore();
 /* neck + head */
 c.fillStyle=DC.skin;c.fillRect(0.5,hy-36,7.5,7);
 const hx=4.5,hy2=hy-42.5;
 /* long blond-gray hair down the back, past the shoulders */
 const hg=c.createLinearGradient(-14,hy2-10,-4,hy2+20);hg.addColorStop(0,'#e6d6aa');hg.addColorStop(0.6,DC.hair);hg.addColorStop(1,'#b8a47c');c.fillStyle=hg;c.strokeStyle='#7a6a48';c.lineWidth=0.7;
 c.beginPath();c.moveTo(1,hy2-10);c.quadraticCurveTo(-12,hy2-9,-14.5,hy2+4);c.quadraticCurveTo(-16,hy2+16,-12,hy2+22);c.quadraticCurveTo(-8,hy2+24,-5,hy2+19);c.quadraticCurveTo(-1,hy2+14,1.5,hy2+6);c.closePath();c.fill();c.stroke();
 c.strokeStyle='rgba(120,105,75,.7)';c.lineWidth=0.6;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-2-i*2.2,hy2-7);c.quadraticCurveTo(-10-i*1.1,hy2+5,-8.5-i*1.3,hy2+20-i);c.stroke()}
 c.strokeStyle='rgba(250,245,230,.6)';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-4-i*3,hy2-6);c.quadraticCurveTo(-11-i,hy2+6,-10-i*1.5,hy2+17);c.stroke()}
 /* face */
 c.fillStyle=DC.skin;c.strokeStyle=DC.ol;c.lineWidth=0.9;c.beginPath();c.ellipse(hx,hy2,9.6,10.6,0,0,TAU);c.fill();c.stroke();
 c.beginPath();c.moveTo(13.3,hy2-1.5);c.quadraticCurveTo(16.8,hy2+1.6,13.4,hy2+3.4);c.fill();c.stroke();
 c.fillStyle='rgba(220,120,100,.35)';c.beginPath();c.arc(10,hy2+2.5,2.6,0,TAU);c.fill();
 /* gray goatee + mustache */
 c.fillStyle=DC.beard;c.strokeStyle='#77736c';c.lineWidth=0.5;c.beginPath();c.moveTo(1.5,hy2+3.5);c.quadraticCurveTo(3.5,hy2+11,9.5,hy2+12.2);c.quadraticCurveTo(14,hy2+11.4,13.8,hy2+7.2);c.quadraticCurveTo(10.5,hy2+5.4,6,hy2+6.2);c.closePath();c.fill();c.stroke();
 c.beginPath();c.moveTo(7.5,hy2+5.2);c.quadraticCurveTo(11,hy2+3.3,14.3,hy2+5.3);c.quadraticCurveTo(11,hy2+6.6,7.5,hy2+6.3);c.fill();
 c.strokeStyle='#6a2a1a';c.lineWidth=0.9;c.beginPath();c.moveTo(9.2,hy2+7.6);c.quadraticCurveTo(11.4,hy2+8.8,13,hy2+7.3);c.stroke();
 c.fillStyle=DC.skinD;c.beginPath();c.ellipse(-0.8,hy2+0.5,2.2,3,0,0,TAU);c.fill();
 /* front lock of hair over the ear */
 c.fillStyle='#e0d0a4';c.beginPath();c.moveTo(-4.5,hy2-8);c.quadraticCurveTo(-3.5,hy2+5,-2,hy2+12);c.lineTo(1.2,hy2+11);c.quadraticCurveTo(0,hy2+1,1,hy2-7);c.fill();
 /* dark rectangular glasses */
 c.fillStyle='rgba(160,195,225,.35)';c.fillRect(6.4,hy2-3.6,7.4,4.8);c.strokeStyle='#0b0b0b';c.lineWidth=1.6;c.strokeRect(6.4,hy2-3.6,7.4,4.8);c.lineWidth=1.2;c.beginPath();c.moveTo(6.4,hy2-2.6);c.lineTo(-0.5,hy2-3);c.stroke();
 c.fillStyle='#2a1a10';c.beginPath();c.arc(10.8,hy2-1.2,1,0,TAU);c.fill();
 c.strokeStyle='#8a7a5a';c.lineWidth=0.8;c.beginPath();c.moveTo(7,hy2-5.4);c.lineTo(12.5,hy2-5.8);c.stroke();
 /* black cap with a small white logo */
 c.fillStyle='#161616';c.beginPath();c.moveTo(-5.5,hy2-4.5);c.quadraticCurveTo(-4.5,hy2-14.5,4.5,hy2-14.6);c.quadraticCurveTo(13.5,hy2-14,14,hy2-5.5);c.lineTo(-5.5,hy2-4.5);c.fill();
 c.beginPath();c.moveTo(11,hy2-6.5);c.quadraticCurveTo(18.5,hy2-7,22.5,hy2-4.4);c.lineTo(22,hy2-3.1);c.quadraticCurveTo(16,hy2-4.6,10.5,hy2-4.4);c.fill();
 c.fillStyle='#e0e0e0';c.beginPath();c.arc(7,hy2-9.5,2,0,TAU);c.fill();c.fillRect(3,hy2-10,8,1);c.fillStyle='#161616';c.fillRect(6.2,hy2-9.6,1.6,1.6);
 c.restore();
 c.save();c.translate(0,hy);c.rotate(P.lean);c.translate(0,-hy);const ap=duncanArm(c,P,0,hy,false,o);c.restore();
 o._hand=[ap.w[0],ap.w[1]];
 return P}
/* ---------------- Hope: modest adventurer. Fitted jacket, cargo pants, boots, braid. Same jointed rig language as Duncan. ---------------- */
const HC={skin:'#f0c2a4',skinD:'#d7a588',jacket:'#1c6d68',jacketD:'#145650',jacketL:'#3aa39a',cargo:'#c6a56a',cargoD:'#a68448',ol:'#1a140e',boot:'#5a3a22',bootD:'#3a2416',glove:'#6b4a32',belt:'#3a2a18',brass:'#d7b15a',hair:'#4e2c16',hairL:'#8a5a32',lip:'#c46878'};
function drawBraid(c,o,hy){const phase=o.pony||'idle',u=Math.max(0,Math.min(1,o.ponyU||0));
 const sway=Math.sin((G.t||0)*3.1+(o.u||0)*TAU)*6*(0.4+0.6*(o.A||0));
 const x0=-11,y0=hy-28;c.save();c.lineCap='round';c.lineJoin='round';
 if(phase==='coil'){const k=u*u*(3-2*u);c.strokeStyle=HC.hair;c.lineWidth=4.2;c.beginPath();c.moveTo(x0,y0);
  for(let i=1;i<=10;i++){const t=i/10,ang=-1.1+t*Math.PI*2*1.8,rad=4+(1-k)*8+t*3;c.lineTo(0+Math.cos(ang)*rad,y0+7+Math.sin(ang)*rad*0.48)}c.stroke();c.restore();return}
 const to=(phase==='lasso'||phase==='unroll')?(o.hairTo||{x:92,y:hy+4}):null;
 const k=to?Math.max(0.22,u):1;
 const x1=to?x0+(to.x-x0)*k:-14+sway*0.45,y1=to?y0+(to.y-y0)*k:y0+74;
 const mx=(x0+x1)/2+(to?-10*(1-k):-10+sway),my=(y0+y1)/2;
 c.strokeStyle=HC.hair;c.lineWidth=6.2;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(mx,my,x1,y1);c.stroke();
 c.strokeStyle=HC.hairL;c.lineWidth=2.3;c.beginPath();c.moveTo(x0+0.6,y0+1);c.quadraticCurveTo(mx+1.2,my,x1+0.4,y1-1);c.stroke();
 c.strokeStyle='#2a160e';c.lineWidth=1.15;
 for(let i=0;i<7;i++){const t=(i+0.5)/7,it=1-t,px=it*it*x0+2*it*t*mx+t*t*x1,py=it*it*y0+2*it*t*my+t*t*y1;
  const flip=i%2?1:-1;c.beginPath();c.moveTo(px-3.1*flip,py-3.4);c.lineTo(px+3.1*flip,py+3.2);c.stroke()}
 c.fillStyle='#e8d2a8';c.beginPath();c.arc(x1,y1,1.7,0,TAU);c.fill();c.strokeStyle=HC.hair;c.lineWidth=0.8;c.stroke();
 c.restore()}
function hopeArm(c,P,i,hy,far,o){const sh=[far?-0.5:1.2,hy-27];let {sa,ea}=P.arms[i];
 if(o.ov){const v=o.ov;if(v.t==='cuff'&&!far){sa=1.35;ea=0.2}else if(v.t==='cuff'&&far){sa=0.85;ea=0.5}else if(v.t==='hose'&&!far){sa=1.0;ea=0.4}else if(v.t==='blanket'){sa=far?1.15:1.45;ea=0.6}else if(v.t==='cheer'){sa=far?2.45:2.75;ea=0.22}else if(v.t==='point'&&!far){sa=1.4;ea=0.1}else if(v.t==='wave'&&!far){sa=2.55;ea=0.5+0.3*Math.sin(G.t*12)}}
 if(!far&&o.pony==='punch'){sa=1.25;ea=0.18}
 const p=armPts(sh,sa,ea,14,13),col=far?HC.jacketD:HC.jacket;
 segO(c,sh,p.e,3.5,col,HC.ol);segO(c,p.e,p.w,3.1,col,HC.ol);
 c.fillStyle=far?shade(HC.glove,0.8):HC.glove;c.strokeStyle=HC.ol;c.lineWidth=0.7;c.beginPath();c.arc(p.w[0]+Math.sin(p.fa)*1.6,p.w[1]+Math.cos(p.fa)*1.6,3.1,0,TAU);c.fill();c.stroke();
 return p}
function hopeBoot(c,L,far){const col=far?HC.bootD:HC.boot;
 const bt0=[lerp(L.k[0],L.a[0],0.42),lerp(L.k[1],L.a[1],0.42)];
 segO(c,bt0,L.a,3.5,col,HC.ol);
 c.save();c.translate(L.a[0],L.a[1]);c.rotate(L.fr||0);
 c.fillStyle=col;c.strokeStyle='#1a100c';c.lineWidth=0.7;
 c.beginPath();c.moveTo(-3.6,-6);c.lineTo(3.2,-6.2);c.lineTo(3.6,-2);c.quadraticCurveTo(11,-1.5,11.2,2.6);c.lineTo(-3.8,3.2);c.closePath();c.fill();c.stroke();
 c.strokeStyle='rgba(255,220,160,.35)';c.beginPath();c.moveTo(-2.4,-5);c.lineTo(2,-5.2);c.stroke();
 c.restore()}
function drawHope(c,o){const P=pose(o,RH),hy=P.hy;o._P=P;
 const sway=Math.sin((o.u||0)*TAU)*(P.A||0)*2.4;
 c.save();c.translate(sway,0);
 const hang=(o.pony||'idle')==='idle'||o.pony==='punch';
 if(hang)drawBraid(c,o,hy);
 c.save();hopeArm(c,P,1,hy,true,o);c.restore();
 const leg=(L,far)=>{const col=far?HC.cargoD:HC.cargo;
  segO(c,L.h,L.k,3.7,col,HC.ol);segO(c,L.k,L.a,3.3,col,HC.ol);
  if(!far){c.save();c.translate(lerp(L.h[0],L.k[0],0.45)+2.2,lerp(L.h[1],L.k[1],0.45));c.fillStyle='#8d6a3a';c.strokeStyle=HC.ol;c.lineWidth=0.6;c.fillRect(-2.2,-3.2,4.6,5.2);c.strokeRect(-2.2,-3.2,4.6,5.2);c.restore()}
  hopeBoot(c,L,far)};
 leg(P.legs[1],true);leg(P.legs[0],false);
 c.save();c.translate(-sway*0.65,hy);c.rotate(P.lean+(P.run>0.45?0.05:0));c.translate(0,-hy);
 /* fitted jacket: slim shoulders, narrow waist, modest hips. No bare skin below the collar. */
 c.beginPath();c.moveTo(-6.4,hy+3);c.quadraticCurveTo(-5.2,hy-4,-4.2,hy-12);c.quadraticCurveTo(-6.6,hy-20,-6.8,hy-30);
 c.quadraticCurveTo(-2.2,hy-35,5.4,hy-31);c.quadraticCurveTo(8.4,hy-18,6.2,hy-10);c.quadraticCurveTo(5.2,hy-3,6.2,hy+3);c.closePath();
 const gr=c.createLinearGradient(-8,hy-30,8,hy);gr.addColorStop(0,HC.jacketD);gr.addColorStop(0.45,HC.jacket);gr.addColorStop(1,HC.jacketL);
 c.fillStyle=gr;c.fill();c.strokeStyle=HC.ol;c.lineWidth=1;c.stroke();
 c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=0.8;c.beginPath();c.moveTo(0.2,hy-28);c.lineTo(-0.2,hy-2);c.stroke();
 c.fillStyle=HC.jacketD;c.fillRect(-6.6,hy-31,13.2,3.2);
 c.fillStyle=HC.belt;c.fillRect(-6.2,hy-1.2,12.6,3.2);c.fillStyle=HC.brass;c.fillRect(3.2,hy-0.6,2.4,2.2);
 /* satchel on the hip, strap across the jacket */
 c.strokeStyle='#6b4e32';c.lineWidth=1.5;c.beginPath();c.moveTo(-5.5,hy-29);c.lineTo(5.5,hy+1);c.stroke();
 c.save();c.translate(7.2+Math.sin((o.u||0)*TAU)*0.8*(P.A||0),hy+6);c.fillStyle='#8a6240';c.strokeStyle=HC.ol;c.lineWidth=0.7;
 c.beginPath();c.moveTo(-3.2,-1);c.lineTo(3.4,-1.4);c.quadraticCurveTo(4.2,3.2,3,6.2);c.lineTo(-3.4,6);c.quadraticCurveTo(-4.4,2.4,-3.2,-1);c.fill();c.stroke();
 c.strokeStyle='#d7b15a';c.beginPath();c.moveTo(-2.2,0.4);c.lineTo(2.4,0.2);c.stroke();c.restore();
 /* neck, then a softer face */
 c.fillStyle=HC.skin;c.fillRect(0.6,hy-36,4.8,6);
 const hx=3.2,hy2=hy-45.5;
 /* hair pulled back into the braid, with a soft side lock */
 c.fillStyle=HC.hair;c.beginPath();c.moveTo(hx-1,hy2-11);c.quadraticCurveTo(hx-14,hy2-8,hx-13,hy2+4);c.quadraticCurveTo(hx-12,hy2+16,hx-6,hy2+12);c.quadraticCurveTo(hx-3,hy2+2,hx-1,hy2-6);c.fill();
 c.fillStyle=HC.hairL;c.beginPath();c.moveTo(hx-2,hy2-9);c.quadraticCurveTo(hx+2,hy2-16,hx+7,hy2-12);c.quadraticCurveTo(hx+3,hy2-7,hx-1,hy2-8);c.fill();
 c.fillStyle=HC.skin;c.strokeStyle='#e0b090';c.lineWidth=0.7;c.beginPath();c.ellipse(hx,hy2,7.2,9.8,0,0,TAU);c.fill();c.stroke();
 c.beginPath();c.moveTo(hx+6.2,hy2-0.2);c.quadraticCurveTo(hx+8.6,hy2+1.1,hx+6.3,hy2+2.2);c.fill();
 c.fillStyle='rgba(232,150,160,.4)';c.beginPath();c.ellipse(hx+4.4,hy2+2.8,1.8,1.15,0,0,TAU);c.fill();
 c.strokeStyle='#7a4a32';c.lineWidth=1.05;c.beginPath();c.moveTo(hx+1.6,hy2-6.2);c.quadraticCurveTo(hx+4.4,hy2-7.6,hx+7.6,hy2-5.4);c.stroke();
 const ex=hx+4.7,ey=hy2-1.7;
 c.fillStyle='#fff';c.beginPath();c.ellipse(ex,ey,3.15,2.15,-0.15,0,TAU);c.fill();
 c.fillStyle='#6a4630';c.beginPath();c.ellipse(ex+0.35,ey,1.45,1.45,0,0,TAU);c.fill();
 c.fillStyle='#1a100c';c.beginPath();c.arc(ex+0.55,ey,0.62,0,TAU);c.fill();
 c.fillStyle='#fff';c.beginPath();c.arc(ex-0.15,ey-0.45,0.38,0,TAU);c.fill();
 c.strokeStyle='#2a160e';c.lineWidth=1.25;c.beginPath();c.moveTo(ex-3.1,ey-0.7);c.quadraticCurveTo(ex,ey-2.5,ex+3.2,ey-0.9);c.stroke();
 for(let i=0;i<4;i++){c.beginPath();c.moveTo(ex-2.2+i*1.45,ey-1.15);c.lineTo(ex-2.5+i*1.45,ey-2.7);c.stroke()}
 c.fillStyle=HC.lip;c.beginPath();c.moveTo(hx+3.3,hy2+4.15);c.quadraticCurveTo(hx+5.3,hy2+3.2,hx+7.5,hy2+4.05);c.quadraticCurveTo(hx+5.5,hy2+6.15,hx+3.3,hy2+4.15);c.fill();
 c.strokeStyle='#8a3a48';c.lineWidth=0.7;c.stroke();
 c.restore();
 c.save();c.translate(-sway*0.35,hy);c.rotate(P.lean);c.translate(0,-hy);const ap=hopeArm(c,P,0,hy,false,o);c.restore();
 if(!hang){c.save();c.translate(sway*0.2,0);drawBraid(c,o,hy);c.restore()}
 c.restore();
 o._hand=[ap.w[0]-sway*0.35,ap.w[1]];
 return P}
function drawHero(c,o){if(G.who==='hope')drawHope(c,o);else drawDuncan(c,o)}
function drawWho(c,who,o){if(who==='hope')drawHope(c,o);else drawDuncan(c,o)}
function drawFollowerWorld(c,lead){const p=G.partner;if(!p)return;
 const face=p.face||lead.face||1,sc=0.88;
 c.save();c.translate(p.x,p.y||0);c.globalAlpha=(lead.inv>0&&Math.floor(lead.inv*12)%2)?0.28:0.82;c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(0,2,16,3.2,0,0,TAU);c.fill();
 c.scale(face*sc,sc);drawWho(c,p.who,p.o);c.restore()}
function pairBegin(c,lead){drawFollowerWorld(c,lead);
 const x=G._leadX!=null?G._leadX:lead.x,y=(lead.y||0)+(G._hop||0);
 c.save();c.translate(x,y);
 if(lead.inv>0&&Math.floor(lead.inv*12)%2)c.globalAlpha=0.45;
 c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(0,-((lead.y||0)+(G._hop||0)),20,4,0,0,TAU);c.fill();
 c.scale(lead.face||1,1);drawHero(c,lead.o)}
function pairEnd(c){c.restore()}
function makeHopeFace(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 x.fillStyle='#4e2c16';x.beginPath();x.ellipse(40,70,16,34,0.35,0,TAU);x.fill();
 x.fillStyle='#1c6d68';x.fillRect(18,96,70,28);
 x.fillStyle='#f0c2a4';x.beginPath();x.ellipse(72,68,30,36,0,0,TAU);x.fill();
 x.fillStyle='#4e2c16';x.beginPath();x.ellipse(70,42,32,18,0,Math.PI,0);x.fill();
 x.fillStyle='#fff';x.beginPath();x.ellipse(84,66,8,5,0,0,TAU);x.fill();
 x.fillStyle='#1a100c';x.beginPath();x.arc(86,66,2.4,0,TAU);x.fill();
 x.strokeStyle='#2a1a14';x.lineWidth=2;x.beginPath();x.moveTo(76,60);x.quadraticCurveTo(84,56,92,60);x.stroke();
 x.strokeStyle='#c46878';x.lineWidth=2.4;x.beginPath();x.moveTo(78,84);x.quadraticCurveTo(86,90,94,83);x.stroke();
 return c.toDataURL()}
/* ---------------- generic people ---------------- */
const RP=mkRig({vr:150}),RK=mkRig({S:30,L1:17,L2:16,hipH:35,ank:3,lift:6,kick:5,vw:50,vr:140,bob:1.2});
function drawPerson(c,o,L){const R=L.kid?RK:RP,P=pose(o,R),hy=P.hy,sc=L.kid?0.66:1,ol='#1a1018';o._P=P;
 const legC=L.pants,shoe=L.shoe||'#222';
 const arm=(i,far)=>{let {sa,ea}=P.arms[i];if(o.ov){const v=o.ov;if(v.t==='aim'){sa=v.a+(far?-0.1:0.1);ea=0.2}else if(v.t==='cheer'||v.t==='hands'){sa=far?2.5:2.8;ea=0.3+0.2*Math.sin(G.t*14+i)}else if(v.t==='throw'&&!far){sa=lerp(-2.6,1.6,v.k);ea=0.3}else if(v.t==='carry'){sa=0.7;ea=1.2}else if(v.t==='cuffed'){sa=-0.5;ea=0.4}else if(v.t==='cane'&&!far){sa=0.5;ea=0.2}else if(v.t==='wave'&&!far){sa=2.7;ea=0.5+0.5*Math.sin(G.t*12)}}
  const sh=[0,hy-27*sc],p=armPts(sh,sa,ea,14*sc,13*sc),col=far?shade(L.top,0.75):L.top,sk=far?shade(L.skin,0.8):L.skin;
  segO(c,sh,p.e,4.6*sc,col,ol);segO(c,p.e,p.w,4*sc,L.sleeve==='short'?sk:col,ol);c.fillStyle=L.glove||sk;c.beginPath();c.arc(p.w[0],p.w[1],3.6*sc,0,TAU);c.fill();return p};
 const leg=(Lg,far)=>{const col=far?shade(legC,0.75):legC;if(L.skirt){segO(c,Lg.k,Lg.a,2.6*sc,far?shade(L.skin,0.8):L.skin,ol)}else{segO(c,Lg.h,Lg.k,5*sc,col,ol);segO(c,Lg.k,Lg.a,4.4*sc,col,ol)}
  c.save();c.translate(Lg.a[0],Lg.a[1]);c.rotate(Lg.fr);c.fillStyle=far?shade(shoe,0.7):shoe;c.beginPath();c.moveTo(-4*sc,-3*sc);c.lineTo(5*sc,-3*sc);c.quadraticCurveTo(10*sc,-2*sc,10.5*sc,3*sc);c.lineTo(-4.5*sc,3*sc);c.closePath();c.fill();c.restore()};
 arm(1,true);leg(P.legs[1],true);leg(P.legs[0],false);
 c.save();c.translate(0,hy);c.rotate(P.lean);c.translate(0,-hy);
 if(L.skirt){c.fillStyle=L.skirt;c.strokeStyle=ol;c.lineWidth=0.9;c.beginPath();c.moveTo(-9*sc,hy-4*sc);c.lineTo(9*sc,hy-4*sc);c.lineTo(15*sc,hy+24*sc);c.lineTo(-14*sc,hy+24*sc);c.closePath();c.fill();c.stroke();
  c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<5;i++){c.beginPath();c.arc((-8+i*5)*sc,hy+(8+(i%2)*8)*sc,1.6*sc,0,TAU);c.fill()}}
 c.beginPath();c.moveTo(-9*sc,hy+1);c.quadraticCurveTo(-11*sc,hy-16*sc,-8*sc,hy-30*sc);c.quadraticCurveTo(0,hy-33*sc,7*sc,hy-30*sc);c.quadraticCurveTo(11*sc,hy-16*sc,9*sc,hy+1);c.closePath();
 c.fillStyle=L.top;c.fill();c.strokeStyle=ol;c.lineWidth=0.9;c.stroke();
 if(L.stripes){c.fillStyle='#f2e23a';c.fillRect(-9*sc,hy-8*sc,18.5*sc,2.4*sc);c.fillRect(-9*sc,hy-20*sc,19.5*sc,2.4*sc)}
 if(L.hoodie){c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=0.8;c.beginPath();c.moveTo(-6*sc,hy-6*sc);c.lineTo(8*sc,hy-6*sc);c.stroke();c.beginPath();c.moveTo(5*sc,hy-29*sc);c.lineTo(5.5*sc,hy-20*sc);c.stroke()}
 if(L.star)star5(c,4*sc,hy-22*sc,2.6*sc,'#ffd23f');
 if(L.can){c.fillStyle='#d42a1a';c.strokeStyle='#5a0a05';c.fillRect(8*sc,hy-6*sc,9*sc,11*sc);c.strokeRect(8*sc,hy-6*sc,9*sc,11*sc);c.fillStyle='#222';c.fillRect(13*sc,hy-9*sc,3*sc,3*sc)}
 const hx=2*sc,h2=hy-40*sc,hr=8.4*sc;
 c.fillStyle=L.skin;c.strokeStyle=ol;c.lineWidth=0.9;c.fillRect(-1*sc,hy-35*sc,6*sc,6*sc);
 if(L.head==='bun'){c.fillStyle='#d9d9df';c.beginPath();c.arc(hx-4*sc,h2-8*sc,4.5*sc,0,TAU);c.fill()}
 if(L.head==='hair'||L.head==='bun'||L.head==='kid'||L.head==='pony'){c.fillStyle=L.hair||'#5a3a20';c.beginPath();c.ellipse(hx-2*sc,h2-1*sc,hr+1.2*sc,hr+1.5*sc,0,0,TAU);c.fill();if(L.head==='pony'){c.beginPath();c.ellipse(hx-11*sc,h2+2*sc,3*sc,7*sc,0.4,0,TAU);c.fill()}}
 c.fillStyle=L.skin;c.beginPath();c.ellipse(hx,h2,hr,hr*1.08,0,0,TAU);c.fill();c.stroke();
 c.beginPath();c.moveTo(hx+hr-0.8,h2-1);c.quadraticCurveTo(hx+hr+3*sc,h2+1.5*sc,hx+hr-0.5,h2+3*sc);c.fill();
 c.fillStyle='#1a1010';c.beginPath();c.arc(hx+5*sc,h2-1.5*sc,1.1*sc,0,TAU);c.fill();
 if(L.mood==='sad'){c.strokeStyle='#5a2a1a';c.lineWidth=0.8;c.beginPath();c.arc(hx+5*sc,h2+6.5*sc,2*sc,-2.5,-0.6);c.stroke();c.fillStyle='#7ac8ff';c.beginPath();c.arc(hx+5.5*sc,h2+2*sc+((G.t*30)%6)*sc,1*sc,0,TAU);c.fill()}
 else if(!L.mask){c.strokeStyle='#5a2a1a';c.lineWidth=0.8;c.beginPath();c.arc(hx+5*sc,h2+3*sc,2.2*sc,0.4,2.2);c.stroke()}
 if(L.head==='bun'||L.glasses){c.strokeStyle='#333';c.lineWidth=0.8;c.strokeRect(hx+3*sc,h2-3.5*sc,5*sc,3.5*sc)}
 if(L.mask){c.fillStyle=L.maskC||'#111';c.beginPath();c.moveTo(hx-3*sc,h2+0.5*sc);c.lineTo(hx+hr+2.5*sc,h2+0.5*sc);c.lineTo(hx+hr+1*sc,h2+7*sc);c.quadraticCurveTo(hx+3*sc,h2+10*sc,hx-3*sc,h2+6*sc);c.closePath();c.fill()}
 if(L.head==='hood'){c.fillStyle=L.top;c.strokeStyle=ol;c.beginPath();c.moveTo(hx+6*sc,h2-9*sc);c.quadraticCurveTo(hx-6*sc,h2-14*sc,hx-11*sc,h2-2*sc);c.quadraticCurveTo(hx-11*sc,h2+8*sc,hx-4*sc,h2+10*sc);c.lineTo(hx-2*sc,h2+3*sc);c.quadraticCurveTo(hx-3*sc,h2-7*sc,hx+7.5*sc,h2-6*sc);c.closePath();c.fill();c.stroke()}
 if(L.head==='ushanka'){c.fillStyle='#6a4a30';c.strokeStyle=ol;c.beginPath();c.ellipse(hx-1*sc,h2-8*sc,hr+2*sc,6*sc,0,0,TAU);c.fill();c.stroke();c.fillStyle='#8a6a48';c.beginPath();c.ellipse(hx-4*sc,h2+1*sc,4*sc,7*sc,0,0,TAU);c.fill();c.stroke();c.fillStyle='#c8202a';star5(c,hx+5*sc,h2-8*sc,2.4*sc,'#ffd23f')}
 if(L.head==='helmet'){c.fillStyle='#1a1a1a';c.beginPath();c.ellipse(hx,h2-5*sc,hr+2*sc,6.5*sc,0,Math.PI,0);c.fill();c.fillRect(hx-hr-6*sc,h2-5.5*sc,hr*2+10*sc,2.4*sc);c.fillStyle='#ffd23f';c.fillRect(hx+3*sc,h2-11*sc,3*sc,5*sc)}
 if(L.head==='cap'||L.head==='kid'){c.fillStyle=L.capC||'#2a5aa8';c.beginPath();c.ellipse(hx,h2-5*sc,hr+0.5*sc,5.5*sc,0,Math.PI,0);c.fill();c.fillRect(hx+3*sc,h2-6*sc,9*sc,2*sc)}
 if(L.head==='bald'){c.fillStyle='#ddd';c.beginPath();c.ellipse(hx-5*sc,h2,3*sc,5*sc,0,0,TAU);c.fill()}
 c.restore();
 c.save();c.translate(0,hy);c.rotate(P.lean);c.translate(0,-hy);const ap=arm(0,false);c.restore();o._hand=ap.w;
 if(L.cane){c.strokeStyle='#6a4020';c.lineWidth=2;c.beginPath();c.moveTo(ap.w[0],ap.w[1]);c.lineTo(ap.w[0]+3,0);c.stroke()}
 if(L.flag){c.strokeStyle='#5a3a20';c.lineWidth=1.2;c.beginPath();c.moveTo(ap.w[0],ap.w[1]+6);c.lineTo(ap.w[0],ap.w[1]-26);c.stroke();c.fillStyle='#d42a2a';c.beginPath();c.moveTo(ap.w[0],ap.w[1]-26);c.quadraticCurveTo(ap.w[0]+8,ap.w[1]-24+Math.sin(G.t*8)*2,ap.w[0]+15,ap.w[1]-25);c.lineTo(ap.w[0]+15,ap.w[1]-15);c.quadraticCurveTo(ap.w[0]+8,ap.w[1]-15+Math.sin(G.t*8+1)*2,ap.w[0],ap.w[1]-16);c.fill();star5(c,ap.w[0]+4,ap.w[1]-21,2,'#ffd23f')}
 if(L.match){c.fillStyle='#ffb020';c.beginPath();c.arc(ap.w[0]+1,ap.w[1]-4,2+Math.random(),0,TAU);c.fill()}
 return P}
const LOOK={
 antifa:{skin:'#e0b090',top:'#1c1c22',pants:'#24242a',shoe:'#111',head:'hood',mask:true,hoodie:true},
 arsonist:{skin:'#e0b090',top:'#1c1c22',pants:'#24242a',shoe:'#111',head:'hood',mask:true,hoodie:true,can:true,match:true},
 commie:{skin:'#f0c0a0',top:'#b8222a',pants:'#3a3030',shoe:'#2a1a10',head:'ushanka',flag:true},
 granny:{skin:'#f0c8a8',top:'#8a5aa8',pants:'#8a5aa8',skirt:'#7a4a98',shoe:'#3a2a20',head:'bun',hair:'#d9d9df',cane:true},
 kid:{kid:true,skin:'#f2c4a0',top:'#e8604a',pants:'#3a5aa8',shoe:'#fff',head:'kid',hair:'#7a4a20',capC:'#2a8a4a',mood:'sad'},
 mom:{skin:'#e8b898',top:'#3aa0a0',pants:'#2a3a6a',shoe:'#6a2a2a',head:'pony',hair:'#8a5a2a'},
 farmer:{skin:'#e0a880',top:'#4a7ac0',pants:'#3a4a7a',shoe:'#4a2a10',head:'cap',capC:'#c03a2a',sleeve:'short'},
 fire:{skin:'#e8b490',top:'#3a3428',pants:'#3a3428',shoe:'#111',head:'helmet',stripes:true,glove:'#c8a040'},
 deputy:{skin:'#d8a080',top:'#b89d64',pants:'#4a3a20',shoe:'#111',head:'cap',capC:'#161616',star:true},
 shade:{skin:'#d8b0a0',top:'#241428',pants:'#1a1020',shoe:'#111',head:'hood',mask:true,hoodie:true},
 rival:{skin:'#e8c0b0',top:'#24182e',pants:'#2a2030',shoe:'#111',head:'hood',mask:true,hoodie:true},
 rivalDone:{skin:'#f0d0c0',top:'#f4efe4',pants:'#6a5a4a',shoe:'#3a2a20',head:'pony',hair:'#6a3b22'},
};
/* ---------------- umbrella creature (closed = tall hooded figure; open = attack) ---------------- */
function drawUmb(c,u,sc){sc=sc||1;const op=clamp(u.op||0,0,1),sh=u.shake||0;c.save();c.scale(sc,sc);c.translate(Math.sin(G.t*60)*sh*2,0);
 const top=-140+op*12,hemY=lerp(-4,-74,op),hw=lerp(17,80,op),mid=lerp(-96,-108,op);
 c.globalAlpha*=u.fade===undefined?1:u.fade;
 /* shadow */c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(0,0,lerp(18,30,op),4,0,0,TAU);c.fill();
 if(op>0.05){c.strokeStyle='#2a1a10';c.lineWidth=3;c.beginPath();c.moveTo(0,top);c.lineTo(0,-12);c.stroke();c.lineWidth=3.5;c.beginPath();c.arc(-5,-12,5,0,Math.PI);c.stroke()}
 const g=c.createLinearGradient(-hw,0,hw,0);g.addColorStop(0,'#2a1c14');g.addColorStop(0.45,'#5a4030');g.addColorStop(0.7,'#4a3426');g.addColorStop(1,'#22160f');
 c.fillStyle=g;c.strokeStyle='#120b07';c.lineWidth=1.5;c.beginPath();c.moveTo(0,top);
 c.bezierCurveTo(hw*0.35,top+10,hw*lerp(0.55,1.05,op),lerp(hemY-60,hemY-30,op),hw,hemY);
 const n=8;for(let i=0;i<n;i++){const x0=hw-(2*hw)*(i/n),x1=hw-(2*hw)*((i+1)/n);c.quadraticCurveTo((x0+x1)/2,hemY+lerp(4,10,op),x1,hemY)}
 c.bezierCurveTo(-hw*lerp(0.55,1.05,op),lerp(hemY-60,hemY-30,op),-hw*0.35,top+10,0,top);c.fill();c.stroke();
 if(op<0.6){const a=1-op/0.6;c.globalAlpha*=1;c.fillStyle='rgba(30,20,14,'+(0.95*a)+')';c.strokeStyle='rgba(10,6,4,'+a+')';const hw2=lerp(24,40,op),hy2=mid+lerp(4,0,op);
  c.beginPath();c.moveTo(0,top+2);c.bezierCurveTo(hw2*0.5,top+12,hw2,hy2-14,hw2,hy2);for(let i=0;i<6;i++){const x0=hw2-(2*hw2)*(i/6),x1=hw2-(2*hw2)*((i+1)/6);c.quadraticCurveTo((x0+x1)/2,hy2+6,x1,hy2)}c.bezierCurveTo(-hw2,hy2-14,-hw2*0.5,top+12,0,top+2);c.fill();c.stroke()}
 c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*hw*0.12,top+18);c.quadraticCurveTo(i*hw*0.3,lerp(-60,-90,op),i*hw*0.42,hemY)}c.stroke();
 c.fillStyle='#c8b070';c.beginPath();c.arc(0,top-3,2.5,0,TAU);c.fill();
 /* eyes */
 const ey=op>0.5?hemY-22:mid+12,lk=u.look||1;c.fillStyle=u.stun>0?'#fff':'#ffef9a';for(const ex of[-6,6]){c.beginPath();c.ellipse(ex+lk*2,ey,3.2,u.blink?0.5:3.6,0,0,TAU);c.fill()}
 if(u.stun>0){c.strokeStyle='#222';c.lineWidth=1;for(const ex of[-6,6]){c.beginPath();for(let a=0;a<9;a+=0.5)c.lineTo(ex+lk*2+Math.cos(a+G.t*8)*a*0.32,ey+Math.sin(a+G.t*8)*a*0.32);c.stroke()}
  for(let i=0;i<3;i++){const a=G.t*4+i*TAU/3;star5(c,Math.cos(a)*22,top-10+Math.sin(a)*5,4,'#ffd23f')}}
 else{c.fillStyle='#1a0a05';for(const ex of[-6,6]){c.beginPath();c.arc(ex+lk*3,ey+0.5,1.5,0,TAU);c.fill()}
  c.strokeStyle='#ffef9a';c.lineWidth=1.4;c.beginPath();c.moveTo(-9+lk*2,ey-5);c.lineTo(-3+lk*2,ey-3.5);c.moveTo(9+lk*2,ey-5);c.lineTo(3+lk*2,ey-3.5);c.stroke()}
 if(u.cuffed){c.strokeStyle='#d8dce4';c.lineWidth=2.4;c.beginPath();c.ellipse(0,hemY-18,hw*0.75,4,0,0,TAU);c.stroke();c.beginPath();c.ellipse(0,hemY-30,hw*0.65,4,0,0,TAU);c.stroke()}
 c.restore()}
/* ---------------- effects ---------------- */
function FXList(){return []}
function fxBurst(F,x,y,n,col,sp,life,size,grav){for(let i=0;i<n;i++){const a=Math.random()*TAU,v=sp*(0.3+Math.random()*0.7);F.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*0.3,l:life*(0.6+Math.random()*0.4),l0:life,c:typeof col==='string'?col:pick(col),s:size*(0.6+Math.random()*0.6),g:grav===undefined?200:grav})}}
function fxText(F,x,y,t,col,size){F.push({x,y,vx:0,vy:-30,l:1.4,l0:1.4,txt:t,c:col||'#ffd23f',s:size||16,g:0})}
function fxStep(F,dt){for(let i=F.length-1;i>=0;i--){const p=F[i];p.l-=dt;if(p.l<=0){F.splice(i,1);continue}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}}
function fxDraw(c,F,ts){for(const p of F){const a=clamp(p.l/p.l0*1.6,0,1);c.globalAlpha=a;
  if(p.txt){const fs=p.s*(ts||1);c.font=fs+'px Lilita,system-ui,sans-serif';c.textAlign='center';c.lineWidth=fs*0.22;c.strokeStyle='#2a0a05';c.strokeText(p.txt,p.x,p.y);c.fillStyle=p.c;c.fillText(p.txt,p.x,p.y)}
  else if(p.c==='heart'){c.fillStyle='#ff4a7a';heart(c,p.x,p.y,p.s)}
  else if(p.c==='star'){star5(c,p.x,p.y,p.s,'#ffd23f')}
  else{c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.s,0,TAU);c.fill()}}c.globalAlpha=1}
function heart(c,x,y,s){c.beginPath();c.moveTo(x,y+s*0.9);c.bezierCurveTo(x-s*1.6,y-s*0.2,x-s*0.6,y-s*1.3,x,y-s*0.4);c.bezierCurveTo(x+s*0.6,y-s*1.3,x+s*1.6,y-s*0.2,x,y+s*0.9);c.fill()}
function toast(t,ms){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('on'),ms||1300)}
/* painted background, tiled with alternate mirroring so seams always match */
function drawTiledBG(img,gy,groundY,bgH,camPx,dim){const s=bgH/img.height,w=img.width*s,top=groundY-gy*bgH;
 if(top>0){cx.drawImage(img,0,0,img.width,2,0,0,G.W,top+1)}
 const i0=Math.floor(camPx/w);for(let i=i0;i*w-camPx<G.W;i++){const x=i*w-camPx;if(i%2===0)cx.drawImage(img,x,top,w+0.5,bgH);else{cx.save();cx.translate(x+w,top);cx.scale(-1,1);cx.drawImage(img,-0.5,0,w+0.5,bgH);cx.restore()}}
 const bot=top+bgH;if(bot<G.H)for(let i=i0;i*w-camPx<G.W;i++){const x=i*w-camPx;cx.drawImage(img,0,img.height-2,img.width,2,x,bot-1,w+0.5,G.H-bot+1)}
 if(dim){cx.fillStyle=dim;cx.fillRect(0,0,G.W,G.H)}}
/* ---------------- input ----------------
   Same touch scheme as Peter's Vol 2 games (Jimothy Timothy and the Hair Mob, Kelly's Giraffe Getaway Vol 2):
   SWIPE & HOLD anywhere to move (8-way, anchor follows the finger), SWIPE UP to jump, big round JUMP + ACTION buttons
   bottom-right. Portrait: the game sits on top and the buttons live in their own panel below it, so they never cover play.
   NO D-pad. */
const TOUCH=new Map(),VIRT={jump:0,act:0};
function swipeDir(t){const dx=t.x-t.ax,dy=t.y-t.ay,d=Math.hypot(dx,dy),o={};if(d<14)return o;if(d>44){t.ax=t.x-dx/d*44;t.ay=t.y-dy/d*44}
 const s=Math.round(Math.atan2(dy,dx)/(Math.PI/4));if(s===0||s===1||s===-1)o.R=1;if(s===4||s===-4||s===3||s===-3)o.L=1;if(s===2||s===1||s===3)o.D=1;if(s===-2||s===-1||s===-3)o.U=1;return o}
function playing(){return G.mode==='play'&&!G.paused&&G.game}
function isUI(el){return el&&el.closest&&el.closest('button,.screen:not([hidden]),#storyBox')}
document.addEventListener('pointerdown',e=>{Sound.unlock();if(!playing()||isUI(e.target))return;const t={x:e.clientX,y:e.clientY,ax:e.clientX,ay:e.clientY,ox:e.clientX,oy:e.clientY,px:e.clientX,py:e.clientY,z:{},st:performance.now()};TOUCH.set(e.pointerId,t);
 if(G.game.touch)G.game.touch(t);e.preventDefault()},{passive:false});
addEventListener('pointermove',e=>{const t=TOUCH.get(e.pointerId);if(!t)return;t.x=e.clientX;t.y=e.clientY;const ddx=t.x-t.px,ddy=t.y-t.py;t.px=t.x;t.py=t.y;
 const bu=t.z.U;t.z=swipeDir(t);if(!playing())return;const g=G.game;if(g.drag)g.drag(ddx,ddy);if(t.z.U&&!bu&&g.jump&&g.swipeJump!==false)g.jump()},{passive:false});
function pup(e){TOUCH.delete(e.pointerId)}
addEventListener('pointerup',pup);addEventListener('pointercancel',pup);
function clearInput(){TOUCH.clear();VIRT.jump=VIRT.act=0;G.keys={};document.querySelectorAll('#pad .big.on').forEach(b=>b.classList.remove('on'))}
function held(){return null}
function bindBtn(el,k){const on=e=>{e.preventDefault();e.stopPropagation();Sound.unlock();if(!playing())return;if(!VIRT[k]){const g=G.game;if(k==='jump'&&g.jump)g.jump();if(k==='act'&&g.act)g.act()}VIRT[k]=1;el.classList.add('on')},
 off=e=>{e.preventDefault();VIRT[k]=0;el.classList.remove('on')};
 el.addEventListener('pointerdown',on,{passive:false});el.addEventListener('pointerup',off,{passive:false});el.addEventListener('pointercancel',off);el.addEventListener('pointerleave',off);el.addEventListener('contextmenu',e=>e.preventDefault())}
bindBtn($('bJump'),'jump');bindBtn($('bAct'),'act');
function touchX(){let v=0;for(const t of TOUCH.values()){if(t.z.L)v-=1;if(t.z.R)v+=1}return clamp(v,-1,1)}
function touchY(){let v=0;for(const t of TOUCH.values()){if(t.z.U)v-=1;if(t.z.D)v+=1}return clamp(v,-1,1)}
/* a long swipe (finger well away from where it went down) runs */
function touchRun(){for(const t of TOUCH.values())if(Math.abs(t.x-t.ox)>80)return true;return false}
function actHeld(){const k=G.keys;return !!(VIRT.act||k.Space||k.Enter||k.KeyJ||G.pad.btn.a)}
/* pad layout: copied from Hair Mob's layoutPad (portrait panel = bottom 38%, ACTION outer-right, JUMP inside it and higher) */
function padOn(){return G.mode==='play'||G.mode==='result'}
function layoutPad(){const pad=$('pad'),ba=$('bAct'),bj=$('bJump'),hint=$('swipeHint');
 const b=Follow.padButtons(G.W,G.FH,!G.land,!G.land?G.H:G.FH);
 const place=(el,box)=>{el.style.left='auto';el.style.top='auto';el.style.width=box.s+'px';el.style.height=box.s+'px';el.style.right=box.right+'px';el.style.bottom=box.bottom+'px'};
 if(!G.land){const top=G.H,ph=G.FH-top;pad.style.top=top+'px';pad.style.height=ph+'px';
  place(bj,b.jump);place(ba,b.act);
  bj.style.setProperty('font-size',Math.round(Math.min(25,b.jump.s*0.27))+'px','important');ba.style.setProperty('font-size',Math.round(Math.min(18,b.act.s*0.19))+'px','important');
  hint.style.display='';Object.assign(hint.style,{top:'12px',left:'14px',right:'14px'})}
 else{pad.style.top='0';pad.style.height=G.H+'px';
  place(bj,b.jump);place(ba,b.act);
  bj.style.setProperty('font-size',Math.round(Math.min(25,b.jump.s*0.27))+'px','important');ba.style.setProperty('font-size',Math.round(Math.min(18,b.act.s*0.19))+'px','important');
  hint.style.display='none'}}
let padLbl='';
function padSync(){const pad=$('pad'),vis=G.mode==='play'&&!G.paused&&!!G.game;if(pad.hidden===vis)pad.hidden=!vis;document.body.classList.toggle('padmode',padOn()&&!G.land);
 if(!vis||!G.game)return;const g=G.game,b=(g.btns&&g.btns())||['JUMP','ACTION'],key=b.join('|');if(key===padLbl)return;padLbl=key;
 const bj=$('bJump'),ba=$('bAct'),lb=(e,t,d)=>{const dim=!t||t[0]==='~';e.textContent=(t||d).replace('~','');e.classList.toggle('dim',dim)};lb(bj,b[0],'JUMP');lb(ba,b[1],'ACTION');$('swipeHint').innerHTML=(g.hint&&g.hint())||'SWIPE &amp; HOLD ANYWHERE TO MOVE<br>SWIPE UP TO JUMP'}
addEventListener('keydown',e=>{Sound.unlock();const was=G.keys[e.code];G.keys[e.code]=true;if(was)return;
 if(G.mode==='play'){if(e.code==='Escape'||e.code==='KeyP'){togglePause();return}if(e.code==='KeyC'){doSwap();e.preventDefault();return}if(G.paused)return;const g=G.game;if(!g)return;
  if((e.code==='Space'||e.code==='Enter'||e.code==='KeyJ')&&g.act){g.act();e.preventDefault()}
  if((e.code==='KeyK'||((e.code==='ArrowUp'||e.code==='KeyW')&&g.swipeJump!==false))&&g.jump){g.jump();e.preventDefault()}
  if(/^Arrow/.test(e.code))e.preventDefault()}
 else if(G.mode==='story'&&(e.code==='Space'||e.code==='Enter'||e.code==='ArrowRight')){$('bNext').click();e.preventDefault()}
 else if(G.mode==='story'&&e.code==='Escape'){$('bSkip').click()}});
addEventListener('keyup',e=>{G.keys[e.code]=false});addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(G.mode==='play'&&!G.paused)togglePause()}});
function axisX(){const k=G.keys;return clamp(((k.ArrowRight||k.KeyD)?1:0)-((k.ArrowLeft||k.KeyA)?1:0)+G.pad.ax+touchX(),-1,1)}
function axisY(){const k=G.keys;return clamp(((k.ArrowDown||k.KeyS)?1:0)-((k.ArrowUp||k.KeyW)?1:0)+G.pad.ay+touchY(),-1,1)}
/* hold a direction for a moment (any input) and Duncan breaks into a run */
function runHeld(dir){const n=G.t;if(!dir||dir!==G._rd||n-(G._rl||0)>0.12){G._rd=dir;G._rs=n}G._rl=n;return !!((dir&&n-G._rs>0.2)||touchRun()||G.keys.ShiftLeft||G.keys.ShiftRight||Math.abs(G.pad.ax)>0.85||G.pad.btn.x||G.pad.btn.rb)}
function pollPad(){const ps=navigator.getGamepads?navigator.getGamepads():[];let gp=null;for(const p of ps)if(p&&p.connected){gp=p;break}
 const pd=G.pad;pd.prev=pd.btn;pd.btn={};pd.ax=pd.ay=0;if(!gp)return;const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed),dz=v=>Math.abs(v)<0.22?0:v;
 pd.ax=clamp(dz(gp.axes[0]||0)+(b(15)?1:0)-(b(14)?1:0),-1,1);pd.ay=clamp(dz(gp.axes[1]||0)+(b(13)?1:0)-(b(12)?1:0),-1,1);
 pd.btn={a:b(0),b:b(1),x:b(2),y:b(3),lb:b(4),rb:b(5),start:b(9),up:b(12),down:b(13),left:b(14),right:b(15)};const E=n=>pd.btn[n]&&!pd.prev[n];
 if(Object.keys(pd.btn).some(E))Sound.unlock();
 if(G.mode==='play'){if(E('start')){togglePause();return}if(E('lb')){doSwap();return}if(G.paused){menuNav(E);return}const g=G.game;if(!g)return;
  if(E('a')&&g.act)g.act();if((E('b')||E('y'))&&g.jump)g.jump();if(E('b')&&!g.jump&&g.act)g.act()}
 else menuNav(E)}
function menuNav(E){const bs=[...document.querySelectorAll('#ui button')].filter(b=>b.offsetParent!==null);if(!bs.length)return;let i=bs.indexOf(document.activeElement);
 const st=G.pad.ay>0.6||G.pad.ax>0.6?1:G.pad.ay<-0.6||G.pad.ax<-0.6?-1:0;const mv=(E('down')||E('right'))?1:(E('up')||E('left'))?-1:(st&&!G._nav)?st:0;G._nav=!!st;
 if(mv){i=i<0?0:(i+mv+bs.length)%bs.length;bs[i].focus()}if(E('a')||E('start'))(i>=0?bs[i]:bs[0]).click();if(E('b')){const sk=$('bSkip');if(sk.offsetParent)sk.click()}}
/* ---------------- screens ---------------- */
const SCREENS=['loading','title','levels','story','howto','pause','result'];
function show(id){for(const s of SCREENS)$(s).hidden=s!==id;$('hud').hidden=!(id==='pause'||G.mode==='play');const f=$(id)&&$(id).querySelector('button.big,button');if(f&&!('ontouchstart' in window))setTimeout(()=>f.focus(),30)}
function setMode(m,scr){const was=padOn();G.mode=m;if(was!==padOn())resize();show(scr||m)}
function goTitle(){G.game=null;G.paused=false;setMode('title');Sound.startMusic()}
function goLevels(){const L=$('lvList');L.innerHTML='';LV.forEach((l,i)=>{const b=document.createElement('button');const st=G.stars[l.id]||0;
  b.innerHTML=`${i+1}. ${l.name}<small>${l.kind}</small><span class="st">${'★'.repeat(st)}${'☆'.repeat(3-st)}</span>`;b.onclick=()=>{Sound.play('click');startLevel(i)};L.appendChild(b)});setMode('levels')}
let story=null;
function startStory(lines,done,scene){story={lines,i:0,done};G.storyScene=scene||null;setMode('story');showLine()}
function showLine(){const [who,t]=story.lines[story.i];$('spk').textContent=who;$('txt').textContent=t;const pm={Duncan:'face',Hope:'hope'};$('portrait').src=IMGS[pm[who]||'emblem'];
 $('bNext').innerHTML=story.i<story.lines.length-1?'Next &#9654;':'OK &#9654;'}
$('bNext').onclick=()=>{Sound.play('click');if(!story)return;story.i++;if(story.i>=story.lines.length){const d=story.done;story=null;d()}else showLine()};
$('bSkip').onclick=()=>{Sound.play('click');if(!story)return;const d=story.done;story=null;d()};
function armLevel(L){G.who=(L.cfg&&L.cfg.who)||'duncan';G.swap=null;G._leadX=null;G._hop=0;
 if(G.game&&G.game.d&&typeof G.game.d.x==='number')resetPair(G.game.d.x,G.game.d.face||1);
 else G.partner={who:G.who==='hope'?'duncan':'hope',x:0,y:0,face:1,o:mkGait()}}
function startLevel(i){G.lv=i;G.paused=false;const L=LV[i];G.game=L.make(L.cfg||{});G.game.lvl=L;armLevel(L);startStory(L.story,()=>howto(i),true)}
function howto(i){const L=LV[i];$('htNum').textContent='Level '+(i+1)+' of '+LV.length+' · '+L.kind;$('htTitle').textContent=L.name;$('htText').textContent=L.how;
 $('htKeys').innerHTML=L.keys.map(k=>'<div>'+k+'</div>').join('');setMode('howto')}
$('bStart').onclick=()=>{Sound.play('click');Sound.unlock();G.paused=false;clearInput();const was=padOn();G.mode='play';if(!was)resize();show('none');$('hud').hidden=false;$('hudLv').textContent='Lv '+(G.lv+1);if(G.game.start)G.game.start()};
$('bPause').onclick=()=>togglePause();
function togglePause(){if(G.mode!=='play')return;G.paused=!G.paused;$('pause').hidden=!G.paused;clearInput();if(G.paused){$('bPSound').textContent='Sound: '+(Sound.isOn()?'On':'Off');Sound.setHiss(0)}}
$('bResume').onclick=()=>togglePause();
$('bRestart').onclick=()=>{$('pause').hidden=true;G.paused=false;const L=LV[G.lv];G.game=L.make(L.cfg||{});G.game.lvl=L;armLevel(L);$('bStart').onclick()};
$('bSwap').onclick=()=>{Sound.unlock();doSwap()};
$('bSwitch').onclick=()=>{Sound.unlock();doSwap()};
$('bSkipLv').onclick=()=>{$('pause').hidden=true;G.paused=false;Sound.setHiss(0);nextLevel()};
$('bPLevels').onclick=()=>{$('pause').hidden=true;G.paused=false;Sound.setHiss(0);goLevels()};
function sndBtn(b){b.onclick=()=>{Sound.unlock();Sound.set(!Sound.isOn());b.textContent='Sound: '+(Sound.isOn()?'On':'Off')}}
sndBtn($('bSound'));sndBtn($('bPSound'));$('bSound').textContent='Sound: '+(Sound.isOn()?'On':'Off');
$('bPlay').onclick=()=>{Sound.unlock();Sound.play('click');let i=LV.findIndex(l=>!G.stars[l.id]);if(i<0)i=0;startLevel(i)};
$('bLevels').onclick=()=>{Sound.unlock();Sound.play('click');goLevels()};
$('bLvBack').onclick=()=>goTitle();
let lastRes=null;
function finish(win,stars,text){if(G.mode!=='play')return;Sound.setHiss(0);G.mode='result';lastRes={win,stars};const L=LV[G.lv];
 if(win){G.stars[L.id]=Math.max(G.stars[L.id]||0,stars);saveStars();Sound.play('win')}else Sound.play('lose');
 $('rsTitle').textContent=win?pick(G.who==='hope'?['Great job, Hope!','That was grace.','Way to go, Hope!']:['Great job, Constable!','Flemingsburg is safe!','Way to go, Duncan!']):'Oops! Try again?';
 [...$('rsStars').children].forEach((e,i)=>{e.classList.toggle('on',win&&i<stars)});$('rsStars').hidden=!win;$('rsText').textContent=text||'';
 $('bContinue').innerHTML=win?'Continue &#9654;':'&#8635; Try again';$('bRetry').innerHTML=win?'&#8635; Play again':'Skip level &#9193;';setTimeout(()=>{if(G.mode==='result')show('result')},700)}
$('bContinue').onclick=()=>{Sound.play('click');if(lastRes&&lastRes.win)nextLevel();else startLevel(G.lv)};
$('bRetry').onclick=()=>{Sound.play('click');if(lastRes&&lastRes.win)startLevel(G.lv);else nextLevel()};
function nextLevel(){if(G.lv+1<LV.length)startLevel(G.lv+1);else{G.game=ENDING();startStory(ENDING_STORY,goTitle,true)}}
/* ---------------- who is in front ---------------- */
function resetPair(x,face){const other=G.who==='hope'?'duncan':'hope';
 G.partner={who:other,x:Math.max(24,x-(face||1)*Follow.TRAIL),y:0,face:face||1,o:mkGait()};
 G.swap=null;G._leadX=null;G._hop=0}
function updatePartner(lead,dt,gap){if(!G.partner)resetPair(lead.x,lead.face||1);const p=G.partner;
 if(G.swap){G.swap.t+=dt;const u=Math.min(1,G.swap.t/G.swap.dur),e=Follow.ease(u);
  const back=Follow.trailTarget(lead.x,G.swap.face,gap,null);
  const vis=Follow.lerp(G.swap.fromX,lead.x,e),prev=G._leadX!=null?G._leadX:vis;
  G._leadX=vis;G._hop=Math.sin(Math.min(1,u)*Math.PI)*-32;
  const x0=p.x;p.x=Follow.lerp(G.swap.startLeadX,back,e);p.y=0;p.face=Math.sign(back-G.swap.startLeadX)||(-G.swap.face);
  stepGait(p.o,p.x-x0,dt,p.who==='hope'?RH:RD,true);
  stepGait(lead.o,vis-prev,dt,heroRig(),true);
  if(u>=1){G.swap=null;G._leadX=null;G._hop=0;p.x=back;p.y=0}
  return}
 const x0=p.x;const moved=Follow.stepTrail(p,lead.x,lead.face||1,dt,gap);p.y=0;
 if(Math.abs(moved)>0.4)p.face=Math.sign(moved);else p.face=lead.face||p.face||1;
 stepGait(p.o,moved,dt,p.who==='hope'?RH:RD,lead.y>=-0.5);
 G._leadX=null;G._hop=0}
function doSwap(){if(G.mode!=='play'||!G.game||!G.game.d||G.game.over||G.game.won){if(G.mode==='play'&&G.game&&!G.game.d)toast("Duncan's at the wheel",1100);return}
 if(G.swap)return;const lead=G.game.d;if(!G.partner)resetPair(lead.x,lead.face||1);
 const face=lead.face||1,far=Math.abs(G.partner.x-lead.x)>160;
 const fromX=far?lead.x-face*Follow.TRAIL:G.partner.x;
 G.swap={t:0,dur:0.42,face,fromX,startLeadX:lead.x};
 const prev=G.who;G.who=Follow.swapWho(prev);G.partner.who=prev;G.partner.o=mkGait();
 if(G.paused){G.paused=false;$('pause').hidden=true}
 Sound.play('click');toast(G.who==='hope'?'Hope':'Duncan',800)}
function storyLeft(g,cfg){if(!cfg||!cfg.story)return false;
 for(const e of g.ents){if(e.type==='shade'&&e.st!=='aside')return true;if(e.type==='rival'&&!e.forgiven)return true;
  if((e.type==='antifa'||e.type==='commie'||e.type==='arsonist'||e.type==='umb')&&e.st!=='busted'&&e.st!=='gone')return true}
 if(cfg.gap&&!g.crossed)return true;return false}
function asideShade(g,e,face){if(e.st==='aside')return;e.st='aside';e.vx=(face||1)*320;e.fade=1;g.busted++;
 Sound.play('help');fxBurst(g.F,e.x,e.y,12,['#fff','#ffe9a0'],140,0.7,3,30);fxText(g.F,e.x,e.y-28,'Aside!','#fff6c8',15)}
function hopeLabel(g,cfg){const D=g.d;if(!g.pony)return 'ACTION';
 if(g.pony.phase==='coil'||g.pony.phase==='unroll'||g.pony.phase==='lasso')return 'ACTION';
 if(cfg.gap&&!g.crossed&&D.y>-30&&D.x>cfg.gap.x0-90&&D.x<=cfg.gap.x0+2)return 'LASSO';
 if(g.ents.some(e=>e.type==='shade'&&e.kind!=='high'&&e.st!=='aside'&&Math.abs(e.x-D.x)<150))return 'PRAY';
 if(g.ents.some(e=>e.type==='shade'&&e.kind==='high'&&e.st!=='aside'&&Math.abs(e.x-D.x)<180))return 'GRACE';
 if(g.ents.some(e=>(e.type==='antifa'||e.type==='commie'||e.type==='arsonist')&&e.st!=='busted'&&e.st!=='gone'&&Math.abs(e.x-D.x)<160))return 'LASSO';
 return 'ACTION'}
function hopePress(g,cfg,bust){const D=g.d,now=performance.now();
 g._taps=(g._taps||[]).filter(t=>now-t<450);g._taps.push(now);
 if(g.pony.phase==='coil'||g.pony.phase==='unroll'||D.swing)return true;
 const rival=g.ents.find(e=>e.type==='rival'&&!e.forgiven);
 if(rival&&g._taps.length>=3){g._taps=[];g.pony={phase:'coil',t:0,u:0,hit:false};D.face=Math.sign(rival.x-D.x)||D.face;Sound.play('whistle');return true}
 if(cfg.gap&&!g.crossed&&D.y>-30&&D.x>cfg.gap.x0-90&&D.x<=cfg.gap.x0+2){D.face=1;g.pony={phase:'lasso',t:0,u:0,kind:'swing'};Sound.play('jump');return true}
 const crook=g.ents.find(e=>(e.type==='antifa'||e.type==='commie'||e.type==='arsonist')&&e.st!=='busted'&&e.st!=='gone'&&Math.abs(e.x-D.x)<160&&D.y>-40);
 if(crook){g.pony={phase:'lasso',t:0,u:0,kind:'catch',target:crook};D.face=Math.sign(crook.x-D.x)||D.face;Sound.play('whistle');return true}
 const low=g.ents.find(e=>e.type==='shade'&&e.kind!=='high'&&e.st!=='aside'&&Math.hypot(e.x-D.x,e.y-(D.y-60))<165);
 if(low&&g.cdp<=0){g.cdp=0.42;D.face=Math.sign(low.x-D.x)||1;g.prayers.push({x:D.x+D.face*18,y:D.y-64,vx:D.face*280,r:14,life:0.9});Sound.play('help');fxBurst(g.F,D.x+D.face*20,D.y-70,8,['#fff','#fff6c8'],80,0.5,3,-20);return true}
 const high=g.ents.find(e=>e.type==='shade'&&e.kind==='high'&&e.st!=='aside'&&Math.abs(e.x-D.x)<180);
 if(high&&g.cdg<=0){g.cdg=1.15;g.graces.push({x:D.x,y:D.y-58,face:D.face||1,r:18,life:0.74,l0:0.74});Sound.play('star');return true}
 const umb=g.ents.find(e=>(e.type==='umb'||e.type==='boss')&&e.st!=='busted'&&e.st!=='gone'&&Math.abs(e.x-D.x)<110);
 if(umb&&cfg.duncanOnlyUmb){toast('Duncan folds the umbrellas',1100);D.ov={t:'point',tm:0.35};return true}
 g.pony={phase:'punch',t:0.22,u:1};D.ov={t:'point',tm:0.22};Sound.play('cuff');return true}
function storyStep(g,cfg,dt,bust){if(g.cdp>0)g.cdp-=dt;if(g.cdg>0)g.cdg-=dt;const D=g.d,py=g.pony;
 if(py.phase==='lasso'){py.t+=dt;py.u=Math.min(1,py.t/0.42);D.o.pony='lasso';D.o.ponyU=py.u;
  if(py.kind==='swing'&&cfg.gap)D.o.hairTo={x:(cfg.gap.anchorX-D.x)*D.face,y:cfg.gap.anchorY-D.y};
  if(py.kind==='catch'&&py.target)D.o.hairTo={x:(py.target.x-D.x)*D.face,y:((py.target.y||0)-78)-D.y};
  if(py.u>=1){if(py.kind==='swing')D.swing={t:0};
   else if(py.kind==='catch'&&py.target&&py.target.st!=='busted'&&py.target.st!=='gone'&&Math.abs(py.target.x-D.x)<180)bust(py.target);
   if(py.kind!=='swing'){py.phase='idle';D.o.pony='idle'}else py.phase='swing'}}
 else if(py.phase==='coil'){py.t+=dt;py.u=Math.min(1,py.t/0.48);D.o.pony='coil';D.o.ponyU=py.u;if(py.t>=0.48){py.phase='unroll';py.t=0;py.u=0;py.hit=false}}
 else if(py.phase==='unroll'){py.t+=dt;py.u=Math.min(1,py.t/0.62);D.o.pony='unroll';D.o.ponyU=py.u;
  const rv=g.ents.find(e=>e.type==='rival'&&!e.forgiven);
  if(rv)D.o.hairTo={x:(rv.x-D.x)*D.face,y:(rv.y||0)-60-D.y};
  if(!py.hit&&py.u>=0.32&&py.u<=0.9&&rv&&(rv.x-D.x)*D.face>-40&&Math.abs(rv.x-D.x)<210&&D.y>-50){py.hit=true;rv.forgiven=true;g.busted++;Sound.play('star');Sound.play('help');fxBurst(g.F,rv.x,-70,18,['#fff','#ffe9a0','#fff6c8'],160,0.8,4,20);fxText(g.F,rv.x,-120,'Peace','#fff6c8',18)}
  if(py.t>=0.62){py.phase='idle';D.o.pony='idle'}}
 else if(py.phase==='punch'){py.t-=dt;D.o.pony='punch';D.o.ponyU=Math.max(0,py.t/0.22);if(py.t<=0){py.phase='idle';D.o.pony='idle'}}
 for(let i=g.prayers.length-1;i>=0;i--){const p=g.prayers[i];p.life-=dt;p.x+=p.vx*dt;let dead=p.life<=0;
  for(const e of g.ents){if(e.type!=='shade'||e.st==='aside')continue;if(Math.hypot(e.x-p.x,e.y-p.y)<(e.r||22)+p.r){asideShade(g,e,Math.sign(p.vx)||1);dead=true}}
  if(dead)g.prayers.splice(i,1)}
 for(let i=g.graces.length-1;i>=0;i--){const gr=g.graces[i];gr.life-=dt;const u=1-gr.life/gr.l0;gr.r=18+(176-18)*Math.min(1,Math.max(0,u));
  for(const e of g.ents){if(e.type!=='shade'||e.st==='aside')continue;if((e.x-gr.x)*gr.face<0)continue;if(Math.hypot(e.x-gr.x,e.y-gr.y)<gr.r+22)asideShade(g,e,gr.face)}
  if(gr.life<=0)g.graces.splice(i,1)}
 for(const e of g.ents){if(e.type!=='shade')continue;e.y=(e.homeY||e.y)+Math.sin(g.t*2+e.x)*6;
  if(e.st==='aside'){e.x+=e.vx*dt;e.vx*=Math.pow(0.15,dt);e.fade=Math.max(0,(e.fade==null?1:e.fade)-dt*0.7)}}}
function storyDrawGround(c,cfg){const gap=cfg.gap;if(!gap)return;
 c.fillStyle='#120810';c.fillRect(gap.x0,-6,gap.x1-gap.x0,240);
 c.fillStyle='#3a2a28';c.fillRect(gap.x0-10,-16,18,30);c.fillRect(gap.x1-8,-16,18,30);
 c.strokeStyle='#6b4a2a';c.lineWidth=5;c.beginPath();c.moveTo(gap.anchorX,gap.anchorY);c.lineTo(gap.anchorX,-4);c.stroke();
 c.strokeStyle='#e0b033';c.lineWidth=3;c.beginPath();c.arc(gap.anchorX,gap.anchorY,11,0,TAU);c.stroke()}
function storyDrawFx(c,g){for(const p of g.prayers||[]){c.fillStyle='rgba(255,246,190,.4)';c.beginPath();c.arc(p.x,p.y,13,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.moveTo(p.x-2,p.y);c.lineTo(p.x-11,p.y-5);c.lineTo(p.x+2,p.y);c.lineTo(p.x+11,p.y-5);c.closePath();c.fill()}
 for(const gr of g.graces||[]){c.strokeStyle='rgba(255,236,170,.75)';c.lineWidth=6;c.beginPath();c.arc(gr.x,gr.y,gr.r,gr.face>0?-1.15:Math.PI-1.15,gr.face>0?1.15:Math.PI+1.15);c.stroke()}}
/* ================= SIDE-SCROLLER (on foot) ================= */
const NEED={granny:['My groceries!','Thank you, Constable!'],kid:['I lost my mommy!','Mommy!'],farmer:['My hat blew off!','Much obliged!'],mom:['','']};
function SideGame(cfg){
 const g={F:[],hearts:cfg.hearts||3,t:0,busted:0,helped:0,need:{bust:0,help:0},ents:[],proj:[],waves:[],len:cfg.len||2400,cam:0,started:false,
  d:{x:cfg.x||200,y:0,vy:0,face:1,o:mkGait(),inv:0,kb:0,ov:null},rain:cfg.rain?[]:null,flash:0};
 const D=g.d;D.o.ov=null;
 for(const s of cfg.spawns||[]){const e={type:s.t,x:s.x,y:0,face:-1,o:mkGait(),st:'idle',tm:0,op:0,home:s.x,look:LOOK[s.t]||null,id:Math.random()};
  if(s.t==='umb'||s.t==='boss'){e.st='creep';e.blinkT=rnd(1,3)}
  if(s.t==='antifa'||s.t==='commie'||s.t==='arsonist'){e.st='loiter';e.tt=rnd(0,2);g.need.bust++}
  if(s.t==='umb'){g.need.bust++}
  if(s.t==='granny'||s.t==='kid'||s.t==='farmer'){e.st='need';g.need.help++}
  if(s.t==='kid'){e.mom={x:s.x+(s.momdx||260),o:mkGait(),face:-1}}
  if(s.t==='farmer'){e.hat={x:s.x+90,y:-60,vx:0}}
  if(s.t==='boss'){e.hits=0;e.st='intro';e.tm=1.2}
  g.ents.push(e)}
 g.pony={phase:'idle',t:0,u:0};g.prayers=[];g.graces=[];g.crossed=false;g.gap=cfg.gap||null;g.cdp=0;g.cdg=0;g._taps=[];
 for(const s of cfg.shades||[]){g.ents.push({type:'shade',kind:s.kind||'low',x:s.x,y:s.y,homeY:s.y,face:1,o:mkGait(),st:'idle',fade:1,r:22,look:LOOK.shade,id:Math.random()});g.need.bust++}
 if(cfg.rival){g.ents.push({type:'rival',x:cfg.rival.x,y:0,face:-1,o:mkGait(),st:'idle',forgiven:false,look:LOOK.rival,id:Math.random()});g.need.bust++}
 g.boss=g.ents.find(e=>e.type==='boss');
 g.view=()=>{const land=G.land;const k=land?G.H*0.235/106:Math.min(G.H*0.2,G.W*0.4)/106;const gY=land?G.H*0.86:G.H*0.85;const bgH=land?G.H*1.03:G.H*0.93;return{k,gY,bgH,vw:G.W/k}};
 g.start=()=>{g.started=true;/* spawn safety: start on solid street ground, short blink grace */D.y=0;D.vy=0;D.x=clamp(D.x,40,g.len-40);D.inv=1.5;if(g.boss)toast('BOSS: The Great Umbrella!',1800);else if(cfg.toast)toast(cfg.toast,1500)};
 function hurt(dir){if(D.inv>0||g.over)return;g.hearts--;D.inv=1.4;D.kb=dir*230;D.vy=-120;D.y=-1;Sound.play('hurt');fxText(g.F,D.x,D.y-120,'Ouch!','#ff8a7a',15);if(g.hearts<=0){g.over=true;setTimeout(()=>finish(false,0,cfg.failText||'The troublemakers got the best of you this time. Try again!'),600)}}
 function bust(e){e.st='busted';e.tm=1.1;e.cuffed=true;g.busted++;Sound.play('cuff');setTimeout(()=>Sound.play('bust'),120);D.ov={t:'cuff',tm:0.35};fxBurst(g.F,e.x,-60,14,'star',140,0.8,4,150);
  fxText(g.F,e.x,-150,pick(['BUSTED!','CUFFED!','GOTCHA!']),'#ffd23f',18);if(e.type==='umb')fxText(g.F,e.x,-128,'Umbrella folded!','#fff',11)}
 g.act=()=>{if(g.over||!g.started)return;if(cfg.story&&G.who==='hope'){if(hopePress(g,cfg,bust))return}let best=null,bd=1e9;
  for(const e of g.ents){const dx=Math.abs(e.x-D.x);let r=0;
   if(e.type==='umb')r=e.st==='open'?120:(e.st==='creep'||e.st==='shake')?84:0;
   else if((e.type==='antifa'||e.type==='commie'||e.type==='arsonist')&&e.st!=='busted'&&e.st!=='gone')r=90;
   else if(e.st==='need')r=85;
   else if(e.type==='boss'&&e.st==='open')r=175;
   if(r&&dx<r&&dx<bd){bd=dx;best=e}}
  if(!best){if(cfg.story&&G.who==='duncan'&&g.ents.some(e=>e.type==='shade'&&e.st!=='aside'))toast("That's a job for Hope",1000);else if(cfg.story&&G.who==='duncan'&&g.ents.some(e=>e.type==='rival'&&!e.forgiven&&Math.abs(e.x-D.x)<240))toast('Hope can forgive him',1000);D.ov={t:'point',tm:0.3};Sound.play('whistle');return}
  if(cfg.duncanOnlyUmb&&G.who!=='duncan'&&(best.type==='umb'||best.type==='boss')){toast('Duncan folds the umbrellas',1100);D.ov={t:'point',tm:0.3};return}
  D.face=Math.sign(best.x-D.x)||D.face;
  if(best.type==='boss'){best.hits++;Sound.play('cuff');Sound.play('boom');D.ov={t:'cuff',tm:0.4};fxBurst(g.F,best.x,-150,24,'star',220,1,5,150);fxText(g.F,best.x,-260,['STRAP ONE!','STRAP TWO!','STRAP THREE!','FOLDED!'][best.hits-1]||'POW!','#ffd23f',22);g.flash=0.3;
   if(best.hits>=4){best.st='busted';best.tm=2.5;best.cuffed=true;g.busted++;Sound.play('bust');g.won=true;setTimeout(()=>finish(true,g.hearts>=4?3:g.hearts>=2?2:1,'The Great Umbrella is folded, strapped and hauled off to the county lockup!'),2400)}
   else{best.st='close';best.tm=0.35;best.after='retreat';if(best.hits===1||best.hits===3){for(const dx of[-1,1]){const x=clamp(D.x+dx*rnd(260,340),40,g.len-40);g.ents.push({type:'umb',x,y:0,face:-1,o:mkGait(),st:'creep',tm:0,op:0,home:x,id:Math.random(),rise:1});}}}return}
  if(best.st==='need'){best.st='helped';best.tm=0;g.helped++;D.ov={t:'wave',tm:0.6};Sound.play('help');fxBurst(g.F,best.x,-90,8,'heart',80,1.2,5,-40);fxText(g.F,best.x,-140,NEED[best.type][1],'#9effa0',13);
   if(best.type==='farmer'){best.hat.give=1}return}
  bust(best)};
 g.jump=()=>{if(g.over||!g.started)return;if(D.y>=-0.5){D.vy=-340;D.y=-1;Sound.play('jump')}};
 let hold=null,tapT=0;
 g.down=p=>{};g.move=p=>{};
 g.up=p=>{};g.btns=()=>['JUMP',(cfg.story&&G.who==='hope')?hopeLabel(g,cfg):'ACTION'];
 g.update=dt=>{g.t+=dt;const V=g.view();if(g.flash>0)g.flash-=dt;
  /* --- Duncan input --- */
  let dir=0,run=false;const h=held();
  if(G.auto){const a=g.autoplay();dir=a.dir;run=a.run}
  else if(h&&!(h.swipe)){const wx=g.cam+h.x/V.k,dx=wx-D.x;if(Math.abs(dx)>10){dir=Math.sign(dx);run=Math.abs(h.x-(D.x-g.cam)*V.k)>G.W*0.26}}
  else{const ax=axisX();if(Math.abs(ax)>0.2){dir=Math.sign(ax);run=runHeld(dir)}}
  if(g.over||!g.started||g.won||G.swap)dir=0;
  if(g.pony&&(g.pony.phase==='coil'||g.pony.phase==='unroll'||g.pony.phase==='lasso'))dir=0;
  if(D.ov){D.ov.tm-=dt;if(D.ov.tm<=0)D.ov=null}
  const sp=run?RD.vr:RD.vw;let vx=dir*sp+D.kb;D.kb*=Math.pow(0.02,dt);if(Math.abs(D.kb)<5)D.kb=0;
  if(dir)D.face=dir;
  const x0=D.x;
  if(D.swing){D.swing.t+=dt;const u=Math.min(1,D.swing.t/1.15),e=u*u*(3-2*u),gap=cfg.gap;
   D.x=gap.x0-10+(gap.x1+36-(gap.x0-10))*e;D.y=-Math.sin(u*Math.PI)*200;D.vy=0;D.face=1;
   D.o.pony='lasso';D.o.ponyU=1;D.o.hairTo={x:(gap.anchorX-D.x)*D.face,y:gap.anchorY-D.y};
   if(u>=1){D.swing=null;D.y=0;D.vy=0;D.x=gap.x1+36;g.crossed=true;D.o.pony='idle';g.pony.phase='idle';Sound.play('help');fxText(g.F,D.x,-130,'Across!','#fff',18)}}
  else{let nx=D.x+vx*dt;const gap=cfg.gap;
   if(gap&&D.y>=-0.5){if(D.x<=gap.x0&&nx>gap.x0)nx=gap.x0-1;if(D.x>=gap.x1&&nx<gap.x1)nx=gap.x1+1}
   D.x=clamp(nx,20,g.len-20);if(g.gate&&D.x>g.gate)D.x=g.gate;
   const over=gap&&D.x>gap.x0+4&&D.x<gap.x1-4;
   if(over){D.vy+=900*dt;D.y+=D.vy*dt;if(D.y>150){D.x=gap.x0-40;D.y=0;D.vy=0;D.inv=0.4;g.hearts--;Sound.play('hurt');fxText(g.F,D.x,-110,'The ravine is too wide','#ffb0a0',14);if(g.hearts<=0){g.over=true;setTimeout(()=>finish(false,0,'The ravine is too wide to jump.'),600)}}}
   else if(D.y<0||D.vy<0){D.vy+=900*dt;D.y+=D.vy*dt;if(D.y>=0){D.y=0;D.vy=0}}}
  const on=D.y>=-0.5&&Math.abs(D.kb)<40&&!D.swing;D.o.ov=D.ov;if(!G.swap)stepGait(D.o,D.x-x0,dt,heroRig(),on);
  if(D.inv>0)D.inv-=dt;
  let cam=D.x-V.vw*(G.land?0.4:0.46);
  if(G.partner){const back=Math.min(G.partner.x,D.x);if(back-cam<110)cam=back-110}
  g.cam=clamp(cam,0,Math.max(0,g.len-V.vw));if(V.vw>g.len)g.cam=(g.len-V.vw)/2;
  /* --- entities --- */
  g.gate=null;
  for(const e of g.ents){const dx=D.x-e.x,adx=Math.abs(dx),near=adx<V.vw*0.9;e.look2=Math.sign(dx)||1;
   if(e.type==='shade'||e.type==='rival'){e.face=Math.sign(D.x-e.x)||e.face||1;if(e.type==='rival'){e.look=e.forgiven?LOOK.rivalDone:LOOK.rival;e.o.ov=e.forgiven?{t:'cheer'}:null}stepGait(e.o,0,dt,RP,true);continue}
   if(e.type==='umb'){
    e.blinkT-=dt;e.blink=e.blinkT<0;if(e.blinkT<-0.12)e.blinkT=rnd(1.5,4);e.look=Math.sign(dx);
    if(e.rise){e.rise=Math.max(0,e.rise-dt*1.5)}
    if(e.st==='creep'){e.shake=0;if(near&&g.started&&!g.over){e.x+=Math.sign(dx)*(cfg.umbSp||38)*dt*(0.6+0.4*Math.abs(Math.sin(g.t*3+e.id*9)))}if(adx<86&&g.started){e.st='shake';e.tm=cfg.umbWind||0.8}}
    else if(e.st==='shake'){e.shake=1;e.tm-=dt;if(e.tm<=0){e.st='open';e.tm=1.9;e.shake=0;Sound.play('pop');fxBurst(g.F,e.x,-80,16,['#5a4030','#2a1c14','#fff'],220,0.5,3,300);g.F.push({x:e.x,y:-60,vx:0,vy:0,l:0.25,l0:0.25,c:'ring',s:20,g:0});if(adx<102&&D.y>-35)hurt(-Math.sign(e.x-D.x)||-1)}}
    else if(e.st==='open'){e.op=Math.min(1,e.op+dt*8);e.stun=1;e.tm-=dt;if(e.tm<=0){e.st='close';e.tm=0.3}}
    else if(e.st==='close'){e.stun=0;e.op=Math.max(0,e.op-dt*4);e.tm-=dt;if(e.tm<=0){e.st='back';e.tm=0.9}}
    else if(e.st==='back'){e.x-=Math.sign(dx)*60*dt;e.tm-=dt;if(e.tm<=0)e.st='creep'}
    else if(e.st==='busted'){e.op=Math.max(0,e.op-dt*5);e.stun=0;e.tm-=dt;e.fade=clamp(e.tm/0.6,0,1);if(e.tm<=0)e.st='gone'}
    if(e.st!=='open'&&e.st!=='busted'&&e.st!=='gone'&&e.st!=='close')e.op=Math.max(0,e.op-dt*6);
    e.x=clamp(e.x,20,g.len-20)}
   else if(e.type==='boss'){
    e.look=Math.sign(dx);
    if(e.st==='intro'){e.tm-=dt;if(e.tm<=0&&g.started)e.st='creep'}
    else if(e.st==='creep'){e.shake=0;e.stun=0;e.x+=Math.sign(dx)*48*dt;if(adx<175){e.st='shake';e.tm=1}}
    else if(e.st==='shake'){e.shake=1.4;e.tm-=dt;if(e.tm<=0){e.st='open';e.tm=2.6;e.shake=0;Sound.play('pop');Sound.play('boom');g.flash=0.25;fxBurst(g.F,e.x,-200,30,['#5a4030','#2a1c14','#fff'],320,0.7,5,300);
      g.waves.push({x:e.x,d:-1,l:3},{x:e.x,d:1,l:3});if(adx<120&&D.y>-35)hurt(-Math.sign(e.x-D.x)||-1)}}
    else if(e.st==='open'){e.op=Math.min(1,e.op+dt*6);e.stun=1;e.tm-=dt;if(e.tm<=0){e.st='close';e.tm=0.4;e.after='creep'}}
    else if(e.st==='close'){e.stun=0;e.op=Math.max(0,e.op-dt*3);e.tm-=dt;if(e.tm<=0){e.st=e.after||'creep';e.tx=D.x<g.len/2?g.len-90:90}}
    else if(e.st==='retreat'){const t=e.tx;e.x+=Math.sign(t-e.x)*200*dt;if(Math.abs(t-e.x)<8)e.st='creep'}
    else if(e.st==='busted'){e.tm-=dt;e.op=Math.max(0,e.op-dt*3);e.fade=clamp(e.tm/1,0,1);e.stun=0}
    e.x=clamp(e.x,60,g.len-60)}
   else if(e.type==='antifa'||e.type==='commie'||e.type==='arsonist'){
    let mv=0,sp=0;const R=RP;
    if(e.st==='loiter'){e.tt-=dt;if(e.type==='commie'&&near&&adx<420&&g.started){e.st='march'}
     else if(near&&adx<(e.type==='arsonist'?280:210)&&g.started){e.st='flee';e.tm=e.type==='arsonist'?3.4:2.7;Sound.play('whistle')}
     else{if(e.tt<0){e.tt=rnd(1.5,3);e.pd=pick([-1,0,1])}const t=e.home+(e.pd||0)*50;if(Math.abs(t-e.x)>4){mv=Math.sign(t-e.x);sp=55}}}
    else if(e.st==='flee'){mv=-Math.sign(dx)||1;sp=e.type==='arsonist'?168:150;e.tm-=dt;if(e.tm<=0||e.x<=25||e.x>=g.len-(e.type==='arsonist'?143:25)){e.st='tired';e.tm=e.type==='arsonist'?2.2:1.7}}
    else if(e.st==='tired'){e.tm-=dt;if(Math.random()<dt*4)g.F.push({x:e.x+rnd(-4,4),y:-100,vx:rnd(-20,20),vy:-30,l:0.6,l0:0.6,c:'#9ad8ff',s:2,g:200});if(e.tm<=0){e.st='flee';e.tm=1.8;if(adx>260){e.st='loiter';e.home=e.x}}}
    else if(e.st==='march'){if(adx>130){mv=Math.sign(dx);sp=55}e.face=Math.sign(dx)||e.face;e.tt-=dt;if(e.tt<=0&&adx<420&&!g.over){e.tt=2.5;e.ov={t:'throw',k:0,tm:0.35};
      const T=0.95,y0=-88,gr=420;g.proj.push({x:e.x+e.face*8,y:y0,vx:(D.x-e.x)/T,vy:(-45-y0-0.5*gr*T*T)/T,g:gr,l:2.5})}}
    else if(e.st==='busted'){e.tm-=dt;e.ov={t:'cuffed',tm:1};e.fade=clamp(e.tm/0.5,0,1);if(e.tm<=0)e.st='gone'}
    if(e.ov){e.ov.tm-=dt;if(e.ov.t==='throw')e.ov.k=Math.min(1,e.ov.k+dt*5);if(e.ov.tm<=0&&e.ov.t!=='cuffed')e.ov=null}
    if(mv){e.face=mv}else if(e.st!=='busted'&&e.st!=='gone')e.face=Math.sign(dx)||e.face;
    const x0=e.x;e.x=clamp(e.x+mv*sp*dt,22,g.len-(e.type==='arsonist'?140:22));e.o.ov=e.ov;stepGait(e.o,e.x-x0,dt,RP,true);
    if(e.type==='arsonist'&&e.st!=='busted'&&e.st!=='gone')g.gate=g.len-70;
    /* run into a fleeing or tired crook and you nab him (no button needed) */
    if((e.st==='flee'||e.st==='tired')&&Math.abs(e.x-D.x)<38&&D.y>-30&&!g.over)bust(e)}
   else if(e.st==='need'||e.st==='helped'){e.face=Math.sign(dx)||e.face;e.o.ov=e.st==='helped'?{t:'wave'}:(e.type==='granny'?{t:'cane'}:null);let x0=e.x;
    if(e.type==='kid'&&e.st==='helped'){const m=e.mom;if(Math.abs(m.x-e.x)>26){const d=Math.sign(m.x-e.x);e.x+=d*120*dt;e.face=d;e.o.ov=null}else{e.look={...LOOK.kid,mood:'happy'};e.o.ov={t:'hands'}}}
    stepGait(e.o,e.x-x0,dt,e.look&&e.look.kid?RK:RP,true);
    if(e.mom){e.mom.face=Math.sign(e.x-e.mom.x)||-1;e.mom.o.ov=e.st==='helped'?{t:'hands'}:{t:'wave'};stepGait(e.mom.o,0,dt,RP,true)}
    if(e.hat){const h=e.hat;if(h.give){h.x+=(e.x+3-h.x)*Math.min(1,dt*5);h.y+=(-104-h.y)*Math.min(1,dt*5)}else{h.y=-60+Math.sin(g.t*3)*16;h.x=e.home+90+Math.sin(g.t*1.3)*20}}}}
  /* projectiles (tomatoes) */
  for(let i=g.proj.length-1;i>=0;i--){const p=g.proj[i];p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;
   if(Math.abs(p.x-D.x)<15&&p.y>D.y-95&&p.y<D.y-10&&D.inv<=0){g.proj.splice(i,1);Sound.play('splat');fxBurst(g.F,p.x,p.y,12,'#d82a1a',120,0.5,3);fxText(g.F,D.x,D.y-125,'Splat!','#ff6a5a',14);hurt(Math.sign(p.vx)||1);continue}
   if(p.y>=-2||p.l<=0){Sound.play('splat');fxBurst(g.F,p.x,-2,10,'#d82a1a',100,0.4,3);g.proj.splice(i,1)}}
  for(let i=g.waves.length-1;i>=0;i--){const w=g.waves[i];w.x+=w.d*270*dt;w.l-=dt;if(w.l<=0||w.x<0||w.x>g.len){g.waves.splice(i,1);continue}if(Math.abs(w.x-D.x)<16&&D.y>-28&&!w.hit){w.hit=1;hurt(w.d)}}
  for(let i=g.ents.length-1;i>=0;i--)if(g.ents[i].st==='gone')g.ents.splice(i,1);
  if(cfg.story){storyStep(g,cfg,dt,bust);if(storyLeft(g,cfg))g.gate=g.len-120}
  fxStep(g.F,dt);
  if(g.rain){if(g.rain.length<140)for(let i=0;i<6;i++)g.rain.push({x:Math.random()*G.W,y:Math.random()*-G.H,v:rnd(500,800)});for(const r of g.rain){r.y+=r.v*dt;r.x-=r.v*0.15*dt;if(r.y>G.H){r.y=rnd(-60,0);r.x=Math.random()*G.W*1.1}}
   if(Math.random()<dt*0.12)g.flash=0.18}
  /* finish */
  if(!g.boss&&!g.over&&!g.done&&D.x>=g.len-60){if(cfg.story&&storyLeft(g,cfg)){g.gate=g.len-120;if(g.t-(g._nag||0)>2.2){g._nag=g.t;toast('Still some trouble out there',1000)}}
   else{g.done=true;const nb=g.need.bust,nh=g.need.help;const st=1+(g.busted>=Math.ceil(nb*0.8)?1:0)+(g.helped>=nh?1:0);
   finish(true,st,`Busted ${g.busted} of ${nb} troublemakers and helped ${g.helped} of ${nh} neighbors.`)}}};
 g.hud=()=>'♥'.repeat(Math.max(0,g.hearts))+'♡'.repeat(Math.max(0,(cfg.hearts||3)-g.hearts))+(g.boss?`  Boss ${'■'.repeat(4-g.boss.hits)}${'□'.repeat(g.boss.hits)}`:`  Bust ${g.busted}/${g.need.bust}`+(g.need.help?`  Help ${g.helped}/${g.need.help}`:''));
 g.draw=()=>{const V=g.view(),k=V.k,img=G.img[cfg.bg];drawTiledBG(img,cfg.gy,V.gY,V.bgH,g.cam*k,cfg.dim);
  cx.save();cx.translate(-g.cam*k,V.gY);cx.scale(k,k);
  if(cfg.story)storyDrawGround(cx,cfg);
  /* end marker */
  if(!g.boss){const ex=g.len-40;cx.fillStyle='#5a3a20';cx.fillRect(ex-2,-70,4,70);cx.fillStyle='#2a6a3a';cx.strokeStyle='#fff';cx.lineWidth=1.5;cx.beginPath();cx.roundRect?cx.roundRect(ex-34,-92,68,26,4):cx.rect(ex-34,-92,68,26);cx.fill();cx.stroke();
   cx.fillStyle='#fff';cx.font='12px Lilita,system-ui';cx.textAlign='center';cx.fillText(cfg.endSign||'Next Block →',ex,-74)}
  for(const w of g.waves){cx.save();cx.translate(w.x,0);cx.scale(w.d,1);cx.globalAlpha=clamp(w.l,0,1)*0.85;cx.strokeStyle='#cfe8ff';cx.lineWidth=3;for(let i=0;i<3;i++){cx.beginPath();cx.arc(-i*9,-2,12+i*5,-1.3,0.2);cx.stroke()}cx.restore()}
  const ord=[...g.ents].sort((a,b)=>(a.type==='boss'?-1:0)-(b.type==='boss'?-1:0));
  for(const e of ord){cx.save();cx.translate(e.x,e.y||0);
   if(e.type==='umb'){if(e.rise)cx.translate(0,e.rise*140);if(e.st==='busted'){}drawUmb(cx,e,1)}
   else if(e.type==='boss'){drawUmb(cx,e,2.5)}
   else{if(e.fade!==undefined)cx.globalAlpha=e.fade;const L=e.look||LOOK[e.type];
    if(e.mom){cx.save();cx.translate(e.mom.x-e.x,0);cx.scale(e.mom.face,1);drawPerson(cx,e.mom.o,LOOK.mom);cx.restore()}
    cx.save();cx.scale(e.face||1,1);if(e.st==='busted'){cx.translate(0,4)}drawPerson(cx,e.o,e.st==='tired'?{...L}:L);cx.restore();
    if(e.st==='busted'){cx.strokeStyle='#d8dce4';cx.lineWidth=2;cx.beginPath();cx.arc(-8*(e.face||1),-62,3.5,0,TAU);cx.arc(-4*(e.face||1),-62,3.5,0,TAU);cx.stroke()}
    if(e.type==='granny'&&e.st==='need'){cx.fillStyle='#d82a1a';for(let i=0;i<4;i++){cx.beginPath();cx.arc(16+i*9,-3,3.5,0,TAU);cx.fill()}cx.fillStyle='#c8a060';cx.fillRect(-26,-12,12,12)}
    if(e.hat){cx.save();cx.translate(e.hat.x-e.x,e.hat.y);cx.rotate(e.hat.give?0:Math.sin(g.t*4)*0.5);cx.fillStyle='#c8a050';cx.beginPath();cx.ellipse(0,0,11,3,0,0,TAU);cx.fill();cx.fillRect(-6,-7,12,7);cx.restore()}
    if(e.st==='need'){const b=NEED[e.type][0];cx.font='11px Lilita,system-ui';const w=cx.measureText(b).width+12;const by=e.look&&e.look.kid?-82:-122;
     cx.fillStyle='rgba(255,255,255,.95)';cx.strokeStyle='#333';cx.lineWidth=1;cx.beginPath();cx.roundRect?cx.roundRect(-w/2,by-16,w,20,6):cx.rect(-w/2,by-16,w,20);cx.fill();cx.stroke();cx.fillStyle='#222';cx.textAlign='center';cx.fillText(b,0,by-2);
     cx.fillStyle='#ffd23f';cx.font='16px Lilita,system-ui';cx.fillText('!',0,by-22+Math.sin(g.t*6)*2)}
    if(e.st==='tired'){cx.fillStyle='#fff';cx.font='11px Lilita,system-ui';cx.textAlign='center';cx.fillText('huff huff',0,-112)}}
   cx.restore()}
  if(cfg.story)storyDrawFx(cx,g);
  pairBegin(cx,D);pairEnd(cx);
  for(const p of g.proj){cx.fillStyle='#d82a1a';cx.beginPath();cx.arc(p.x,p.y,5,0,TAU);cx.fill();cx.fillStyle='#2a8a2a';cx.fillRect(p.x-1.5,p.y-7,3,3)}
  for(const p of g.F)if(p.c==='ring'){cx.strokeStyle='rgba(255,255,255,'+(p.l/p.l0)+')';cx.lineWidth=3;cx.beginPath();cx.arc(p.x,p.y,(1-p.l/p.l0)*90+10,0,TAU);cx.stroke()}
  fxDraw(cx,g.F.filter(p=>p.c!=='ring'),1);
  cx.restore();
  if(g.rain){cx.strokeStyle='rgba(180,200,255,.45)';cx.lineWidth=1.3;cx.beginPath();for(const r of g.rain){cx.moveTo(r.x,r.y);cx.lineTo(r.x-3,r.y+14)}cx.stroke()}
  if(g.flash>0){cx.fillStyle='rgba(255,255,255,'+(g.flash*1.5)+')';cx.fillRect(0,0,G.W,G.H)}};
 /* QA autopilot: walks to the next job, busts/helps, jumps over tomatoes and gusts */
 g.autoplay=()=>{let tg=null,bd=1e9;for(const e of g.ents){if(e.st==='busted'||e.st==='gone'||e.st==='helped')continue;if(e.type==='boss'||e.type==='umb'||e.type==='antifa'||e.type==='commie'||e.type==='arsonist'||e.st==='need'){const d=Math.abs(e.x-D.x)+(e.x<D.x-200?5000:0);if(d<bd){bd=d;tg=e}}}
  for(const p of g.proj)if(Math.abs(p.x-D.x)<70&&p.vy>0)g.jump();for(const w of g.waves)if(Math.abs(w.x-D.x)<60&&Math.sign(D.x-w.x)===w.d)g.jump();
  if(!tg)return{dir:1,run:true};const dx=tg.x-D.x;
  if(tg.type==='umb'||tg.type==='boss'){if(tg.st==='open'){if(Math.abs(dx)<(tg.type==='boss'?120:90)){g.act();return{dir:0}}return{dir:Math.sign(dx),run:true}}
   if(tg.st==='shake'){return{dir:-Math.sign(dx),run:true}}if(tg.type==='umb'&&Math.abs(dx)<60){g.act();return{dir:0}}if(Math.abs(dx)<(tg.type==='boss'?200:100))return{dir:0};return{dir:Math.sign(dx),run:Math.abs(dx)>200}}
  if(Math.abs(dx)<44){g.act();return{dir:0}}return{dir:Math.sign(dx),run:true}};
 return g}
/* ================= TOP-DOWN DRIVING (the Jeep) ================= */
const CARCOL=['#3a7ad8','#e8e2d0','#2a9a5a','#e8a020','#7a4ab8','#2a2a32','#d8d8e0','#4ac0c8','#b86a3a'];
function rr(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
function drawCar(c,w,l,col,o){o=o||{};c.fillStyle='rgba(0,0,0,.3)';rr(c,-w/2+3,-l/2+4,w,l,7);c.fill();
 c.fillStyle='#111';for(const sx of[-1,1])for(const sy of[-1,1])c.fillRect(sx*w/2-(sx>0?3:4)+0.5*sx,sy*l*0.3-6,(o.bigTire?7:5),12);
 c.fillStyle=col;c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1;rr(c,-w/2,-l/2,w,l,7);c.fill();c.stroke();
 c.fillStyle='rgba(255,255,255,.25)';rr(c,-w/2+3,-l/2+2,w*0.25,l-4,4);c.fill();
 c.fillStyle='#1d2a3a';c.beginPath();c.moveTo(-w/2+4,-l/2+l*0.3);c.lineTo(w/2-4,-l/2+l*0.3);c.lineTo(w/2-6,-l/2+l*0.42);c.lineTo(-w/2+6,-l/2+l*0.42);c.fill();
 c.beginPath();c.moveTo(-w/2+6,l/2-l*0.2);c.lineTo(w/2-6,l/2-l*0.2);c.lineTo(w/2-4,l/2-l*0.1);c.lineTo(-w/2+4,l/2-l*0.1);c.fill();
 c.fillStyle=shade(col,1.1);rr(c,-w/2+6,-l/2+l*0.43,w-12,l*0.36,3);c.fill();
 c.fillStyle='#ffe9a0';c.fillRect(-w/2+3,-l/2,6,3);c.fillRect(w/2-9,-l/2,6,3);c.fillStyle='#d82020';c.fillRect(-w/2+3,l/2-3,6,3);c.fillRect(w/2-9,l/2-3,6,3);
 if(o.star){star5(c,0,0,7,'#ffd23f')}}
function drawJeep(c,t,brk){const w=36,l=62;c.fillStyle='rgba(0,0,0,.3)';rr(c,-w/2+3,-l/2+4,w,l,6);c.fill();
 c.fillStyle='#0d0d0d';for(const sx of[-1,1])for(const sy of[-1,1]){rr(c,sx*w/2-(sx>0?2:7),sy*l*0.3-8,9,16,3);c.fill()}
 c.fillStyle='#c9c7bd';c.strokeStyle='#4a4a46';c.lineWidth=1.2;rr(c,-w/2,-l/2,w,l,5);c.fill();c.stroke();
 c.fillStyle='#aeaca2';c.fillRect(-w/2+3,-l/2+2,w-6,l*0.3);c.strokeStyle='rgba(0,0,0,.25)';for(let i=1;i<6;i++){c.beginPath();c.moveTo(-10+i*3.4,-l/2+3);c.lineTo(-10+i*3.4,-l/2+8);c.stroke()}
 c.fillStyle='#2a3440';c.fillRect(-w/2+3,-l/2+l*0.31,w-6,4);
 c.fillStyle='#1a1a1a';rr(c,-w/2+2,-l/2+l*0.38,w-4,l*0.58,4);c.fill();c.strokeStyle='#333';c.beginPath();c.moveTo(-w/2+4,0);c.lineTo(w/2-4,0);c.moveTo(-w/2+4,l*0.2);c.lineTo(w/2-4,l*0.2);c.stroke();
 const ph=Math.floor(t*6)%2;c.fillStyle=ph?'#ff2a2a':'#5a0a0a';c.fillRect(-w/2+3,-l/2+l*0.36,w/2-3,5);c.fillStyle=ph?'#0a1a5a':'#2a6aff';c.fillRect(0,-l/2+l*0.36,w/2-3,5);
 c.globalCompositeOperation='lighter';const gl=c.createRadialGradient(ph?-10:10,-l/2+l*0.38,1,ph?-10:10,-l/2+l*0.38,34);gl.addColorStop(0,ph?'rgba(255,40,40,.5)':'rgba(40,90,255,.5)');gl.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gl;c.fillRect(-50,-60,100,100);c.globalCompositeOperation='source-over';
 c.fillStyle='#0d0d0d';c.beginPath();c.arc(0,l/2+3,7,0,TAU);c.fill();c.fillStyle='#555';c.beginPath();c.arc(0,l/2+3,3,0,TAU);c.fill();
 star5(c,-w/2+1,-2,4,'#e8c040');star5(c,w/2-1,-2,4,'#e8c040');c.fillStyle='#ddd';c.beginPath();c.arc(-w/2+2,-l/2+l*0.32,2.5,0,TAU);c.fill();
 c.fillStyle='#fff6c0';c.fillRect(-w/2+3,-l/2-1,6,3);c.fillRect(w/2-9,-l/2-1,6,3);if(brk){c.fillStyle='#ff3030';c.fillRect(-w/2+2,l/2-3,6,3);c.fillRect(w/2-8,l/2-3,6,3)}}
function drawFireTruck(c,t){const w=42,l=118;c.fillStyle='rgba(0,0,0,.3)';rr(c,-w/2+3,-l/2+4,w,l,5);c.fill();c.fillStyle='#111';for(const sy of[-0.33,0.2,0.38])for(const sx of[-1,1])c.fillRect(sx*w/2-(sx>0?2:5),sy*l-7,7,14);
 c.fillStyle='#c81e1e';c.strokeStyle='#5a0a0a';c.lineWidth=1.2;rr(c,-w/2,-l/2,w,l,5);c.fill();c.stroke();c.fillStyle='#1d2a3a';c.fillRect(-w/2+4,-l/2+8,w-8,8);
 c.fillStyle='#d8d8d8';c.fillRect(-8,-l/2+26,16,l-34);c.fillStyle='#999';for(let y=-l/2+30;y<l/2-10;y+=8)c.fillRect(-8,y,16,2);
 const ph=Math.floor(t*7)%2;c.fillStyle=ph?'#ff4040':'#fff';c.fillRect(-w/2+3,-l/2+18,10,4);c.fillStyle=ph?'#fff':'#ff4040';c.fillRect(w/2-13,-l/2+18,10,4);c.fillStyle='#fff6c0';c.fillRect(-w/2+3,-l/2-1,7,3);c.fillRect(w/2-10,-l/2-1,7,3)}
function drawAmb(c,t){const w=40,l=80;c.fillStyle='rgba(0,0,0,.3)';rr(c,-w/2+3,-l/2+4,w,l,5);c.fill();c.fillStyle='#111';for(const sy of[-0.3,0.3])for(const sx of[-1,1])c.fillRect(sx*w/2-(sx>0?2:5),sy*l-7,7,14);
 c.fillStyle='#f4f4f0';c.strokeStyle='#666';rr(c,-w/2,-l/2,w,l,5);c.fill();c.stroke();c.fillStyle='#1d2a3a';c.fillRect(-w/2+4,-l/2+6,w-8,8);c.fillStyle='#e02020';c.fillRect(-w/2,-l/2+20,3,l-24);c.fillRect(w/2-3,-l/2+20,3,l-24);
 c.fillRect(-4,0,8,22);c.fillRect(-11,7,22,8);const ph=Math.floor(t*7)%2;c.fillStyle=ph?'#ff3030':'#ffd0d0';c.fillRect(-w/2+3,-l/2+16,12,4);c.fillStyle=ph?'#ffd0d0':'#ff3030';c.fillRect(w/2-15,-l/2+16,12,4)}
function drawScooter(c,t,wob){c.save();c.rotate(Math.sin(t*20)*0.25*wob);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(3,4,10,22,0,0,TAU);c.fill();c.fillStyle='#222';c.fillRect(-2.5,-24,5,9);c.fillRect(-2.5,14,5,9);
 c.fillStyle='#9aa0a8';rr(c,-7,-18,14,34,5);c.fill();c.fillStyle='#d42a1a';c.fillRect(-6,8,12,9);c.fillStyle='#1c1c22';c.beginPath();c.ellipse(0,-2,11,8,0,0,TAU);c.fill();c.beginPath();c.arc(0,-6,7,0,TAU);c.fill();c.fillStyle='#e0b090';c.fillRect(-12,-12,4,4);c.fillRect(8,-12,4,4);c.restore()}
function drawUmbTop(c,u){c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.arc(4,5,15,0,TAU);c.fill();c.fillStyle='#3b2a1e';c.strokeStyle='#120b07';c.lineWidth=1.2;c.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU,r=i%2?12:15;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke();
 c.fillStyle='#5a4030';c.beginPath();c.arc(0,0,7,0,TAU);c.fill();c.fillStyle='#ffef9a';c.beginPath();c.arc(-3,-9,2,0,TAU);c.arc(3,-9,2,0,TAU);c.fill()}
function hash(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function DriveGame(cfg){
 const g={F:[],t:0,J:{a:0,d:0,v:cfg.speed||260,slow:0},cars:[],umbs:[],blocked:0,knocked:0,umbBust:0,siren:0,started:false,spawnD:400,cfgChase:!!cfg.chase,rain:(cfg.night||cfg.rain)?[]:null};
 const J=g.J;g.esc=cfg.escort?{a:0,d:-150,v:J.v,blk:0,type:cfg.escort}:null;
 if(cfg.chase)g.sc={a:0,d:340,v:250,hits:0,wob:0,boost:0,lane:0,lt:1};
 g.k=()=>G.land?G.H/320:G.W/320;g.vlen=()=>(G.land?G.W:G.H)/g.k();
 g.start=()=>{g.started=true;toast(cfg.tow?'Tow the boat to the flood!':cfg.chase?'Catch that firebug!':cfg.escort==='amb'?'Clear the road for the ambulance!':'Clear the road for the fire truck!',1600);Sound.play('siren')};
 function spawn(){const vl=g.vlen();while(g.spawnD<J.d+vl+200){const lanes=[-60,0,60];const ln=pick(lanes);const st=Math.random()<(cfg.stubborn||0);
   g.cars.push({a:ln,d:g.spawnD,v:rnd(120,170)*(cfg.chase?0.9:1),col:st?'#c81e2a':pick(CARCOL),st:st?'stub':'drive',va:0,rot:0,ta:ln,w:32,l:54});
   if(Math.random()<(cfg.umbs||0))g.umbs.push({a:pick(lanes)+rnd(-15,15),d:g.spawnD+rnd(60,140),hit:0});
   g.spawnD+=rnd(cfg.gap?cfg.gap[0]:150,cfg.gap?cfg.gap[1]:260)}}
 g.act=()=>{if(!g.started||g.over)return;if(g.siren>0){return}g.siren=2.2;Sound.play('siren');fxText(g.F,J.a,-J.d-60,'WEE-OOO!','#9ad8ff',14);
  for(const c of g.cars){if(c.st==='drive'&&c.d>J.d-40&&c.d<J.d+360){c.st='yield';c.ta=c.a>=0?112:-112;if(Math.abs(c.a)<20)c.ta=J.a>c.a?-112:112}else if(c.st==='stub'&&c.d>J.d-40&&c.d<J.d+360){fxText(g.F,c.a,-c.d-30,'Nyet!','#ff8a7a',12)}}};
 g.down=()=>{};g.move=()=>{};g.up=p=>{};g.swipeJump=false;g.boost=0;g.bcd=0;
 g.jump=()=>{if(!g.started||g.over||g.bcd>0)return;g.boost=1;g.bcd=2.4;Sound.play('jump');fxText(g.F,J.a,-J.d-60,'BOOST!','#ffd23f',14)};
 g.btns=()=>[g.bcd>0?'~BOOST':'BOOST',g.siren>0?'~SIREN':'SIREN'];g.hint=()=>'SWIPE &amp; HOLD ANYWHERE TO STEER<br>BOOST TO RAM · SIREN TO CLEAR';
 g.update=dt=>{g.t+=dt;if(!g.started)return;spawn();const k=g.k();if(g.siren>0)g.siren-=dt;
  /* steering */
  let ta=null;const h=held();
  if(G.auto)ta=g.autoplay();
  else if(h){ta=G.land?(h.y-G.H/2)/k:(h.x-G.W/2)/k}
  let st=0;if(ta!==null){const d=ta-J.a;st=Math.abs(d)>3?Math.sign(d)*Math.min(1,Math.abs(d)/30):0}else st=G.land?axisY():axisX();
  J.a=clamp(J.a+st*230*dt,-125,125);J.rot=st*0.15;
  if(g.boost>0)g.boost-=dt;if(g.bcd>0)g.bcd-=dt;if(J.slow>0)J.slow-=dt;const vt=(cfg.speed||260)*(g.boost>0?1.4:1)*(J.slow>0?0.75:1)*(Math.abs(J.a)>95?0.85:1);J.v+=(vt-J.v)*Math.min(1,dt*2);J.d+=J.v*dt;
  /* cars */
  for(const c of g.cars){if(c.st==='off'){c.va*=Math.pow(0.05,dt);c.a+=c.va*dt;c.rot+=c.spin*dt;c.spin*=Math.pow(0.1,dt);c.v*=Math.pow(0.1,dt);c.d+=c.v*dt;continue}
   if(c.st==='yield'){c.a+=clamp(c.ta-c.a,-90*dt,90*dt);c.v+=(70-c.v)*dt;if(Math.abs(c.a-c.ta)<2&&!c.ok){c.ok=1;fxText(g.F,c.a,-c.d-30,'👍','#fff',12)}}
   c.d+=c.v*dt;
   /* jeep contact = ram */
   if(Math.abs(c.a-J.a)<34&&Math.abs(c.d-J.d)<(c.l+62)/2-2){const side=Math.abs(c.a)>=100?Math.sign(c.a):(c.a===J.a?(Math.random()<0.5?-1:1):Math.sign(c.a-J.a));
    c.st='off';c.va=side*rnd(280,360);c.spin=side*rnd(3,6);c.v=J.v*0.9;g.knocked++;J.slow=0.6;Sound.play('crash');fxBurst(g.F,(c.a+J.a)/2,-(c.d+J.d)/2,14,['#fff','#ffd23f','#aaa'],160,0.5,3,0);fxText(g.F,c.a,-c.d-34,pick(['BONK!','OFF THE ROAD!','MOVE IT!']),'#ffd23f',14);if(c.col==='#c81e2a')fxText(g.F,c.a,-c.d-18,'Comrade down!','#fff',10)}}
  for(const u of g.umbs){if(!u.hit&&Math.abs(u.a-J.a)<30&&Math.abs(u.d-J.d)<40){u.hit=1;g.umbBust++;Sound.play('pop');Sound.play('bust');fxBurst(g.F,u.a,-u.d,16,'star',150,0.7,4,0);fxText(g.F,u.a,-u.d-30,'Umbrella busted!','#ffd23f',13)}}
  g.cars=g.cars.filter(c=>c.d>J.d-400);g.umbs=g.umbs.filter(u=>u.d>J.d-400);
  /* escort */
  const E=g.esc;if(E){E.a+=clamp(J.a-E.a,-150*dt,150*dt)*Math.min(1,dt*60);const tgt=J.d-150;let v=J.v+(tgt-E.d)*1.8;v=clamp(v,0,400);
   let blk=null;const EL=E.type==='amb'?80:118;for(const c of g.cars){if(c.st==='off')continue;if(Math.abs(c.a-E.a)<36&&c.d>E.d&&c.d-E.d<(EL+c.l)/2+30){if(!blk||c.d<blk.d)blk=c}}
   if(blk){v=Math.min(v,blk.v);E.d=Math.min(E.d+v*dt,blk.d-(EL+blk.l)/2-10);g.blocked+=dt;E.blk+=dt;if(E.blk>0.6){E.blk=0;Sound.play('honk');fxText(g.F,E.a,-E.d-70,'HONK!','#ff8a7a',13)}}else{E.d+=v*dt;E.blk=0}E.v=v;E.isBlk=!!blk}
  /* chase target */
  const S=g.sc;if(S&&!S.done){S.lt-=dt;if(S.lt<=0){S.lt=rnd(1.2,2.4);S.lane=pick([-60,0,60])}
   for(const c of g.cars)if(c.st!=='off'&&Math.abs(c.a-S.a)<30&&c.d>S.d&&c.d-S.d<90){S.lane=S.lane===c.a?(c.a>0?0:c.a<0?0:pick([-60,60])):S.lane}
   S.a+=clamp(S.lane-S.a,-110*dt,110*dt);if(S.boost>0)S.boost-=dt;S.wob=Math.max(0,S.wob-dt);const gap=S.d-J.d;S.v=(S.boost>0?330:gap>520?200:gap<120?275:248);S.d+=S.v*dt;
   if(Math.abs(S.a-J.a)<26&&Math.abs(S.d-J.d)<40&&S.wob<=0){S.hits++;S.wob=1.2;S.boost=1.1;Sound.play('crash');fxBurst(g.F,S.a,-S.d,16,'star',150,0.6,4,0);fxText(g.F,S.a,-S.d-40,['BUMP!','BUMP! BUMP!','GOTCHA!'][S.hits-1]||'BUMP!','#ffd23f',16);
    if(S.hits>=3){S.done=true;g.over=true;Sound.play('bust');const tt=g.t;setTimeout(()=>finish(true,tt<40?3:tt<60?2:1,'You caught the firebug! His gas can is confiscated and his scooter is impounded.'),1300)}}}
  /* goal */
  if(!cfg.chase&&!g.over&&J.d>=cfg.dist){g.over=true;if(cfg.onDone){cfg.onDone(g);return}const b=g.blocked;const st=b<2?3:b<6?2:1;finish(true,st,`${E.type==='amb'?'The ambulance':'The fire truck'} made it! Blocked for ${b.toFixed(1)} seconds. Cars cleared: ${g.knocked}. Umbrellas busted: ${g.umbBust}.`)}
  fxStep(g.F,dt);
  if(g.rain){if(g.rain.length<120)for(let i=0;i<6;i++)g.rain.push({x:Math.random()*G.W,y:Math.random()*G.H,l:rnd(0.2,0.6)});for(const r of g.rain){r.l-=dt;if(r.l<0){r.x=Math.random()*G.W;r.y=Math.random()*G.H;r.l=rnd(0.2,0.6)}}}};
 g.hud=()=>{if(cfg.tow)return`🚤 ${clamp(Math.floor(g.J.d/cfg.dist*100),0,100)}% to the flood`;if(g.sc)return`Bumps ${g.sc.hits}/3  ${Math.floor(g.t)}s`;const p=clamp(Math.floor(g.J.d/cfg.dist*100),0,100);return`${g.esc.type==='amb'?'🚑':'🚒'} ${p}%  Blocked ${g.blocked.toFixed(1)}s`};
 g.draw=()=>{const k=g.k(),cam=J.d-(G.land?170:190);const d=G.dpr;
  cx.fillStyle=cfg.night?'#1a2a1a':'#4a8a3a';cx.fillRect(0,0,G.W,G.H);

  cx.save();if(G.land)cx.setTransform(0,k*d,-k*d,0,-cam*k*d,G.H/2*d);else cx.setTransform(k*d,0,0,k*d,G.W/2*d,(G.H+cam*k)*d*1);
  /* in this space: x = across, y = -along */
  const vl=g.vlen(),d0=cam-60,d1=cam+vl+60,ww=(G.land?G.H:G.W)/k/2+40;
  /* grass detail + scenery */
  const seg=90;for(let i=Math.floor(d0/seg);i*seg<d1;i++){const y=-i*seg;cx.fillStyle=(i%2)?(cfg.night?'#1c2e1c':'#4f9240'):(cfg.night?'#192a19':'#4a8a3a');cx.fillRect(-ww,y-seg,ww*2,seg);
   for(const side of[-1,1]){const r=hash(i*3+side);const x=side*(150+r*60);if(r<0.45){cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.arc(x+5,y-40+5,22,0,TAU);cx.fill();cx.fillStyle=cfg.night?'#1f4a24':(r<0.2?'#d8742a':'#2f7a32');cx.beginPath();cx.arc(x,y-40,22,0,TAU);cx.fill();cx.fillStyle='rgba(255,255,255,.12)';cx.beginPath();cx.arc(x-6,y-46,9,0,TAU);cx.fill()}
    else if(r<0.7){cx.fillStyle=pick2(['#a83a2a','#5a6a8a','#7a5a3a'],i+side);cx.fillRect(x-28,y-75,56,60);cx.fillStyle='rgba(0,0,0,.25)';cx.fillRect(x,y-75,28,60);cx.fillStyle='#ddd';cx.fillRect(x-6,y-15,12,4)}
    else{cx.fillStyle='#e8e0d0';for(let j=0;j<4;j++)cx.fillRect(side*136-2,y-j*22-10,4,14)}}}
  cx.fillStyle='#8a8478';cx.fillRect(-130,-d1,260,d1-d0);cx.fillStyle='#3a3a40';cx.fillRect(-92,-d1,184,d1-d0);
  cx.fillStyle='#f0e6c8';cx.fillRect(-92,-d1,3,d1-d0);cx.fillRect(89,-d1,3,d1-d0);
  cx.fillStyle='#f2d04a';for(const lx of[-30,30]){for(let y=Math.floor(d0/50)*50;y<d1;y+=50)cx.fillRect(lx-1.5,-y-26,3,24)}
  if(!cfg.chase){const fy=-cfg.dist;cx.fillStyle='#fff';for(let i=0;i<12;i++)cx.fillRect(-92+i*16,fy-(i%2)*8,8,8);cx.fillStyle='#222';for(let i=0;i<12;i++)cx.fillRect(-84+i*16,fy-(i%2)*8,8,8)}
  for(const u of g.umbs)if(!u.hit){cx.save();cx.translate(u.a,-u.d);drawUmbTop(cx,u);cx.restore()}
  for(const c of g.cars){cx.save();cx.translate(c.a,-c.d);cx.rotate(c.rot||0);drawCar(cx,c.w,c.l,c.col,{star:c.col==='#c81e2a'});cx.restore()}
  if(g.sc&&!(g.sc.done&&g.over&&false)){const S=g.sc;cx.save();cx.translate(S.a,-S.d);drawScooter(cx,g.t,S.wob);if(S.done){cx.strokeStyle='#d8dce4';cx.lineWidth=2;cx.beginPath();cx.arc(-4,-4,4,0,TAU);cx.arc(4,-4,4,0,TAU);cx.stroke()}cx.restore();
   if(!S.done){cx.save();cx.translate(S.a,-S.d-34);cx.fillStyle='#ffd23f';cx.beginPath();cx.moveTo(-6,-10);cx.lineTo(6,-10);cx.lineTo(0,0);cx.fill();cx.restore()}}
  const E=g.esc;if(E){cx.save();cx.translate(E.a,-E.d);E.type==='amb'?drawAmb(cx,g.t):drawFireTruck(cx,g.t);cx.restore();}
  cx.save();cx.translate(J.a,-J.d);cx.rotate(J.rot||0);if(cfg.tow){cx.save();cx.translate(0,40);cx.rotate(-(J.rot||0)*0.6);cx.fillStyle='#333';cx.fillRect(-2,-10,4,14);cx.fillStyle='#555';cx.fillRect(-16,4,32,62);cx.fillStyle='#111';cx.fillRect(-21,30,6,14);cx.fillRect(15,30,6,14);cx.translate(0,36);cx.rotate(-Math.PI/2);drawBoatTop(cx,g.t,[],null,false);cx.restore()}drawJeep(cx,g.t,J.slow>0);cx.restore();
  if(g.siren>1.4){cx.strokeStyle='rgba(150,200,255,'+((g.siren-1.4)*0.8)+')';cx.lineWidth=3;cx.beginPath();cx.arc(J.a,-J.d,(2.2-g.siren)*300+20,0,TAU);cx.stroke()}
  fxDraw(cx,g.F.filter(p=>!p.txt),1);
  cx.restore();
  const TS=(a,dd)=>G.land?[(dd-cam)*k,G.H/2+a*k]:[G.W/2+a*k,G.H-(dd-cam)*k];
  for(const p of g.F)if(p.txt){const q=TS(p.x,-p.y);const a=clamp(p.l/p.l0*1.6,0,1);cx.globalAlpha=a;const fs=p.s*k;cx.font=fs+'px Lilita,system-ui,sans-serif';cx.textAlign='center';cx.lineWidth=fs*0.22;cx.strokeStyle='#2a0a05';cx.strokeText(p.txt,q[0],q[1]);cx.fillStyle=p.c;cx.fillText(p.txt,q[0],q[1]);cx.globalAlpha=1}
  if(E&&E.isBlk){const q=TS(E.a,E.d+(G.land?70:66));cx.fillStyle='#ff4a3a';cx.strokeStyle='#fff';cx.lineWidth=4;cx.font='30px Lilita,system-ui';cx.textAlign='center';cx.strokeText('!',q[0],q[1]);cx.fillText('!',q[0],q[1])}
  if(!cfg.night&&g.rain){cx.fillStyle='rgba(20,30,60,.2)';cx.fillRect(0,0,G.W,G.H);cx.strokeStyle='rgba(200,220,255,.4)';cx.lineWidth=1;cx.beginPath();for(const r of g.rain){cx.moveTo(r.x,r.y);cx.lineTo(r.x-2,r.y+10)}cx.stroke()}
  if(cfg.night){cx.fillStyle='rgba(8,10,40,.42)';cx.fillRect(0,0,G.W,G.H);cx.strokeStyle='rgba(180,200,255,.35)';cx.lineWidth=1;cx.beginPath();for(const r of g.rain){cx.moveTo(r.x,r.y);cx.lineTo(r.x-2,r.y+10)}cx.stroke()}};
 /* QA autopilot: steer at the nearest car ahead in the escort's path, use the siren on groups */
 g.autoplay=()=>{if(g.sc){return g.sc.a}let tg=null;for(const c of g.cars){if(c.st==='off'||c.st==='yield')continue;if(c.d>J.d&&c.d<J.d+260&&(!tg||c.d<tg.d))tg=c}
  if(tg&&tg.st==='drive'&&g.siren<=0&&Math.random()<0.02)g.act();return tg?tg.a:0};
 return g}
function pick2(a,i){return a[Math.abs(Math.floor(i))%a.length]}
/* ================= FIRE: run the hoses, then aim the water ================= */
const WIN=[[198,64,357,179],[550,64,696,179],[903,64,1057,179],[198,257,357,356],[550,257,696,356],[903,257,1057,356],[205,460,352,556],[910,460,1055,556]];
function drawTruckSide(c,t){c.save();c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(60,0,130,7,0,0,TAU);c.fill();
 c.fillStyle='#c81e1e';c.strokeStyle='#4a0808';c.lineWidth=1.5;rr(c,-70,-62,180,50,4);c.fill();c.stroke();rr(c,110,-74,58,62,8);c.fill();c.stroke();
 c.fillStyle='#bfe0f0';rr(c,128,-68,30,20,3);c.fill();c.fillStyle='#e8e8e8';c.fillRect(-70,-30,238,5);
 c.fillStyle='#d8d8d8';c.fillRect(-66,-72,170,6);for(let x=-62;x<104;x+=10)c.fillRect(x,-76,2,10);c.fillRect(-66,-78,170,3);
 c.fillStyle='#f2d04a';c.font='11px Lilita,system-ui';c.textAlign='center';c.fillText('FLEMINGSBURG F.D.',20,-40);
 c.fillStyle='#7a7a7a';c.beginPath();c.arc(-40,-46,11,0,TAU);c.fill();c.fillStyle='#3a3a3a';c.beginPath();c.arc(-40,-46,5,0,TAU);c.fill();
 const ph=Math.floor(t*7)%2;c.fillStyle=ph?'#ff3030':'#ffd0d0';c.fillRect(120,-80,14,6);c.fillStyle=ph?'#ffd0d0':'#ff3030';c.fillRect(144,-80,14,6);
 for(const x of[-40,70,140]){c.fillStyle='#111';c.beginPath();c.arc(x,-12,14,0,TAU);c.fill();c.fillStyle='#aaa';c.beginPath();c.arc(x,-12,6,0,TAU);c.fill()}c.restore()}
function drawHydrant(c){c.fillStyle='#e8c020';c.strokeStyle='#5a4a08';c.lineWidth=1.2;rr(c,-7,-26,14,26,3);c.fill();c.stroke();c.beginPath();c.arc(0,-26,8,Math.PI,0);c.fill();c.stroke();c.fillRect(-11,-18,22,6);c.strokeRect(-11,-18,22,6);c.fillStyle='#8a7010';c.fillRect(-2,-36,4,4)}
function drawFlames(c,x0,y0,x1,y1,f,t,id){const w=x1-x0,h=y1-y0,cxm=(x0+x1)/2;c.save();c.beginPath();c.rect(x0-w*0.3,y0-h*1.2,w*1.6,h*2.2);c.clip();
 c.globalCompositeOperation='lighter';const gl=c.createRadialGradient(cxm,y1-h*0.3,2,cxm,y1-h*0.3,w*0.9);gl.addColorStop(0,'rgba(255,170,40,'+(0.7*f)+')');gl.addColorStop(1,'rgba(255,60,0,0)');c.fillStyle=gl;c.fillRect(x0-w*0.4,y0-h,w*1.8,h*2.4);
 const n=6;for(let i=0;i<n;i++){const px=x0+w*(0.12+0.76*i/(n-1)),fh=h*f*(0.7+0.5*Math.sin(t*9+i*1.7+id))*1.15,fw=w*0.16;
  const g=c.createLinearGradient(0,y1,0,y1-fh);g.addColorStop(0,'rgba(255,90,10,.95)');g.addColorStop(0.5,'rgba(255,170,30,.85)');g.addColorStop(1,'rgba(255,240,140,0)');c.fillStyle=g;
  c.beginPath();c.moveTo(px-fw,y1);c.quadraticCurveTo(px-fw*1.2,y1-fh*0.5,px+Math.sin(t*7+i)*fw*0.6,y1-fh);c.quadraticCurveTo(px+fw*1.2,y1-fh*0.5,px+fw,y1);c.fill()}
 c.globalCompositeOperation='source-over';c.restore()}
function FireGame(cfg){
 const g={F:[],t:0,phase:'hose',task:0,hold:true,done:0,goal:cfg.goal||12,spreads:0,ret:{x:0,y:0},retOn:false,started:false,smoke:[],
  W:WIN.map((r,i)=>({r,f:0,full:0,id:i})),ig:2,d:{x:0,y:0,face:1,o:mkGait(),ov:{t:'hose'}},crew:[{o:mkGait()},{o:mkGait()}],ars:{x:0,o:mkGait(),on:false}};
 const D=g.d;
 g.L=()=>{const land=G.land;let S,ox,oy,gY,k;if(land){S=G.W/1280;ox=0;oy=-40*S;gY=G.H*0.97;k=G.H*0.2/106}else{S=G.W/920;ox=-180*S;oy=Math.max(54,G.H*0.07);gY=G.H*0.87;k=G.H*0.155/106}return{S,ox,oy,gY,k,vw:G.W/k}};
 const L0=g.L();D.x=170;
 g.tasks=()=>{const L=g.L();return[{x:L.vw-34,label:'Hook the hose to the hydrant!'},{x:L.vw*(G.land?0.5:0.46),label:'Bring a hose to the fire crew!'}]};
 g.start=()=>{g.started=true;toast(cfg.toast||'Run the hose!',1500)};
 g.act=()=>{if(!g.started||g.over)return;if(g.phase==='hose'){const T=g.tasks()[g.task];if(g.hold&&Math.abs(D.x-T.x)<40){g.hold=false;Sound.play('cuff');fxText(g.F,T.x,-120,g.task===0?'Hooked up!':'Here ya go!','#9effa0',15);g.task++;
    if(g.task>=2){g.phase='spray';(cfg.startW||[1,3]).forEach((i,j)=>{g.W[i].f=j?0.45:0.5});g.ars.on=cfg.ars!==false;g.ars.x=g.L().vw*0.3;toast('Aim the water at the fire!',1500)}}}};
 g.down=p=>{};g.move=p=>{};g.up=p=>{};D.vy=0;
 g.jump=()=>{if(!g.started||g.over||g.phase!=='hose')return;if(D.y>=-0.5){D.vy=-320;D.y=-1;Sound.play('jump')}};
 g.btns=()=>g.phase==='hose'?['JUMP',g.hold?'HOOK UP':'ACTION']:['','SPRAY'];g.hint=()=>g.phase==='hose'?'SWIPE &amp; HOLD ANYWHERE TO MOVE<br>SWIPE UP TO JUMP':'SWIPE &amp; HOLD TO AIM THE WATER<br>HOLD SPRAY TO SPRAY';
 g.swipeJump=true;g.drag=(dx,dy)=>{if(g.phase!=='spray')return;const gn=1.5;g.ret.x=clamp(g.ret.x+dx*gn,0,G.W);g.ret.y=clamp(g.ret.y+dy*gn,0,G.H);g.retOn=true};
 g.update=dt=>{g.t+=dt;if(!g.started)return;const L=g.L(),k=L.k;
  if(g.phase==='hose'){const T=g.tasks()[g.task];let dir=0,run=false;const h=held();
   if(G.auto){const tx=g.hold?T.x:150;dir=Math.abs(tx-D.x)>12?Math.sign(tx-D.x):0;run=true;if(!dir&&g.hold)g.act()}
   else if(h){const dx=h.x/k-D.x;if(Math.abs(dx)>8){dir=Math.sign(dx);run=Math.abs(dx*k)>G.W*0.22}}else{const ax=axisX();if(Math.abs(ax)>0.2){dir=Math.sign(ax);run=runHeld(dir)}}
   if(dir)D.face=dir;const x0=D.x;D.x=clamp(D.x+dir*(run?RD.vr:RD.vw)*dt,20,L.vw-20);if(D.y<0||D.vy<0){D.vy+=900*dt;D.y+=D.vy*dt;if(D.y>=0){D.y=0;D.vy=0}}stepGait(D.o,D.x-x0,dt,heroRig(),D.y>=0);D.ov=g.hold?{t:'hose'}:null;D.o.ov=D.ov;
   if(!g.hold&&D.x<175){g.hold=true;Sound.play('click');fxText(g.F,D.x,-120,'Got a hose!','#fff',13)}}
  else{/* spray */
   const h=held();if(G.auto){if(!g._tw||g._tw.f<=0)g._tw=g.W.filter(w=>w.f>0).sort((a,b)=>b.f-a.f)[0];const w=g._tw;if(w){const tx=L.ox+(w.r[0]+w.r[2])/2*L.S,ty=L.oy+(w.r[1]+w.r[3])/2*L.S;g.ret.x+=(tx-g.ret.x)*Math.min(1,dt*6);g.ret.y+=(ty-g.ret.y)*Math.min(1,dt*6)}g.retOn=true}
   else{g.swipeJump=false;const k=G.keys,ax=clamp(((k.ArrowRight||k.KeyD)?1:0)-((k.ArrowLeft||k.KeyA)?1:0)+G.pad.ax,-1,1),ay=clamp(((k.ArrowDown||k.KeyS)?1:0)-((k.ArrowUp||k.KeyW)?1:0)+G.pad.ay,-1,1);if(ax||ay){g.ret.x=clamp(g.ret.x+ax*520*dt,0,G.W);g.ret.y=clamp(g.ret.y+ay*520*dt,0,G.H)}g.retOn=!!(ax||ay||actHeld()||TOUCH.size)}
   if(!g.ret.x&&!g.ret.y){g.ret.x=G.W/2;g.ret.y=G.H*0.3}
   Sound.setHiss(g.retOn?1:0);
   if(g.retOn){for(const w of g.W){if(w.f<=0)continue;const r=w.r,x0=L.ox+r[0]*L.S-14,x1=L.ox+r[2]*L.S+14,y0=L.oy+r[1]*L.S-14,y1=L.oy+r[3]*L.S+14;
     if(g.ret.x>x0&&g.ret.x<x1&&g.ret.y>y0&&g.ret.y<y1){w.f-=dt*0.95;if(Math.random()<dt*20)g.smoke.push({x:g.ret.x+rnd(-10,10),y:g.ret.y,l:1.2,s:rnd(6,12)});
      if(w.f<=0){w.f=0;w.full=0;g.done++;Sound.play('star');fxText(g.F,g.ret.x/k,(g.ret.y-L.gY)/k,'Out!','#9ad8ff',16);if(g.done>=g.goal&&!g.over){g.over=true;Sound.setHiss(0);const st=g.spreads===0?3:g.spreads<=2?2:1;setTimeout(()=>finish(true,st,`You and the fire crew put out ${g.done} fires! Fire spread ${g.spreads} time${g.spreads===1?'':'s'}.`),900)}}}}}
   const burning=g.W.filter(w=>w.f>0).length;g.ig-=dt;if(g.ig<=0&&burning<(cfg.maxBurn||4)&&g.done+burning<g.goal){g.ig=Math.max(cfg.igMin||1.6,(cfg.ig0||3.2)-g.t*0.02);const c=g.W.filter(w=>w.f<=0);if(c.length){pick(c).f=0.35;Sound.play('pop')}}
   for(const w of g.W){if(w.f<=0)continue;w.f=Math.min(1,w.f+dt*(cfg.grow||0.075));if(w.f>=1){w.full+=dt;if(w.full>(cfg.spreadT||6)){w.full=-4;g.spreads++;fxText(g.F,(L.ox+(w.r[0]+w.r[2])/2*L.S)/k,(L.oy+w.r[1]*L.S-L.gY)/k,'It spread!','#ff8a5a',14);
      const nb=g.W.filter(o=>o.f<=0&&Math.abs(o.r[0]-w.r[0])+Math.abs(o.r[1]-w.r[1])<500);if(nb.length&&g.done+burning<g.goal)pick(nb).f=0.5}}}
   for(const c of g.crew){stepGait(c.o,0,dt,RP,true)}
   D.ov={t:'point'};D.o.ov=D.ov;stepGait(D.o,0,dt,heroRig(),true);
   const A=g.ars;if(A.on){const x0=A.x;A.x+=170*dt;stepGait(A.o,A.x-x0,dt,RP,true);if(A.x>L.vw+60)A.on=false;if(!A.said&&A.x>L.vw*0.45){A.said=1;fxText(g.F,D.x,-130,'Hey! Come back here!','#fff',12)}}}
  for(let i=g.smoke.length-1;i>=0;i--){const s=g.smoke[i];s.l-=dt;s.y-=40*dt;s.s+=12*dt;if(s.l<=0)g.smoke.splice(i,1)}
  fxStep(g.F,dt)};
 g.hud=()=>g.phase==='hose'?`Hoses ${g.task}/2`:`Fires out ${g.done}/${g.goal}  Spread ${g.spreads}`;
 g.draw=()=>{const L=g.L(),k=L.k,S=L.S,img=G.img.house;
  cx.fillStyle='#2a1838';cx.fillRect(0,0,G.W,G.H);cx.drawImage(img,0,0,img.width,2,0,0,G.W,L.oy+1);
  cx.drawImage(img,L.ox,L.oy,1280*S,720*S);if(cfg.night){cx.fillStyle='rgba(10,12,48,.5)';cx.fillRect(0,0,G.W,G.H)}const ib=L.oy+720*S;
  if(ib<L.gY-10*k){const gr=cx.createLinearGradient(0,ib,0,L.gY);gr.addColorStop(0,'#3a4a2a');gr.addColorStop(1,'#2a3420');cx.fillStyle=gr;cx.fillRect(0,ib,G.W,L.gY-ib)}
  cx.fillStyle='#8a8070';cx.fillRect(0,L.gY-8*k,G.W,6*k);cx.fillStyle='#34343a';cx.fillRect(0,L.gY-2*k,G.W,G.H);
  for(const w of g.W)if(w.f>0){const r=w.r;drawFlames(cx,L.ox+r[0]*S,L.oy+r[1]*S,L.ox+r[2]*S,L.oy+r[3]*S,w.f,g.t,w.id);if(w.f>0.7&&Math.random()<0.3)g.smoke.push({x:L.ox+(r[0]+r[2])/2*S+rnd(-20,20),y:L.oy+r[1]*S,l:1.6,s:rnd(8,14),dark:1})}
  for(const s of g.smoke){cx.fillStyle=s.dark?'rgba(40,36,40,'+(s.l*0.35)+')':'rgba(230,240,255,'+(s.l*0.4)+')';cx.beginPath();cx.arc(s.x,s.y,s.s,0,TAU);cx.fill()}
  cx.save();cx.translate(0,L.gY);cx.scale(k,k);
  cx.save();cx.translate(G.land?60:40,0);drawTruckSide(cx,g.t);cx.restore();
  const T=g.tasks();cx.save();cx.translate(T[0].x,0);drawHydrant(cx);cx.restore();
  const reel=[G.land?20:0,-46];cx.strokeStyle='#e8d8a0';cx.lineWidth=3.2;cx.lineCap='round';
  if(g.task>=1){cx.beginPath();cx.moveTo(reel[0],reel[1]);cx.quadraticCurveTo(reel[0]+40,-2,T[0].x*0.5,-2);cx.lineTo(T[0].x-8,-2);cx.lineTo(T[0].x-6,-14);cx.stroke()}
  const cr=T[1].x;
  if(g.task>=2){cx.beginPath();cx.moveTo(reel[0]+6,reel[1]+4);cx.quadraticCurveTo(reel[0]+60,-1,cr-30,-2);cx.stroke()}
  if(g.phase==='hose'&&g.hold){const hd=D.o._hand?[D.x+D.o._hand[0]*D.face,D.o._hand[1]]:[D.x,-50];cx.beginPath();cx.moveTo(reel[0]+6,reel[1]+2);cx.bezierCurveTo(reel[0]+40,-2,hd[0]-40*D.face,-2,hd[0],hd[1]);cx.stroke()}
  if(g.phase==='hose'){const t=T[g.task];if(t&&g.hold){cx.fillStyle='#ffd23f';cx.beginPath();const bob=Math.sin(g.t*6)*4;cx.moveTo(t.x-9,-70+bob);cx.lineTo(t.x+9,-70+bob);cx.lineTo(t.x,-56+bob);cx.fill()}}
  /* crew */
  const ang=g.phase==='spray'?Math.atan2((g.ret.y-L.gY)/k+60,(g.ret.x/k)-cr):-1;
  const aimA=g.phase==='spray'?clamp(Math.PI/2-(-ang),0.2,2.9):0.9;
  for(let i=0;i<2;i++){cx.save();cx.translate(cr-i*20-8,0);g.crew[i].o.ov=g.phase==='spray'?{t:'aim',a:Math.PI-Math.atan2(-((g.ret.y-L.gY)/k+60),(g.ret.x/k)-(cr-i*20-8))-Math.PI/2+Math.PI/2}:null;
   if(g.phase==='spray'){const dx=(g.ret.x/k)-(cr-i*20-8),dy=(g.ret.y-L.gY)/k+60;g.crew[i].o.ov={t:'aim',a:Math.atan2(dx,dy)}}
   drawPerson(cx,g.crew[i].o,LOOK.fire);cx.restore()}
  if(g.task>=2){cx.strokeStyle='#e8d8a0';cx.lineWidth=3;cx.beginPath();cx.moveTo(cr-30,-2);cx.quadraticCurveTo(cr-20,-40,cr-8+(g.crew[0].o._hand?g.crew[0].o._hand[0]:10),g.crew[0].o._hand?g.crew[0].o._hand[1]:-60);cx.stroke()}
  if(g.ars.on){cx.save();cx.translate(g.ars.x,0);drawPerson(cx,g.ars.o,LOOK.arsonist);cx.restore()}
  pairBegin(cx,D);pairEnd(cx);
  fxDraw(cx,g.F,1);cx.restore();
  /* water stream */
  if(g.phase==='spray'&&g.retOn){const h=g.crew[0].o._hand||[10,-60];const nx=(cr-8+h[0])*k,ny=L.gY+h[1]*k,tx=g.ret.x,ty=g.ret.y,mx=(nx+tx)/2,my=Math.min(ny,ty)-Math.abs(tx-nx)*0.25-40;
   cx.strokeStyle='rgba(170,215,255,.55)';cx.lineWidth=9;cx.lineCap='round';cx.beginPath();cx.moveTo(nx,ny);cx.quadraticCurveTo(mx,my,tx,ty);cx.stroke();cx.strokeStyle='rgba(235,248,255,.85)';cx.lineWidth=3;cx.stroke();
   for(let i=0;i<10;i++){const t=((g.t*2.2+i/10)%1),it=1-t,x=it*it*nx+2*it*t*mx+t*t*tx,y=it*it*ny+2*it*t*my+t*t*ty;cx.fillStyle='rgba(220,240,255,.9)';cx.beginPath();cx.arc(x+rnd(-2,2),y+rnd(-2,2),2.4,0,TAU);cx.fill()}
   cx.fillStyle='rgba(220,240,255,.7)';for(let i=0;i<6;i++){cx.beginPath();cx.arc(tx+rnd(-14,14),ty+rnd(-14,14),rnd(1.5,3.5),0,TAU);cx.fill()}}
  if(g.phase==='spray'){cx.strokeStyle='#fff';cx.lineWidth=2.5;cx.beginPath();cx.arc(g.ret.x,g.ret.y,18,0,TAU);cx.moveTo(g.ret.x-26,g.ret.y);cx.lineTo(g.ret.x-10,g.ret.y);cx.moveTo(g.ret.x+10,g.ret.y);cx.lineTo(g.ret.x+26,g.ret.y);cx.moveTo(g.ret.x,g.ret.y-26);cx.lineTo(g.ret.x,g.ret.y-10);cx.moveTo(g.ret.x,g.ret.y+10);cx.lineTo(g.ret.x,g.ret.y+26);cx.stroke()}};
 return g}
/* ================= CAT RESCUE (park) ================= */
const PERCH=[[540,162],[620,152],[700,148],[780,149],[860,158]];
function drawCat(c,col,pose,t){c.save();const fall=pose==='fall';c.fillStyle=col;c.strokeStyle='#2a1a10';c.lineWidth=1;
 c.beginPath();c.ellipse(0,-8,11,7,0,0,TAU);c.fill();c.stroke();c.beginPath();c.arc(10,-15,6.5,0,TAU);c.fill();c.stroke();
 c.beginPath();c.moveTo(6,-20);c.lineTo(7,-26);c.lineTo(11,-21);c.moveTo(12,-21);c.lineTo(15,-26);c.lineTo(16,-18);c.fill();
 c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(-10,-9);c.quadraticCurveTo(-20,-12+Math.sin(t*5)*4,-17,-24);c.stroke();
 if(fall){c.beginPath();c.moveTo(-6,-4);c.lineTo(-11,4);c.moveTo(6,-4);c.lineTo(11,4);c.moveTo(-3,-12);c.lineTo(-9,-20);c.moveTo(4,-12);c.lineTo(9,-22);c.stroke()}
 else{c.beginPath();c.moveTo(-6,-3);c.lineTo(-6,1);c.moveTo(6,-3);c.lineTo(6,1);c.stroke()}
 c.fillStyle='#2a1a10';c.beginPath();c.arc(12,-16,1.1,0,TAU);c.arc(9,-16,1.1,0,TAU);c.fill();if(fall){c.beginPath();c.arc(11,-12,1.6,0,TAU);c.fill()}c.restore()}
function CatGame(cfg){
 const g={F:[],t:0,caught:0,miss:0,goal:cfg.goal||10,cats:[],next:1.2,launched:0,started:false,d:{x:0,face:1,o:mkGait(),ov:{t:'blanket'}},basket:[]};const D=g.d;
 g.L=()=>{const land=G.land;let S,ox,oy,gY,k;if(land){S=G.W/1280;gY=G.H*0.985;oy=gY-619*S;ox=0;k=G.H*0.2/106}else{S=G.H/720;oy=0;gY=619*S;ox=G.W/2-700*S;k=G.H*0.165/106}return{S,ox,oy,gY,k,vw:G.W/k}};
 D.x=g.L().vw*0.5;
 g.start=()=>{g.started=true;toast('Catch the kitties!',1300)};
 D.y=0;D.vy=0;g.dash=0;g.dcd=0;
 g.act=()=>{if(!g.started||g.over||g.dcd>0)return;g.dash=0.35;g.dcd=0.8;Sound.play('jump');fxBurst(g.F,D.x-D.face*20,-10,6,['#fff','#ddd'],80,0.4,3,0)};
 g.jump=()=>{if(!g.started||g.over)return;if(D.y>=-0.5){D.vy=-300;D.y=-1;Sound.play('jump')}};
 g.down=()=>{};g.move=()=>{};g.up=()=>{};g.btns=()=>['JUMP','DIVE'];g.hint=()=>'SWIPE &amp; HOLD ANYWHERE TO MOVE<br>DIVE FOR A FAST DASH';
 const COLS=['#e8962a','#2a2a2a','#f0f0f0','#9a9aa8','#d8b07a'];
 g.update=dt=>{g.t+=dt;if(!g.started)return;const L=g.L(),k=L.k;
  g.next-=dt;if(g.next<=0&&g.launched<g.goal+2&&g.cats.filter(c=>c.st!=='done').length<2){g.next=Math.max(1.3,2.6-g.launched*0.1);const p=pick(PERCH);g.cats.push({px:p[0],py:p[1],st:'warn',tm:1.3,col:pick(COLS),x:0,y:0,vy:0});g.launched++;Sound.play('meow')}
  let dir=0,run=false;const h=held();
  const fc=g.cats.filter(c=>c.st==='fall'||c.st==='warn').sort((a,b)=>(b.st==='fall')-(a.st==='fall')||a.tm-b.tm)[0];
  if(G.auto&&fc){const tx=(L.ox+fc.px*L.S)/k;dir=Math.abs(tx-D.x)>6?Math.sign(tx-D.x):0;run=Math.abs(tx-D.x)>40}
  else if(h){const dx=h.x/k-D.x;if(Math.abs(dx)>6){dir=Math.sign(dx);run=Math.abs(dx*k)>G.W*0.2}}else{const ax=axisX();if(Math.abs(ax)>0.2){dir=Math.sign(ax);run=runHeld(dir)}}
  if(g.dash>0){g.dash-=dt;dir=D.face;run=true}if(g.dcd>0)g.dcd-=dt;if(dir)D.face=dir;const x0=D.x;D.x=clamp(D.x+dir*(run?RD.vr:RD.vw)*(g.dash>0?1.5:1)*dt,20,L.vw-20);if(D.y<0||D.vy<0){D.vy+=900*dt;D.y+=D.vy*dt;if(D.y>=0){D.y=0;D.vy=0}}D.o.ov={t:'blanket'};stepGait(D.o,D.x-x0,dt,heroRig(),D.y>=0);
  for(const c of g.cats){const wx=(L.ox+c.px*L.S)/k,wy=(L.oy+c.py*L.S-L.gY)/k;
   if(c.st==='warn'){c.tm-=dt;c.x=wx+Math.sin(g.t*40)*1.5;c.y=wy;if(c.tm<=0){c.st='fall';c.vy=-60;c.x=wx}}
   else if(c.st==='fall'){c.vy+=620*dt;c.y+=c.vy*dt;const bx=D.x+14*D.face;
    if(c.y-D.y>=-72&&c.y-D.y<-50&&Math.abs(c.x-bx)<34){c.st='done';g.caught++;Sound.play('help');fxBurst(g.F,c.x,-80,8,'heart',90,1,5,-40);fxText(g.F,c.x,-120,pick(['Gotcha, kitty!','Safe!','Purrfect!']),'#9effa0',14);g.basket.push(c.col);
     if(g.caught>=g.goal&&!g.over){g.over=true;setTimeout(()=>finish(true,g.miss===0?3:g.miss===1?2:1,`You caught ${g.caught} kitties! Missed: ${g.miss}.`),700)}}
    else if(c.y>=0){c.st='done';g.miss++;Sound.play('meow');fxText(g.F,c.x,-60,'Missed!','#ff8a7a',14);c.run=1;
     if(g.miss>=3&&!g.over){g.over=true;setTimeout(()=>finish(false,0,'Three kitties got away! They are fine, but let us try again.'),700)}}}}
  g.cats=g.cats.filter(c=>c.st!=='done');fxStep(g.F,dt)};
 g.hud=()=>`🐱 ${g.caught}/${g.goal}  Missed ${g.miss}/3`;
 g.draw=()=>{const L=g.L(),k=L.k,img=G.img.park;cx.fillStyle='#6ab8f0';cx.fillRect(0,0,G.W,G.H);cx.drawImage(img,L.ox,L.oy,1280*L.S,720*L.S);
  if(L.oy+720*L.S<G.H){cx.drawImage(img,0,718,1280,2,L.ox,L.oy+720*L.S-1,1280*L.S,G.H)}
  cx.save();cx.translate(0,L.gY);cx.scale(k,k);
  cx.save();cx.translate(30,0);cx.fillStyle='#a87a3a';cx.strokeStyle='#5a3a10';rr(cx,-22,-24,44,24,6);cx.fill();cx.stroke();g.basket.forEach((col,i)=>{cx.save();cx.translate(-14+(i%4)*9,-22-Math.floor(i/4)*6);cx.scale(0.5,0.5);drawCat(cx,col,'sit',g.t+i);cx.restore()});cx.restore();
  for(const c of g.cats){if(c.st==='fall'){cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.ellipse(c.x,0,14,3,0,0,TAU);cx.fill()}
   cx.save();cx.translate(c.x,c.y);drawCat(cx,c.col,c.st==='fall'?'fall':'sit',g.t);if(c.st==='warn'){cx.fillStyle='#ffd23f';cx.font='18px Lilita,system-ui';cx.textAlign='center';cx.fillText('!',6,-34)}cx.restore()}
  pairBegin(cx,D);const hd=D.o._hand||[14,-60];cx.fillStyle='#c8202a';cx.strokeStyle='#5a0a10';cx.lineWidth=1.2;cx.beginPath();cx.ellipse(14,hd[1]-2,26,6,0,0,TAU);cx.fill();cx.stroke();
  cx.fillStyle='#fff';cx.fillRect(12,hd[1]-5,4,6);cx.restore();
  fxDraw(cx,g.F,1);cx.restore()};
 return g}
/* ================= TRAFFIC (direct the intersection) ================= */
function TrafficGame(cfg){
 const g={F:[],t:0,sig:'EW',sw:0,through:0,goal:cfg.goal||30,hearts:3,cars:[],spawnT:0.5,amb:[18,42],started:false};
 g.k=()=>Math.min(G.W,G.H)/330;
 const DIRS={E:{vx:1,vy:0,ax:'EW',lane:[0,18]},W:{vx:-1,vy:0,ax:'EW',lane:[0,-18]},N:{vx:0,vy:-1,ax:'NS',lane:[18,0]},S:{vx:0,vy:1,ax:'NS',lane:[-18,0]}};
 g.start=()=>{g.started=true;toast('Wave the traffic through!',1400)};
 g.toggle=to=>{if(g.over)return;const n=to||(g.sig==='EW'?'NS':'EW');if(n===g.sig&&!g.sw)return;g.sig=n;g.sw=0.7;Sound.play('whistle')};
 g.act=()=>{if(g.started)g.toggle()};g.down=()=>{};g.move=()=>{};g.up=p=>{};g.swipeJump=false;g.btns=()=>['','SWITCH'];g.hint=()=>'SWIPE ← → OR ↑ ↓ TO PICK THE ROAD<br>OR TAP SWITCH';
 g.update=dt=>{g.t+=dt;if(!g.started)return;const k=g.k(),hx=G.W/2/k+40,hy=G.H/2/k+40;if(g.sw>0)g.sw-=dt;
  if(!G.auto){const ax=axisX(),ay=axisY();if(Math.abs(ax)>0.7&&Math.abs(ay)<0.3&&g.sig!=='EW')g.toggle('EW');if(Math.abs(ay)>0.7&&Math.abs(ax)<0.3&&g.sig!=='NS')g.toggle('NS')}
  g.spawnT-=dt;if(g.spawnT<=0){g.spawnT=Math.max(0.75,1.6-g.t*0.01);const d=pick(['E','W','N','S']);g.addCar(d,false)}
  if(g.amb.length&&g.t>g.amb[0]){g.amb.shift();g.addCar(pick(['E','W','N','S']),true);toast('Ambulance coming!',1400);Sound.play('siren')}
  for(const c of g.cars){const D=DIRS[c.d];const go=g.sig===D.ax&&g.sw<=0;const pos=c.d==='E'?c.x:c.d==='W'?-c.x:c.d==='N'?-c.y:c.y;/* pos increases toward exit; stop line at -50 */
   let lim=1e9;if(!go&&pos<-50)lim=-50-(c.amb?24:20);for(const o of g.cars){if(o===c||o.d!==c.d)continue;const op=o.d==='E'?o.x:o.d==='W'?-o.x:o.d==='N'?-o.y:o.y;if(op>pos)lim=Math.min(lim,op-46)}
   const want=c.amb?150:115;let v=want;if(pos+v*dt>lim)v=Math.max(0,(lim-pos)/dt);c.v=v;c.x+=D.vx*v*dt;c.y+=D.vy*v*dt;
   if(v<5&&pos<-40){c.wait+=dt;if(c.amb&&c.wait>3.5&&!c.mad){c.mad=1;g.hurt('The ambulance waited too long!')}else if(!c.amb&&c.wait>8&&!c.honk){c.honk=1;Sound.play('honk');fxText(g.F,c.x,c.y-20,'HONK!','#ff8a7a',12)}if(!c.amb&&c.wait>14&&!c.mad){c.mad=1;g.hurt('A driver lost patience!')}}
   if(pos>-50&&!c.past){c.past=1}if(pos>Math.max(hx,hy)&&!c.out){c.out=1;g.through++;if(g.through>=g.goal&&!g.over){g.over=true;setTimeout(()=>finish(true,g.hearts===3?3:g.hearts===2?2:1,`You waved ${g.through} cars through safely!`),600)}}}
  g.cars=g.cars.filter(c=>!c.out);fxStep(g.F,dt);
  if(G.auto){let wE=0,wN=0,amb=null;for(const c of g.cars){if(!c.past){if(DIRS[c.d].ax==='EW')wE+=1+c.wait;else wN+=1+c.wait;if(c.amb)amb=c}}const want=amb?DIRS[amb.d].ax:(wE>wN+3?'EW':wN>wE+3?'NS':g.sig);if(want!==g.sig&&g.sw<=0&&(g._lt||0)<g.t-1.2){g._lt=g.t;g.toggle(want)}}};
 g.addCar=(d,amb)=>{const k=g.k(),hx=G.W/2/k+60,hy=G.H/2/k+60,D=DIRS[d];const s=Math.max(hx,hy);const x=d==='E'?-s:d==='W'?s:D.lane[0],y=d==='N'?s:d==='S'?-s:D.lane[1];
  for(const o of g.cars)if(o.d===d&&Math.hypot(o.x-x,o.y-y)<60)return;g.cars.push({d,x,y,v:0,wait:0,amb,col:amb?'#fff':pick(CARCOL)})};
 g.hurt=msg=>{g.hearts--;Sound.play('hurt');toast(msg,1400);if(g.hearts<=0&&!g.over){g.over=true;setTimeout(()=>finish(false,0,'Traffic got too backed up. Try again!'),700)}};
 g.hud=()=>'♥'.repeat(Math.max(0,g.hearts))+'♡'.repeat(3-Math.max(0,g.hearts))+`  Cars ${g.through}/${g.goal}`;
 g.draw=()=>{const k=g.k(),d=G.dpr;cx.fillStyle='#4a8a3a';cx.fillRect(0,0,G.W,G.H);cx.save();cx.setTransform(k*d,0,0,k*d,G.W/2*d,G.H/2*d);const hx=G.W/2/k+5,hy=G.H/2/k+5;
  for(const [x,y] of[[-110,-110],[110,-110],[-110,110],[110,110]]){cx.fillStyle='#8a8478';cx.fillRect(x-60,y-60,120,120);cx.fillStyle=pick2(['#a83a2a','#6a7a9a','#c8a060','#7a5a3a'],x*3+y);cx.fillRect(x-40,y-40,80,80);cx.fillStyle='rgba(0,0,0,.2)';cx.fillRect(x,y-40,40,80)}
  cx.fillStyle='#3a3a40';cx.fillRect(-hx,-42,hx*2,84);cx.fillRect(-42,-hy,84,hy*2);
  cx.fillStyle='#f2d04a';for(let x=-hx;x<hx;x+=30)if(Math.abs(x)>60)cx.fillRect(x,-1.5,16,3);for(let y=-hy;y<hy;y+=30)if(Math.abs(y)>60)cx.fillRect(-1.5,y,3,16);
  cx.fillStyle='#f4f4f4';for(let i=-36;i<=30;i+=12){cx.fillRect(i,-58,7,12);cx.fillRect(i,46,7,12);cx.fillRect(-58,i,12,7);cx.fillRect(46,i,12,7)}
  cx.fillRect(-42,46,42,3);cx.fillRect(0,-49,42,3);cx.fillRect(46,0,3,42);cx.fillRect(-49,-42,3,42);
  const lc=(ax)=>g.sw>0?'#f2c02a':g.sig===ax?'#3ae05a':'#e8302a';
  for(const [x,y,ax] of[[-50,-50,'NS'],[50,50,'NS'],[50,-50,'EW'],[-50,50,'EW']]){cx.fillStyle='#222';cx.beginPath();cx.arc(x,y,7,0,TAU);cx.fill();cx.fillStyle=lc(ax);cx.beginPath();cx.arc(x,y,5,0,TAU);cx.fill()}
  for(const c of g.cars){cx.save();cx.translate(c.x,c.y);cx.rotate({E:Math.PI/2,W:-Math.PI/2,N:0,S:Math.PI}[c.d]);if(c.amb)drawAmb(cx,g.t);else drawCar(cx,28,48,c.col);if(c.wait>8&&!c.amb){cx.rotate(-{E:Math.PI/2,W:-Math.PI/2,N:0,S:Math.PI}[c.d]);cx.fillStyle='#ff4a3a';cx.font='16px Lilita,system-ui';cx.textAlign='center';cx.fillText(c.wait>12?'!!!':'!',0,-30)}cx.restore()}
  /* Duncan, seen from above */
  cx.save();const rot=g.sig==='EW'?Math.PI/2:0;cx.rotate(rot+Math.sin(g.t*3)*0.05);cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(3,3,15,10,0,0,TAU);cx.fill();
  const wv=Math.sin(g.t*8)*0.4;cx.strokeStyle='#eab48c';cx.lineWidth=5;cx.lineCap='round';cx.beginPath();cx.moveTo(-11,0);cx.lineTo(-24,-10+wv*10);cx.moveTo(11,0);cx.lineTo(24,10-wv*10);cx.stroke();cx.fillStyle='#fff';cx.beginPath();cx.arc(-24,-10+wv*10,3.2,0,TAU);cx.arc(24,10-wv*10,3.2,0,TAU);cx.fill();
  cx.fillStyle='#1d3b27';cx.beginPath();cx.ellipse(0,4,12,8,0,0,TAU);cx.fill();cx.fillStyle='#b89d64';cx.beginPath();cx.ellipse(0,0,13,8,0,0,TAU);cx.fill();cx.strokeStyle='#2e2012';cx.lineWidth=1;cx.stroke();
  cx.fillStyle='#dccb9f';cx.beginPath();cx.ellipse(0,3,7,6,0,0,TAU);cx.fill();cx.fillStyle='#161616';cx.beginPath();cx.arc(0,0,6.5,0,TAU);cx.fill();cx.fillRect(-4,-10,8,5);cx.fillStyle='#ddd';cx.beginPath();cx.arc(0,-2,1.5,0,TAU);cx.fill();cx.restore();
  fxDraw(cx,g.F,1);cx.restore()};
 return g}
/* ================= SHOOTING RANGE (water cannon at cardboard cutouts) ================= */
function ShootGame(cfg){
 const g={F:[],t:0,started:false,hits:0,goal:cfg.goal||15,oops:0,miss:0,ammo:cfg.ammo||8,maxAmmo:cfg.ammo||8,reload:0,ret:{x:0,y:0},retOn:false,T:[],spawnT:0.8,shotT:0,cd:0,d:{o:mkGait()}};
 const D=g.d;
 g.L=()=>{const land=G.land,gY=land?G.H*0.97:G.H*0.92,rg=land?G.H*0.2:G.H*0.16,k=land?G.H*0.2/106:Math.min(G.H*0.17,G.W*0.36)/106;
  return{land,gY,k,rows:[gY-rg*2.15,gY-rg*1.1,gY-rg*0.1],sc:[k*0.62,k*0.8,k*1.0],x0:G.W*(land?0.2:0.26),x1:G.W*(land?0.78:0.95),dx:G.W*(land?0.075:0.11)}};
 g.start=()=>{g.started=true;g.ret.x=G.W*0.6;g.ret.y=G.H*0.5;toast(cfg.toast||'Squirt the bad guys! Not the neighbors!',1700)};
 function spawn(){const L=g.L();const row=Math.floor(Math.random()*3),s=L.sc[row];
  for(let tries=0;tries<8;tries++){const x=rnd(L.x0,L.x1);if(g.T.some(t=>t.row===row&&t.st!=='gone'&&Math.abs(t.x-x)<58*s))continue;
   const good=Math.random()<(cfg.goodP||0.25);const kind=good?pick(['granny','kid','farmer']):pick(['umb','umb','antifa','commie']);
   g.T.push({row,x,kind,good,up:0,st:'rise',life:(cfg.life||2.8)*rnd(0.85,1.15),vx:cfg.move?pick([-1,1])*rnd(40,80)*s/L.k:0,o:mkGait(),tilt:0});return}}
 function tgtBox(t,L){const s=L.sc[t.row],h=(t.kind==='umb'?140:108)*s*t.up;return{x0:t.x-30*s,x1:t.x+30*s,y0:L.rows[t.row]-h,y1:L.rows[t.row]+4}}
 g.act=()=>{if(!g.started||g.over||g.cd>0)return;if(g.reload>0)return;if(g.ammo<=0){Sound.play('click');toast('Out of water! Press RELOAD',1000);return}
  g.ammo--;g.cd=0.18;g.shotT=0.28;Sound.play('splat');const L=g.L(),rx=g.ret.x,ry=g.ret.y;
  fxBurst(g.F,rx,ry,12,['#bfe4ff','#ffffff','#7cc4ff'],140,0.5,3,300);
  const live=g.T.filter(t=>(t.st==='up'||t.st==='rise')&&t.up>0.5).sort((a,b)=>b.row-a.row);
  for(const t of live){const b=tgtBox(t,L);if(rx>b.x0-8&&rx<b.x1+8&&ry>b.y0-8&&ry<b.y1){t.st='hit';t.wet=1;
    if(t.good){g.oops++;Sound.play('hurt');fxText(g.F,t.x,b.y0-10,pick(['Hey! I\'m a neighbor!','Oops! Sorry!','Not me, Constable!']),'#ff9a8a',15)}
    else{g.hits++;Sound.play('bust');fxText(g.F,t.x,b.y0-10,pick(['SPLASH!','SOAKED!','Bullseye!','Got \'em!']),'#ffd23f',17);fxBurst(g.F,t.x,(b.y0+b.y1)/2,16,'star',150,0.6,4,0);
     if(g.hits>=g.goal&&!g.over){g.over=true;const tt=g.t,st=g.oops===0&&tt<(cfg.par||70)?3:g.oops<=2?2:1;setTimeout(()=>finish(true,st,`You soaked ${g.hits} cardboard troublemakers in ${Math.round(tt)} seconds! Neighbors splashed by mistake: ${g.oops}.`),1100)}}
    return}}
  g.miss++};
 g.jump=()=>{if(!g.started||g.over||g.reload>0||g.ammo===g.maxAmmo)return;g.reload=0.8;Sound.play('jump');fxText(g.F,G.W*(G.land?0.1:0.14),g.L().gY-120*g.L().k,'Filling up!','#9ad8ff',14)};
 g.swipeJump=false;g.drag=(dx,dy)=>{g.ret.x=clamp(g.ret.x+dx*1.5,0,G.W);g.ret.y=clamp(g.ret.y+dy*1.5,0,G.H);g.retOn=true};
 g.btns=()=>[(g.reload>0||g.ammo===g.maxAmmo)?'~RELOAD':'RELOAD',(g.ammo>0&&g.reload<=0)?'SQUIRT':'~SQUIRT'];
 g.hint=()=>'SWIPE &amp; HOLD TO AIM<br>SQUIRT TO SHOOT · RELOAD FOR MORE WATER';
 g.hud=()=>`Soaked ${g.hits}/${g.goal}  💧${g.reload>0?'…':g.ammo}  Oops ${g.oops}`;
 g.update=dt=>{g.t+=dt;if(!g.started)return;const L=g.L();if(g.cd>0)g.cd-=dt;if(g.shotT>0)g.shotT-=dt;
  if(g.reload>0){g.reload-=dt;if(g.reload<=0){g.reload=0;g.ammo=g.maxAmmo;Sound.play('cuff')}}
  if(G.auto)g.autoplay(dt);else{const k=G.keys,ax=clamp(((k.ArrowRight||k.KeyD)?1:0)-((k.ArrowLeft||k.KeyA)?1:0)+G.pad.ax,-1,1),ay=clamp(((k.ArrowDown||k.KeyS)?1:0)-((k.ArrowUp||k.KeyW)?1:0)+G.pad.ay,-1,1);if(ax||ay){g.ret.x=clamp(g.ret.x+ax*520*dt,0,G.W);g.ret.y=clamp(g.ret.y+ay*520*dt,0,G.H)}}
  g.spawnT-=dt;const up=g.T.filter(t=>t.st!=='gone').length;if(g.spawnT<=0&&up<(cfg.maxUp||4)){spawn();g.spawnT=Math.max(cfg.rateMin||0.55,(cfg.rate||1.2)-g.t*0.006)}
  for(const t of g.T){if(t.st==='rise'){t.up=Math.min(1,t.up+dt*5);if(t.up>=1)t.st='up'}
   else if(t.st==='up'){t.life-=dt;if(t.life<=0)t.st='down'}
   else if(t.st==='hit'){t.tilt=Math.min(1,t.tilt+dt*4);if(t.tilt>=1)t.st='down'}
   else if(t.st==='down'){t.up-=dt*4;if(t.up<=0){t.up=0;t.st='gone'}}
   if(t.vx&&t.st!=='hit'){t.x+=t.vx*L.k*dt;if(t.x<L.x0||t.x>L.x1){t.vx=-t.vx;t.x=clamp(t.x,L.x0,L.x1)}stepGait(t.o,Math.abs(t.vx*L.k*dt),dt,RP,true)}}
  g.T=g.T.filter(t=>t.st!=='gone');stepGait(D.o,0,dt,heroRig(),true);fxStep(g.F,dt)};
 g.autoplay=dt=>{if(g.ammo<=0&&g.reload<=0){g.jump();return}const L=g.L();let best=null;for(const t of g.T){if(t.good||t.st==='hit'||t.st==='down')continue;if(!best||t.row>best.row)best=t}
  if(!best)return;const b=tgtBox(best,L),tx=best.x,ty=(b.y0+b.y1)/2;g.ret.x+=(tx-g.ret.x)*Math.min(1,dt*9);g.ret.y+=(ty-g.ret.y)*Math.min(1,dt*9);
  if(Math.abs(g.ret.x-tx)<8&&Math.abs(g.ret.y-ty)<10&&best.up>0.8)g.act()};
 function cutout(t,L){const s=L.sc[t.row];cx.save();cx.translate(t.x,L.rows[t.row]);cx.fillStyle='#7a5a3a';cx.fillRect(-3*s,-30*s,6*s,34*s);
  cx.scale(s,s*t.up);if(t.tilt){cx.transform(1,0,-t.tilt*0.3,1-t.tilt*0.55,0,0)}
  if(t.kind==='umb'){drawUmb(cx,{op:0,shake:0},1)}else{if(t.vx<0)cx.scale(-1,1);t.o.ov=null;drawPerson(cx,t.o,LOOK[t.kind])}
  if(!t.good){cx.save();cx.translate(0,t.kind==='umb'?-92:-62);cx.globalAlpha=0.85;for(const [r,c] of[[11,'#fff'],[8,'#e8322a'],[5,'#fff'],[2.5,'#e8322a']]){cx.fillStyle=c;cx.beginPath();cx.arc(0,0,r,0,TAU);cx.fill()}cx.restore()}
  else{cx.save();cx.translate(0,-112);cx.fillStyle='#3ab04a';cx.strokeStyle='#fff';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,9,0,TAU);cx.fill();cx.stroke();cx.strokeStyle='#fff';cx.lineWidth=2.5;cx.beginPath();cx.moveTo(-4,0);cx.lineTo(-1,3);cx.lineTo(4,-3);cx.stroke();cx.restore()}
  if(t.wet){cx.fillStyle='rgba(120,190,255,.35)';cx.fillRect(-30,-140,60,140)}
  cx.restore()}
 function fence(y,s){cx.fillStyle='#8a5a32';cx.fillRect(0,y-26*s,G.W,26*s);cx.fillStyle='#a8743e';for(let x=0;x<G.W;x+=22*s){cx.fillRect(x+1,y-30*s,18*s,30*s)}cx.fillStyle='rgba(0,0,0,.25)';cx.fillRect(0,y-4*s,G.W,4*s)}
 g.draw=()=>{const L=g.L(),img=G.img[cfg.bg||'park'],bgH=Math.max(L.land?G.H*1.04:G.H*0.8,L.gY/(cfg.gy||0.88)+2);drawTiledBG(img,cfg.gy||0.88,L.gY,bgH,0,cfg.dim||null);
  for(let r=0;r<3;r++){for(const t of g.T)if(t.row===r)cutout(t,L);fence(L.rows[r]+6*L.sc[r],L.sc[r])}
  /* Duncan and the water cannon */
  const dx=G.W*(L.land?0.1:0.12);cx.save();cx.translate(dx,L.gY);cx.scale(L.k,L.k);D.o.ov={t:'point'};
  if(G.partner){cx.save();cx.translate(-Follow.TRAIL,0);cx.globalAlpha=0.82;cx.scale(0.88,0.88);drawWho(cx,G.partner.who,G.partner.o);cx.restore()}
  drawHero(cx,D.o);
  cx.fillStyle='#2a6ad8';rr(cx,-34,-62,16,30,4);cx.fill();cx.fillStyle='#bfe4ff';const lv=g.reload>0?1-g.reload/0.8:g.ammo/g.maxAmmo;cx.fillRect(-31,-35-24*lv,10,24*lv);cx.restore();
  if(g.shotT>0){const h=D.o._hand||[22,-62],nx=dx+h[0]*L.k,ny=L.gY+h[1]*L.k,tx=g.ret.x,ty=g.ret.y,mx=(nx+tx)/2,my=Math.min(ny,ty)-Math.abs(tx-nx)*0.15-20;
   cx.globalAlpha=Math.min(1,g.shotT*5);cx.strokeStyle='rgba(170,215,255,.6)';cx.lineWidth=8;cx.lineCap='round';cx.beginPath();cx.moveTo(nx,ny);cx.quadraticCurveTo(mx,my,tx,ty);cx.stroke();cx.strokeStyle='rgba(240,250,255,.9)';cx.lineWidth=3;cx.stroke();cx.globalAlpha=1}
  if(cfg.dim){cx.fillStyle='rgba(255,230,150,.08)';cx.fillRect(0,0,G.W,G.H)}
  fxDraw(cx,g.F,1);
  const rx=g.ret.x,ry=g.ret.y;cx.strokeStyle='#fff';cx.lineWidth=2.5;cx.beginPath();cx.arc(rx,ry,18,0,TAU);cx.moveTo(rx-26,ry);cx.lineTo(rx-10,ry);cx.moveTo(rx+10,ry);cx.lineTo(rx+26,ry);cx.moveTo(rx,ry-26);cx.lineTo(rx,ry-10);cx.moveTo(rx,ry+10);cx.lineTo(rx,ry+26);cx.stroke();
  cx.fillStyle='#e8322a';cx.beginPath();cx.arc(rx,ry,3,0,TAU);cx.fill()};
 return g}
/* ================= FLOOD RESCUE: tow the boat with the Jeep, then the inflatable boat ================= */
function drawBoatTop(c,t,riders,face,moving){/* faces +x */const L=34,W=17;
 if(moving){c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=2.5;c.beginPath();c.moveTo(-L-4,-W*0.6);c.lineTo(-L-30,-W*1.5-Math.sin(t*9)*2);c.moveTo(-L-4,W*0.6);c.lineTo(-L-30,W*1.5+Math.sin(t*9)*2);c.stroke()}
 c.fillStyle='rgba(0,0,0,.25)';rr(c,-L+3,-W+4,L*2,W*2,W);c.fill();
 c.fillStyle='#e8662a';rr(c,-L,-W,L*2,W*2,W);c.fill();c.strokeStyle='#7a2a10';c.lineWidth=1.5;c.stroke();
 c.fillStyle='#4a4a52';rr(c,-L+7,-W+6,L*2-16,W*2-12,W-6);c.fill();
 c.fillStyle='#fff';c.fillRect(-6,-W+1,12,3);c.fillRect(-6,W-4,12,3);
 c.fillStyle='#222';rr(c,-L-9,-6,12,12,3);c.fill();c.fillStyle='#555';c.fillRect(-L-12,-2,5,4);
 const seats=[[16,0],[4,-6],[4,6],[-8,0]];(riders||[]).forEach((r,i)=>{const p=seats[i]||[0,0];c.fillStyle=r.col||'#e8604a';c.beginPath();c.arc(p[0],p[1],5.2,0,TAU);c.fill();c.fillStyle=r.hair||'#7a4a20';c.beginPath();c.arc(p[0]-1.5,p[1],3.6,0,TAU);c.fill()});
 if(face&&face.naturalWidth){c.save();c.beginPath();c.arc(-L+12,0,8,0,TAU);c.clip();c.rotate(Math.PI/2);c.drawImage(face,-9,-9,18,18);c.restore();c.strokeStyle='#2e2012';c.lineWidth=1.2;c.beginPath();c.arc(-L+12,0,8,0,TAU);c.stroke()}
 else{c.fillStyle='#eab48c';c.beginPath();c.arc(-L+12,0,7,0,TAU);c.fill()}}
function FloodGame(cfg){
 const g={phase:'tow',F:[],t:0,started:false,swipeJump:false};
 const tow=DriveGame({tow:true,dist:cfg.towDist||5200,speed:255,stubborn:0.1,umbs:0.12,gap:[200,320],rain:true,onDone:()=>{toast('Launch the boat!',1400);fxText(tow.F,tow.J.a,-tow.J.d-70,'We made it to the flood!','#ffd23f',14);setTimeout(()=>{if(g.phase==='tow'&&G.game===g){g.phase='boat';B.start()}},1300)}});
 const B=BoatGame(cfg);g.tow=tow;g.B=B;const cur=()=>g.phase==='tow'?tow:B;
 g.start=()=>{g.started=true;tow.start()};
 g.update=dt=>{g.t+=dt;cur().update(dt)};g.draw=()=>cur().draw();
 g.act=()=>cur().act();g.jump=()=>cur().jump();g.btns=()=>cur().btns();g.hint=()=>cur().hint();g.hud=()=>cur().hud();
 return g}
function BoatGame(cfg){
 const SP=cfg.spots||[[0.42,0.14,'roof','granny'],[0.8,0.1,'roof','kid'],[0.6,0.33,'car','farmer'],[0.9,0.38,'roof','mom'],[0.38,0.5,'tree','kid'],[0.7,0.58,'roof','cat'],[0.48,0.78,'car','granny'],[0.9,0.62,'roof','farmer']];
 const g={F:[],t:0,started:false,rescued:0,bumps:0,goal:SP.length,cap:cfg.cap||3,seats:[],shore:[],
  P:SP.map((s,i)=>({u:s[0],v:s[1],kind:s[2],who:s[3],st:'wait',o:mkGait(),id:i})),
  logs:[0,1,2,3].slice(0,cfg.logs||3).map(i=>({u:rnd(0.3,0.95),v:rnd(0,1),a:rnd(0,3),sp:rnd(0.035,0.06)})),
  b:{u:0.2,v:0.45,vx:0,vy:0,ang:0,slow:0,boost:0,bcd:0}};
 const b=g.b;
 g.S=()=>Math.min(G.W,G.H)/360;
 g.start=()=>{g.started=true;toast('Rescue everybody from the flood!',1700);Sound.play('whistle')};
 const near=()=>{const S=g.S();let best=null,bd=1e9;for(const p of g.P){if(p.st!=='wait')continue;const d=Math.hypot((p.u-b.u)*G.W,(p.v-b.v)*G.H);if(d<bd){bd=d;best=p}}return bd<70*S?best:null};
 g.act=()=>{if(!g.started||g.over)return;const p=near();if(!p){if(g.seats.length)toast('Take them to the shore ←',900);return}
  if(g.seats.length>=g.cap){toast('Boat\'s full! Drop them at the shore',1100);Sound.play('honk');return}
  p.st='boat';g.seats.push(p);Sound.play(p.who==='cat'?'meow':'cuff');fxText(g.F,p.u*G.W,p.v*G.H-30*g.S(),p.who==='cat'?'Mew!':pick(['Thank you!','Hop in!','My hero!']),'#9effa0',15)};
 g.jump=()=>{if(!g.started||g.over||b.bcd>0)return;b.boost=1;b.bcd=2.2;Sound.play('jump');fxText(g.F,b.u*G.W,b.v*G.H-30*g.S(),'VROOM!','#ffd23f',14)};
 g.btns=()=>[b.bcd>0?'~BOOST':'BOOST',near()&&g.seats.length<g.cap?'RESCUE':'~RESCUE'];
 g.hint=()=>'SWIPE &amp; HOLD TO STEER THE BOAT<br>RESCUE NEXT TO PEOPLE · BOOST TO SPEED UP';
 g.hud=()=>`Rescued ${g.rescued}/${g.goal}  Boat ${g.seats.length}/${g.cap}`;
 const SHORE=0.15;
 g.update=dt=>{g.t+=dt;if(!g.started)return;const S=g.S();if(b.boost>0)b.boost-=dt;if(b.bcd>0)b.bcd-=dt;if(b.slow>0)b.slow-=dt;
  let ax,ay;if(G.auto){[ax,ay]=g.autoplay()}else{ax=axisX();ay=axisY()}const m=Math.hypot(ax,ay);if(m>1){ax/=m;ay/=m}
  const spd=150*S*(b.boost>0?1.6:1)*(b.slow>0?0.5:1);b.vx+=(ax*spd-b.vx)*Math.min(1,dt*3);b.vy+=(ay*spd-b.vy)*Math.min(1,dt*3);
  const u0=b.u,v0=b.v;b.u+=b.vx*dt/G.W;b.v+=(b.vy*dt+6*S*dt)/G.H;b.u=clamp(b.u,SHORE-0.01,0.98);b.v=clamp(b.v,0.05,0.95);
  const sp=Math.hypot(b.vx,b.vy);if(sp>12*S){const ta=Math.atan2(b.vy,b.vx);let d=ta-b.ang;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;b.ang+=d*Math.min(1,dt*8)}
  /* bump into flooded houses/cars/trees */
  for(const p of g.P){const r=(p.kind==='roof'?34:p.kind==='car'?26:28)*S+14*S,dx=(b.u-p.u)*G.W,dy=(b.v-p.v)*G.H,d=Math.hypot(dx,dy);if(d<r&&d>0.01){b.u=p.u+dx/d*r/G.W;b.v=p.v+dy/d*r/G.H}}
  /* floating logs */
  for(const l of g.logs){l.v+=l.sp*dt;l.a+=dt*0.4;if(l.v>1.08){l.v=-0.08;l.u=rnd(0.3,0.95)}
   const d=Math.hypot((l.u-b.u)*G.W,(l.v-b.v)*G.H);if(d<30*S&&!l.cool){l.cool=1.2;b.slow=0.8;g.bumps++;Sound.play('crash');const nx=(b.u-l.u)*G.W/d,ny=(b.v-l.v)*G.H/d;b.vx=nx*160*S;b.vy=ny*160*S;fxText(g.F,b.u*G.W,b.v*G.H-28*S,'BONK! Watch the logs!','#ffd23f',13)}
   if(l.cool){l.cool-=dt;if(l.cool<=0)l.cool=0}}
  /* drop off at the shore */
  if(b.u<SHORE+0.05&&g.seats.length){for(const p of g.seats){p.st='safe';g.rescued++;g.shore.push({p,x:rnd(0.03,0.11),y:clamp(b.v+rnd(-0.06,0.06),0.08,0.92)})}Sound.play('star');fxText(g.F,b.u*G.W+30*S,b.v*G.H-30*S,g.seats.length>1?'Safe and dry!':'Safe!','#9effa0',17);g.seats=[];
   if(g.rescued>=g.goal&&!g.over){g.over=true;const tt=g.t,st=tt<(cfg.par||90)&&g.bumps<=1?3:g.bumps<=4?2:1;setTimeout(()=>finish(true,st,`Everybody's safe! You rescued ${g.rescued} from the flood in ${Math.round(tt)} seconds. Log bumps: ${g.bumps}.`),1100)}}
  for(const p of g.P)stepGait(p.o,0,dt,RP,true);
  stepGait(b.o||(b.o=mkGait()),0,dt,RD,true);fxStep(g.F,dt);
  if(!g.rain)g.rain=[];if(g.rain.length<90)for(let i=0;i<5;i++)g.rain.push({x:Math.random()*G.W,y:Math.random()*G.H,l:rnd(0.2,0.6)});for(const r of g.rain){r.l-=dt;if(r.l<0){r.x=Math.random()*G.W;r.y=Math.random()*G.H;r.l=rnd(0.2,0.6)}}};
 g.autoplay=()=>{let tu,tv;if(g.seats.length>=g.cap||(g.seats.length&&!g.P.some(p=>p.st==='wait'))){tu=SHORE+0.02;tv=b.v}
  else{let best=null,bd=1e9;for(const p of g.P){if(p.st!=='wait')continue;const d=Math.hypot((p.u-b.u)*G.W,(p.v-b.v)*G.H);if(d<bd){bd=d;best=p}}if(!best)return[0,0];if(near()===best){g.act();return[0,0]}tu=best.u;tv=best.v}
  const dx=(tu-b.u)*G.W,dy=(tv-b.v)*G.H,d=Math.hypot(dx,dy);if(d<4)return[0,0];return[dx/d,dy/d]};
 g.draw=()=>{const S=g.S(),W=G.W,H=G.H;
  const wg=cx.createLinearGradient(0,0,0,H);wg.addColorStop(0,'#6a8a8a');wg.addColorStop(1,'#4a6a72');cx.fillStyle=wg;cx.fillRect(0,0,W,H);
  cx.strokeStyle='rgba(255,255,255,.16)';cx.lineWidth=2*S;for(let i=0;i<26;i++){const y=((hash(i)*H+g.t*12*S)%H),x=hash(i+50)*W;cx.beginPath();cx.moveTo(x-14*S,y);cx.quadraticCurveTo(x,y-5*S,x+14*S,y);cx.stroke()}
  /* shore */
  const sx=SHORE*W;cx.fillStyle='#d8c48a';cx.beginPath();cx.moveTo(0,0);cx.lineTo(sx+8*S,0);for(let y=0;y<=H;y+=20*S)cx.lineTo(sx+8*S+Math.sin(y*0.05+g.t)*4*S,y);cx.lineTo(0,H);cx.fill();
  cx.fillStyle='#4f9240';cx.fillRect(0,0,sx-4*S,H);cx.fillStyle='#3a3a40';cx.fillRect(sx*0.25,0,sx*0.45,H);cx.fillStyle='#f2d04a';for(let y=0;y<H;y+=40*S)cx.fillRect(sx*0.47-1.5*S,y,3*S,20*S);
  cx.save();cx.translate(sx*0.47,H*0.22);cx.scale(S*0.7,S*0.7);cx.fillStyle='#333';cx.fillRect(-14,30,28,40);cx.fillStyle='#111';cx.fillRect(-20,52,6,12);cx.fillRect(14,52,6,12);drawJeep(cx,g.t,false);cx.restore();
  cx.save();cx.translate(sx*0.47,H*0.78);cx.scale(S*0.7,S*0.7);drawAmb(cx,g.t);cx.restore();
  for(const s of g.shore){cx.save();cx.translate(s.x*W,s.y*H);cx.scale(S*0.3,S*0.3);if(s.p.who==='cat')drawCat(cx,'#e8a040','sit',g.t);else{s.p.o.ov={t:'cheer'};drawPerson(cx,s.p.o,LOOK[s.p.who])}cx.restore()}
  /* flooded things */
  for(const p of g.P){const x=p.u*W,y=p.v*H;cx.save();cx.translate(x,y);cx.scale(S,S);
   cx.strokeStyle='rgba(255,255,255,.25)';cx.lineWidth=2;cx.beginPath();cx.ellipse(0,4,40+Math.sin(g.t*2+p.id)*3,26,0,0,TAU);cx.stroke();
   if(p.kind==='roof'){cx.fillStyle='rgba(0,0,0,.25)';cx.fillRect(-30,-18,64,42);cx.fillStyle=pick2(['#a83a2a','#5a6a8a','#7a5a3a','#3a6a4a'],p.id);cx.fillRect(-32,-22,64,42);cx.fillStyle='rgba(0,0,0,.22)';cx.fillRect(-32,-1,64,21);cx.fillStyle='#ddd';cx.fillRect(-33,-2,66,3);cx.fillStyle='#6a4a3a';cx.fillRect(14,-30,9,12)}
   else if(p.kind==='car'){drawCar(cx,30,52,pick2(CARCOL,p.id+2),{});cx.fillStyle='rgba(90,120,130,.45)';cx.fillRect(-20,6,40,24)}
   else{cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.arc(4,4,28,0,TAU);cx.fill();cx.fillStyle='#2f7a32';cx.beginPath();cx.arc(0,0,28,0,TAU);cx.fill();cx.fillStyle='#3a9a3e';cx.beginPath();cx.arc(-8,-8,14,0,TAU);cx.fill()}
   if(p.st==='wait'){cx.save();cx.scale(0.32,0.32);if(p.who==='cat')drawCat(cx,'#e8a040',Math.sin(g.t*4+p.id)>0?'sit':'fall',g.t);else{p.o.ov={t:'cheer'};drawPerson(cx,p.o,LOOK[p.who])}cx.restore();
    if(Math.sin(g.t*5+p.id*1.3)>-0.2){cx.font='13px Lilita,system-ui,sans-serif';cx.textAlign='center';cx.lineWidth=3;cx.strokeStyle='#2a0a05';const tx=p.who==='cat'?'MEOW!':'HELP!';cx.strokeText(tx,0,-46);cx.fillStyle='#fff';cx.fillText(tx,0,-46)}}
   cx.restore()}
  for(const l of g.logs){cx.save();cx.translate(l.u*W,l.v*H);cx.rotate(l.a);cx.scale(S,S);cx.fillStyle='rgba(0,0,0,.25)';rr(cx,-24,-5,50,13,6);cx.fill();cx.fillStyle='#7a5230';rr(cx,-26,-7,52,14,7);cx.fill();cx.fillStyle='#c8a070';cx.beginPath();cx.ellipse(24,0,4,7,0,0,TAU);cx.fill();cx.strokeStyle='#5a3a20';cx.lineWidth=1;cx.beginPath();cx.moveTo(-18,-3);cx.lineTo(10,-3);cx.stroke();cx.restore()}
  cx.save();cx.translate(b.u*W,b.v*H);cx.rotate(b.ang);cx.scale(S,S);drawBoatTop(cx,g.t,g.seats.map(p=>({col:p.who==='cat'?'#e8a040':(LOOK[p.who]||{}).top,hair:p.who==='cat'?'#c88030':(LOOK[p.who]||{}).hair||'#5a3a20'})),G.img.face,Math.hypot(b.vx,b.vy)>20*S);cx.restore();
  const n=near();if(n&&g.seats.length<g.cap){cx.fillStyle='#ffd23f';const bob=Math.sin(g.t*6)*4*S,x=n.u*W,y=n.v*H-58*S+bob;cx.beginPath();cx.moveTo(x-9*S,y);cx.lineTo(x+9*S,y);cx.lineTo(x,y+14*S);cx.fill()}
  if(g.seats.length>=g.cap&&Math.sin(g.t*6)>0){cx.font=(18*S)+'px Lilita,system-ui,sans-serif';cx.textAlign='left';cx.lineWidth=4;cx.strokeStyle='#2a0a05';cx.strokeText('← To the shore!',sx+14*S,b.v*H-40*S);cx.fillStyle='#ffd23f';cx.fillText('← To the shore!',sx+14*S,b.v*H-40*S)}
  cx.fillStyle='rgba(20,30,60,.18)';cx.fillRect(0,0,W,H);cx.strokeStyle='rgba(200,220,255,.4)';cx.lineWidth=1;cx.beginPath();for(const r of g.rain||[]){cx.moveTo(r.x,r.y);cx.lineTo(r.x-2,r.y+10)}cx.stroke();
  for(const p of g.F){const a=clamp(p.l/p.l0*1.6,0,1);cx.globalAlpha=a;if(p.txt){const fs=p.s*S;cx.font=fs+'px Lilita,system-ui,sans-serif';cx.textAlign='center';cx.lineWidth=fs*0.22;cx.strokeStyle='#2a0a05';cx.strokeText(p.txt,p.x,p.y);cx.fillStyle=p.c;cx.fillText(p.txt,p.x,p.y)}cx.globalAlpha=1}};
 return g}
/* ================= ENDING scene ================= */
function ENDING(){const g={t:0,F:[],d:{o:mkGait()},crowd:[{o:mkGait(),L:LOOK.granny,x:-120},{o:mkGait(),L:LOOK.kid,x:-80},{o:mkGait(),L:LOOK.mom,x:-55},{o:mkGait(),L:LOOK.farmer,x:90},{o:mkGait(),L:LOOK.fire,x:130},{o:mkGait(),L:LOOK.deputy,x:170}]};
 g.update=dt=>{g.t+=dt;if(Math.random()<dt*2.5){const x=rnd(-200,200),y=rnd(-330,-200);fxBurst(g.F,x,y,26,['#ffd23f','#ff5a5a','#5ab0ff','#fff','#7aff7a'],160,1.4,2.6,60);Sound.play('pop')}fxStep(g.F,dt)};
 g.draw=()=>{const land=G.land,k=land?G.H*0.235/106:Math.min(G.H*0.15,G.W*0.34)/106,gY=land?G.H*0.86:G.H*0.8,bgH=land?G.H*1.03:G.H*0.72;
  drawTiledBG(G.img.square,0.83,gY,bgH,(G.img.square.width*bgH/G.img.square.height-G.W)/2,null);cx.save();cx.translate(G.W/2,gY);cx.scale(k,k);fxDraw(cx,g.F,1);
  for(const c of g.crowd){cx.save();cx.translate(c.x*(land?1.3:0.75),0);cx.scale(c.x<0?1:-1,1);c.o.ov={t:'cheer'};drawPerson(cx,c.o,c.L);cx.restore()}
  const ho=mkGait();ho.ov={t:'cheer'};g.d.o.ov={t:'cheer'};g.d.ov={t:'cheer'};
  cx.save();cx.translate(-78,0);drawDuncan(cx,g.d.o);cx.restore();
  cx.save();cx.translate(74,0);cx.scale(-1,1);drawHope(cx,ho);cx.restore();cx.restore()};
 g.update2=g.update;return g}
/* ================= LEVELS ================= */
const KEYS_SIDE=['<b>Touch:</b> swipe &amp; hold anywhere to walk (a long swipe runs). Swipe up or press JUMP to jump. ACTION busts or helps.','<b>Keys:</b> ← → walk, Shift run, Space bust/help, ↑ jump, C switches.','<b>Switch:</b> SWAP up top. The other one follows a few steps behind, smaller and dimmer. Only the one in front moves.','<b>Gamepad:</b> stick walk (push far to run), A bust/help, B jump, LB switches.'];
const KEYS_X=['<b>Touch:</b> swipe and hold anywhere to walk. A long swipe runs. Swipe up or JUMP. Green ACTION stays on the left. Orange JUMP stays on the right.','<b>Switch:</b> SWAP at the top, or the C key. The other character steps back. Only the leader takes your controls.','<b>Hope:</b> ACTION prays at a low shade, sends grace at a high one, lassos a crook or the ravine ring, and three quick taps is forgiveness.','<b>Duncan:</b> ACTION busts a crook and folds an umbrella, same ranges as always.'];
const KEYS_DRIVE=['<b>Touch:</b> swipe &amp; hold anywhere to steer. SIREN clears the road, BOOST rams.','<b>Keys:</b> arrows steer, Space siren, K boost.','<b>Gamepad:</b> stick steers, A siren, B boost.'];
const KEYS_SHOOT=['<b>Touch:</b> swipe &amp; hold anywhere to aim. SQUIRT shoots water, RELOAD fills the tank back up.','<b>Keys:</b> arrows aim, Space squirts, K reloads.','<b>Gamepad:</b> stick aims, A squirts, B reloads.'];
const LV=[
 {id:'c1',name:'Main Street, with Hope',kind:'On foot',make:SideGame,cfg:{bg:'street_day',gy:0.87,len:2700,who:'duncan',toast:'Hope is a few steps behind',endSign:'Next Block →',
   spawns:[{t:'granny',x:330},{t:'umb',x:620},{t:'antifa',x:900},{t:'umb',x:1220},{t:'kid',x:1450,momdx:240},{t:'umb',x:1850},{t:'commie',x:2150},{t:'umb',x:2420}]},
  story:[['Duncan','Mornin\', Flemingsburg. Constable Duncan, reportin\' for duty. Kilt pressed, boots shined.'],['Hope','I am Hope. Jacket, cargo pants, boots, and a braid down my back. I will walk with you.'],['Duncan','Only one of us drives. The other stays a few steps back, so you can see who is movin\'.'],['Duncan','SWAP up top, or the C key, and we trade places. My ACTION still busts crooks and folds umbrellas.']],
  how:'Patrol Main Street the way Duncan always has. Hope follows behind. SWAP puts her in front. Bust umbrellas and troublemakers, and help the neighbors.',keys:KEYS_X},
 {id:'c2',name:'Prayer on the Corner',kind:'On foot',make:SideGame,cfg:{bg:'street_dusk',gy:0.83,len:1400,who:'hope',story:true,toast:'Hope leads',endSign:'Corner clear →',
   shades:[{x:460,y:-58,kind:'low'},{x:980,y:-150,kind:'high'}],spawns:[]},
  story:[['Hope','Two shades are hanging over the corner. They are not neighbors.'],['Hope','Stand under the low one and press ACTION. That is a prayer.'],['Hope','The high one needs grace. ACTION again when you are close. Duncan cannot cuff a shade.']],
  how:'Play as Hope. ACTION near the low shade sends a prayer. ACTION near the high shade sends grace. Both have to go before the street opens.',keys:KEYS_X},
 {id:'c3',name:'Catch and Fold',kind:'On foot',make:SideGame,cfg:{bg:'street_day',gy:0.87,len:1600,who:'duncan',story:true,duncanOnlyUmb:true,toast:'Crook and an umbrella',endSign:'Lock-up →',
   spawns:[{t:'antifa',x:520},{t:'umb',x:1120}]},
  story:[['Duncan','Crook on the street. Umbrella by the walk. You know my ranges.'],['Hope','SWAP to me and ACTION throws the ponytail. I can lasso the crook.'],['Duncan','The umbrella is mine. Hope, you leave that fold to the Constable.']],
  how:'Duncan busts the crook, or Hope lassos him. Only Duncan can fold the umbrella. SWAP when you need the other one.',keys:KEYS_X},
 {id:'c4',name:'The Ravine',kind:'On foot',make:SideGame,cfg:{bg:'park',gy:0.88,len:2000,who:'hope',story:true,hearts:4,toast:'Do not jump the gap',endSign:'Far gate →',
   gap:{x0:900,x1:1200,anchorX:1100,anchorY:-168},rival:{x:1560},spawns:[]},
  story:[['Hope','That gap is wider than a run-jump. Do not try it.'],['Hope','Stand on the near lip and press ACTION. My ponytail catches the ring and we swing across.'],['Hope','On the far side, tap ACTION three times. The ponytail strikes, and it lands as forgiveness.']],
  how:'Walk Hope to the lip. ACTION swings her across. A run-jump falls. On the far side, tap ACTION three times to forgive the one waiting there.',keys:KEYS_X},
 {id:'l1',name:'Main Street Patrol',kind:'On foot',make:SideGame,cfg:{bg:'street_day',gy:0.87,len:2700,toast:'Patrol Main Street!',endSign:'Next Block →',
   spawns:[{t:'granny',x:330},{t:'umb',x:620},{t:'antifa',x:900},{t:'umb',x:1220},{t:'kid',x:1450,momdx:240},{t:'umb',x:1850},{t:'commie',x:2150},{t:'umb',x:2420}]},
  story:[['Duncan','Mornin\', Flemingsburg! Constable Duncan, reportin\' for duty. Kilt pressed, boots shined.'],['Duncan','Word is the umbrellas are creepin\' around town again. Tall, dark and sneaky.'],['Duncan','Get too close and they POP open on ya. Bust \'em before they pop, or wait till they\'re stuck open and dizzy!'],['Duncan','And keep an eye out for Antifa and commies. Let\'s go keep this town safe.']],
  how:'Walk down Main Street. Bust umbrellas, Antifa and commies, and help the neighbors who need you.',keys:KEYS_SIDE},
 {id:'l2',name:'Code 3: Clear the Road',kind:'Jeep driving',make:DriveGame,cfg:{escort:'fire',dist:9000,speed:260,stubborn:0.12,umbs:0.14,gap:[170,280]},
  story:[['Dispatch','Constable! House fire out on Elm Street. The fire truck needs a clear road, NOW!'],['Duncan','Lights on, siren on. Time to put this ol\' Jeep to work.'],['Duncan','Hit the SIREN and folks pull over. The stubborn ones in the red cars won\'t budge, so ram \'em off the road!']],
  how:'Drive ahead of the fire truck. Siren cars out of the way or ram them off the road so the truck never gets stuck.',keys:KEYS_DRIVE},
 {id:'l3',name:'Run the Hose',kind:'Fire rescue',make:FireGame,cfg:{goal:12},
  story:[['Fire Chief','Duncan! Glad you\'re here. We need hoses run and we need \'em quick!'],['Duncan','Hook the hose to the hydrant, then bring a line to the crew. Then we drown those flames!'],['Duncan','Hey... who\'s that sneakin\' around with a gas can?']],
  how:'First run the hoses: carry one to the hydrant, then bring one to the crew. Then aim the water into the burning windows.',keys:['<b>Touch:</b> swipe &amp; hold to walk Duncan with the hose, press HOOK UP at the hydrant and the crew. Then swipe &amp; hold to aim the water, hold SPRAY to spray.','<b>Keys:</b> ← → walk, Space hook up, then arrows aim and Space sprays.','<b>Gamepad:</b> stick walk, A hook up, then stick aims the water.']},
 {id:'l4',name:'Antifa Alley',kind:'On foot',make:SideGame,cfg:{bg:'street_dusk',gy:0.83,len:2900,hearts:3,toast:'Catch the firebug!',endSign:'Lock-up →',umbSp:44,umbWind:0.7,
   spawns:[{t:'antifa',x:420},{t:'umb',x:680},{t:'commie',x:900},{t:'farmer',x:1120},{t:'antifa',x:1380},{t:'umb',x:1600},{t:'commie',x:1850},{t:'umb',x:2080},{t:'granny',x:2250},{t:'arsonist',x:2560}]},
  story:[['Duncan','That firebug ran off toward the east side. Sun\'s goin\' down, and the troublemakers are out.'],['Duncan','Antifa run when they see me comin\'. Run after \'em! They get tired quick.'],['Duncan','Commies throw tomatoes. Jump over \'em! And don\'t let that firebug get away. He\'s the big catch tonight.']],
  how:'Chase down the Antifa, dodge commie tomatoes, help the neighbors, and catch the firebug with the gas can before the lock-up.',keys:KEYS_SIDE},
 {id:'s1',name:'Splash Range',kind:'Shooting',make:ShootGame,cfg:{bg:'park',gy:0.88,goal:12,life:3.0,rate:1.3,goodP:0.2,par:60,toast:'Soak the bad-guy cutouts!'},
  story:[['Deputy','Mornin\', Constable! Target practice day out at the park range.'],['Duncan','No real guns for this ol\' boy today. Just the big water cannon!'],['Duncan','Soak the cardboard umbrellas, Antifa and commies with the red bullseye. The neighbors with the green check are friends. Don\'t splash \'em!']],
  how:'Aim at the cardboard cutouts with a red bullseye and squirt them. Don\'t splash the neighbors with the green check. Reload when the tank runs dry.',keys:KEYS_SHOOT},
 {id:'l5',name:'Rush Hour',kind:'Traffic duty',make:TrafficGame,cfg:{goal:30},
  story:[['Duncan','The stoplight at Main and Water Street is busted. Some umbrella poked it, no doubt.'],['Duncan','Guess I\'m the stoplight today. Whistle ready!'],['Duncan','Keep the cars movin\'. And when an ambulance comes, wave it right on through!']],
  how:'Swipe or press SWITCH to change which road goes. Don\'t make drivers wait too long, and never make the ambulance wait!',keys:['<b>Touch:</b> swipe ← → for the side road, ↑ ↓ for the main road, or press SWITCH.','<b>Keys:</b> Space switches, or ← → for the side road and ↑ ↓ for the main road.','<b>Gamepad:</b> A switches, or push the stick the way you want traffic to go.']},
 {id:'l6',name:'Night Run',kind:'Jeep driving',make:DriveGame,cfg:{escort:'amb',dist:10000,speed:275,stubborn:0.2,umbs:0.2,gap:[150,250],night:true},
  story:[['Dispatch','Constable, the ambulance is takin\' a patient to the hospital. Rain\'s comin\' down hard!'],['Duncan','Then nobody gets in that ambulance\'s way. Not on my watch.']],
  how:'Lead the ambulance through the rainy night. Siren or ram the cars aside, and flatten the umbrellas on the road!',keys:KEYS_DRIVE},
 {id:'l7',name:'Kitty Rescue',kind:'Park rescue',make:CatGame,cfg:{goal:10},
  story:[['Granny','Constable! The umbrellas spooked all the kitties up into the big oak!'],['Duncan','Don\'t you worry, ma\'am. I brought my good blanket.'],['Duncan','When a kitty wiggles, it\'s about to jump. Get under it!']],
  how:'Move under the kitties and catch them in the blanket. Don\'t miss three!',keys:['<b>Touch:</b> swipe &amp; hold anywhere to move. DIVE dashes, JUMP hops.','<b>Keys:</b> ← → move, Shift runs, Space dive, ↑ jump.','<b>Gamepad:</b> stick moves, A dive, B jump.']},
 {id:'d1',name:'Code 3: Oak Street',kind:'Jeep driving',make:DriveGame,cfg:{escort:'fire',dist:10000,speed:270,stubborn:0.18,umbs:0.16,gap:[160,260]},
  story:[['Dispatch','Constable! Smoke over on Oak Street. Second fire this week!'],['Duncan','That firebug again, I\'d bet my bagpipes on it.'],['Duncan','More traffic today, and more stubborn red cars. Siren \'em or ram \'em. That fire truck does NOT stop!']],
  how:'Lead the fire truck to Oak Street. Siren the cars out of the way or ram the stubborn ones off the road.',keys:KEYS_DRIVE},
 {id:'f1',name:'Oak Street Blaze',kind:'Fire rescue',make:FireGame,cfg:{goal:14,grow:0.085,ig0:3.0,startW:[0,4],toast:'Hoses first, Constable!'},
  story:[['Fire Chief','Duncan! This one\'s bigger than Elm Street. Same drill, run the hoses!'],['Duncan','Hydrant first, then the crew. Then we soak every window.'],['Fire Chief','Watch it! These flames grow quicker. Don\'t let \'em spread!']],
  how:'Run the hoses to the hydrant and the crew, then aim the water into the burning windows. Put out 14 fires.',keys:['<b>Touch:</b> swipe &amp; hold to walk Duncan with the hose, press HOOK UP at the hydrant and the crew. Then swipe &amp; hold to aim the water, hold SPRAY to spray.','<b>Keys:</b> ← → walk, Space hook up, then arrows aim and Space sprays.','<b>Gamepad:</b> stick walk, A hook up, then stick aims the water.']},
 {id:'b1',name:'Flood Rescue',kind:'Boat rescue',make:FloodGame,cfg:{towDist:5200,cap:3,par:100,logs:3},
  story:[['Dispatch','Constable! The creek jumped its banks down by the lake. Folks are stuck on their roofs!'],['Duncan','Then hitch up the inflatable boat. The Jeep\'s towin\' it!'],['Duncan','Get the boat to the flood first. Then steer up next to folks, press RESCUE, and bring \'em to the shore. Three at a time, and watch for floatin\' logs!']],
  how:'Tow the boat with the Jeep to the flood. Then steer the boat next to stranded folks, press RESCUE, and bring them back to the shore.',keys:['<b>Touch:</b> first drive: swipe &amp; hold to steer the Jeep, SIREN clears the road, BOOST rams. Then in the boat: swipe &amp; hold any way to steer, RESCUE picks people up, BOOST speeds up.','<b>Keys:</b> arrows steer, Space siren / rescue, K boost.','<b>Gamepad:</b> stick steers, A siren / rescue, B boost.']},
 {id:'p1',name:'Park Patrol',kind:'On foot',make:SideGame,cfg:{bg:'park',gy:0.88,len:3100,hearts:3,toast:'Patrol the park!',endSign:'Park Gate →',umbSp:46,umbWind:0.75,
   spawns:[{t:'granny',x:360},{t:'umb',x:620},{t:'antifa',x:860},{t:'umb',x:1100},{t:'kid',x:1320,momdx:260},{t:'commie',x:1700},{t:'umb',x:1940},{t:'antifa',x:2180},{t:'farmer',x:2400},{t:'umb',x:2620},{t:'commie',x:2860}]},
  story:[['Duncan','The floodwater\'s goin\' down. Time to check on the park.'],['Duncan','Umbrellas love a soggy day. And I see Antifa and commies hidin\' behind the big oak.'],['Duncan','Help the neighbors, bust the troublemakers, and make it to the park gate!']],
  how:'Walk through the park. Bust umbrellas, Antifa and commies, and help the neighbors who need you.',keys:KEYS_SIDE},
 {id:'s2',name:'Fair Night Squirt Gallery',kind:'Shooting',make:ShootGame,cfg:{bg:'square',gy:0.83,dim:'rgba(10,8,40,.28)',goal:18,move:true,life:2.4,rate:1.0,rateMin:0.5,goodP:0.3,maxUp:5,par:75,toast:'Moving targets! Watch for neighbors!'},
  story:[['Mayor','Constable! The county fair\'s in town, and the squirt gallery needs a champion.'],['Duncan','Moving targets, eh? I\'ve chased faster umbrellas than these.'],['Duncan','Same rules. Red bullseye gets soaked. Green check is a neighbor. Don\'t splash Granny!']],
  how:'The cutouts slide back and forth now. Soak 18 bad guys with a red bullseye and keep the neighbors dry.',keys:KEYS_SHOOT},
 {id:'f2',name:'Night Blaze',kind:'Fire rescue',make:FireGame,cfg:{goal:16,night:true,grow:0.09,ig0:2.8,igMin:1.5,startW:[2,6],toast:'Night fire! Run the hose!'},
  story:[['Dispatch','Constable, a fire\'s broke out on Water Street. In the middle of the night!'],['Duncan','I was just about to get my beauty sleep. Let\'s go!'],['Fire Chief','It\'s dark and it\'s spreadin\' fast. Hoses, then water, quick as you can!']],
  how:'Run the hoses, then put out 16 fires in the dark before they spread.',keys:['<b>Touch:</b> swipe &amp; hold to walk Duncan with the hose, press HOOK UP at the hydrant and the crew. Then swipe &amp; hold to aim the water, hold SPRAY to spray.','<b>Keys:</b> ← → walk, Space hook up, then arrows aim and Space sprays.','<b>Gamepad:</b> stick walk, A hook up, then stick aims the water.']},
 {id:'d2',name:'Five-Alarm Run',kind:'Jeep driving',make:DriveGame,cfg:{escort:'fire',dist:12000,speed:285,stubborn:0.22,umbs:0.2,gap:[140,240],night:true},
  story:[['Dispatch','All units! FIVE ALARMS at the old mill! Every truck in the county is rollin\'!'],['Duncan','Rain, dark, and traffic. Of course.'],['Duncan','Longest run yet. Keep that fire truck movin\' and don\'t you let it get stuck!']],
  how:'The longest drive yet, at night in the rain. Clear the road so the fire truck never gets stuck.',keys:KEYS_DRIVE},
 {id:'f3',name:'The Big One',kind:'Fire rescue',make:FireGame,cfg:{goal:20,grow:0.1,spreadT:5,maxBurn:5,ig0:2.6,igMin:1.3,startW:[1,3],toast:'Windy! Fires spread fast!'},
  story:[['Fire Chief','This is the big one, Duncan. The wind\'s pushin\' the flames from window to window!'],['Duncan','Then we push back harder. Run the hoses!'],['Duncan','And that fella with the gas can... I KNOW I saw a scooter parked out back.']],
  how:'The wind spreads fire fast. Run the hoses, then put out 20 fires. Hit the biggest flames first!',keys:['<b>Touch:</b> swipe &amp; hold to walk Duncan with the hose, press HOOK UP at the hydrant and the crew. Then swipe &amp; hold to aim the water, hold SPRAY to spray.','<b>Keys:</b> ← → walk, Space hook up, then arrows aim and Space sprays.','<b>Gamepad:</b> stick walk, A hook up, then stick aims the water.']},
 {id:'l8',name:'Catch the Firebug',kind:'Jeep chase',make:DriveGame,cfg:{chase:true,speed:290,stubborn:0.1,umbs:0.1,gap:[190,300]},
  story:[['Duncan','There he is! The firebug, on a little scooter, with a brand new gas can!'],['Duncan','Bump that scooter three times and he\'s done. Hang on to your sporran!']],
  how:'Chase the firebug\'s scooter. Bump it three times to stop him. Cars in the way will slow you down.',keys:KEYS_DRIVE},
 {id:'l9',name:'The Great Umbrella',kind:'Boss',make:SideGame,cfg:{bg:'square',gy:0.83,len:900,hearts:5,rain:true,spawns:[{t:'boss',x:640}],dim:'rgba(10,8,30,.15)'},
  story:[['Duncan','The firebug talked. All the trouble comes from one place: the town square.'],['Duncan','The biggest umbrella anybody ever saw. The Great Umbrella!'],['Duncan','When it pops open, a big gust rolls along the ground. Jump over it! Then while it\'s stuck open and dizzy, run in and strap it shut. Four straps!']],
  how:'Jump over the gusts when the Great Umbrella pops open. While it\'s dizzy, run in and bust it. Four times!',keys:KEYS_SIDE},
];
const ENDING_STORY=[['Mayor','Constable Duncan! The Great Umbrella is folded, the firebug is locked up, and the kitties are home safe, and everybody\'s dry after the flood.'],['Mayor','On behalf of Flemingsburg: thank you. And thank you, Hope.'],['Hope','I will keep a few steps behind, Constable. Or in front, when you SWAP.'],['Duncan','Just doin\' my job. Now... anybody seen my bagpipes?'],['Duncan','THE END. Thanks for playin\'!']];
/* ================= TITLE ================= */
function drawTitle(){const img=G.img.cover;cx.save();cx.filter='blur(14px) brightness(0.45)';const sc=Math.max(G.W/img.width,G.H/img.height)*1.1;cx.drawImage(img,(G.W-img.width*sc)/2,(G.H-img.height*sc)/2,img.width*sc,img.height*sc);cx.restore();
 const b=$('titleBtns').getBoundingClientRect();let R;if(G.land)R={x:10,y:10,w:b.left-24,h:G.H-20};else R={x:8,y:8,w:G.W-16,h:b.top-20};
 const s=Math.min(R.w/img.width,R.h/img.height),w=img.width*s,h=img.height*s,x=R.x+(R.w-w)/2,y=R.y+(R.h-h)/2;G.coverRect={x,y,w,h};
 cx.save();cx.shadowColor='rgba(255,200,60,'+(0.45+0.25*Math.sin(G.t*2))+')';cx.shadowBlur=24;cx.fillStyle='#ffd23f';rr(cx,x-4,y-4,w+8,h+8,14);cx.fill();cx.restore();
 cx.save();rr(cx,x,y,w,h,10);cx.clip();cx.drawImage(img,x,y,w,h);
 const lx=x+w*0.66,ly=y+h*0.395,ph=Math.floor(G.t*5)%2;cx.globalCompositeOperation='lighter';const gr=cx.createRadialGradient(lx,ly,1,lx,ly,w*0.12);gr.addColorStop(0,ph?'rgba(255,40,40,.5)':'rgba(40,90,255,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gr;cx.fillRect(x,y,w,h);cx.restore()}
/* ================= LOOP ================= */
let last=performance.now(),hudTxt='';
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;G.t+=dt;pollPad();padSync();
 cx.setTransform(G.dpr,0,0,G.dpr,0,0);
 if(G.mode==='title'||G.mode==='levels'||G.mode==='loading'){if(G.img.cover&&G.img.cover.complete&&G.img.cover.naturalWidth)drawTitle();else{cx.fillStyle='#1b1226';cx.fillRect(0,0,G.W,G.H)}}
 else if(G.game){const g=G.game;try{if(G.mode==='play'&&!G.paused){g.update(dt);if(g.d&&typeof g.d.x==='number')updatePartner(g.d,dt,g.gap||null)}else if(g.update2)g.update2(dt);cx.setTransform(G.dpr,0,0,G.dpr,0,0);g.draw()}catch(e){console.error(e);throw e}
  if(G.mode==='play'&&$('bSwap')&&$('bSwap').textContent!=='SWAP')$('bSwap').textContent='SWAP';
  if(G.mode==='play'&&g.hud){const t=g.hud();if(t!==hudTxt){hudTxt=t;$('hudInfo').textContent=t}}}
 requestAnimationFrame(frame)}
IMGS.hope=makeHopeFace();
loadAll(()=>{goTitle();requestAnimationFrame(frame)});
/* QA / debug hooks */
window.__cd={TOUCH,VIRT,G,LV,startLevel,finish,goTitle,doSwap,RD,RH,RP,pose,stepGait,mkGait,cadence};
