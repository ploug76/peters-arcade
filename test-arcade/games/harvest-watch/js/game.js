/* Constable Duncan: The Harvest Watch
   Duncan's rig and face are the original character art. This file does not change the first game. */
'use strict';
const $=i=>document.getElementById(i);
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const cv=$('cv'),cx=cv.getContext('2d');
const G={W:0,H:0,FH:0,dpr:1,land:false,mode:'loading',lv:0,keys:{},pad:{ax:0,ay:0,btn:{},prev:{}},paused:false,t:0,img:{},state:null,parts:{},
 stars:(()=>{try{return JSON.parse(localStorage.getItem('pa-test-cdhw_stars')||'{}')}catch(e){return{}}})(),
 board:(()=>{try{const b=JSON.parse(localStorage.getItem('pa-test-cdhw_board')||'[]');return Array.isArray(b)?b:[]}catch(e){return[]}})(),
 best:(()=>{try{return +localStorage.getItem('pa-test-cdhw_best')||0}catch(e){return 0}})()};
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
LOOK.pastor={skin:'#e0b090',top:'#2c2c40',pants:'#2c2c40',shoe:'#111',head:'bald',glasses:true};
/* ---------------- sound (synthesized, same idea as the first game, new tune) ---------------- */
const Sound=(()=>{let ac=null,master=null,mus=null,on=true,musOn=false,nextT=0,step=0,timer=null;
 try{on=localStorage.getItem('pa-test-cdhw_sound')!=='0'}catch(e){}
 function unlock(){if(ac){if(ac.state==='suspended')ac.resume();return}try{ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=on?0.85:0;master.connect(ac.destination);mus=ac.createGain();mus.gain.value=0.45;mus.connect(master)}catch(e){ac=null}if(musOn)startMusic()}
 function env(g,t,a,d,v){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,v),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)}
 function tone(f,d,type,v,f2){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(1,f2),t+d);env(g,t,0.01,d,v||0.12);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+0.05)}
 let nb=null;function noiseBuf(){if(nb||!ac)return nb;nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return nb}
 function noise(d,v,fq){if(!ac)return;const t=ac.currentTime,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf();f.type='bandpass';f.frequency.value=fq||900;f.Q.value=0.7;env(g,t,0.005,d,v||0.2);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+d+0.05)}
 const S={
  click(){tone(880,0.04,'square',0.05)},
  jump(){tone(320,0.14,'square',0.06,640)},
  whistle(){tone(2400,0.08,'sine',0.1,2800);setTimeout(()=>tone(1800,0.12,'sine',0.06),90)},
  help(){[523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,0.14,'triangle',0.1),i*70))},
  hurt(){tone(280,0.28,'sawtooth',0.1,90)},
  splat(){noise(0.14,0.3,700)},
  pop(){noise(0.12,0.28,500);tone(200,0.16,'sine',0.08,70)},
  bell(){tone(784,0.45,'sine',0.14,622);setTimeout(()=>tone(1174,0.55,'sine',0.06),30)},
  baa(){tone(380,0.16,'triangle',0.08,280);setTimeout(()=>tone(320,0.18,'triangle',0.06),120)},
  win(){[523,659,784,1047,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.18,'square',0.07),i*110))},
  lose(){[392,330,262].forEach((f,i)=>setTimeout(()=>tone(f,0.26,'triangle',0.1),i*180))}
 };
 const N=n=>440*Math.pow(2,(n-69)/12);
 const MEL=[74,0,78,81,78,74, 76,0,74,71,0,69, 74,78,81,83, 81,78,76,0, 74,76,78,74, 71,69,71,74, 69,0,67,69, 62,0,0,0];
 function sched(){if(!ac)return;while(nextT<ac.currentTime+0.25){const n=MEL[step%MEL.length],t=nextT,d=0.2;
  if(n){const o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.type='triangle';o.frequency.value=N(n);f.type='lowpass';f.frequency.value=1800;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.04,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d*1.4);o.connect(f);f.connect(g);g.connect(mus);o.start(t);o.stop(t+d*1.5)}
  if(step%8===0){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=N(50);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.03,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.4);o.connect(g);g.connect(mus);o.start(t);o.stop(t+0.45)}
  nextT+=0.21;step++}}
 function startMusic(){musOn=true;if(!ac||timer)return;nextT=ac.currentTime+0.05;timer=setInterval(sched,80)}
 function set(v){on=v;try{localStorage.setItem('pa-test-cdhw_sound',v?'1':'0')}catch(e){}if(master)master.gain.value=v?0.85:0}
 function play(n){if(on&&S[n]){unlock();try{S[n]()}catch(e){}}}
 return{unlock,play,set,isOn:()=>on,startMusic}})();
