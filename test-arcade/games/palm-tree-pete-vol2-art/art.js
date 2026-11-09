/* Character, tile and backdrop drawing ported from Rescue from Palm Tree Pete's Island (Vol 1)
   so the hero, Palm Tree Pete, the goons and the kids are the same pictures.
   Public routines take a canvas context. Gameplay code in game.js decides who stands where. */
(function(){'use strict';
const PI=Math.PI,TAU=PI*2;
const LERP=(a,b,t)=>a+(b-a)*t;
let g=null;
function use(ctx){g=ctx;return g}

const KIND={
 hero:{h:28,w:1,skin:'#e2a982',skinD:'#b97c58',hair:'#b98d5c',hairD:'#7d5a36',shirt:'flag',pants:'stars',shoe:'flag',beard:'#8a6440',grin:1,bag:1},
 thug:{h:29,w:1.12,skin:'#c99272',skinD:'#93634a',hair:'#1c1a19',hairD:'#0c0b0b',shirt:'#2b2f36',shirtD:'#1a1d22',collar:1,pants:'#1c1e24',shoe:'#0d0d0f',shades:1,light:1},
 pete:{h:29,w:1.4,skin:'#c9824f',skinD:'#94562c',hair:'#b4b9c2',hairD:'#7d838d',shirt:'track',pants:'#18234a',shoe:'#6b3a1c',smirk:1,watch:1,brow:1},
 kid0:{h:18,w:.9,skin:'#f0c29c',skinD:'#c48e68',hair:'#5a3a1e',hairD:'#3a240f',shirt:'#e94b5a',shirtD:'#b23040',pants:'#3a5fa8',shoe:'#fff',kid:1},
 kid1:{h:17,w:.9,skin:'#8d5a3c',skinD:'#643c26',hair:'#1a120c',hairD:'#0a0604',shirt:'#f2c230',shirtD:'#c4961a',pants:'#5a4a8a',shoe:'#e94b5a',kid:1,pony:1},
 kid2:{h:19,w:.9,skin:'#f3d0b0',skinD:'#c99d7b',hair:'#e8c46a',hairD:'#b8913a',shirt:'#3bb273',shirtD:'#258a52',pants:'#2b3a55',shoe:'#fff',kid:1},
 kid3:{h:16,w:.9,skin:'#c68b62',skinD:'#94603e',hair:'#2d1a10',hairD:'#160c06',shirt:'#5aa7e8',shirtD:'#3a7dc0',pants:'#d2a24a',shoe:'#333',kid:1,pony:1},
 kid4:{h:17,w:.9,skin:'#f6d3b8',skinD:'#cf9f7f',hair:'#c8501e',hairD:'#8f3410',shirt:'#9b59d0',shirtD:'#7239a6',pants:'#2f6f5a',shoe:'#ffd84a',kid:1},
 kid5:{h:18,w:.9,skin:'#6e4128',skinD:'#4a2a18',hair:'#151010',hairD:'#050303',shirt:'#ff8c2a',shirtD:'#cc6a14',pants:'#e8e2d0',shoe:'#3bb273',kid:1,pony:1}
};
/* One Vol 2 pixel per Vol 1 unit, times 2, puts the hero at the same height the stage was built for. */
const S=2;

function srand(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rrPath(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function rrW(x,y,w,h,r,f){rrPath(x,y,w,h,r);g.fillStyle=f;g.fill()}
function star(x,y,r){g.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,rr2=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2)}g.closePath();g.fill()}
function limb(x1,y1,x2,y2,w,col){g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
function shade(c){if(!c||c[0]!=='#'||c.length<7)return c;const n=parseInt(c.slice(1),16);const r=(n>>16)*.72|0,gg=((n>>8)&255)*.72|0,b=(n&255)*.72|0;return'rgb('+r+','+gg+','+b+')'}
function hexShade(c,m){if(!c||c[0]!=='#'||c.length<7)return c;const n=parseInt(c.slice(1),16);const r=(n>>16)*m|0,gg=((n>>8)&255)*m|0,b=(n&255)*m|0;return'rgb('+r+','+gg+','+b+')'}
function ptpBadge(cx,cy,r){g.save();g.translate(cx,cy);g.fillStyle='#d4a640';g.beginPath();g.arc(0,0,r*1.12,0,TAU);g.fill();g.fillStyle='#c8202f';g.beginPath();g.arc(0,0,r,0,TAU);g.fill();
 const m=g.getTransform();if(m.a<0)g.scale(-1,1);g.fillStyle='#fff';g.font='900 '+(r*.95)+'px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('PTP',0,r*.06);g.restore()}
function shirtFill(K,x,y,w,h){
 if(K.shirt==='flag'){g.fillStyle='#f4efe6';g.fillRect(x,y,w,h);g.fillStyle='#c22433';for(let i=0;i<h;i+=2.2)g.fillRect(x,y+i,w,1.1);
  const pw=w*.55,px=x+w-pw;g.fillStyle='#22336f';g.fillRect(px,y,pw,h*.5);g.fillStyle='#fff';for(let i=0;i<3;i++)for(let j=0;j<3;j++)star(px+.9+i*pw/3.1,y+1+j*h*.5/3.2,.48)}
 else if(K.shirt==='track'){const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,'#141e40');gr.addColorStop(1,'#24346a');g.fillStyle=gr;g.fillRect(x,y,w,h);
  g.fillStyle='#e9ecf2';g.fillRect(x,y,w*.08,h);
  g.strokeStyle='#b8bfcc';g.lineWidth=.45;g.beginPath();g.moveTo(x+w*.86,y);g.lineTo(x+w*.86,y+h);g.stroke();
  g.fillStyle='#0f1730';g.fillRect(x+w*.5,y,w*.5,1.4);
  ptpBadge(x+w*.5,y+h*.3,2.2)}
 else if(K.shirt==='stripe'){g.fillStyle='#f4f2ea';g.fillRect(x,y,w,h);g.fillStyle='#1f50b8';for(let i=0;i<h;i+=3.2)if((i/3.2|0)%2)g.fillRect(x,y+i,w,1.6)}
 else if(K.shirt==='hawaii'){g.fillStyle='#f07a1e';g.fillRect(x,y,w,h);g.fillStyle='#2f7d3a';for(let i=0;i<5;i++){const px=x+((i*3.7)%w),py=y+((i*5.3)%h);g.beginPath();for(let k=0;k<5;k++){const a=-PI/2+(k-2)*.6;g.moveTo(px,py);g.quadraticCurveTo(px+Math.cos(a)*1.6,py+Math.sin(a)*1.6-0.6,px+Math.cos(a)*2.4,py+Math.sin(a)*2.4)}g.lineWidth=.6;g.strokeStyle='#2f7d3a';g.stroke();g.fillStyle='#7a4a24';g.fillRect(px-.25,py,.5,2.4)}g.fillStyle='rgba(255,220,120,.35)';g.fillRect(x,y,w,1)}
 else{const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,K.shirtD||K.shirt);gr.addColorStop(1,K.shirt);g.fillStyle=gr;g.fillRect(x,y,w,h)}}
function leg2(hx,hy,a1,a2,L,w,col,shoe,K){
 const kx=hx-Math.sin(a1)*L,ky=hy+Math.cos(a1)*L,fx=kx-Math.sin(a1+a2)*L,fy=ky+Math.cos(a1+a2)*L;
 limb(hx,hy,kx,ky,w,col);limb(kx,ky,fx,fy,w*.9,col);
 if(K.pants==='stars'){g.fillStyle='#fff';for(let i=1;i<4;i++){const t=i/4;star(LERP(hx,kx,t)+.6,LERP(hy,ky,t),.55);star(LERP(kx,fx,t)-.5,LERP(ky,fy,t),.5)}}
 g.save();g.translate(fx,fy);{const sa=a1+a2;g.rotate(sa>1.2?sa-1.2:sa<-1.2?sa+1.2:0)}
 if(shoe==='flag'){rrW(-1.6,-1.6,5.4,2.6,1,'#c8202f');g.fillStyle='#1f2f6b';g.fillRect(-1.6,-1.6,2,1.3);g.fillStyle='#fff';g.fillRect(-1.6,.6,5.4,.6);g.fillRect(.6,-.9,3,.4)}
 else rrW(-1.6,-1.6,5.2,2.6,1,shoe);g.restore();return[fx,fy]}
function arm(K,x,y,a,e,h,back,pose,o){
 const L=h*.17,sl=K.shirt==='flag'?(back?'#b51f2d':'#f4efe6'):K.shirt==='hawaii'?'#f07a1e':K.shirt==='track'?'#1e2c5c':K.shirt==='stripe'?(back?'#1a3f96':'#f4f2ea'):K.shirt;
 const ex=x-Math.sin(a)*L,ey=y+Math.cos(a)*L,hx=ex-Math.sin(a+e)*L,hy=ey+Math.cos(a+e)*L;
 limb(x,y,ex,ey,2.8*K.w*(K.kid?.8:1),back?shade(sl):sl);
 if(K.shirt==='flag'&&!back){g.strokeStyle='#c22433';g.lineWidth=.9;g.beginPath();g.moveTo(LERP(x,ex,.35),LERP(y,ey,.35)-.9);g.lineTo(LERP(x,ex,.35),LERP(y,ey,.35)+.9);g.stroke()}
 if(K.shirt==='flag'){g.fillStyle=back?'#cfc8ba':'#fff';g.beginPath();g.arc(ex,ey,1.55,0,TAU);g.fill()}
 limb(ex,ey,hx,hy,2.3*(K.kid?.8:1),back?K.skinD:K.skin);
 if(K.watch&&!back){g.fillStyle='#e2b448';g.beginPath();g.arc(LERP(ex,hx,.78),LERP(ey,hy,.78),1.25,0,TAU);g.fill();g.fillStyle='#fff6d0';g.beginPath();g.arc(LERP(ex,hx,.78),LERP(ey,hy,.78),.55,0,TAU);g.fill()}
 g.fillStyle=back?K.skinD:K.skin;g.beginPath();g.arc(hx,hy,1.45*(K.kid?.8:1),0,TAU);g.fill();
 if(pose==='thumbs'&&!back){g.fillStyle=K.skin;g.fillRect(hx-.5,hy-3.2,1.2,2.6)}
 if(K.light&&!back&&!(o&&o.noLight)){g.save();g.translate(hx,hy);g.rotate(a+e);g.fillStyle='#3b3b40';g.fillRect(-.6,-.8,4.2,1.6);g.fillStyle='#ffe9a0';g.fillRect(3.4,-1,1,2);g.restore()}}
function head(K,kind,x,y,r,pose,ph,o){
 g.fillStyle=K.skinD;g.fillRect(x-1.2,y+r*.6,2.4,2);
 const gr=g.createRadialGradient(x+r*.35,y-r*.3,r*.2,x,y,r*1.15);gr.addColorStop(0,K.skin);gr.addColorStop(1,K.skinD);g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r*.95,r,0,0,TAU);g.fill();
 g.fillStyle=K.skinD;g.beginPath();g.ellipse(x-r*.25,y+.2,r*.22,r*.3,0,0,TAU);g.fill();
 g.fillStyle=K.hair;g.beginPath();
 if(kind==='hero'){g.moveTo(x-r*1.0,y+r*.1);g.quadraticCurveTo(x-r*1.15,y-r*1.15,x+r*.3,y-r*1.18);g.quadraticCurveTo(x+r*1.1,y-r*1.05,x+r*.95,y-r*.45);g.quadraticCurveTo(x+r*.2,y-r*.75,x-r*.55,y-r*.15);g.closePath();g.fill();
  g.strokeStyle=K.hairD;g.lineWidth=.35;for(let i=0;i<4;i++){g.beginPath();g.moveTo(x+r*.8-i*r*.3,y-r*.95+i*.15);g.quadraticCurveTo(x-r*.2-i*r*.2,y-r*1.1,x-r*.9,y-r*.2+i*.1);g.stroke()}}
 else if(K.kid){g.ellipse(x-r*.1,y-r*.35,r*1.02,r*.75,0,PI*.95,TAU+.1);g.fill();if(K.pony){g.beginPath();g.ellipse(x-r*1.05,y-r*.1,r*.35,r*.6,.4,0,TAU);g.fill()}}
 else if(kind==='thug'){g.ellipse(x-r*.05,y-r*.45,r*.98,r*.6,0,PI,TAU);g.fill()}
 else if(kind==='pete'){g.moveTo(x-r*.98,y+r*.15);g.quadraticCurveTo(x-r*1.12,y-r*1.12,x+r*.3,y-r*1.12);g.quadraticCurveTo(x+r*.95,y-r*1.0,x+r*.88,y-r*.66);g.quadraticCurveTo(x+r*.2,y-r*.82,x-r*.4,y-r*.42);g.lineTo(x-r*.55,y+r*.12);g.closePath();g.fill();
  g.strokeStyle=K.hairD;g.lineWidth=.32;for(let i=0;i<5;i++){g.beginPath();g.moveTo(x+r*.85-i*r*.12,y-r*.75-i*r*.08);g.quadraticCurveTo(x-r*.1,y-r*1.15+i*r*.12,x-r*.95,y-r*.1+i*r*.08);g.stroke()}
  g.fillStyle='rgba(255,255,255,.45)';g.beginPath();g.ellipse(x+r*.05,y-r*1.02,r*.45,r*.1,-.1,0,TAU);g.fill()}
 else{g.ellipse(x-r*.1,y-r*.3,r,r*.7,0,PI,TAU);g.fill()}
 const ex=x+r*.45,ey=y-r*.12;
 if(K.shades){g.fillStyle='#111';rrPath(ex-r*.35,ey-r*.18,r*.75,r*.36,r*.12);g.fill();g.fillStyle='rgba(140,200,255,.55)';g.fillRect(ex-r*.15,ey-r*.12,r*.25,r*.08)}
 else{g.fillStyle='#fff';g.beginPath();g.ellipse(ex,ey,r*.17,r*(pose==='scared'?.22:.15),0,0,TAU);g.fill();g.fillStyle='#23313f';g.beginPath();g.arc(ex+r*.05,ey,r*.09,0,TAU);g.fill();
  g.strokeStyle=K.hairD;g.lineWidth=.45;g.beginPath();g.moveTo(ex-r*.2,ey-r*.3);g.lineTo(ex+r*.22,ey-r*(pose==='scared'?.42:.3));g.stroke()}
 if(K.brow){g.strokeStyle='#6f747c';g.lineWidth=.75;g.lineCap='round';g.beginPath();g.moveTo(ex-r*.25,ey-r*.24);g.quadraticCurveTo(ex,ey-r*.5,ex+r*.28,ey-r*.36);g.stroke();g.strokeStyle=K.skinD;g.lineWidth=.35;g.beginPath();g.moveTo(ex-r*.22,ey+r*.2);g.lineTo(ex+r*.2,ey+r*.16);g.stroke()}
 g.fillStyle=K.skinD;g.beginPath();g.moveTo(x+r*.85,y-r*.05);g.lineTo(x+r*1.08,y+r*.25);g.lineTo(x+r*.82,y+r*.3);g.fill();
 if(K.beard){g.fillStyle=K.beard;g.beginPath();g.moveTo(x-r*.2,y+r*.05);g.quadraticCurveTo(x-r*.1,y+r*1.05,x+r*.55,y+r*1.0);g.quadraticCurveTo(x+r*.95,y+r*.85,x+r*.95,y+r*.45);g.lineTo(x+r*.3,y+r*.35);g.closePath();g.fill()}
 if(K.grin||pose==='cheer'||pose==='thumbs'){g.fillStyle='#fff';g.beginPath();g.moveTo(x+r*.35,y+r*.45);g.quadraticCurveTo(x+r*.7,y+r*.8,x+r*.95,y+r*.45);g.closePath();g.fill();g.strokeStyle='#5a2a1a';g.lineWidth=.3;g.stroke()}
 else if(K.smirk&&pose!=='hurt'&&pose!=='ko'){g.strokeStyle='#5a2a1a';g.lineWidth=.5;g.lineCap='round';g.beginPath();g.moveTo(x+r*.42,y+r*.52);g.quadraticCurveTo(x+r*.68,y+r*.66,x+r*.95,y+r*.36);g.stroke();g.strokeStyle=K.skinD;g.lineWidth=.35;g.beginPath();g.arc(x+r*.98,y+r*.3,r*.12,-.5,1.4);g.stroke()}
 else if(pose==='scared'){g.fillStyle='#4a1a14';g.beginPath();g.ellipse(x+r*.72,y+r*.55,r*.13,r*.18,0,0,TAU);g.fill()}
 else{g.strokeStyle='#5a2a1a';g.lineWidth=.4;g.beginPath();g.moveTo(x+r*.5,y+r*.55);g.lineTo(x+r*.9,y+r*.5);g.stroke()}
 if(o&&o.dizzy){g.fillStyle='#ffd84a';for(let i=0;i<3;i++){const a=(ph||0)*3+i*TAU/3;star(x+Math.cos(a)*r*1.4,y-r*1.4+Math.sin(a)*r*.4,1.2)}}}

/* pose: idle|walk|crouch|jump|punch|kick|lowkick|climb|hurt|ko|cheer|scared|thumbs|block|windup */
function drawMan(kind,x,y,s,face,pose,ph,o){o=o||{};const base=KIND[kind]||KIND.thug;const K=o.look?Object.assign({},base,o.look):base;
 const h=K.h,W=K.w;g.save();g.translate(x,y);g.scale((s||1)*(face||1),(s||1));
 if(o.flash&&Math.floor(o.flash*20)%2)g.globalAlpha*=.45;
 if(pose==='ko'){g.rotate(-PI/2*0.92);g.translate(0,-2)}
 if(pose!=='ko'&&!o.noShadow){g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(0,0,7*W,1.6,0,0,TAU);g.fill()}
 let hip=h*.47,sh=h*.79,lean=0,la=0,lb=0,lk1=.15,lk2=.15,aF=.25,aB=-.2,eF=-.3,eB=-.3;
 const sw=Math.sin(ph||0);
 if(pose==='walk'){const A=o.amp===undefined?1:o.amp;la=sw*.55*A;lb=-sw*.55*A;lk1=.15+(.1+Math.max(0,-Math.cos(ph||0))*.5)*A;lk2=.15+(.1+Math.max(0,Math.cos(ph||0))*.5)*A;aF=-sw*.5*A;aB=sw*.5*A}
 else if(pose==='idle'){const br=Math.sin((ph||0)*.5)*.3;sh+=br*.3}
 else if(pose==='crouch'||pose==='lowkick'){hip=h*.3;sh=h*.6;la=-1.1;lk1=2.0;lb=-.6;lk2=1.6;aF=-1.0;eF=-.9;aB=-.5;lean=.25}
 else if(pose==='jump'){la=-.9;lk1=1.4;lb=-.2;lk2=1.0;aF=-2.4;aB=-2.0;eF=.2}
 else if(pose==='punch'){la=-.35;lb=.35;aF=-1.55;eF=0;aB=-.9;eB=-1.8;lean=.12}
 else if(pose==='windup'){la=-.2;lb=.3;aF=.5;eF=-1.6;aB=-.8;eB=-1.6;lean=-.1}
 else if(pose==='kick'){la=-1.45;lk1=0;lb=.15;aF=-.9;eF=-.9;aB=.6;lean=-.15}
 else if(pose==='block'){aF=-.9;eF=-2.2;aB=-.7;eB=-2.2;lean=-.05}
 else if(pose==='climb'){la=sw*.4-.2;lb=-sw*.4-.2;lk1=lk2=.6;aF=PI-.3+sw*.3;aB=PI-.3-sw*.3;eF=eB=0}
 else if(pose==='hurt'){lean=-.3;aF=.8;aB=.6;la=.2;lb=-.3}
 else if(pose==='cheer'){const j=Math.abs(Math.sin((ph||0)*1.5));g.translate(0,-j*3);aF=PI-.35;aB=PI+.35-.1;eF=eB=.2}
 else if(pose==='scared'){const sk=Math.sin((ph||0)*9)*.4;g.translate(sk,0);aF=-2.5;eF=-2.2;aB=-2.3;eB=-2.2;la=.1;lb=-.1}
 else if(pose==='thumbs'){aF=-2.3;eF=.4;aB=.2}
 if(pose==='crouch'&&o.amp){la+=sw*.6*o.amp;lb-=sw*.6*o.amp;lk1+=Math.max(0,-Math.cos(ph||0))*.5*o.amp;lk2+=Math.max(0,Math.cos(ph||0))*.5*o.amp}
 if(pose==='lowkick'){la=-1.55;lk1=0;lb=.2;lk2=1.9}
 const legL=hip/2,legW=3.1*W*(K.kid?.85:1);
 const pc=K.pants==='stars'?'#1d2c5e':K.pants;
 g.save();g.globalAlpha*=.92;leg2(-.6,-hip,lb,lk2,legL,legW,shade(pc),K.shoe==='flag'?'flag':K.shoe,K);g.restore();
 g.save();g.translate(0,-hip);g.rotate(lean);g.translate(0,hip);
 const shX=.4,shY=-sh;arm(K,shX-1.2,shY+1.2,aB,eB,h,true,pose,o);
 const tw=8.4*W,tx=-tw/2,ty=-sh-1.2,th=sh-hip+1.6;g.save();rrPath(tx,ty,tw,th,2.2*W);g.clip();shirtFill(K,tx,ty,tw,th);
 const sg=g.createLinearGradient(tx,0,tx+tw,0);sg.addColorStop(0,'rgba(0,0,0,.32)');sg.addColorStop(.55,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(255,255,255,.12)');g.fillStyle=sg;g.fillRect(tx,ty,tw,th);
 if(K.collar){g.fillStyle='#3a404a';g.fillRect(tx+tw*.45,ty,tw*.4,1.6)}
 g.restore();
 if(K.bag){limb(tx+tw*.85,ty+.5,tx+tw*.12,ty+th-1,1.3,'#16161a');rrW(tx-2.2,ty+th-3.5,4,4.4,.8,'#2a2622');g.fillStyle='#3d3731';g.fillRect(tx-2.2,ty+th-3.5,4,1.2)}
 if(kind==='pete'){g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(tx+tw*.62,ty+th*.62,tw*.45,th*.4,0,0,TAU);g.fill()}
 g.fillStyle=K.kid?shade(pc):'#2a211b';g.fillRect(tx,-hip-.6,tw,1.5);
 const hr=h*(K.kid?.17:.135),hy=-sh-hr-.4;head(K,kind,.6,hy,hr,pose,ph,o);
 g.restore();
 leg2(.8,-hip,la,lk1,legL,legW,pc,K.shoe==='flag'?'flag':K.shoe,K);
 g.save();g.translate(0,-hip);g.rotate(lean);g.translate(0,hip);arm(K,shX+1.4,shY+1.2,aF,eF,h,false,pose,o);g.restore();
 g.restore()}

function speck(R,x,y,w,h,n,cols,sz){for(let i=0;i<n;i++){g.fillStyle=cols[Math.floor(R()*cols.length)];const s=(sz||2)*(0.5+R());g.fillRect(x+R()*w,y+R()*h,s,s)}}
function skyNight(F,t,camx){const gr=g.createLinearGradient(0,F.y,0,F.y+F.h);gr.addColorStop(0,'#0a1030');gr.addColorStop(.55,'#24325e');gr.addColorStop(1,'#3c4f7c');g.fillStyle=gr;g.fillRect(F.x,F.y,F.w,F.h);
 const R=srand(7);g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<60;i++){const x=F.x+((R()*F.w*2-(camx||0)*.05)%F.w+F.w)%F.w,y=F.y+R()*F.h*.5;const tw=.5+.5*Math.sin(t*2+i);g.globalAlpha=.3+.6*tw;g.fillRect(x,y,1.6,1.6)}g.globalAlpha=1;
 const mx=F.x+F.w*.78,my=F.y+F.h*.16;const mg=g.createRadialGradient(mx,my,4,mx,my,60);mg.addColorStop(0,'rgba(255,250,220,.5)');mg.addColorStop(1,'rgba(255,250,220,0)');g.fillStyle=mg;g.fillRect(mx-60,my-60,120,120);g.fillStyle='#fdf6d8';g.beginPath();g.arc(mx,my,14,0,TAU);g.fill();g.fillStyle='rgba(200,190,160,.5)';g.beginPath();g.arc(mx-4,my-3,3,0,TAU);g.arc(mx+5,my+4,2,0,TAU);g.fill()}
function seaBand(F,y,t,camx){const gr=g.createLinearGradient(0,y,0,F.y+F.h);gr.addColorStop(0,'#1d4f7a');gr.addColorStop(1,'#0b2a48');g.fillStyle=gr;g.fillRect(F.x,y,F.w,F.y+F.h-y);g.strokeStyle='rgba(200,230,255,.25)';g.lineWidth=1.5;for(let i=0;i<10;i++){const yy=y+6+i*9,off=(t*12+i*37-(camx||0)*.2)%60;g.beginPath();for(let x=F.x-60+off;x<F.x+F.w;x+=60){g.moveTo(x,yy);g.quadraticCurveTo(x+15,yy-3,x+30,yy)}g.stroke()}
 g.fillStyle='rgba(255,250,220,.25)';g.fillRect(F.x+F.w*.74,y+2,F.w*.08,Math.max(0,F.y+F.h-y))}
function palmSil(x,y,h,col,sway){g.strokeStyle=col;g.lineWidth=Math.max(3,h*.05);g.lineCap='round';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+h*.15,y-h*.5,x+h*.08+sway,y-h);g.stroke();g.fillStyle=col;const tx=x+h*.08+sway,ty=y-h;for(let i=0;i<7;i++){const a=-PI+i*PI/6+Math.sin(i)*.2;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+Math.cos(a)*h*.3,ty+Math.sin(a)*h*.3-h*.1,tx+Math.cos(a)*h*.45,ty+Math.sin(a)*h*.35+h*.12);g.quadraticCurveTo(tx+Math.cos(a)*h*.25,ty+Math.sin(a)*h*.2,tx,ty);g.fill()}}
function stripedHouseSide(x,y,w,h){for(let i=0;i<8;i++){g.fillStyle=i%2?'#f4f2ea':'#2152b8';g.fillRect(x,y+i*h/8,w,h/8+.5)}g.fillStyle='#d9d3c3';g.fillRect(x-4,y-6,w+8,8);
 const dr=w*.16,dg=g.createRadialGradient(x+w/2-dr*.3,y-6-dr*.5,2,x+w/2,y-6,dr);dg.addColorStop(0,'#fff0a8');dg.addColorStop(.5,'#e0ad3a');dg.addColorStop(1,'#8a5f12');g.fillStyle=dg;g.beginPath();g.arc(x+w/2,y-6,dr,PI,0);g.fill();g.fillStyle='#d4a640';g.fillRect(x+w/2-1,y-6-dr-6,2,7);
 g.fillStyle='#9a6234';const dw=w*.3,dh=h*.7;g.beginPath();g.moveTo(x+w/2-dw/2,y+h);g.lineTo(x+w/2-dw/2,y+h-dh+dw/2);g.arc(x+w/2,y+h-dh+dw/2,dw/2,PI,0);g.lineTo(x+w/2+dw/2,y+h);g.fill();g.strokeStyle='#2a1a0e';g.lineWidth=1.5;g.beginPath();g.moveTo(x+w/2,y+h);g.lineTo(x+w/2,y+h-dh);g.stroke();g.fillStyle='#1d1d1d';g.fillRect(x+w/2-dw*.35,y+h-dh*.45,dw*.7,3)}

