/* Constable Duncan of Flemingsburg (Oct 2026).
   One canvas, DOM menus. Touch, keyboard and gamepad (no on-screen D-pad). All art drawn in code except the painted backgrounds. */
'use strict';
const $=i=>document.getElementById(i);
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],TAU=Math.PI*2;
const cv=$('cv'),cx=cv.getContext('2d');
const G={W:0,H:0,dpr:1,land:false,mode:'loading',lv:0,game:null,keys:{},pad:{ax:0,ay:0,btn:{},prev:{}},ptr:new Map(),paused:false,t:0,img:{},auto:false,
 stars:(()=>{try{return JSON.parse(localStorage.getItem('pa-test-ha_stars')||'{}')}catch(e){return{}}})()};
function saveStars(){try{localStorage.setItem('pa-test-ha_stars',JSON.stringify(G.stars))}catch(e){}}
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
 try{on=localStorage.getItem('pa-test-ha_sound')!=='0'}catch(e){}
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
 function set(v){on=v;try{localStorage.setItem('pa-test-ha_sound',v?'1':'0')}catch(e){}if(master)master.gain.value=v?0.9:0}
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
function clearInput(){TOUCH.clear();VIRT.jump=VIRT.act=VIRT.swap=0;G.keys={};document.querySelectorAll('#pad .big.on').forEach(b=>b.classList.remove('on'))}
function held(){return null}
function bindBtn(el,k){const on=e=>{e.preventDefault();e.stopPropagation();Sound.unlock();if(!playing())return;if(!VIRT[k]){const g=G.game;if(k==='jump'&&g.jump)g.jump();if(k==='act'&&g.act)g.act();if(k==='swap'&&g.swap)g.swap()}VIRT[k]=1;el.classList.add('on')},
 off=e=>{e.preventDefault();VIRT[k]=0;el.classList.remove('on')};
 el.addEventListener('pointerdown',on,{passive:false});el.addEventListener('pointerup',off,{passive:false});el.addEventListener('pointercancel',off);el.addEventListener('pointerleave',off);el.addEventListener('contextmenu',e=>e.preventDefault())}
bindBtn($('bJump'),'jump');bindBtn($('bAct'),'act');bindBtn($('bSwap'),'swap');
function touchX(){let v=0;for(const t of TOUCH.values()){if(t.z.L)v-=1;if(t.z.R)v+=1}return clamp(v,-1,1)}
function touchY(){let v=0;for(const t of TOUCH.values()){if(t.z.U)v-=1;if(t.z.D)v+=1}return clamp(v,-1,1)}
/* a long swipe (finger well away from where it went down) runs */
function touchRun(){for(const t of TOUCH.values())if(Math.abs(t.x-t.ox)>80)return true;return false}
function actHeld(){const k=G.keys;return !!(VIRT.act||k.Space||k.Enter||k.KeyJ||G.pad.btn.a)}
/* pad layout: copied from Hair Mob's layoutPad (portrait panel = bottom 38%, ACTION outer-right, JUMP inside it and higher) */
function padOn(){return G.mode==='play'||G.mode==='result'}
function layoutPad(){const pad=$('pad'),ba=$('bAct'),bj=$('bJump'),bs=$('bSwap'),hint=$('swipeHint'),SB=8;
 const place=(el,w,side,off,bot)=>{el.style.width=w+'px';el.style.height=w+'px';el.style.bottom=bot+'px';if(side==='right'){el.style.left='';el.style.right=off+'px'}else{el.style.right='';el.style.left=off+'px'}};
 if(!G.land){const top=G.H,ph=G.FH-top;pad.style.top=top+'px';pad.style.height=ph+'px';
  const big=Math.round(clamp(ph*0.36,92,124)),sm=Math.round(big*0.84),bot=Math.round(clamp(ph*0.14,18,46))+SB;
  /* same NES pair as the original: ACTION left of JUMP, both the same size, on the right. SWAP is the extra team button on the left. */
  place(bj,sm,'right',16,bot);place(ba,sm,'right',16+sm+18,bot);place(bs,sm,'left',16,bot);
  bj.style.setProperty('font-size',Math.round(Math.min(25,sm*0.27))+'px','important');ba.style.setProperty('font-size',Math.round(Math.min(18,sm*0.19))+'px','important');bs.style.setProperty('font-size',Math.round(Math.min(18,sm*0.19))+'px','important');
  hint.style.display='';Object.assign(hint.style,{top:'12px',left:'14px',right:'14px'})}
 else{pad.style.top='0';pad.style.height=G.H+'px';const big=Math.round(clamp(G.H*0.21,72,96)),sm=Math.round(big*0.82);
  place(bj,sm,'right',14,12);place(ba,sm,'right',14+sm+16,12);place(bs,sm,'left',14,12);
  bj.style.setProperty('font-size',Math.round(Math.min(25,sm*0.27))+'px','important');ba.style.setProperty('font-size',Math.round(Math.min(18,sm*0.19))+'px','important');bs.style.setProperty('font-size',Math.round(Math.min(18,sm*0.19))+'px','important');
  hint.style.display='none'}}
let padLbl='';
function padSync(){const pad=$('pad'),vis=G.mode==='play'&&!G.paused&&!!G.game;if(pad.hidden===vis)pad.hidden=!vis;document.body.classList.toggle('padmode',padOn()&&!G.land);
 if(!vis||!G.game)return;const g=G.game,b=(g.btns&&g.btns())||['JUMP','ACTION'],key=b.join('|');if(key===padLbl)return;padLbl=key;
 const bj=$('bJump'),ba=$('bAct'),lb=(e,t,d)=>{const dim=!t||t[0]==='~';e.textContent=(t||d).replace('~','');e.classList.toggle('dim',dim)};lb(bj,b[0],'JUMP');lb(ba,b[1],'ACTION');$('swipeHint').innerHTML=(g.hint&&g.hint())||'SWIPE &amp; HOLD ANYWHERE TO MOVE<br>SWIPE UP TO JUMP'}