/* ---------------- pictures (relative to this volume) ---------------- */
const IMGS={cover:'art/cover.webp',face:'art/face.webp',emblem:'art/emblem.png',street_day:'art/street_day.webp',street_dusk:'art/street_dusk.webp',park:'art/park.webp',house:'art/house.webp',square:'art/square.webp'};
function loadAll(cb){const ks=Object.keys(IMGS);let n=0;ks.forEach(k=>{const im=new Image();im.onload=im.onerror=()=>{n++;const f=$('ldFill');if(f)f.style.width=(n/ks.length*100)+'%';if(n===ks.length)cb()};im.src=IMGS[k];G.img[k]=im})}
function saveStars(){try{localStorage.setItem('pa-test-cdhw_stars',JSON.stringify(G.stars))}catch(e){}}
function saveBoard(){try{localStorage.setItem('pa-test-cdhw_board',JSON.stringify(G.board));localStorage.setItem('pa-test-cdhw_best',String(G.best||0))}catch(e){}}
/* ---------------- effects ---------------- */
const FX=[];
function burst(x,y,n,cols,sp){sp=sp||120;for(let i=0;i<n;i++){const a=Math.random()*TAU,v=sp*(0.4+Math.random()*0.6);FX.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,l:0.6+Math.random()*0.4,l0:0.9,c:cols[i%cols.length],s:2+Math.random()*3})}}
function popText(x,y,t,col){FX.push({x,y,vx:0,vy:-32,l:1.15,l0:1.15,txt:t,c:col||'#ffd23f',s:16})}
function stepFX(dt){for(let i=FX.length-1;i>=0;i--){const p=FX[i];p.l-=dt;if(p.l<=0){FX.splice(i,1);continue}p.vy+=140*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}}
function drawFX(){for(const p of FX){cx.globalAlpha=clamp(p.l/p.l0*1.5,0,1);if(p.txt){cx.font=p.s+'px Lilita,system-ui,sans-serif';cx.textAlign='center';cx.lineWidth=3;cx.strokeStyle='#2a0a05';cx.strokeText(p.txt,p.x,p.y);cx.fillStyle=p.c;cx.fillText(p.txt,p.x,p.y)}else{cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.s,0,TAU);cx.fill()}}cx.globalAlpha=1}
function toast(t,ms){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('on'),ms||1200)}
function drawTiledBG(img,gy,groundY,bgH,camPx){if(!img||!img.naturalWidth){cx.fillStyle='#87b4e0';cx.fillRect(0,0,G.W,G.H);return}const s=bgH/img.height,w=img.width*s,top=groundY-gy*bgH;
 if(top>0)cx.drawImage(img,0,0,img.width,2,0,0,G.W,top+1);
 const i0=Math.floor(camPx/w);for(let i=i0;i*w-camPx<G.W+2;i++){const x=i*w-camPx;if(i%2===0)cx.drawImage(img,x,top,w+0.5,bgH);else{cx.save();cx.translate(x+w,top);cx.scale(-1,1);cx.drawImage(img,-0.5,0,w+0.5,bgH);cx.restore()}}
 const bot=top+bgH;if(bot<G.H)cx.drawImage(img,0,img.height-3,img.width,3,0,bot-1,G.W,G.H-bot+2)}