/* wi: 0 beach, 1 jungle, 2 villa, 3 striped house, 4 docks. Same paints as Vol 1's beach, villa, plaza and cliff scenes. */
function scene(ctx,wi,o){use(ctx);o=o||{};const W=o.W,H=o.H,t=o.t||0,pan=o.pan||0;const floor=o.floor==null?H*.75:o.floor;const F={x:0,y:0,w:W,h:H};
 if(wi===2){g.fillStyle='#120e14';g.fillRect(0,0,W,H);g.fillStyle='#eadfc8';g.fillRect(0,Math.max(0,floor-H*.55),W,H);return}
 if(wi===3){g.fillStyle='#120e14';g.fillRect(0,0,W,H);return}
 skyNight(F,t,pan);
 if(wi===1){g.fillStyle='rgba(8,28,12,.28)';g.fillRect(0,0,W,H);
  g.fillStyle='#16321c';g.beginPath();g.moveTo(0,floor-10);for(let i=0;i<=8;i++)g.lineTo(i*W/8,floor-50-Math.sin(i*1.4)*18);g.lineTo(W,floor+40);g.lineTo(0,floor+40);g.fill();
  g.fillStyle='#1d4a1d';g.beginPath();g.moveTo(0,floor-4);for(let i=0;i<=10;i++)g.lineTo(i*W/10,floor-26-Math.sin(i*1.1+1)*12);g.lineTo(W,floor+20);g.lineTo(0,floor+20);g.fill();
  const sway=Math.sin(t)*3;palmSil(-pan*.2%W+W*.08,floor,H*.42,'#0d1a10',sway);palmSil(-pan*.35%W+W*.28,floor,H*.5,'#102214',sway);palmSil(W*.62,floor,H*.46,'#0d1a10',Math.sin(t+1)*3);palmSil(W*.9,floor,H*.36,'#102214',Math.sin(t+2)*3)}
 else{const seaY=Math.max(H*.28,floor-H*(wi===4?.22:.16));seaBand(F,seaY,t,pan);
  if(wi===0){g.fillStyle='#1a2340';g.beginPath();g.moveTo(0,seaY);for(let i=0;i<=8;i++)g.lineTo(i*W/8,seaY-8-Math.sin(i*1.7)*6);g.lineTo(W,seaY);g.fill()}
  const sway=Math.sin(t)*3;palmSil(W*.08-pan*.15,floor,H*.42,'#0d1426',sway);palmSil(W*.22-pan*.25,floor,H*.34,'#0d1426',Math.sin(t+1)*3);
  if(wi===4){palmSil(W*.78,floor,H*.3,'#0d1426',Math.sin(t+.6)*3)}
  else palmSil(W*.9,floor,H*.38,'#0d1426',Math.sin(t+1)*3)}}