addEventListener('keydown',e=>{Sound.unlock();const was=G.keys[e.code];G.keys[e.code]=true;if(was)return;
 if(G.mode==='play'){if(e.code==='Escape'||e.code==='KeyP'){togglePause();return}if(G.paused)return;const g=G.game;if(!g)return;
  if((e.code==='Space'||e.code==='Enter'||e.code==='KeyJ')&&g.act){g.act();e.preventDefault()}
  if((e.code==='KeyK'||((e.code==='ArrowUp'||e.code==='KeyW')&&g.swipeJump!==false))&&g.jump){g.jump();e.preventDefault()}
  if((e.code==='KeyC'||e.code==='KeyQ')&&g.swap){g.swap();e.preventDefault()}
  const pick={Digit1:'duncan',Digit2:'hope',Digit3:'lumina',Digit4:'aria',Digit5:'faith',Digit6:'valora'}[e.code];
  if(pick&&g.swapTo){g.swapTo(pick);e.preventDefault()}
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
 pd.btn={a:b(0),b:b(1),x:b(2),y:b(3),rb:b(5),start:b(9),up:b(12),down:b(13),left:b(14),right:b(15)};const E=n=>pd.btn[n]&&!pd.prev[n];
 if(Object.keys(pd.btn).some(E))Sound.unlock();
 if(G.mode==='play'){if(E('start')){togglePause();return}if(G.paused){menuNav(E);return}const g=G.game;if(!g)return;
  if(E('a')&&g.act)g.act();if((E('b')||E('y'))&&g.jump)g.jump();if(E('b')&&!g.jump&&g.act)g.act();if(E('x')&&g.swap)g.swap()}
 else menuNav(E)}
function menuNav(E){const bs=[...document.querySelectorAll('#ui button')].filter(b=>b.offsetParent!==null);if(!bs.length)return;let i=bs.indexOf(document.activeElement);
 const st=G.pad.ay>0.6||G.pad.ax>0.6?1:G.pad.ay<-0.6||G.pad.ax<-0.6?-1:0;const mv=(E('down')||E('right'))?1:(E('up')||E('left'))?-1:(st&&!G._nav)?st:0;G._nav=!!st;
 if(mv){i=i<0?0:(i+mv+bs.length)%bs.length;bs[i].focus()}if(E('a')||E('start'))(i>=0?bs[i]:bs[0]).click();if(E('b')){const sk=$('bSkip');if(sk.offsetParent)sk.click()}}
/* ---------------- screens (same menus as Constable Duncan) ---------------- */
const SCREENS=['loading','title','levels','story','howto','pause','result'];
function show(id){for(const s of SCREENS)$(s).hidden=s!==id;$('hud').hidden=!(id==='pause'||G.mode==='play');const f=$(id)&&$(id).querySelector('button.big,button');if(f&&!('ontouchstart' in window))setTimeout(()=>f.focus(),30)}
function setMode(m,scr){const was=padOn();G.mode=m;if(was!==padOn())resize();show(scr||m)}
function goTitle(){G.game=null;G.paused=false;setMode('title');Sound.startMusic()}
function goLevels(){const L=$('lvList');L.innerHTML='';LV.forEach((l,i)=>{const b=document.createElement('button');const st=G.stars[l.id]||0;
  b.innerHTML=`${i+1}. ${l.name}<small>${l.kind}</small><span class="st">${'★'.repeat(st)}${'☆'.repeat(3-st)}</span>`;b.onclick=()=>{Sound.play('click');startLevel(i)};L.appendChild(b)});setMode('levels')}
let story=null;
function startStory(lines,done,scene){story={lines,i:0,done};G.storyScene=scene||null;setMode('story');showLine()}
function showLine(){const [who,t]=story.lines[story.i];$('spk').textContent=who;$('txt').textContent=t;$('portrait').src=who==='Duncan'?IMGS.face:IMGS.emblem;
 $('bNext').innerHTML=story.i<story.lines.length-1?'Next &#9654;':'OK &#9654;'}
$('bNext').onclick=()=>{Sound.play('click');if(!story)return;story.i++;if(story.i>=story.lines.length){const d=story.done;story=null;d()}else showLine()};
$('bSkip').onclick=()=>{Sound.play('click');if(!story)return;const d=story.done;story=null;d()};
function startLevel(i){G.lv=i;G.paused=false;const L=LV[i];G.game=L.make(L.cfg||{});G.game.lvl=L;startStory(L.story,()=>howto(i),true)}
function howto(i){const L=LV[i];$('htNum').textContent='Level '+(i+1)+' of '+LV.length+' · '+L.kind;$('htTitle').textContent=L.name;$('htText').textContent=L.how;
 $('htKeys').innerHTML=L.keys.map(k=>'<div>'+k+'</div>').join('');setMode('howto')}
$('bStart').onclick=()=>{Sound.play('click');Sound.unlock();G.paused=false;clearInput();const was=padOn();G.mode='play';if(!was)resize();show('none');$('hud').hidden=false;$('hudLv').textContent='Lv '+(G.lv+1);if(G.game.start)G.game.start()};
$('bPause').onclick=()=>togglePause();
function togglePause(){if(G.mode!=='play')return;G.paused=!G.paused;$('pause').hidden=!G.paused;clearInput();if(G.paused){$('bPSound').textContent='Sound: '+(Sound.isOn()?'On':'Off');Sound.setHiss(0)}}
$('bResume').onclick=()=>togglePause();
$('bRestart').onclick=()=>{$('pause').hidden=true;G.paused=false;const L=LV[G.lv];G.game=L.make(L.cfg||{});G.game.lvl=L;$('bStart').onclick()};
$('bSkipLv').onclick=()=>{$('pause').hidden=true;G.paused=false;Sound.setHiss(0);nextLevel()};
$('bPLevels').onclick=()=>{$('pause').hidden=true;G.paused=false;Sound.setHiss(0);goLevels()};
function sndBtn(b){b.onclick=()=>{Sound.unlock();Sound.set(!Sound.isOn());b.textContent='Sound: '+(Sound.isOn()?'On':'Off')}}
sndBtn($('bSound'));sndBtn($('bPSound'));$('bSound').textContent='Sound: '+(Sound.isOn()?'On':'Off');
$('bPlay').onclick=()=>{Sound.unlock();Sound.play('click');let i=LV.findIndex(l=>!G.stars[l.id]);if(i<0)i=0;startLevel(i)};
$('bLevels').onclick=()=>{Sound.unlock();Sound.play('click');goLevels()};
$('bLvBack').onclick=()=>goTitle();
let lastRes=null,runScore=0;
function finish(win,stars,text){if(G.mode!=='play')return;Sound.setHiss(0);G.mode='result';lastRes={win,stars};const L=LV[G.lv];
 if(win){G.stars[L.id]=Math.max(G.stars[L.id]||0,stars);saveStars();Sound.play('win');runScore+=(G.game&&G.game.bank)||0}else Sound.play('lose');
 $('rsTitle').textContent=win?pick(['Great job, team!','The lane is brighter!','Well done!']):'Up you get. Try again?';
 [...$('rsStars').children].forEach((e,i)=>{e.classList.toggle('on',win&&i<stars)});$('rsStars').hidden=!win;$('rsText').textContent=text||'';
 $('bContinue').innerHTML=win?'Continue &#9654;':'&#8635; Try again';$('bRetry').innerHTML=win?'&#8635; Play again':'Skip level &#9193;';setTimeout(()=>{if(G.mode==='result')show('result')},700)}
$('bContinue').onclick=()=>{Sound.play('click');if(lastRes&&lastRes.win)nextLevel();else startLevel(G.lv)};
$('bRetry').onclick=()=>{Sound.play('click');if(lastRes&&lastRes.win)startLevel(G.lv);else nextLevel()};
function nextLevel(){if(G.lv+1<LV.length)startLevel(G.lv+1);else{G.game=null;startStory(ENDING_STORY,goTitle,true)}}
/* ---------------- angels, drawn on the same rig as the townspeople ---------------- */
const HERO={
 duncan:{name:'Duncan',verb:'WHISTLE'},
 hope:{name:'Hope',verb:'LASSO'},
 lumina:{name:'Lumina',verb:'LIGHT'},
 aria:{name:'Aria',verb:'WIND'},
 faith:{name:'Faith',verb:'SHIELD'},
 valora:{name:'Valora',verb:'LIFT'}
};
const ORDER=['duncan','hope','lumina','aria','faith','valora'];
function halo(c,x,y,rx,col){c.save();c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.ellipse(x,y,rx,rx*0.32,0,0,TAU);c.stroke();c.restore()}
function drawAngel(c,o,id){const P=pose(o,RD),hy=P.hy,A=ANG[id];o._P=P;
 const leg=(L,far)=>{const col=far?shade(A.pants,0.75):A.pants;
  if(A.dress){segO(c,L.k,L.a,3.2,far?shade(A.skin,0.8):A.skin)}
  else{segO(c,L.h,L.k,5,col);segO(c,L.k,L.a,4.2,col)}
  c.save();c.translate(L.a[0],L.a[1]);c.rotate(L.fr||0);c.fillStyle=far?shade(A.shoe,0.7):A.shoe;
  c.beginPath();c.moveTo(-4.5,-3);c.lineTo(8,-2.5);c.quadraticCurveTo(11,0,10,3.2);c.lineTo(-4.5,3.2);c.closePath();c.fill();c.restore()};
 const arm=(i,far)=>{let {sa,ea}=P.arms[i];
  if(o.ov&&o.ov.t==='cheer'){sa=far?2.5:2.8;ea=0.25}
  if(o.ov&&o.ov.t==='reach'&&!far){sa=1.35;ea=0.15}
  const sh=[0,hy-27],p=armPts(sh,sa,ea,15,14),col=far?shade(A.shirt,0.75):A.shirt,sk=far?shade(A.skin,0.8):A.skin;
  segO(c,sh,p.e,5,A.sleeve?sk:col);segO(c,p.e,p.w,4.2,A.sleeve?sk:col);
  c.fillStyle=sk;c.beginPath();c.arc(p.w[0],p.w[1],3.8,0,TAU);c.fill();return p};
 if(A.wings){c.fillStyle='rgba(255,255,255,.92)';c.strokeStyle='#d5e7f4';c.lineWidth=1;
  [-1,1].forEach(s=>{c.beginPath();c.moveTo(0,hy-20);c.quadraticCurveTo(-34*s,hy-48,-42*s,hy-8);c.quadraticCurveTo(-18*s,hy-4,0,hy-6);c.fill();c.stroke()})}
 if(id==='hope'){c.strokeStyle='#5c331c';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-2,hy-36);c.quadraticCurveTo(-18,hy-10,-14,hy+8);c.stroke();
  c.strokeStyle='#8d552f';c.lineWidth=4;c.beginPath();c.moveTo(-1,hy-36);c.quadraticCurveTo(-16,hy-8,-12,hy+6);c.stroke()}
 arm(1,true);leg(P.legs[1],true);leg(P.legs[0],false);
 c.save();c.translate(0,hy);c.rotate(P.lean);c.translate(0,-hy);
 if(A.dress){c.fillStyle=A.shirt;c.strokeStyle='#1a1018';c.lineWidth=1;c.beginPath();c.moveTo(-11,hy-2);c.lineTo(11,hy-2);c.lineTo(16,hy+22);c.lineTo(-15,hy+22);c.closePath();c.fill();c.stroke();
  if(A.gold){c.strokeStyle=A.gold;c.lineWidth=2.4;c.beginPath();c.moveTo(-15,hy+18);c.lineTo(16,hy+18);c.stroke();c.fillStyle=A.gold;c.fillRect(-2,hy-2,4,24)}}
 c.beginPath();c.moveTo(-10,hy);c.quadraticCurveTo(-13,hy-16,-9,hy-30);c.quadraticCurveTo(0,hy-34,8,hy-30);c.quadraticCurveTo(14,hy-16,11,hy);c.closePath();
 c.fillStyle=A.shirt;c.fill();c.strokeStyle='#1a1018';c.lineWidth=1;c.stroke();
 if(id==='valora'){c.fillStyle='#f2c9a0';c.fillRect(-10,hy-8,21,4)}
 if(id==='faith'){c.strokeStyle='#e6c15a';c.lineWidth=2;c.beginPath();c.moveTo(-10,hy-4);c.lineTo(11,hy-4);c.stroke()}
 const hx=4,hy2=hy-42;
 c.fillStyle=A.skin;c.beginPath();c.ellipse(hx,hy2,9.2,10,0,0,TAU);c.fill();c.strokeStyle='#1a1018';c.lineWidth=0.9;c.stroke();
 c.fillStyle='#1a1010';c.beginPath();c.arc(hx+5,hy2-1,1.15,0,TAU);c.fill();
 if(!A.glass){c.strokeStyle='#a84848';c.lineWidth=1;c.beginPath();c.arc(hx+4,hy2+4,2.4,0.3,1.3);c.stroke()}
 if(A.hair&&!A.cap){c.fillStyle=A.hair;c.beginPath();c.ellipse(hx-2,hy2-2,11,12,0,0,TAU);c.fill();c.fillStyle=A.skin;c.beginPath();c.ellipse(hx+1,hy2,8,9,0,0,TAU);c.fill();
  if(id==='valora'){c.strokeStyle=A.hair;c.lineWidth=4;c.beginPath();c.moveTo(hx-6,hy2-4);c.quadraticCurveTo(hx-10,hy2+10,hx-8,hy2+22);c.stroke()}}
 if(A.glass){c.fillStyle='#14181d';c.beginPath();c.ellipse(hx+6,hy2-1,6.2,3.5,-0.1,0,TAU);c.fill();c.fillStyle='#0c0e12';c.beginPath();c.ellipse(hx+6,hy2-1,4.6,2.4,-0.1,0,TAU);c.fill();c.strokeStyle='#e6edf4';c.lineWidth=1.1;c.stroke()}
 if(A.cap){c.fillStyle=A.cap;c.beginPath();c.ellipse(hx,hy2-8,11,6,0,Math.PI,0);c.fill();c.fillRect(hx-8,hy2-8,20,3.2);c.beginPath();c.moveTo(hx+8,hy2-7);c.lineTo(hx+18,hy2-4);c.lineTo(hx+8,hy2-4);c.fill()}
 if(A.circlet){c.strokeStyle='#e6c15a';c.lineWidth=2;c.beginPath();c.ellipse(hx,hy2-8,9,3,0,Math.PI,0);c.stroke()}
 halo(c,hx-2,hy2-18,A.haloR||13,A.halo);
 c.restore();
 c.save();c.translate(0,hy);c.rotate(P.lean);c.translate(0,-hy);armDraw(c,P,0,hy,A);c.restore()}
function armDraw(c,P,i,hy,A){let {sa,ea}=P.arms[i];const sh=[0,hy-27],p=armPts(sh,sa,ea,15,14);
 segO(c,sh,p.e,5.1,A.shirt);segO(c,p.e,p.w,4.2,A.sleeve?A.skin:A.shirt);c.fillStyle=A.skin;c.beginPath();c.arc(p.w[0],p.w[1],3.8,0,TAU);c.fill()}
const ANG={
 hope:{shirt:'#141414',pants:'#3a6cb8',shoe:'#111',skin:'#ffd3b0',hair:'#6a3b22',cap:'#121212',halo:'#ffe08a',haloR:11,glass:true,sleeve:false},
 lumina:{shirt:'#fff6ea',pants:'#fff6ea',shoe:'#f2d2a8',skin:'#ffe0c2',hair:'#e6c15a',halo:'#fff1a0',haloR:16,dress:true,gold:'#e6b422'},
 aria:{shirt:'#7fd4ee',pants:'#7fd4ee',shoe:'#f7f7f2',skin:'#f3d2b8',hair:'#f7fbff',halo:'#d8fbff',haloR:14,dress:true,wings:true},
 faith:{shirt:'#6d3cb0',pants:'#6d3cb0',shoe:'#2a1a14',skin:'#e8b898',hair:'#3a2418',halo:'#d7c4ff',haloR:14,dress:true,circlet:true},
 valora:{shirt:'#e07058',pants:'#c4543e',shoe:'#6a3418',skin:'#f0c0a0',hair:'#a84828',halo:'#ffb0a0',haloR:13}
};
function hairRope(c,x0,y0,x1,y1){c.save();c.lineCap='round';c.strokeStyle='#3e2416';c.lineWidth=10;c.beginPath();
 for(let i=0;i<=10;i++){const t=i/10,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t+Math.sin(t*Math.PI)*26;(i?c.lineTo(x,y):c.moveTo(x,y))}c.stroke();
 c.strokeStyle='#8d552f';c.lineWidth=6;c.stroke();c.strokeStyle='rgba(232,196,150,.7)';c.lineWidth=2;c.stroke();c.restore()}
/* ---------------- the team adventure, on the original street ---------------- */
function gnd(a,b){return{x0:a,x1:b}}
function AngelGame(cfg){
 const g={F:[],t:0,cam:0,started:false,len:cfg.len,who:'duncan',roster:cfg.roster.slice(),met:!cfg.meet,
  p:{x:cfg.spawn||80,y:0,vy:0,face:1,o:mkGait(),ov:null},
  notes:(cfg.notes||[]).map(n=>Object.assign({got:false},n)),
  walls:(cfg.walls||[]).map(w=>Object.assign({open:false},w)),
  hooks:(cfg.hooks||[]).map(h=>Object.assign({used:false},h)),
  stones:(cfg.stones||[]).map(s=>Object.assign({shown:false},s)),
  leaves:(cfg.leaves||[]).map(l=>Object.assign({gone:false},l)),
  sparks:(cfg.sparks||[]).map(s=>Object.assign({cool:0,asleep:false,dir:s.dir||1},s)),
  plates:(cfg.plates||[]).map(p=>Object.assign({on:false},p)),
  rocks:(cfg.rocks||[]).map(r=>Object.assign({held:false,placed:false},r)),
  sockets:(cfg.sockets||[]).map(s=>Object.assign({filled:false},s)),
  bells:(cfg.bells||[]).map(b=>Object.assign({rung:false},b)),
  grounds:cfg.grounds.map(s=>({x0:s.x0,x1:s.x1})),
  swing:null,pull:null,hold:null,shieldT:0,beamT:0,glideT:0,glideWarm:0,whistleT:0,gustT:0,
  notesGot:0,falls:0,bank:0,introT:0,check:cfg.spawn||80};
 const P=g.p;
 g.view=()=>{const land=G.land;const k=land?G.H*0.235/106:Math.min(G.H*0.2,G.W*0.4)/106;const gY=land?G.H*0.86:G.H*0.85;const bgH=land?G.H*1.03:G.H*0.93;return{k,gY,bgH,vw:G.W/k}};
 g.start=()=>{g.started=true;P.y=0;P.vy=0;P.x=clamp(P.x,30,g.len-40);if(cfg.toast)toast(cfg.toast,1500)};
 function segs(){const s=g.grounds.slice();g.stones.forEach(st=>{if(st.shown)s.push({x0:st.x,x1:st.x+st.w})});return s}
 function supported(x,y){if(y<-8||y>8)return false;return segs().some(s=>x>=s.x0+2&&x<=s.x1-2)}
 function edgeDist(){if(!supported(P.x,P.y))return 999;for(let d=8;d<=160;d+=8)if(!supported(P.x+P.face*d,0))return d;return 999}
 function say(t){toast(t,1200)}
 function openId(id){if(!id)return;g.walls.forEach(w=>{if(w.id===id)w.open=true})}
 function solids(){const list=[];g.walls.forEach(w=>{if(!w.open)list.push(w)});g.leaves.forEach(l=>{if(!l.gone)list.push(l)});g.rocks.forEach(r=>{if(!r.held&&!r.placed)list.push(r)});return list}
 function respawn(){g.falls++;if(g.hold){g.hold.held=false;g.hold.x=g.hold.home;g.hold=null}P.x=g.check;P.y=0;P.vy=0;g.glideT=0;say('Up you get');Sound.play('hurt')}
 g.swapTo=id=>{if(g.roster.indexOf(id)<0){say('Not yet');return}if(g.who===id||g.swing||g.pull)return;if(g.hold){g.hold.held=false;g.hold.x=P.x;g.hold=null}g.shieldT=0;g.glideT=0;g.who=id;Sound.play('click');fxBurst(g.F,P.x,-70,12,'star',120,0.6,4,80)};
 g.swap=()=>{const have=ORDER.filter(id=>g.roster.indexOf(id)>=0);const i=Math.max(0,have.indexOf(g.who));g.swapTo(have[(i+1)%have.length])};
 function tryWhistle(){let hit=false;
  g.bells.forEach(b=>{if(!b.rung&&Math.abs(b.x-P.x)<130){b.rung=true;openId(b.opens);hit=true}});
  g.walls.forEach(w=>{if(w.kind==='lock'&&!w.open&&Math.abs(w.x+w.w/2-P.x)<140){w.open=true;hit=true}});
  if(hit){g.whistleT=1;Sound.play('whistle');fxBurst(g.F,P.x,-80,16,'star',160,0.8,4,40);say('The way opens')}
  else say('Stand by the gate')}
 function tryLasso(){let best=null,bd=1e9;
  g.hooks.forEach(h=>{if(h.kind==='swing'||h.used)return;const dx=(h.x-P.x)*P.face,dy=h.y-(-70),d=Math.hypot(dx,dy);if(dx>16&&d<(h.range||240)&&d<bd){best={hook:h,tx:h.x,ty:h.y};bd=d}});
  g.notes.forEach(n=>{if(!n.pull||n.got)return;const dx=(n.x-P.x)*P.face,dy=n.y-(-70),d=Math.hypot(dx,dy);if(dx>16&&d<260&&d<bd){best={note:n,tx:n.x,ty:n.y};bd=d}});
  if(best){g.pull={t:0,dur:0.7,hook:best.hook||null,note:best.note||null,tx:best.tx,ty:best.ty};Sound.play('help');return}
  const sw=g.hooks.find(h=>h.kind==='swing'&&!h.used&&P.x>=h.lip0&&P.x<=h.lip1&&(h.x-P.x)*P.face>0);
  if(sw){g.swing={t:0,dur:1.05,x0:P.x,y0:P.y,x1:sw.land,y1:0,hook:sw};Sound.play('jump');return}
  say(g.hooks.some(h=>h.kind==='swing'&&!h.used)?'Step to the edge':'Nothing to catch')}
 function tryLight(){g.beamT=1.1;let n=0;
  g.stones.forEach(s=>{if(s.shown)return;const dx=(s.x+16-P.x)*P.face;if(dx>-20&&dx<320){s.shown=true;n++;fxBurst(g.F,s.x+s.w/2,-16,8,'star',80,0.7,3,20)}});
  if(n){Sound.play('star');say(n>1?'The path lights up':'A stone appears')}else say('Shine along the dark path')}
 function tryWind(){const leaf=g.leaves.find(l=>!l.gone&&(l.x-P.x)*P.face>-10&&(l.x-P.x)*P.face<180);
  if(leaf){leaf.gone=true;g.gustT=0.7;Sound.play('pop');fxBurst(g.F,leaf.x,-40,18,['#7fbe45','#e0b84a','#fff'],200,0.7,4,80);say('The leaves fly');return}
  if(P.y<-1||edgeDist()<=80){g.glideT=3.2;g.glideWarm=0.36;P.vy=Math.min(P.vy,-320);P.y=Math.min(P.y,-1);g.gustT=0.8;Sound.play('jump');return}
  say('Blow the leaves, or glide from the edge')}
 function tryLift(){if(g.hold){const rock=g.hold;const sock=g.sockets.find(s=>!s.filled&&Math.abs(s.x+s.w/2-P.x)<80);
   rock.held=false;g.hold=null;
   if(sock){sock.filled=true;rock.placed=true;rock.x=sock.x;Sound.play('bust');fxBurst(g.F,sock.x,-10,14,'star',100,0.7,4,40);say('The stone is set')}
   else{rock.x=P.x;say('Set down')}return}
  const rock=g.rocks.find(r=>!r.placed&&!r.held&&Math.abs(r.x+r.w/2-P.x)<96);
  if(!rock){say('Stand by the stone');return}
  rock.held=true;g.hold=rock;P.ov={t:'cheer',tm:0.4};Sound.play('help');say('Up it goes')}
 g.act=()=>{if(!g.started||g.over||g.swing||g.pull||g.introT>0)return;
  if(g.who==='duncan')return tryWhistle();
  if(g.who==='hope')return tryLasso();
  if(g.who==='lumina')return tryLight();
  if(g.who==='aria')return tryWind();
  if(g.who==='faith'){g.shieldT=6.4;Sound.play('star');fxBurst(g.F,P.x+P.face*20,-50,14,'star',140,0.7,4,20);say('The shield holds');return}
  if(g.who==='valora')return tryLift()};
 g.jump=()=>{if(!g.started||g.over||g.swing||g.pull||g.introT>0||g.hold)return;if(P.y>=-0.5&&supported(P.x,P.y)){P.vy=-340;P.y=-1;Sound.play('jump')}};
 g.btns=()=>['JUMP',HERO[g.who].verb];
 g.hud=()=>HERO[g.who].name+'   ♪ '+g.notesGot+'/3';
 g.update=dt=>{g.t+=dt;if(!g.started||g.over)return;
  if(g.shieldT>0)g.shieldT-=dt;if(g.beamT>0)g.beamT-=dt;if(g.whistleT>0)g.whistleT-=dt;if(g.gustT>0)g.gustT-=dt;
  if(P.ov){P.ov.tm-=dt;if(P.ov.tm<=0)P.ov=null}
  if(cfg.meet&&!g.met&&P.x>=cfg.meet.x){g.met=true;if(g.roster.indexOf(cfg.meet.who)<0)g.roster.push(cfg.meet.who);g.introT=1.15;toast(HERO[cfg.meet.who].name+' is here',1400);Sound.play('help');fxBurst(g.F,P.x,-90,20,'star',180,0.9,5,30)}
  if(g.introT>0){g.introT-=dt;fxStep(g.F,dt);return}
  if(g.swing){const s=g.swing;s.t+=dt;const u=Math.min(1,s.t/s.dur),e=u*u*(3-2*u);P.x=s.x0+(s.x1-s.x0)*e;P.y=s.y0+(s.y1-s.y0)*e-Math.sin(Math.PI*e)*100;P.vy=0;
   if(u>=1){P.x=s.x1;P.y=0;P.vy=0;s.hook.used=true;g.swing=null;g.check=P.x;fxBurst(g.F,P.x,-30,12,'star',120,0.6,4,40)}fxStep(g.F,dt);g.cam=clamp(P.x-g.view().vw*(G.land?0.38:0.33),0,Math.max(0,g.len-g.view().vw));return}
  if(g.pull){g.pull.t+=dt;if(g.pull.t>=g.pull.dur){const q=g.pull;if(q.hook){q.hook.used=true;if(q.hook.opens)openId(q.hook.opens);Sound.play('bust')}if(q.note&&!q.note.got){q.note.got=true;g.notesGot++;Sound.play('star')}g.pull=null}fxStep(g.F,dt);return}
  let dir=0,run=false;const ax=axisX();if(Math.abs(ax)>0.2){dir=Math.sign(ax);run=runHeld(dir)}
  if(g.glideT>0){g.glideT-=dt;g.glideWarm-=dt;dir=P.face;run=true}
  const sp=g.glideT>0?240:(g.shieldT>0?150:(g.hold?120:(run?RD.vr:RD.vw)));
  let vx=dir*(g.glideT>0?240:sp);if(dir)P.face=dir;
  let nx=P.x+vx*dt;
  for(const w of solids()){if(!(P.y>-w.h))continue;const L=w.x,R=w.x+w.w;if(nx+16>L&&nx-16<R){nx=P.x<=L?L-17:R+17;vx=0}}
  const x0=P.x;P.x=clamp(nx,16,g.len-16);
  if(P.y<0||P.vy<0||!supported(P.x,0)){P.vy+=900*dt;if(g.glideT>0&&g.glideWarm<=0&&P.vy>22)P.vy=22;P.y+=P.vy*dt;
   if(P.y>=0&&supported(P.x,0)&&P.vy>=0){P.y=0;P.vy=0;g.glideT=0}}
  else{P.y=0;P.vy=0}
  if(P.y>140)respawn();
  if(P.y>=-0.5&&supported(P.x,0))g.check=P.x;
  P.o.ov=P.ov;stepGait(P.o,P.x-x0,dt,RD,P.y>=-0.5);
  if(g.hold){g.hold.x=P.x-10;g.hold.y=-118}
  g.sparks.forEach(s=>{if(s.asleep)return;if(s.cool>0){s.cool-=dt;return}s.x+=s.dir*70*dt;if(s.x>s.x1){s.x=s.x1;s.dir=-1}if(s.x<s.x0){s.x=s.x0;s.dir=1}
   if(Math.abs(s.x-P.x)<28&&P.y>-70){if(g.shieldT>0){s.cool=2;fxBurst(g.F,s.x,-40,8,'star',80,0.4,3,20)}else{P.x=s.home;P.vy=0;say('The shield turns those aside')}}});
  g.plates.forEach(p=>{if(p.on||P.y<-1)return;if(Math.abs(P.x-(p.x+p.w/2))<34){p.on=true;g.sparks.forEach(s=>s.asleep=true);Sound.play('help');fxBurst(g.F,p.x,-8,10,'star',80,0.5,3,10)}});
  const cy=P.y-48;g.notes.forEach(n=>{if(n.got||n.pull)return;const r=n.r||42;if((n.x-P.x)**2+(n.y-cy)**2<r*r){n.got=true;g.notesGot++;Sound.play('star');fxBurst(g.F,n.x,n.y,8,'star',90,0.5,3,20)}});
  g.cam=clamp(P.x-g.view().vw*(G.land?0.38:0.33),0,Math.max(0,g.len-g.view().vw));
  fxStep(g.F,dt);
  if(!g.done&&P.y>=-1&&P.x>=cfg.goal&&g.walls.every(w=>w.open||w.x>=cfg.goal)){g.done=true;g.over=true;
   const notes=g.notesGot,stars=notes>=3?3:notes>=2?2:1,bonus=Math.max(0,Math.round((cfg.par-g.t)*4));
   g.bank=Math.max(0,400+notes*100+bonus-g.falls*20);
   setTimeout(()=>finish(true,stars,'Hymn notes '+notes+'/3. Score '+g.bank+'.'),500)}};
 g.draw=()=>{const V=g.view(),k=V.k,img=G.img[cfg.bg];drawTiledBG(img,cfg.gy,V.gY,V.bgH,g.cam*k,cfg.dim);
  cx.save();cx.translate(-g.cam*k,V.gY);cx.scale(k,k);
  const gs=g.grounds.slice().sort((a,b)=>a.x0-b.x0);
  for(let i=0;i<gs.length-1;i++){if(gs[i+1].x0>gs[i].x1+8){const wide=gs[i+1].x0-gs[i].x1>140;cx.fillStyle=wide?'rgba(12,8,20,.72)':'rgba(40,110,170,.55)';cx.fillRect(gs[i].x1,wide?-20: -8,gs[i+1].x0-gs[i].x1,wide?80:16)}}
  g.stones.forEach(s=>{if(!s.shown){cx.fillStyle='rgba(8,6,20,.62)';cx.fillRect(s.x,-70,s.w,78)}else{cx.fillStyle='rgba(255,236,160,.55)';cx.fillRect(s.x,-6,s.w,8);star5(cx,s.x+s.w/2,-18,6,'#ffe9a0')}});
  g.sockets.forEach(s=>{cx.strokeStyle=s.filled?'#b7e38a':'#ffe08a';cx.lineWidth=3;cx.beginPath();cx.ellipse(s.x+s.w/2,-2,22,8,0,0,TAU);cx.stroke()});
  g.rocks.forEach(r=>{if(r.held)return;cx.fillStyle='#c4a27a';cx.beginPath();cx.ellipse(r.x+r.w/2,r.placed?-16:-28,r.w*0.46,r.placed?16:26,0,0,TAU);cx.fill();cx.strokeStyle='#6a4428';cx.stroke()});
  if(g.hold){cx.fillStyle='#a87848';cx.beginPath();cx.ellipse(P.x+P.face*8,-124,28,18,0,0,TAU);cx.fill();cx.strokeStyle='#3a2414';cx.lineWidth=2;cx.stroke();cx.strokeStyle='#f2d2a0';cx.beginPath();cx.moveTo(P.x+P.face*8,-134);cx.lineTo(P.x+P.face*8,-114);cx.moveTo(P.x+P.face*8-8,-124);cx.lineTo(P.x+P.face*8+8,-124);cx.stroke()}
  g.leaves.forEach(l=>{if(l.gone)return;for(let i=0;i<6;i++){cx.fillStyle=i%2?'#7fbe45':'#e0b84a';cx.beginPath();cx.ellipse(l.x+Math.sin(i)*8,-10-i*8,12,6,0.4,0,TAU);cx.fill()}});
  g.hooks.forEach(h=>{if(h.used&&h.kind==='pull')return;cx.strokeStyle='#8a6230';cx.lineWidth=4;cx.beginPath();cx.moveTo(h.x,0);cx.lineTo(h.x,h.y);cx.stroke();cx.strokeStyle=h.used?'#aaa':'#ffe08a';cx.lineWidth=4;cx.beginPath();cx.arc(h.x,h.y,11,0,TAU);cx.stroke()});
  g.bells.forEach(b=>{cx.strokeStyle='#8a6230';cx.lineWidth=4;cx.beginPath();cx.moveTo(b.x,0);cx.lineTo(b.x,-78);cx.stroke();cx.fillStyle=b.rung?'#fff1a8':'#e6b422';cx.beginPath();cx.moveTo(b.x-12,-78);cx.quadraticCurveTo(b.x,-48,b.x+12,-78);cx.fill()});
  g.plates.forEach(p=>{cx.fillStyle=p.on?'#d7c4ff':'#6a5890';cx.fillRect(p.x,-5,p.w,6)});
  g.walls.forEach(w=>{cx.fillStyle=w.kind==='lock'?'#c9a15a':'#d8d0ea';if(w.open){cx.fillRect(w.x,-18,8,18);cx.fillRect(w.x+w.w-8,-18,8,18);cx.fillRect(w.x,-w.h,w.w,8)}else cx.fillRect(w.x,-w.h,w.w,w.h)});
  g.notes.forEach(n=>{if(n.got)return;star5(cx,n.x,n.y+Math.sin(g.t*3+n.x)*3,8,'#ffd23f')});
  g.sparks.forEach(s=>{if(s.asleep||s.cool>0)return;cx.fillStyle='rgba(186,150,230,.9)';cx.beginPath();cx.ellipse(s.x,-46,16,12,0,0,TAU);cx.fill();cx.fillStyle='#3a2458';cx.beginPath();cx.arc(s.x-4,-48,1.6,0,TAU);cx.arc(s.x+4,-48,1.6,0,TAU);cx.fill()});
  const ex=cfg.goal;cx.fillStyle='#5a3a20';cx.fillRect(ex-2,-70,4,70);cx.fillStyle='#2a6a3a';cx.strokeStyle='#fff';cx.lineWidth=1.5;cx.beginPath();if(cx.roundRect)cx.roundRect(ex-34,-92,68,26,4);else cx.rect(ex-34,-92,68,26);cx.fill();cx.stroke();
  cx.fillStyle='#fff';cx.font='12px Lilita,system-ui';cx.textAlign='center';cx.fillText(cfg.endSign||'Chapel',ex,-74);
  if(g.who==='hope'&&(g.swing||g.pull)){const tx=g.swing?g.swing.hook.x:g.pull.tx,ty=g.swing?g.swing.hook.y:g.pull.ty;hairRope(cx,P.x-P.face*6,P.y-78,tx,ty)}
  else if(g.who==='hope'){const h=g.hooks.find(h=>h.kind==='swing'&&!h.used&&P.x>=h.lip0&&P.x<=h.lip1);if(h){cx.globalAlpha=0.35;hairRope(cx,P.x-P.face*6,-78,h.x,h.y);cx.globalAlpha=1}}
  cx.save();cx.translate(P.x,P.y);cx.scale(P.face||1,1);if(g.who==='duncan')drawDuncan(cx,P.o);else drawAngel(cx,P.o,g.who);cx.restore();
  if(g.beamT>0&&g.who==='lumina'){cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=0.45;cx.fillStyle='#fff1a8';cx.beginPath();cx.moveTo(P.x,P.y-58);cx.lineTo(P.x+P.face*300,-120);cx.lineTo(P.x+P.face*300,10);cx.fill();cx.restore()}
  if(g.shieldT>0&&g.who==='faith'){cx.save();cx.translate(P.x+P.face*34,-48);cx.fillStyle='rgba(214,186,255,.4)';cx.strokeStyle='#ffe08a';cx.lineWidth=4;cx.beginPath();cx.arc(0,0,52,0,TAU);cx.fill();cx.stroke();cx.beginPath();cx.moveTo(0,-22);cx.lineTo(0,24);cx.moveTo(-16,0);cx.lineTo(16,0);cx.stroke();cx.restore()}
  if(g.whistleT>0&&g.who==='duncan'){cx.fillStyle='#fff6c2';cx.font='16px Lilita,system-ui';cx.textAlign='center';for(let i=0;i<3;i++)cx.fillText('♪',P.x+14+i*10,-90-(1-g.whistleT)*30-i*8)}
  fxDraw(cx,g.F,1);
  cx.restore()};
 return g}
const KEYS=['<b>Touch:</b> swipe &amp; hold anywhere to move (a long swipe runs). Swipe up or JUMP. The green button is that hero\'s gift. SWAP changes who leads.','<b>Keys:</b> ← → move, hold to run, ↑ or K jump, J or Space uses the gift, C swaps, 1–6 pick a hero.','<b>Gamepad:</b> stick moves, A uses the gift, B jumps, X swaps.'];
const LV=[
 {id:'garden',name:'The Garden Gate',kind:'On foot',make:AngelGame,cfg:{bg:'street_day',gy:0.87,len:1680,spawn:80,goal:1500,par:50,endSign:'Garden',toast:'The lane is dim!',
   roster:['duncan'],meet:{x:430,who:'hope'},grounds:[gnd(0,560),gnd(900,1180),gnd(1255,1680)],
   walls:[{id:'lock',kind:'lock',x:260,w:34,h:160}],
   hooks:[{id:'ring',kind:'swing',x:960,y:-130,lip0:470,lip1:550,land:980}],
   notes:[{x:150,y:-46},{x:1040,y:-48},{x:1400,y:-42}]},
  story:[['Duncan','Mornin\', Flemingsburg. The lane up to the chapel has gone dim.'],['Duncan','Hope\'s angels are comin\' with me. Each of them has her own gift. I still have my whistle.'],['Hope','My ponytail can catch a ring and swing us across. You whistle the gate, Duncan.']],
  how:'Whistle the brass gate, then swap to Hope and lasso the ring across the gap. Jump the little brook.',keys:KEYS},
 {id:'shadow',name:'The Shadow Walk',kind:'On foot',make:AngelGame,cfg:{bg:'street_dusk',gy:0.83,dim:'rgba(12,8,28,.28)',len:1800,spawn:70,goal:1700,par:55,endSign:'Lanterns',toast:'Light the stones!',
   roster:['duncan','hope'],meet:{x:230,who:'lumina'},grounds:[gnd(0,500),gnd(1020,1800)],
   stones:[{x:470,w:190},{x:640,w:190},{x:820,w:220}],
   hooks:[{id:'lever',kind:'pull',x:1320,y:-170,opens:'door',range:260}],
   walls:[{id:'door',kind:'door',x:1560,w:34,h:160}],
   notes:[{x:140,y:-44},{x:730,y:-46},{x:1400,y:-210,pull:true}]},
  story:[['Lumina','The next stretch is dark. My light shows the hidden stones.'],['Hope','And I can reach the lever none of us can jump to.'],['Duncan','Then we go together. One gift at a time.']],
  how:'Swap to Lumina and light the hidden stones, then cross them. Swap to Hope and lasso the high lever.',keys:KEYS},
 {id:'breeze',name:'The Breezy Bridge',kind:'On foot',make:AngelGame,cfg:{bg:'park',gy:0.88,len:1840,spawn:60,goal:1700,par:55,endSign:'Bell',toast:'A windy day!',
   roster:['duncan','hope','lumina'],meet:{x:160,who:'aria'},grounds:[gnd(0,440),gnd(980,1840)],
   leaves:[{x:250,w:54,h:160}],bells:[{x:1280,opens:'door'}],walls:[{id:'door',kind:'door',x:1540,w:34,h:160}],
   notes:[{x:120,y:-42},{x:700,y:-80,r:70},{x:1400,y:-44}]},
  story:[['Aria','I can blow that leaf pile aside, and my wings will carry us over the wide gap.'],['Duncan','I\'ll whistle the bell on the far side. A run-jump will not reach it.']],
  how:'Swap to Aria. Blow the leaves away, then glide from the edge. Swap back to Duncan and whistle the bell.',keys:KEYS},
 {id:'pebbles',name:'The Pebble Path',kind:'On foot',make:AngelGame,cfg:{bg:'house',gy:0.86,len:1760,spawn:60,goal:1640,par:50,endSign:'Quiet',toast:'Hold the shield!',
   roster:['duncan','hope','lumina','aria'],meet:{x:280,who:'faith'},grounds:[gnd(0,1760)],
   sparks:[{x0:520,x1:980,x:640,home:430,dir:1},{x0:520,x1:980,x:860,home:430,dir:-1}],
   plates:[{x:1020,w:70}],hooks:[{id:'key',kind:'pull',x:1280,y:-175,opens:'door',range:260}],
   walls:[{id:'door',kind:'door',x:1480,w:34,h:160}],
   notes:[{x:150,y:-42},{x:760,y:-48},{x:1360,y:-44}]},
  story:[['Faith','Those little puffs are only worries. My shield walks straight through them.'],['Hope','Past them, a key hangs too high to jump. I\'ll pull it down.']],
  how:'Swap to Faith, raise the shield, and walk through the puffs. Then Hope lassos the high key.',keys:KEYS},
 {id:'stone',name:'The Cornerstone',kind:'On foot',make:AngelGame,cfg:{bg:'square',gy:0.83,len:1960,spawn:60,goal:1820,par:55,endSign:'Square',toast:'Lift the stone!',
   roster:['duncan','hope','lumina','aria','faith'],meet:{x:180,who:'valora'},grounds:[gnd(0,660),gnd(1120,1960)],
   rocks:[{id:'rock',x:340,w:78,h:160,home:340}],sockets:[{x:520,w:74}],
   bells:[{x:1360,opens:'door'}],walls:[{id:'door',kind:'door',x:1620,w:34,h:160}],
   notes:[{x:110,y:-42},{x:560,y:-44},{x:1480,y:-46}]},
  story:[['Valora','That stone is mine to lift. Set it in the ring and the path is clear.'],['Aria','Then I glide the gap, and Duncan whistles us into the square.']],
  how:'Valora lifts the stone onto the glowing ring. Aria glides the gap. Duncan whistles the bell.',keys:KEYS},
 {id:'chapel',name:'Chapel of Hope',kind:'On foot',make:AngelGame,cfg:{bg:'street_dusk',gy:0.83,dim:'rgba(20,12,8,.12)',len:3520,spawn:60,goal:3400,par:110,endSign:'Home',toast:'Every gift!',
   roster:ORDER.slice(),grounds:[gnd(0,520),gnd(880,1240),gnd(1600,1820),gnd(2200,3520)],
   walls:[{id:'lock',kind:'lock',x:220,w:34,h:160},{id:'door',kind:'door',x:3280,w:34,h:160}],
   hooks:[{id:'ring',kind:'swing',x:940,y:-130,lip0:430,lip1:510,land:960}],
   stones:[{x:1200,w:180},{x:1360,w:180},{x:1520,w:160}],
   leaves:[{x:1680,w:54,h:160}],
   sparks:[{x0:2320,x1:2580,x:2400,home:2240,dir:1},{x0:2320,x1:2580,x:2520,home:2240,dir:-1}],
   plates:[{x:2620,w:70}],
   rocks:[{id:'rock',x:2860,w:78,h:160,home:2860}],sockets:[{x:3060,w:74}],
   bells:[{x:3180,opens:'door'}],
   notes:[{x:120,y:-42},{x:1040,y:-46},{x:2460,y:-48}]},
  story:[['Duncan','Chapel hill. The whole team is here.'],['Hope','Whistle, lasso, light, wind, shield, and strength. Then the bell.'],['Lumina','Bring the light home.']],
  how:'Use every gift in turn: whistle, lasso, light, wind, shield, lift, and whistle the bell.',keys:KEYS}
];
const ENDING_STORY=[['Duncan','The lane is bright again. Flemingsburg can see the chapel.'],['Hope','Nobody did it alone. Each gift was needed.'],['Duncan','Just doin\' my job, with good help. Now... anybody seen my bagpipes?'],['Hope','THE END. Thanks for playin\'!']];
function rr(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
/* same title card as Constable Duncan of Flemingsburg */
function drawTitle(){const img=G.img.cover;cx.save();cx.filter='blur(14px) brightness(0.45)';const sc=Math.max(G.W/img.width,G.H/img.height)*1.1;cx.drawImage(img,(G.W-img.width*sc)/2,(G.H-img.height*sc)/2,img.width*sc,img.height*sc);cx.restore();
 const b=$('titleBtns').getBoundingClientRect();let R;if(G.land)R={x:10,y:10,w:b.left-24,h:G.H-20};else R={x:8,y:8,w:G.W-16,h:b.top-20};
 const s=Math.min(R.w/img.width,R.h/img.height),w=img.width*s,h=img.height*s,x=R.x+(R.w-w)/2,y=R.y+(R.h-h)/2;G.coverRect={x,y,w,h};
 cx.save();cx.shadowColor='rgba(255,200,60,'+(0.45+0.25*Math.sin(G.t*2))+')';cx.shadowBlur=24;cx.fillStyle='#ffd23f';rr(cx,x-4,y-4,w+8,h+8,14);cx.fill();cx.restore();
 cx.save();rr(cx,x,y,w,h,10);cx.clip();cx.drawImage(img,x,y,w,h);
 const lx=x+w*0.66,ly=y+h*0.395,ph=Math.floor(G.t*5)%2;cx.globalCompositeOperation='lighter';const gr=cx.createRadialGradient(lx,ly,1,lx,ly,w*0.12);gr.addColorStop(0,ph?'rgba(255,40,40,.5)':'rgba(40,90,255,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gr;cx.fillRect(x,y,w,h);cx.restore()}
let last=performance.now(),hudTxt='';
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;G.t+=dt;pollPad();padSync();
 cx.setTransform(G.dpr,0,0,G.dpr,0,0);
 if(G.mode==='title'||G.mode==='levels'||G.mode==='loading'){if(G.img.cover&&G.img.cover.complete&&G.img.cover.naturalWidth)drawTitle();else{cx.fillStyle='#1b1226';cx.fillRect(0,0,G.W,G.H)}}
 else if(G.game){const g=G.game;try{if(G.mode==='play'&&!G.paused)g.update(dt);else if(g.update2)g.update2(dt);cx.setTransform(G.dpr,0,0,G.dpr,0,0);g.draw()}catch(e){console.error(e);throw e}
  if(G.mode==='play'&&g.hud){const t=g.hud();if(t!==hudTxt){hudTxt=t;$('hudInfo').textContent=t}}}
 requestAnimationFrame(frame)}
loadAll(()=>{goTitle();requestAnimationFrame(frame);});