function rr(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
/* ---------------- harvest props ---------------- */
function drawLoaf(c,x,y,sc){c.save();c.translate(x,y);c.scale(sc||1,sc||1);c.fillStyle='#c9843a';c.beginPath();c.ellipse(0,-8,16,8,0,0,TAU);c.fill();c.fillStyle='#e8b15a';c.beginPath();c.ellipse(0,-11,12,5,0,0,TAU);c.fill();c.strokeStyle='#7a4a18';c.lineWidth=1.2;for(const dx of[-6,0,6]){c.beginPath();c.moveTo(dx,-14);c.lineTo(dx,-8);c.stroke()}c.restore()}
function drawCrow(c,x,y,flap){c.save();c.translate(x,y+Math.sin(flap*10)*2);c.fillStyle='#1c1c22';c.beginPath();c.ellipse(0,-14,13,7,0,0,TAU);c.fill();c.beginPath();c.ellipse(-8,-16,7,3.2,Math.sin(flap*16)*0.8,0,TAU);c.fill();c.beginPath();c.ellipse(4,-16,7,3.2,-Math.sin(flap*16)*0.8,0,TAU);c.fill();c.fillStyle='#f0c24a';c.beginPath();c.moveTo(10,-14);c.lineTo(18,-12);c.lineTo(10,-11);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(6,-18,2.1,0,TAU);c.fill();c.fillStyle='#111';c.beginPath();c.arc(6.7,-18,1,0,TAU);c.fill();c.restore()}
function drawCorn(c,x,ok){c.save();c.translate(x,0);c.fillStyle=ok?'#2f8a3a':'#6a5a32';c.fillRect(-3,-62,6,62);c.fillStyle=ok?'#3aaa48':'#7a6a3a';c.beginPath();c.ellipse(-10,-40,8,16,-0.6,0,TAU);c.fill();c.beginPath();c.ellipse(10,-36,8,16,0.5,0,TAU);c.fill();if(ok){c.fillStyle='#f0d24a';c.beginPath();c.ellipse(0,-48,7,12,0.2,0,TAU);c.fill();c.strokeStyle='#c89820';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-4,-54+i*4);c.lineTo(4,-52+i*4);c.stroke()}}c.restore()}
function drawLamb(c,face,bob){c.save();c.scale(face||1,1);c.translate(0,Math.sin(bob)*1.5);c.fillStyle='#f7f4ee';c.strokeStyle='#c8c0b0';c.lineWidth=1;c.beginPath();c.ellipse(-2,-16,15,10,0,0,TAU);c.fill();c.stroke();c.beginPath();c.ellipse(10,-22,7,6,0,0,TAU);c.fill();c.stroke();c.fillStyle='#f0b0c0';c.beginPath();c.ellipse(6,-28,3,4.2,-0.5,0,TAU);c.fill();c.fillStyle='#222';c.fillRect(-8,-8,3,8);c.fillRect(3,-8,3,8);c.beginPath();c.arc(13,-22,1.3,0,TAU);c.fill();c.fillStyle='#e07080';c.beginPath();c.arc(16,-21,1.4,0,TAU);c.fill();c.restore()}
function drawPen(c,x,w){c.save();c.translate(x,0);c.fillStyle='#c2a05a';c.fillRect(8,-6,w-16,6);c.strokeStyle='#6a4a22';c.lineWidth=3;for(let i=0;i<4;i++){const px=8+i*(w-16)/3;c.beginPath();c.moveTo(px,0);c.lineTo(px,-32);c.stroke()}c.lineWidth=2;c.beginPath();c.moveTo(8,-14);c.lineTo(w-8,-14);c.moveTo(8,-24);c.lineTo(w-8,-24);c.stroke();c.fillStyle='#e6c878';c.font='13px Lilita,system-ui';c.textAlign='center';c.fillText('PEN',w/2,-36);c.restore()}
function drawCart(c,x,n){c.save();c.translate(x,0);c.fillStyle='#6b4428';rr(c,-28,-26,56,22,4);c.fill();c.strokeStyle='#3a2414';c.stroke();c.fillStyle='#8a5a30';c.fillRect(-34,-8,10,8);c.fillRect(24,-8,10,8);c.fillStyle='#222';c.beginPath();c.arc(-22,0,7,0,TAU);c.arc(20,0,7,0,TAU);c.fill();for(let i=0;i<Math.min(4,n);i++)drawLoaf(c,-16+i*11,-24,0.55);c.fillStyle='#ffd23f';c.font='12px Lilita,system-ui';c.textAlign='center';c.fillText('CHAPEL',0,-34);c.restore()}
function drawDish(c,x,y){c.save();c.translate(x,y);c.fillStyle='#f4f0e8';c.beginPath();c.ellipse(0,-4,14,5,0,0,TAU);c.fill();c.strokeStyle='#c8c0b0';c.stroke();c.fillStyle='#d07040';c.beginPath();c.ellipse(0,-8,8,4,0,0,TAU);c.fill();c.fillStyle='#6aaa40';c.beginPath();c.arc(-3,-9,2,0,TAU);c.fill();c.restore()}
function drawTable(c,x0,x1,placed){c.save();const w=x1-x0,x=x0;c.translate(x,0);c.fillStyle='#f7f1e4';c.fillRect(0,-34,w,16);c.strokeStyle='#d8c8a8';c.strokeRect(0,-34,w,16);c.fillStyle='#6a4424';c.fillRect(6,-18,8,18);c.fillRect(w-14,-18,8,18);c.fillStyle='#c9a24a';c.fillRect(w/2-2,-52,4,20);c.fillRect(w/2-8,-48,16,4);for(let i=0;i<placed;i++){drawDish(c,18+i*((w-36)/5),-34)}c.restore()}
function drawPlank(c,p){c.save();c.fillStyle='#6a4224';rr(c,p.x,p.y,p.w,14,3);c.fill();c.strokeStyle='#3e2612';c.lineWidth=1.4;c.stroke();c.fillStyle='#f0d56a';c.fillRect(p.x+4,p.y-8,p.w-8,9);c.fillStyle='#c9962e';for(let x=p.x+8;x<p.x+p.w-8;x+=14)c.fillRect(x,p.y-8,3,9);c.restore()}
function drawBell(c,x,y,t,ring){c.save();c.translate(x,y);c.strokeStyle='#5a3a1c';c.lineWidth=4;c.beginPath();c.moveTo(-18,-8);c.lineTo(-18,-78);c.lineTo(18,-78);c.stroke();c.translate(0,-78);c.rotate(ring?Math.sin(t*16)*0.35:Math.sin(t*1.5)*0.03);c.fillStyle='#d8a84a';c.beginPath();c.moveTo(-4,0);c.lineTo(-16,28);c.quadraticCurveTo(0,36,16,28);c.lineTo(4,0);c.closePath();c.fill();c.strokeStyle='#7a5a18';c.stroke();c.fillStyle='#6a4a10';c.beginPath();c.arc(0,30,3,0,TAU);c.fill();c.restore()}
function drawPigeon(c,x,y,t){c.save();c.translate(x,y);c.scale((Math.sin(t*2)>0?1:-1)*1.35,1.35);c.fillStyle='#d5dbe2';c.beginPath();c.ellipse(0,0,11,6,0,0,TAU);c.fill();c.fillStyle='#8a949e';c.beginPath();c.ellipse(-2,-3,7,3.4,Math.sin(t*9)*0.6,0,TAU);c.fill();c.fillStyle='#444';c.beginPath();c.moveTo(8,-1);c.lineTo(14,-2);c.lineTo(8,2);c.fill();c.fillStyle='#222';c.beginPath();c.arc(4,-4,1.3,0,TAU);c.fill();c.restore()}
function drawPumpkin(c,x){c.save();c.translate(x,0);c.fillStyle='#e07a18';c.beginPath();c.ellipse(0,-10,11,9,0,0,TAU);c.fill();c.strokeStyle='#b85a0c';c.lineWidth=1;c.beginPath();c.moveTo(0,-18);c.lineTo(0,-2);c.stroke();c.fillStyle='#3a8a32';c.fillRect(-2,-22,4,6);c.restore()}
function gaitOf(key){if(!G._gaits)G._gaits={};if(!G._gaits[key])G._gaits[key]=mkGait();return G._gaits[key]}
function drawNpc(key,x,face,look,dt){const o=gaitOf(key);o.ov={t:'wave'};stepGait(o,0,dt,look&&look.kid?RK:RP,true);cx.save();cx.translate(x,0);cx.scale(face||1,1);drawPerson(cx,o,look);cx.restore()}
/* ---------------- levels ---------------- */
function keyHelp(act){return[
 '<b>Touch:</b> swipe and hold anywhere to move. A long swipe runs. Swipe up or press JUMP to jump. The green button is '+act+'.',
 '<b>Keys:</b> arrows or WASD move, Shift runs, Up or K jumps, Space or J is '+act+'.',
 '<b>Gamepad:</b> stick moves, B jumps, A is '+act+'.'
]}
const META=[
 {id:'loaves',name:'Loaves for the Chapel',kind:'Bread run',bg:'street_day',gy:0.87,act:'SHOO',
  story:[['Duncan','Harvest supper is tonight, and the chapel is short on loaves.'],['Duncan','Pick one up and carry it back to Farmer Glen\'s cart. The crows will try to nick it.'],['Duncan','Shoo a crow, or jump it. Four loaves and this street is done.']],
  how:'Carry each loaf to the chapel cart. Shoo the crows or jump over them.',
  done:'Four loaves are on the cart. The chapel ovens can rest.',
  fail:'The crows got the better of the bread run.'},
 {id:'corn',name:'Crows in the Corn',kind:'Cornfield',bg:'park',gy:0.94,act:'SHOO',
  story:[['Duncan','The meadow by the church is full of corn, and full of crows.'],['Duncan','Walk up and shoo them before they finish an ear. Lose three ears and we try again.'],['Duncan','Quick feet. Kind hands.']],
  how:'Shoo six crows. An ear is lost if a crow pecks too long.',
  done:'The corn is still ours. Six crows sent on their way.',
  fail:'Too many ears were lost. The corn can still be saved.'},
 {id:'lambs',name:'The Lost Lambs',kind:'Shepherding',bg:'street_dusk',gy:0.83,act:'WHISTLE',
  story:[['Duncan','Four lambs slipped toward the lane. I am not leaving them there.'],['Duncan','Whistle, then walk them to the pen. A hard run leaves them behind.'],['Duncan','The shepherd goes after the wanderers. So does the constable.']],
  how:'Whistle a lamb and walk it into the pen. Don\'t sprint off without it.',
  done:'Every lamb is in the pen. Nobody was left on the lane.',
  fail:'A lamb reached the lane. Call them a little sooner.'},
 {id:'bell',name:'The Supper Bell',kind:'Bell frame',bg:'house',gy:0.9,act:'RING',
  story:[['Duncan','The supper bell hangs on the frame beside the parish hall.'],['Duncan','Jump the hay steps. Take your time. A miss just sets you back a step.'],['Duncan','Up top, ring it three times so the square knows supper is ready.']],
  how:'Jump from step to step. On the top step, stand by the bell and ring it three times.',
  done:'Three clear rings. Flemingsburg can hear supper.',
  fail:'The drop got you this time. The steps will still be there.'},
 {id:'supper',name:'Supper on the Square',kind:'Supper table',bg:'square',gy:0.72,act:'SET',
  story:[['Duncan','Last job. The long table on the square still needs its dishes.'],['Duncan','Carry each one over and press SET. The little ones are racing through.'],['Duncan','Jump clear of them. Then we give thanks.']],
  how:'Carry five dishes to the long table and set them down. Jump over the runners.',
  done:'The table is set. The square can sit down together.',
  fail:'A dish hit the bricks. Pick it up and try the table again.'}
];
function meta(i){return META[i]}
/* ---------------- input: same swipe-and-hold as the first game ---------------- */
const TOUCH=new Map();
const edge={jump:false,act:false};
let carry={dir:0,t:0,run:false};
let runSince=0,runDir=0;
function playing(){return G.mode==='play'&&!G.paused&&!!G.state}
function isUI(el){return el&&el.closest&&el.closest('button,.screen:not([hidden]),#storyBox')}
document.addEventListener('pointerdown',e=>{Sound.unlock();if(!playing()||isUI(e.target))return;const t={x:e.clientX,y:e.clientY,ax:e.clientX,ay:e.clientY,ox:e.clientX,oy:e.clientY,z:{}};TOUCH.set(e.pointerId,t);e.preventDefault()},{passive:false});
addEventListener('pointermove',e=>{const t=TOUCH.get(e.pointerId);if(!t)return;t.x=e.clientX;t.y=e.clientY;const prev=t.z&&t.z.U;t.z=HW.swipeSample(t);if(playing()&&t.z.U&&!prev)edge.jump=true},{passive:false});
function pup(e){TOUCH.delete(e.pointerId)}
addEventListener('pointerup',pup);addEventListener('pointercancel',pup);
addEventListener('contextmenu',e=>{if(playing())e.preventDefault()});
function clearInput(){TOUCH.clear();edge.jump=edge.act=false;G.keys={};document.querySelectorAll('#pad .big.on').forEach(b=>b.classList.remove('on'))}
function bindBtn(el,k){const on=e=>{e.preventDefault();e.stopPropagation();Sound.unlock();el.classList.add('on');if(!playing())return;if(k==='jump')edge.jump=true;if(k==='act')edge.act=true},
 off=e=>{e.preventDefault();el.classList.remove('on')};
 el.addEventListener('pointerdown',on,{passive:false});el.addEventListener('pointerup',off,{passive:false});el.addEventListener('pointercancel',off);el.addEventListener('pointerleave',off)}