function drawGround(wi,x,y,T,c,ri,top){const R=srand(c*131+ri*17+wi*9+3);
 if(wi===0){g.fillStyle=top?'#cdb98c':'#8f7c58';g.fillRect(x,y,T+.5,T+.5);if(top){g.fillStyle='#e7d7b0';g.fillRect(x,y,T+.5,7);speck(R,x,y,T,T,18,['#bfa77a','#f3e6c4','#a89068'],2)}}
 else if(wi===1){g.fillStyle='#4a3320';g.fillRect(x,y,T+.5,T+.5);speck(R,x,y,T,T,10,['#3a2818','#5c4030'],2);
  if(top){g.fillStyle='#3d6a33';g.fillRect(x,y,T+.5,8);g.fillStyle='#4f7a34';for(let i=0;i<5;i++){const px=x+R()*T;g.beginPath();g.moveTo(px,y+4);g.lineTo(px+2,y-5-R()*4);g.lineTo(px+4,y+4);g.fill()}speck(R,x,y,T,8,8,['#5c8c47','#2c4f25'],2)}}
 else if(wi===2){if(top){g.fillStyle='#5a3e2c';g.fillRect(x,y,T,T);const gr=g.createLinearGradient(0,y,0,y+12);gr.addColorStop(0,'#f2eee6');gr.addColorStop(1,'#cfc8ba');g.fillStyle=gr;g.fillRect(x,y,T,12);g.strokeStyle='rgba(0,0,0,.25)';g.strokeRect(x,y,T,12)}
  else{g.fillStyle='#d9ceb6';g.fillRect(x,y,T+.5,T+.5);speck(R,x,y,T,T,8,['rgba(0,0,0,.05)'],2)}}
 else if(wi===3){if(top){g.fillStyle='#bfb6a2';g.fillRect(x,y,T,T);g.fillStyle='#f4f0e6';g.fillRect(x,y,T,12);g.fillStyle='#d4a640';g.fillRect(x,y+12,T,3)}
  else{g.fillStyle='#e0dace';g.fillRect(x,y,T+.5,T+.5);speck(R,x,y,T,T,8,['rgba(0,0,0,.05)'],2)}}
 else{g.fillStyle='#86613f';g.fillRect(x,y,T+.5,T+.5);g.strokeStyle='#5d4029';g.lineWidth=2;for(let i=8;i<T;i+=10){g.beginPath();g.moveTo(x,y+i);g.lineTo(x+T,y+i);g.stroke()}
  if(top){g.fillStyle='#a07650';g.fillRect(x,y,T+.5,4)}speck(R,x,y,T,T,6,['rgba(255,220,170,.18)'],2)}}
function drawLedge(wi,x,y,T){g.fillStyle='#7a5636';g.fillRect(x,y,T+.5,10);g.fillStyle='#a07650';g.fillRect(x,y,T+.5,3);g.strokeStyle='#4a321e';g.lineWidth=1.5;g.strokeRect(x+.5,y+.5,T-1,9);g.fillStyle='#4a321e';g.beginPath();g.moveTo(x+8,y+10);g.lineTo(x+14,y+10);g.lineTo(x+8,y+22);g.fill();
 if(wi===3){g.fillStyle='#d4a640';g.fillRect(x,y,T,2)}}
function drawCrate(x,y,T,c,ri){const R=srand(c*17+ri*3+9);g.fillStyle='#9a7448';g.fillRect(x+1,y+1,T-2,T-2);g.strokeStyle='#5a4022';g.lineWidth=2;g.strokeRect(x+2.5,y+2.5,T-5,T-5);g.beginPath();g.moveTo(x+3,y+3);g.lineTo(x+T-3,y+T-3);g.moveTo(x+T-3,y+3);g.lineTo(x+3,y+T-3);g.stroke();speck(R,x+3,y+3,T-6,T-6,5,['rgba(255,220,170,.2)','rgba(0,0,0,.12)'],2)}
function drawBack(wi,x,y,T,c,ri,tileAt){const R=srand(c*31+ri*13+wi);
 if(wi===2){g.fillStyle='#eadfc8';g.fillRect(x,y,T+.5,T+.5);speck(R,x,y,T,T,6,['rgba(0,0,0,.04)','rgba(255,255,255,.25)'],2);
  if(tileAt(c,ri+1)==='#'){g.fillStyle='#b99a6c';g.fillRect(x,y+T*.45,T,T*.55);g.fillStyle='#d8c39a';g.fillRect(x,y+T*.45,T,4)}
  if(ri>0&&c%7===3&&R()<.7){const ox=x+4,oy=y+4,ww=T*.7,wh=T*.85;g.fillStyle='#f6f2e8';g.beginPath();g.roundRect?g.roundRect(ox-2,oy-2,ww+4,wh+4,6):g.rect(ox-2,oy-2,ww+4,wh+4);g.fill();g.fillStyle='#14284d';g.fillRect(ox,oy,ww,wh);g.strokeStyle='#f6f2e8';g.lineWidth=1.5;g.beginPath();g.moveTo(ox+ww/2,oy);g.lineTo(ox+ww/2,oy+wh);g.moveTo(ox,oy+wh*.55);g.lineTo(ox+ww,oy+wh*.55);g.stroke()}}
 else{g.fillStyle=(Math.floor(y/24))%2?'#f3f0e6':'#2756bf';g.fillRect(x,y,T+.5,T+.6);if((Math.floor(y/24))%2===0){g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x,y,T,3)}
  if(tileAt(c,ri+1)==='#'){g.fillStyle='#c79a3a';g.fillRect(x,y+T-8,T,4)}
  if(ri>0&&c%7===4){g.fillStyle='#f3f0e6';g.fillRect(x+4,y+3,T-8,T-6);g.fillStyle='#1a2f6a';g.fillRect(x+7,y+6,T-14,T-12);g.fillStyle='#d4a640';g.beginPath();g.arc(x+T/2,y+T*.55,3,0,TAU);g.fill()}}}