bindBtn($('bJump'),'jump');bindBtn($('bAct'),'act');
function readInput(dt){const zones=[];for(const t of TOUCH.values())zones.push(t.z||{});
 const ax=HW.touchAxis(zones),touchX=ax.x,running=HW.touchRun([...TOUCH.values()]);
 const k=G.keys,kx=((k.ArrowRight||k.KeyD)?1:0)-((k.ArrowLeft||k.KeyA)?1:0);
 if(kx||touchX){if((kx||touchX)!==runDir){runDir=kx||touchX;runSince=G.t}}else runDir=0;
 const held=runDir&&G.t-runSince>0.18;
 carry=HW.touchCarry(carry,touchX,dt,running||held);
 const x=HW.axisWithCarry(kx,G.pad.ax||0,touchX,carry);
 let run=!!(k.ShiftLeft||k.ShiftRight||running||held||Math.abs(G.pad.ax)>0.85||G.pad.btn.x||G.pad.btn.rb);
 if(!kx&&!touchX&&carry.t>0&&carry.run)run=true;
 const jump=edge.jump,act=edge.act;edge.jump=edge.act=false;
 return{x,y:0,jump,act,run}}
function padOn(){return G.mode==='play'}
function viewWH(){const vv=window.visualViewport,de=document.documentElement;let w=innerWidth||de.clientWidth,h=innerHeight||de.clientHeight;
 if(de.clientHeight>0)h=Math.min(h,de.clientHeight);if(vv&&vv.scale>0.99&&vv.scale<1.01){w=Math.min(w,vv.width)||w;h=Math.min(h,vv.height)||h}return[Math.max(1,Math.round(w)),Math.max(1,Math.round(h))]}
function layoutPad(){const m=HW.layoutMetrics(G.W,G.FH),bj=$('bJump'),ba=$('bAct'),hint=$('swipeHint');
 const pad=$('pad');
 if(!G.land){const top=G.H;pad.style.top=top+'px';pad.style.height=(G.FH-top)+'px';
  bj.style.width=m.jump.w+'px';bj.style.height=m.jump.h+'px';bj.style.right='calc('+m.jump.right+'px + env(safe-area-inset-right, 0px))';bj.style.bottom='calc('+m.jump.bottom+'px + env(safe-area-inset-bottom, 0px))';bj.style.left='';
  ba.style.width=m.act.w+'px';ba.style.height=m.act.h+'px';ba.style.right='calc('+m.act.right+'px + env(safe-area-inset-right, 0px))';ba.style.bottom='calc('+m.act.bottom+'px + env(safe-area-inset-bottom, 0px))';ba.style.left='';
  hint.style.display='';hint.style.top='12px';hint.style.left='14px';hint.style.right=(m.act.right+m.act.w+8)+'px'}
 else{pad.style.top='0';pad.style.height=G.H+'px';
  bj.style.width=m.jump.w+'px';bj.style.height=m.jump.h+'px';bj.style.right='calc('+m.jump.right+'px + env(safe-area-inset-right, 0px))';bj.style.bottom='calc('+m.jump.bottom+'px + env(safe-area-inset-bottom, 0px))';bj.style.left='';
  ba.style.width=m.act.w+'px';ba.style.height=m.act.h+'px';ba.style.right='calc('+m.act.right+'px + env(safe-area-inset-right, 0px))';ba.style.bottom='calc('+m.act.bottom+'px + env(safe-area-inset-bottom, 0px))';ba.style.left='';
  hint.style.display='none'}
 bj.style.setProperty('font-size',Math.round(Math.min(22,m.jump.w*0.24))+'px','important');
 ba.style.setProperty('font-size',Math.round(Math.min(16,m.act.w*0.18))+'px','important')}
function resize(){G.dpr=Math.min(2,devicePixelRatio||1);[G.W,G.FH]=viewWH();G.land=G.W>G.FH;
 const m=HW.layoutMetrics(G.W,G.FH);
 G.H=(padOn()&&!G.land)?m.gameH:G.FH;
 cv.style.height=G.H+'px';cv.width=Math.round(G.W*G.dpr);cv.height=Math.round(G.H*G.dpr);
 layoutPad();document.body.classList.toggle('land',G.land);document.body.classList.toggle('port',!G.land)}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,120));
if(window.visualViewport)visualViewport.addEventListener('resize',resize);
setInterval(()=>{const [a,b]=viewWH();if(a!==G.W||b!==G.FH)resize()},400);
let padLbl='';
function padSync(){const pad=$('pad'),vis=playing();if(pad.hidden===vis)pad.hidden=!vis;document.body.classList.toggle('padmode',padOn()&&!G.land);
 if(!G.state)return;const b=HW.buttonsFor(G.state.kind),key=b.join('|')+G.mode;if(key===padLbl)return;padLbl=key;
 $('bJump').textContent=b[0];$('bAct').textContent=b[1];
 $('swipeHint').innerHTML='SWIPE &amp; HOLD ANYWHERE TO MOVE<br>SWIPE UP TO JUMP'}
addEventListener('keydown',e=>{Sound.unlock();const was=G.keys[e.code];G.keys[e.code]=true;if(was)return;
 if(G.mode==='play'){if(e.code==='Escape'||e.code==='KeyP'){togglePause();return}if(G.paused)return;
  if(e.code==='Space'||e.code==='Enter'||e.code==='KeyJ'){edge.act=true;e.preventDefault()}
  if(e.code==='KeyK'||e.code==='ArrowUp'||e.code==='KeyW'){edge.jump=true;e.preventDefault()}
  if(e.code==='ArrowDown'||e.code==='ArrowLeft'||e.code==='ArrowRight')e.preventDefault()}
 else if(G.mode==='story'&&(e.code==='Space'||e.code==='Enter'||e.code==='ArrowRight')){$('bNext').click();e.preventDefault()}
 else if(G.mode==='story'&&e.code==='Escape'){$('bSkip').click()}
 else if((e.code==='Space'||e.code==='Enter')&&G.mode!=='loading'){const b=document.querySelector('#ui section:not([hidden]) button.big, #ui section:not([hidden]) button');if(b)b.click()}});
addEventListener('keyup',e=>{G.keys[e.code]=false});
addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(playing())togglePause()}});
function pollPad(){const ps=navigator.getGamepads?navigator.getGamepads():[];let gp=null;for(const p of ps)if(p&&p.connected){gp=p;break}
 const pd=G.pad;pd.prev=pd.btn||{};pd.btn={};pd.ax=pd.ay=0;if(!gp)return;const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed),dz=v=>Math.abs(v)<0.22?0:v;
 pd.ax=clamp(dz(gp.axes[0]||0)+(b(15)?1:0)-(b(14)?1:0),-1,1);pd.ay=clamp(dz(gp.axes[1]||0)+(b(13)?1:0)-(b(12)?1:0),-1,1);
 pd.btn={a:b(0),b:b(1),x:b(2),rb:b(5),start:b(9)};
 const E=n=>pd.btn[n]&&!pd.prev[n];
 if(E('a')||E('b')||E('start'))Sound.unlock();
 if(G.mode==='play'){if(E('start')){togglePause();return}if(G.paused)return;if(E('a'))edge.act=true;if(E('b'))edge.jump=true}}