function drawWater(x,y,T,c,ri,t){const cols=['#1d6a94','#164e78','#0b3a5c'];g.fillStyle=cols[Math.max(0,Math.min(2,ri-10))];g.fillRect(x,y,T+.5,T+.5);
 g.strokeStyle='rgba(220,245,255,.45)';g.lineWidth=1.5;const yy=y+8,off=((t*24+c*11)%(T));g.beginPath();g.moveTo(x-4+off,yy);g.quadraticCurveTo(x+T*.4,yy-3+Math.sin(t*3+c)*2,x+T,yy);g.stroke();
 g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x+(off%(T-6)),yy+6,6,1.5)}

function tiles(ctx,wi,c0,c1,tileAt,T,water,t){use(ctx);const wet={};(water||[]).forEach(c=>{wet[c]=1});
 for(let ri=0;ri<12;ri++)for(let c=c0;c<=c1;c++){const ch=tileAt(c,ri);const x=c*T,y=ri*T;
  if(ch==='#'&&!(wet[c]&&ri>=10))drawGround(wi,x,y,T,c,ri,tileAt(c,ri-1)!=='#');
  else if(ch==='C')drawCrate(x,y,T,c,ri);
  else if(ch==='=')drawLedge(wi,x,y,T);
  else if(wet[c]&&ri>=10)drawWater(x,y,T,c,ri,t||0);
  else if((wi===2||wi===3)&&ch===' ')drawBack(wi,x,y,T,c,ri,tileAt)}
 const deep=wi===0?'#6d5a3e':wi===1?'#2a1c10':wi===2?'#5a3e2c':wi===3?'#cfc6b4':'#5d4029';
 g.fillStyle=deep;g.fillRect(c0*T,12*T,(c1-c0+1)*T,400)}