/* ---------------- screens ---------------- */
const SCREENS=['loading','title','levels','story','howto','pause','result'];
function show(id){for(const s of SCREENS){const n=$(s);if(n)n.hidden=s!==id}$('hud').hidden=!(id==='pause'||G.mode==='play');padLbl=''}
function setMode(m){const was=padOn();G.mode=m;if(was!==padOn())resize();show(m==='play'?'none':m)}
function goTitle(){G.paused=false;G.state=null;setMode('title');Sound.startMusic();const b=$('bestLine');if(G.best){b.hidden=false;b.textContent='Best watch: '+G.best}else b.hidden=true}
function goLevels(){const L=$('lvList');L.innerHTML='';META.forEach((l,i)=>{const b=document.createElement('button');const st=G.stars[l.id]||0;
  b.innerHTML= (i+1)+'. '+l.name+'<small>'+l.kind+'</small><span class="st">'+'★'.repeat(st)+'☆'.repeat(3-st)+'</span>';
  b.onclick=()=>{Sound.play('click');startLevel(i)};L.appendChild(b)});setMode('levels')}
let story=null;
function startStory(lines,done){story={lines,i:0,done};setMode('story');showLine()}
function showLine(){const line=story.lines[story.i];$('spk').textContent=line[0];$('txt').textContent=line[1];$('portrait').src=IMGS[line[0]==='Duncan'?'face':'emblem'];
 $('bNext').innerHTML=story.i<story.lines.length-1?'Next &#9654;':'OK &#9654;'}
$('bNext').onclick=()=>{Sound.play('click');if(!story)return;story.i++;if(story.i>=story.lines.length){const d=story.done;story=null;d()}else showLine()};
$('bSkip').onclick=()=>{Sound.play('click');if(!story)return;const d=story.done;story=null;d()};
function startLevel(i){G.lv=i;G.paused=false;G.shown=false;G._gaits={};FX.length=0;clearInput();const m=meta(i);
 G.state=HW.create(m.id,(Date.now()+(i+1)*17)>>>0||1);padLbl='';startStory(m.story,()=>howto(i))}
function howto(i){const m=meta(i),b=HW.buttonsFor(G.state.kind);
 $('htNum').textContent='Level '+(i+1)+' of '+META.length+' · '+m.kind;$('htTitle').textContent=m.name;$('htText').textContent=m.how;
 $('htKeys').innerHTML=keyHelp(b[1]).map(k=>'<div>'+k+'</div>').join('');setMode('howto')}
function beginPlay(){Sound.play('click');Sound.unlock();G.paused=false;G.shown=false;clearInput();const was=padOn();G.mode='play';if(!was)resize();show('none');$('hud').hidden=false;$('hudLv').textContent='Lv '+(G.lv+1);padLbl='';toast(meta(G.lv).name,1400)}
$('bStart').onclick=beginPlay;
function togglePause(){if(G.mode!=='play')return;G.paused=!G.paused;$('pause').hidden=!G.paused;clearInput();if(G.paused)$('bPSound').textContent='Sound: '+(Sound.isOn()?'On':'Off')}
$('bPause').onclick=()=>togglePause();
$('bResume').onclick=()=>togglePause();
$('bRestart').onclick=()=>{$('pause').hidden=true;const i=G.lv;G.paused=false;G.shown=false;G._gaits={};G.state=HW.create(meta(i).id,(Date.now()>>>0)||1);clearInput();G.mode='play';show('none');$('hud').hidden=false};
$('bSkipLv').onclick=()=>{G.paused=false;$('pause').hidden=true;if(G.lv+1<META.length)startLevel(G.lv+1);else goTitle()};
$('bPLevels').onclick=()=>{G.paused=false;$('pause').hidden=true;goLevels()};
function sndBtn(b){b.onclick=()=>{Sound.unlock();Sound.set(!Sound.isOn());b.textContent='Sound: '+(Sound.isOn()?'On':'Off')}}
sndBtn($('bSound'));sndBtn($('bPSound'));$('bSound').textContent='Sound: '+(Sound.isOn()?'On':'Off');
function runTotal(){let n=0;for(const k in G.parts)n+=G.parts[k];return n}
function prevTotal(){let n=0;const id=G.state&&G.state.id;for(const k in G.parts)if(k!==id)n+=G.parts[k];return n}
function showResult(){const s=G.state,m=meta(G.lv),win=!!s.won;const stars=win?HW.starsFor(s):0;
 if(win){G.stars[m.id]=Math.max(G.stars[m.id]||0,stars);saveStars();G.parts[m.id]=s.score;Sound.play('win')}
 const total=runTotal();const last=G.lv===META.length-1;const full=META.every(x=>G.parts[x.id]!=null);
 let boardNote='';
 if(win&&last&&full){const entry={score:total,stars:META.reduce((n,x)=>n+(G.stars[x.id]||0),0),t:Math.round(s.t),when:Date.now(),me:true};
  G.board=HW.boardInsert(G.board.map(b=>({score:b.score,stars:b.stars,t:b.t,when:b.when})),entry);
  if(total>G.best)G.best=total;saveBoard();
  const list=$('rsBoard');list.hidden=false;list.innerHTML='';
  G.board.forEach((row,i)=>{const li=document.createElement('li');if(row.me&&row.when===entry.when)li.className='me';li.innerHTML='<span>'+(i+1)+'. '+(row.me&&row.when===entry.when?'This watch':'Watch')+'</span><span>'+row.score+'</span>';list.appendChild(li)});
  boardNote=' Best on this phone: '+G.best+'.'}
 else $('rsBoard').hidden=true;
 $('rsTitle').textContent=win?(last&&full?'The harvest is in!':pickLine()):'Try once more?';
 [...$('rsStars').children].forEach((e,i)=>e.classList.toggle('on',win&&i<stars));$('rsStars').hidden=!win;
 $('rsText').textContent=(win?m.done: (s.fail||m.fail))+'  Score '+s.score+'.  Watch '+total+'.'+boardNote;
 $('bContinue').innerHTML=win?(last?'Home &#9654;':'Continue &#9654;'):'&#8635; Try again';
 $('bRetry').innerHTML=win?'&#8635; Play level again':'Skip level &#9193;';
 G.mode='result';resize();show('result')}