function bush(ctx,b,t){use(ctx);const x=b.x,y=b.fy,w=b.w,R=srand((b.sd||1)*97+3);
 for(let i=0;i<7;i++){const cx=x-w/2+w*(.12+R()*.76),cy=y-8-R()*18,r=9+R()*11;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(cx+2,cy+3,r,0,TAU);g.fill();
  const gr=g.createRadialGradient(cx-r*.35,cy-r*.4,1,cx,cy,r);gr.addColorStop(0,'#5fa24a');gr.addColorStop(.7,'#2f6a2a');gr.addColorStop(1,'#1d4a1d');g.fillStyle=gr;g.beginPath();g.arc(cx,cy+Math.sin((t||0)*1.4+i+b.sd)*.6,r,0,TAU);g.fill()}
 speck(R,x-w/2,y-22,w,16,8,['#8fd06a','#2a5a22'],2)}

function ladder(ctx,l,metal){use(ctx);g.strokeStyle=metal?'#9aa0a8':'#b89466';g.lineWidth=4;g.lineCap='butt';g.beginPath();g.moveTo(l.x-10,l.y0);g.lineTo(l.x-10,l.y1);g.moveTo(l.x+10,l.y0);g.lineTo(l.x+10,l.y1);g.stroke();g.strokeStyle=metal?'#c4c9d0':'#8a6a44';g.lineWidth=4;for(let y=l.y0+6;y<l.y1;y+=14){g.beginPath();g.moveTo(l.x-10,y);g.lineTo(l.x+10,y);g.stroke()}}

window.PTP={KIND,S,drawMan,scene,tiles,bush,ladder,skyNight,seaBand,palmSil,stripedHouseSide,hexShade,use};
})();