function pickLine(){const a=['Well done, Constable.','That\'s the way, Duncan.','Flemingsburg is grateful.'];return a[G.lv%a.length]}
$('bContinue').onclick=()=>{Sound.play('click');const win=G.state&&G.state.won;if(!win){startLevel(G.lv);return}if(G.lv+1<META.length)startLevel(G.lv+1);else{if(META.every(x=>G.parts[x.id]!=null)){startStory([['Duncan','The loaves are in, the lambs are home, and the bell rang true.'],['Duncan','Pull up a chair. Tonight we give thanks. That\'s the watch.']],goTitle)}else goTitle()}};
$('bRetry').onclick=()=>{Sound.play('click');if(G.state&&G.state.won)startLevel(G.lv);else if(G.lv+1<META.length)startLevel(G.lv+1);else goTitle()};
$('bPlay').onclick=()=>{Sound.unlock();Sound.play('click');G.parts={};let i=META.findIndex(l=>!G.stars[l.id]);if(i<0)i=0;startLevel(i)};
$('bLevels').onclick=()=>{Sound.unlock();Sound.play('click');goLevels()};
$('bLvBack').onclick=()=>goTitle();
function onEvent(e){const x=e.x||0,y=e.y||-70;
 if(e.type==='jump')Sound.play('jump');
 else if(e.type==='pickup')Sound.play('click');
 else if(e.type==='deliver'||e.type==='place'){Sound.play('help');popText(x,-80,'+'+e.n,'#ffd23f');burst(x,-20,10,['#ffd23f','#fff','#e8a040'])}
 else if(e.type==='pen'){Sound.play('baa');Sound.play('help');popText(x,-70,'Home!','#fff')}
 else if(e.type==='shoo'){Sound.play('whistle');popText(x,-60,'Shoo!','#fff');burst(x,-20,8,['#222','#888','#ffd23f'])}
 else if(e.type==='hurt'){Sound.play('hurt');popText(x,-100,'Ouch!','#ff8a7a')}
 else if(e.type==='lostear'){Sound.play('splat');popText(x,-80,'Oh no!','#ffb060')}
 else if(e.type==='bell'){Sound.play('bell');popText(x,-150,'Ring '+e.n+'!','#ffd23f');burst(x,-120,12,['#ffd23f','#fff'])}
 else if(e.type==='whistle'&&!e.miss)Sound.play('whistle');
 else if(e.type==='behind')toast('Walk a little slower!');
 else if(e.type==='escape'){Sound.play('hurt');toast('That lamb reached the lane!')}
 else if(e.type==='drop'){Sound.play('splat');popText(x,-70,'Dropped!','#ffb0a0')}
 else if(e.type==='fall')toast('Up you get!');
 else if(e.type==='win'){burst(x,-40,18,['#ffd23f','#fff','#7ad0ff','#ffa0c0'],160)}
 else if(e.type==='fail')Sound.play('lose')}
/* ---------------- draw ---------------- */
function view(){const land=G.land;const k=land?G.H*0.235/106:Math.min(G.H*0.2,G.W*0.4)/106;const gY=land?G.H*0.86:G.H*0.84;const bgH=land?G.H*1.02:G.H*0.94;return{k:k||1,gY,bgH,vw:G.W/Math.max(0.2,k)}}
function drawWorld(dt){const s=G.state,m=meta(G.lv),V=view();
 const cam=clamp(s.player.x-V.vw*(G.land?0.36:0.32),0,Math.max(0,s.len-V.vw));
 drawTiledBG(G.img[m.bg],m.gy,V.gY,V.bgH,cam*V.k);
 cx.save();cx.translate(-cam*V.k,V.gY);cx.scale(V.k,V.k);
 if(s.kind==='bell'){for(let i=0;i<s.plats.length;i++){const p=s.plats[i];drawPlank(cx,p);const n=s.plats[i+1];if(n&&n.x>p.x+p.w+8){cx.fillStyle='rgba(12,8,16,.72)';cx.fillRect(p.x+p.w+2,6,n.x-(p.x+p.w)-4,28);cx.fillStyle='#ffd23f';cx.font='11px Lilita,system-ui';cx.textAlign='center';cx.fillText('drop',(p.x+p.w+n.x)/2,24)}}drawBell(cx,s.bellX,s.plats[s.plats.length-1].y,G.t,s.ringCd>0.15);drawNpc('pastor',210,-1,LOOK.pastor||LOOK.farmer,dt)}
 if(s.kind==='loaves'){drawCart(cx,s.cartX,s.progress);drawNpc('glen',s.cartX-72,1,LOOK.farmer,dt);s.loaves.forEach(l=>{if(!l.taken)drawLoaf(cx,l.x,-6,1.15)});[520,980,1480].forEach(drawPumpkin.bind(null,cx))}
 if(s.kind==='corn'){s.corn.forEach(c=>drawCorn(cx,c.x,c.ok));s.crows.forEach(c=>drawCrow(cx,c.x,-8,(c.peck||G.t)*8))}
 if(s.kind==='lambs'){drawPen(cx,s.penX,s.penW);drawNpc('mae',s.penX-40,-1,LOOK.granny,dt);s.lambs.forEach(l=>{if(l.penned){cx.save();cx.translate(l.x,0);drawLamb(cx,1,G.t+l.id);cx.restore()}else{cx.save();cx.translate(l.x,0);drawLamb(cx,l.face||1,G.t*4+l.id);if(!l.follow){cx.fillStyle='#ffd23f';cx.font='16px Lilita,system-ui';cx.textAlign='center';cx.fillText('!',0,-40+Math.sin(G.t*6)*2)}cx.restore()}})}
 if(s.kind==='supper'){const placed=s.dishes.filter(d=>d.placed).length;drawTable(cx,s.table0,s.table1,placed);s.dishes.forEach(d=>{if(!d.taken&&!d.placed)drawDish(cx,d.x,-2)});drawNpc('host',s.table0-50,-1,LOOK.granny,dt);s.kids.forEach(k=>{const o=gaitOf('kid'+k.id);o.ov=null;stepGait(o,-168*dt,dt,RK,true);cx.save();cx.translate(k.x,0);cx.scale(-1,1);drawPerson(cx,o,Object.assign({},LOOK.kid,{mood:''}));cx.restore()})}
 s.crows.forEach(c=>{if(s.kind==='loaves')drawCrow(cx,c.x,c.y,G.t*2)});
 s.pigeons.forEach(g=>drawPigeon(cx,g.x,g.y,G.t+g.phase));
 if(s.kind==='corn')s.crows.forEach(c=>{cx.fillStyle='#ffd23f';cx.font='15px Lilita,system-ui';cx.textAlign='center';cx.fillText('!',c.x,-78)})
 const D=s.player,o=gaitOf('duncan');
 if(D.pose==='point')o.ov={t:'point'};else if(D.pose==='wave')o.ov={t:'wave'};else if(D.pose==='cheer')o.ov={t:'cheer'};else if(D.carry)o.ov={t:'blanket'};else o.ov=null;
 stepGait(o,D.dx,dt,RD,!!D.onGround);
 cx.save();cx.translate(D.x,D.y);if(D.inv>0&&Math.floor(D.inv*12)%2)cx.globalAlpha=0.45;cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.ellipse(4,2,16,4,0,0,TAU);cx.fill();cx.scale(D.face||1,1);drawDuncan(cx,o);
 if(D.carry){const h=o._hand||[16,-40];if(s.kind==='supper')drawDish(cx,h[0],h[1]);else drawLoaf(cx,h[0],h[1],0.7)}
 cx.restore();
 drawFX();
 cx.restore()}
function drawTitle(){const img=G.img.cover;cx.fillStyle='#1b1226';cx.fillRect(0,0,G.W,G.H);
 if(img&&img.naturalWidth){cx.save();cx.filter='blur(16px) brightness(0.4)';const sc=Math.max(G.W/img.width,G.H/img.height)*1.08;cx.drawImage(img,(G.W-img.width*sc)/2,(G.H-img.height*sc)/2,img.width*sc,img.height*sc);cx.restore();
  const b=$('titleBtns').getBoundingClientRect();if(b.width<30)return;let R;if(G.land)R={x:10,y:10,w:Math.max(40,b.left-24),h:G.H-20};else R={x:8,y:8,w:G.W-16,h:Math.max(40,b.top-16)};
  const s=Math.min(R.w/img.width,R.h/img.height),w=img.width*s,h=img.height*s,x=R.x+(R.w-w)/2,y=R.y+(R.h-h)/2;
  cx.save();cx.shadowColor='rgba(255,200,60,.55)';cx.shadowBlur=22;cx.fillStyle='#ffd23f';rr(cx,x-4,y-4,w+8,h+8,14);cx.fill();cx.restore();
  cx.save();rr(cx,x,y,w,h,10);cx.clip();cx.drawImage(img,x,y,w,h);cx.restore();
  const rw=Math.min(w*0.86,420),rh=G.land?36:44,rx=x+(w-rw)/2,ry=y+h-rh-14;
  cx.fillStyle='rgba(42,22,8,.88)';rr(cx,rx,ry,rw,rh,10);cx.fill();cx.strokeStyle='#ffd23f';cx.lineWidth=2;cx.stroke();
  cx.fillStyle='#ffd23f';cx.font=(G.land?18:22)+'px Lilita,system-ui,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('THE HARVEST WATCH',rx+rw/2,ry+rh/2+1)}}
function frame(now){const dt=Math.min(0.05,(now-(frame.last||now))/1000);frame.last=now;G.t+=dt;pollPad();padSync();
 let stepped=0;
 if(playing()){const input=readInput(dt);const ev=HW.tick(G.state,input,dt);stepped=dt;for(const e of ev)onEvent(e);stepFX(dt);
  if(G.state.ready&&!G.shown){G.shown=true;showResult()}
  const hud=HW.hud(G.state,prevTotal());if($('hudInfo').textContent!==hud)$('hudInfo').textContent=hud}
 cx.setTransform(G.dpr,0,0,G.dpr,0,0);
 if(G.mode==='title'||G.mode==='levels'||G.mode==='loading')drawTitle();
 else if(G.state){try{drawWorld(stepped||dt)}catch(err){console.error(err)}}
 requestAnimationFrame(frame)}
resize();
loadAll(()=>{goTitle();requestAnimationFrame(frame)});
window.__cdhw={G,HW,TOUCH,startLevel,goTitle,META};
