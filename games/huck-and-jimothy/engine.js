'use strict';
/* Shared Jimothy Timothy shell.
   Copied from Jimothy Timothy Vol. 2 (The Lantern Picnic) and the earlier
   Hair Mob volume: swipe-anywhere movement, green ACTION on the left,
   orange JUMP on the right, the same HUD, title, menus, camera, and the
   painted-backdrop renderer. Story.js fills in the chapter. */
var AU=(function(){
var A={ctx:null,muted:false,cur:null,next:0,step:0,timer:null,song:null};
var mf=function(m){return 440*Math.pow(2,(m-69)/12);};
A.MUSIC_GAIN=0.21;
A.init=function(){if(this.ctx)return;try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;var c=this.ctx=new C();
 this.master=c.createGain();this.master.gain.value=this.muted?0:0.8;
 var comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;this.master.connect(comp);comp.connect(c.destination);
 this.mus=c.createGain();this.mus.gain.value=A.MUSIC_GAIN;this.mus.connect(this.master);
 this.sfx=c.createGain();this.sfx.gain.value=0.75;this.sfx.connect(this.master);
 var n=c.sampleRate;this.noise=c.createBuffer(1,n,n);var d=this.noise.getChannelData(0);for(var i=0;i<n;i++)d[i]=Math.random()*2-1;}catch(e){this.ctx=null;}};
A.unlock=function(){this.init();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume().catch(function(){});};
A.setMuted=function(m){this.muted=m;if(this.master)this.master.gain.setTargetAtTime(m?0:0.8,this.ctx.currentTime,0.05);};
function env(g,t,a,peak,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);}
function osc(type,f,t,dur,peak,out){var c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);env(g,t,0.01,peak,dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+0.05);return o;}
function tone(m,t,d,v,out){osc('sine',mf(m),t,d,0.16*v,out);osc('triangle',mf(m)*2,t,d*0.4,0.04*v,out);}
function bass(m,t,d,out){osc('triangle',mf(m),t,d,0.2,out);}
function nz(t,d,v,fq,out){var c=A.ctx,s=c.createBufferSource(),g=c.createGain(),fl=c.createBiquadFilter();s.buffer=A.noise;fl.type='bandpass';fl.frequency.value=fq;env(g,t,0.005,v,d);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+d+0.02);}
var SONGS={
 title:{bpm:96,root:65,lead:[0,4,7,4, 12,7,4,2, 0,2,4,7, 4,2,0,null]},
 play:{bpm:118,root:67,lead:[0,4,7,11, 7,4,7,12, 11,7,4,2, 4,7,4,0]},
 win:{bpm:124,root:72,lead:[0,4,7,12, 7,12,16,12, 7,4,7,11, 12,7,4,0]}
};
if(window.STORY&&STORY.songs){for(var sk in STORY.songs)SONGS[sk]=STORY.songs[sk];}
function tick(){var c=A.ctx;if(!c||!A.song)return;var S=A.song,sp=60/S.bpm/2;
 while(A.next<c.currentTime+0.18){var t=A.next,i=A.step%16,out=A.mus;
  if(i%4===0)bass(S.root-12+(i%8===4?7:0),t,sp*3.2,out);
  if(i%8===0){tone(S.root,t,sp*3,0.7,out);tone(S.root+4,t,sp*3,0.45,out);tone(S.root+7,t,sp*2.4,0.35,out);}
  var m=S.lead[i];if(m!=null)tone(S.root+12+m,t,sp*1.3,1,out);
  if(i%2===0)nz(t,0.04,i%4===0?0.05:0.03,7000,out);
  A.next+=sp;A.step++;}}
A.music=function(name){this.init();if(!this.ctx)return;if(this.cur===name)return;this.cur=name;this.song=SONGS[name]||null;this.step=0;this.next=this.ctx.currentTime+0.05;
 if(this.song&&!this.timer)this.timer=setInterval(tick,40);};
A.stop=function(){this.cur=null;this.song=null;};
var FX={
 jump:function(t,o){var x=osc('square',420,t,0.1,0.06,o);x.frequency.exponentialRampToValueAtTime(760,t+0.09);},
 land:function(t,o){osc('sine',140,t,0.08,0.12,o);},
 boop:function(t,o){osc('sine',280,t,0.1,0.16,o);osc('sine',520,t+0.05,0.08,0.08,o);},
 hurt:function(t,o){var x=osc('square',320,t,0.2,0.08,o);x.frequency.exponentialRampToValueAtTime(120,t+0.18);},
 splash:function(t,o){nz(t,0.3,0.22,900,o);osc('sine',180,t,0.2,0.1,o);},
 flick:function(t,o){nz(t,0.12,0.12,1800,o);osc('triangle',640,t,0.08,0.06,o);},
 clear:function(t,o){[72,76,79,84].forEach(function(m,i){tone(m,t+i*0.08,0.2,1.2,o);});},
 win:function(t,o){[72,76,79,84,88,91,96].forEach(function(m,i){tone(m,t+i*0.09,0.22,1.15,o);});},
 nope:function(t,o){osc('square',220,t,0.1,0.06,o);osc('square',180,t+0.12,0.14,0.06,o);},
 menu:function(t,o){tone(84,t,0.12,0.7,o);},
 dig:function(t,o){nz(t,0.16,0.16,600,o);osc('triangle',180,t,0.12,0.08,o);}
};
A.fx=function(n){if(!this.ctx||this.muted)return;var f=FX[n];if(f)try{f(this.ctx.currentTime+0.005,this.sfx);}catch(e){}};
return A;})();
try{Object.defineProperty(window,'muted',{configurable:true,get:function(){return !!AU.muted;}});}catch(e){}

var $=function(id){return document.getElementById(id);};
var cv=$('cv'),c=cv.getContext('2d');
var TAU=Math.PI*2;
function clamp(v,a,b){return v<a?a:v>b?b:v;}
var TS=40,GRAV=1700,RUN=205,JUMP=-700;
var SAVE_KEY=STORY.saveKey;
var save={};
try{save=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch(e){save={};}
if(!save||typeof save!=='object')save={};
save.reached=save.reached|0;save.best=save.best|0;save.cleared=!!save.cleared;save.muted=!!save.muted;
save.levelBest=save.levelBest&&typeof save.levelBest==='object'?save.levelBest:{};
save.run=save.run&&typeof save.run.i==='number'?{i:save.run.i|0,score:save.run.score|0}:null;
save.flags=save.flags&&typeof save.flags==='object'?save.flags:{};
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({reached:save.reached,best:save.best,cleared:save.cleared,muted:save.muted,levelBest:save.levelBest,run:save.run,flags:save.flags}));}catch(e){}}
AU.muted=!!save.muted;
var agedOk=false;

var W=0,H=0,DPR=1,S=1,VV=400,viewW=800,gameH=400,portrait=false,SAFE={t:0,r:0,b:0,l:0};
var state='boot',G=null,SESSION={score:0};
function readSafe(){var p=$('sp');if(!p)return;var cs=getComputedStyle(p);SAFE={t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0};}
function viewWH(){var vv=window.visualViewport,de=document.documentElement;var w=innerWidth||de.clientWidth,h=innerHeight||de.clientHeight;
 if(de.clientHeight>0)h=Math.min(h,de.clientHeight);if(vv&&vv.scale>0.99&&vv.scale<1.01){w=Math.min(w,vv.width)||w;h=Math.min(h,vv.height)||h;}return [Math.max(1,Math.round(w)),Math.max(1,Math.round(h))];}
function resize(){[W,H]=viewWH();DPR=Math.min(devicePixelRatio||1,2);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);portrait=H>W*1.05;readSafe();
 if(portrait){var vw=clamp(W,360,480);S=W/vw;gameH=Math.round(H*0.62);VV=gameH/S;}
 else{VV=400;S=H/VV;gameH=H;}
 viewW=W/S;layoutPad();document.body.classList.toggle('portrait',portrait);}
function layoutPad(){var pad=$('pad'),ba=$('bAct'),bj=$('bJump'),hint=$('swipeHint');if(!pad)return;
 if(portrait){var top=gameH,ph=H-top;pad.style.top=top+'px';pad.style.height=ph+'px';pad.style.pointerEvents='auto';
  var big=Math.round(clamp(ph*0.36,92,124)),sm=Math.round(big*0.84),bot=Math.round(clamp(ph*0.14,18,46))+SAFE.b;
  Object.assign(bj.style,{width:sm+'px',height:sm+'px',left:'',right:(16+SAFE.r)+'px',bottom:bot+'px'});
  Object.assign(ba.style,{width:sm+'px',height:sm+'px',left:'',right:((16+SAFE.r)+sm+18)+'px',bottom:bot+'px'});
  bj.style.setProperty('font-size',Math.round(Math.min(25,sm*0.27))+'px','important');
  ba.style.setProperty('font-size',Math.round(Math.min(18,sm*0.19))+'px','important');
  hint.style.display='';Object.assign(hint.style,{top:'12px',left:(14+SAFE.l)+'px',right:'14px'});}
 else{pad.style.top='0';pad.style.height=H+'px';pad.style.pointerEvents='none';
  var bigL=Math.round(clamp(H*0.21,72,96)),smL=Math.round(bigL*0.82);
  Object.assign(bj.style,{width:smL+'px',height:smL+'px',left:'',right:(14+SAFE.r)+'px',bottom:(12+SAFE.b)+'px',pointerEvents:'auto'});
  Object.assign(ba.style,{width:smL+'px',height:smL+'px',left:'',right:((14+SAFE.r)+smL+16)+'px',bottom:(12+SAFE.b)+'px',pointerEvents:'auto'});
  bj.style.setProperty('font-size',Math.round(Math.min(25,smL*0.27))+'px','important');
  ba.style.setProperty('font-size',Math.round(Math.min(18,smL*0.19))+'px','important');
  hint.style.display='none';}
 if(portrait){bj.style.pointerEvents='auto';ba.style.pointerEvents='auto';}}
addEventListener('resize',resize);addEventListener('orientationchange',function(){setTimeout(resize,160);});
if(window.visualViewport)visualViewport.addEventListener('resize',resize);
setInterval(function(){var wh=viewWH();if(wh[0]!==W||wh[1]!==H)resize();},400);

var K={L:0,R:0,U:0,D:0,J:0,A:0,Y:0},KP={J:0,A:0,Y:0},VIRT={jump:0,act:0},VIRTP={jump:0,act:0},TOUCH=new Map();
var swipeJump=0,lastJ=0,lastA=0,lastY=0;
var inp={L:0,R:0,jump:0,jumpP:0,act:0,actP:0,swap:0,swapP:0};
var KEYMAP={ArrowLeft:'L',KeyA:'L',ArrowRight:'R',KeyD:'R',ArrowUp:'U',KeyW:'U',ArrowDown:'D',KeyS:'D',Space:'J',KeyZ:'J',KeyX:'A',KeyJ:'A',KeyC:'Y',KeyQ:'Y'};
addEventListener('keydown',function(e){AU.unlock();if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
 var k=KEYMAP[e.code];
 if(document.body.classList.contains('uiopen')){if(!e.repeat)uiKey(e);if(k||e.code==='Enter'||e.code==='Space')e.preventDefault();return;}
 if(k){if(!K[k]&&k in KP)KP[k]=1;K[k]=1;e.preventDefault();}
 if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat&&state==='play')pauseGame();
 if(e.code==='KeyM'&&!e.repeat)toggleMute();});
addEventListener('keyup',function(e){var k=KEYMAP[e.code];if(k)K[k]=0;});
function swipeDir(t){var dx=t.x-t.ax,dy=t.y-t.ay,d=Math.hypot(dx,dy),o={};if(d<14)return o;if(d>44){t.ax=t.x-dx/d*44;t.ay=t.y-dy/d*44;}
 var s=Math.round(Math.atan2(dy,dx)/(Math.PI/4));if(s===0||s===1||s===-1)o.R=1;if(s===4||s===-4||s===3||s===-3)o.L=1;if(s===2||s===1||s===3)o.D=1;if(s===-2||s===-1||s===-3)o.U=1;return o;}
function tStart(id,x,y){AU.unlock();TOUCH.set(id,{x:x,y:y,ax:x,ay:y,z:{}});}
function tMove(id,x,y){var t=TOUCH.get(id);if(!t)return;t.x=x;t.y=y;var before=t.z.U;t.z=swipeDir(t);if(t.z.U&&!before)swipeJump=1;}
function tEnd(id){TOUCH.delete(id);}
function clearInput(){TOUCH.clear();for(var k in K)K[k]=0;for(var p in KP)KP[p]=0;VIRT.jump=VIRT.act=VIRTP.jump=VIRTP.act=0;swipeJump=0;document.querySelectorAll('#pad .big.on').forEach(function(b){b.classList.remove('on');});}
function bindSurface(el){if(!el)return;
 el.addEventListener('touchstart',function(e){if(state!=='play')return;if(e.target.closest&&e.target.closest('#pad .big'))return;e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];tStart(t.identifier,t.clientX,t.clientY);}},{passive:false});
 el.addEventListener('touchmove',function(e){if(state!=='play')return;e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];tMove(t.identifier,t.clientX,t.clientY);}},{passive:false});
 el.addEventListener('touchend',function(e){for(var i=0;i<e.changedTouches.length;i++)tEnd(e.changedTouches[i].identifier);},{passive:false});
 el.addEventListener('touchcancel',function(e){for(var i=0;i<e.changedTouches.length;i++)tEnd(e.changedTouches[i].identifier);});
 var md=false;el.addEventListener('mousedown',function(e){if(state!=='play')return;if(e.target.closest&&e.target.closest('#pad .big'))return;md=true;tStart('m',e.clientX,e.clientY);});
 addEventListener('mousemove',function(e){if(md)tMove('m',e.clientX,e.clientY);});
 addEventListener('mouseup',function(){if(md){md=false;tEnd('m');}});}
function bindBtn(el,k){if(!el)return;var on=function(e){e.preventDefault();e.stopPropagation();AU.unlock();if(!VIRT[k])VIRTP[k]=1;VIRT[k]=1;el.classList.add('on');},off=function(e){e.preventDefault();e.stopPropagation();VIRT[k]=0;el.classList.remove('on');};
 el.addEventListener('touchstart',on,{passive:false});el.addEventListener('touchend',off,{passive:false});el.addEventListener('touchcancel',off,{passive:false});
 el.addEventListener('mousedown',on);el.addEventListener('mouseup',off);el.addEventListener('mouseleave',off);el.addEventListener('contextmenu',function(e){e.preventDefault();});}
addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',function(){if(document.hidden){clearInput();if(state==='play')pauseGame();}});
var GP={on:false,L:0,R:0,U:0,D:0,J:0,A:0,Y:0,prev:{}};
function pollPad(){var pads=[];try{pads=navigator.getGamepads?navigator.getGamepads():[];}catch(e){}
 var p=null;for(var i=0;i<(pads?pads.length:0);i++){var q=pads[i];if(q&&q.connected!==false&&q.buttons&&q.buttons.length){p=q;break;}}
 if(!p){if(GP.on){GP.on=false;toast('Controller disconnected');}GP.L=GP.R=GP.U=GP.D=GP.J=GP.A=GP.Y=0;return;}
 if(!GP.on){GP.on=true;toast('Controller connected');refreshCtl();}
 var b=function(i){return !!(p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>0.5));};
 var ax=function(i){return p.axes&&p.axes.length>i?p.axes[i]:0;};
 var x=ax(0),y=ax(1);GP.L=b(14)||x<-0.4?1:0;GP.R=b(15)||x>0.4?1:0;GP.U=b(12)||y<-0.55?1:0;GP.D=b(13)||y>0.55?1:0;
 GP.J=b(0)?1:0;GP.A=(b(2)||b(1))?1:0;GP.Y=b(3)?1:0;
 var now={st:b(9),a:b(0),u:GP.U,d:GP.D},pr=GP.prev,edge=function(k){return now[k]&&!pr[k];};GP.prev=now;
 if(edge('st')){if(state==='play')pauseGame();else if(state==='pause')resumeGame();}
 if(document.body.classList.contains('uiopen')){if(edge('u'))gpFocus(gpIdx-1);if(edge('d'))gpFocus(gpIdx+1);
  if(edge('a')){var t=document.querySelector('#ui .gpf')||document.querySelector('#ui [data-a]');if(t)t.click();}}}
addEventListener('gamepadconnected',function(){pollPad();});
var gpIdx=0,kbUsed=false;
addEventListener('keydown',function(){kbUsed=true;},{once:true});
function gpFocus(i,ns){var bs=[].slice.call(document.querySelectorAll('#ui [data-a]'));if(!bs.length)return;gpIdx=(i+bs.length)%bs.length;bs.forEach(function(b,j){b.classList.toggle('gpf',j===gpIdx);});if(!ns){try{bs[gpIdx].scrollIntoView({block:'nearest'});}catch(e){}AU.fx('menu');}}
function uiKey(e){var nav={ArrowDown:1,ArrowRight:1,KeyS:1,KeyD:1,ArrowUp:-1,ArrowLeft:-1,KeyW:-1,KeyA:-1}[e.code];
 if(nav)gpFocus(gpIdx+(document.querySelector('#ui .gpf')?nav:0));
 else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyZ'){var t=document.querySelector('#ui .gpf')||document.querySelector('#ui [data-a]');if(t)t.click();}
 else if(e.code==='Escape'||e.code==='Backspace'||e.code==='KeyP'){var bk=document.querySelector('#ui [data-a="back"],#ui [data-a="resume"]');if(bk)bk.click();}}
function readInput(){pollPad();var L=K.L||GP.L,R=K.R||GP.R;
 TOUCH.forEach(function(t){if(t.z.L)L=1;if(t.z.R)R=1;});
 inp.L=L&&!R?1:0;inp.R=R&&!L?1:0;
 var j=!!(K.J||GP.J||VIRT.jump||VIRTP.jump||KP.J);inp.jumpP=((j&&!lastJ)||swipeJump||KP.J||VIRTP.jump)?1:0;inp.jump=j||swipeJump?1:0;lastJ=j;swipeJump=0;
 var a=!!(K.A||GP.A||VIRT.act||VIRTP.act||KP.A);inp.actP=(a&&!lastA)||KP.A||VIRTP.act?1:0;inp.act=a?1:0;lastA=a;
 var y=!!(K.Y||GP.Y||KP.Y);inp.swapP=(y&&!lastY)||KP.Y?1:0;inp.swap=y?1:0;lastY=y;
 VIRTP.jump=VIRTP.act=0;KP.J=KP.A=KP.Y=0;}

var IMG={},PAT={};
function loadArt(onp){return fetch('art/meta.json?v='+VERSION).then(function(r){return r.json();}).then(function(m){
 var ns=Object.keys(m),done=0;
 return Promise.all(ns.map(function(n){return new Promise(function(res){var im=new Image();
  im.onload=function(){IMG[n]=im;done++;if(onp)onp(done/ns.length);res();};
  im.onerror=function(){done++;if(onp)onp(done/ns.length);res();};
  im.src='art/'+n+'.webp?v='+VERSION;});}));
}).catch(function(){});}
function spr(n,x,y,sc,flip,rot,ay){var im=IMG[n];if(!im)return 0;sc=sc||1;ay=ay==null?1:ay;var w=im.width*0.5*sc,h=im.height*0.5*sc;
 c.save();c.translate(x,y);if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(im,-w/2,-h*ay,w,h);c.restore();return h;}
function shadow(x,y,w){c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(x,y-2,w,5,0,0,TAU);c.fill();}
function burst(x,y,n,colors){for(var i=0;i<n;i++)G.parts.push({x:x,y:y,vx:(Math.random()-0.5)*180,vy:-40-Math.random()*160,g:500,l:0.4+Math.random()*0.35,s:2+Math.random()*3,c:colors[i%colors.length]});}
function floatText(x,y,txt,col){G.texts.push({x:x,y:y,txt:txt,col:col,l:0.9});}
function addScore(n){SESSION.score+=n;}
function toast(msg){var t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('on');},1700);}
function near(ax,ay,bx,by,r){var dx=ax-bx,dy=ay-by;return dx*dx+dy*dy<r*r;}
function roundRect(x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else{c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}}

function cellAt(grid,tx,ty){if(tx<0||tx>=grid[0].length)return 1;if(ty<0)return 0;if(ty>=grid.length)return 0;return grid[ty][tx];}
function buildLevel(spec){
 var H=spec.h,W=spec.w,GR=spec.ground,grid=[];
 for(var y=0;y<H;y++){var row=new Array(W).fill(0);if(y>=GR)for(var x=0;x<W;x++)row[x]=1;grid.push(row);}
 (spec.holes||[]).forEach(function(h){for(var i=0;i<h[1];i++)for(var y=GR;y<H;y++)if(grid[y][h[0]+i]!=null)grid[y][h[0]+i]=3;});
 (spec.plats||[]).forEach(function(p){for(var i=0;i<p[2];i++)if(grid[p[1]]&&p[0]+i>0&&p[0]+i<W-1)grid[p[1]][p[0]+i]=2;});
 (spec.walls||[]).forEach(function(w){for(var j=0;j<w[3];j++)for(var i=0;i<w[2];i++){var ty=w[1]+j,tx=w[0]+i;if(grid[ty]&&tx>=0&&tx<W&&ty<GR)grid[ty][tx]=1;}});
 var ents=[];
 if(STORY.fill)STORY.fill(spec,ents);
 var goal={k:'goal',x:(spec.goal+0.5)*TS,y:GR*TS};
 return {grid:grid,w:W,h:H,ground:GR,ents:ents,goal:goal,mapW:W*TS,mapH:H*TS};
}
function makePlayer(x,y,hb){return {x:x,y:y,vx:0,vy:0,w:hb.w,h:hb.h,face:1,onG:false,coy:0,buf:0,cut:false,inv:0,flick:0,runDist:0,hurt:0,prevY:y,dead:0};}
function hits(p,x,y,pred){var x0=Math.floor((x-p.w/2)/TS),x1=Math.floor((x+p.w/2-0.01)/TS),y0=Math.floor((y-p.h)/TS),y1=Math.floor((y-0.01)/TS),out=[];
 for(var ty=y0;ty<=y1;ty++)for(var tx=x0;tx<=x1;tx++){var t=cellAt(G.L.grid,tx,ty);if(pred(t))out.push({tx:tx,ty:ty,t:t});}return out;}
function resolveX(p){for(var n=0;n<4;n++){var hs=hits(p,p.x,p.y,function(t){return t===1;});if(!hs.length)return;var h=hs[0];
 if(p.vx>0||p.x>(h.tx+0.5)*TS)p.x=h.tx*TS-p.w/2-0.05;else p.x=(h.tx+1)*TS+p.w/2+0.05;p.vx=0;}}
function resolveY(p,prevY){p.onG=false;
 if(p.vy<0){var hs=hits(p,p.x,p.y,function(t){return t===1;});
  if(hs.length){var bot=-1e9;hs.forEach(function(h){bot=Math.max(bot,(h.ty+1)*TS);});p.y=bot+p.h+0.05;p.vy=0;}}
 if(p.vy>=0){var x0=Math.floor((p.x-p.w/2)/TS),x1=Math.floor((p.x+p.w/2-0.01)/TS),land=null;
  for(var tx=x0;tx<=x1;tx++)for(var ty=0;ty<G.L.h;ty++){var t=cellAt(G.L.grid,tx,ty);if(t!==1&&t!==2)continue;var top=ty*TS;
   if(prevY<=top+1&&p.y>=top-0.5&&p.y-p.h<top-1){if(land==null||top<land)land=top;}}
  if(land!=null){p.y=land;p.vy=0;p.onG=true;p.coy=0.12;}
  else{var hs2=hits(p,p.x,p.y,function(t){return t===1;});if(hs2.length){var top=1e9;hs2.forEach(function(h){top=Math.min(top,h.ty*TS);});p.y=top;p.vy=0;p.onG=true;p.coy=0.12;}}}}
function updatePlayer(p,dt){if(G.won||p.dead){p.vx*=0.8;p.vy=Math.min(900,p.vy+GRAV*dt);return;}
 var prevY=p.y;p.prevY=prevY;
 var speed=(G.spec.speed||RUN);
 var target=(inp.R?speed:0)-(inp.L?speed:0);
 var acc=(p.onG?1500:980)*dt;p.vx+=clamp(target-p.vx,-acc,acc);
 if(inp.R)p.face=1;else if(inp.L)p.face=-1;
 if(inp.jumpP)p.buf=0.14;
 p.buf-=dt;p.coy-=dt;p.inv=Math.max(0,p.inv-dt);p.flick=Math.max(0,p.flick-dt);p.hurt=Math.max(0,p.hurt-dt);
 if(p.buf>0&&(p.onG||p.coy>0)){p.vy=JUMP;p.onG=false;p.coy=0;p.buf=0;p.cut=false;AU.fx('jump');}
 if(!inp.jump&&p.vy<0&&!p.cut){if(p.vy<-460)p.vy=-460;p.cut=true;}
 if(inp.actP&&STORY.onAction)STORY.onAction();
 p.vy=Math.min(860,p.vy+GRAV*dt);
 p.x+=p.vx*dt;resolveX(p);
 var minX=22,maxX=G.L.mapW-22;if(p.x<minX){p.x=minX;if(p.vx<0)p.vx=0;}if(p.x>maxX){p.x=maxX;if(p.vx>0)p.vx=0;}
 p.y+=p.vy*dt;resolveY(p,prevY);
 if(p.onG){p.runDist+=Math.abs(p.vx)*dt;G.cpT-=dt;var tx=Math.floor(p.x/TS);
  if(G.cpT<=0&&cellAt(G.L.grid,tx,G.L.ground)===1){G.cpT=0.45;G.checkpoint.x=p.x;G.checkpoint.y=G.L.ground*TS;}}
 if(!p.onG&&p.y>G.L.ground*TS+70)pit(p);}
function hurt(p,fromX){if(p.inv>0||G.won||p.dead)return;G.hearts--;p.inv=1.45;p.hurt=0.45;p.vy=-300;p.vx=fromX<p.x?240:-240;p.onG=false;G.shake=7;AU.fx('hurt');
 if(G.hearts<=0){p.dead=1;G.fail=0.7;}}
function pit(p){if(p.inv>0||G.won)return;hurt(p,p.x+10);AU.fx('splash');burst(p.x,G.L.ground*TS,8,['#e6c27a','#fff']);
 if(G.hearts>0){p.x=G.checkpoint.x;p.y=G.checkpoint.y;p.vx=0;p.vy=0;p.inv=1.2;toast(STORY.pitText?STORY.pitText():'Back to safe ground.');}}
function updateGoal(){var p=G.p,g=G.L.goal;if(G.won||p.dead)return;
 if(Math.abs(p.x-g.x)<42&&Math.abs(p.y-g.y)<40){
  if(STORY.goalOk&&!STORY.goalOk()){if(G.nagged<=0){G.nagged=1.35;toast(STORY.blockText?STORY.blockText():'Not yet.');AU.fx('nope');p.vx=-p.face*160;}}
  else{G.won=1;G.wonT=0.75;AU.fx('win');burst(g.x,g.y-20,16,['#ffd060','#fff','#ff8a3a']);}}}
function update(dt){var p=G.p;G.t+=dt;G.banner=Math.max(0,G.banner-dt);G.nagged=Math.max(0,G.nagged-dt);G.shake=Math.max(0,G.shake-dt*18);
 if(G.fail>0){G.fail-=dt;if(G.fail<=0)failLevel();return;}
 if(!G.won)updatePlayer(p,dt);else{G.wonT-=dt;p.face=1;p.vx*=0.8;}
 if(state!=='play')return;
 if(STORY.tick)STORY.tick(dt);
 updateGoal();
 G.parts.forEach(function(q){q.l-=dt;q.vy+=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;});G.parts=G.parts.filter(function(q){return q.l>0;});
 G.texts.forEach(function(t){t.l-=dt;t.y-=36*dt;});G.texts=G.texts.filter(function(t){return t.l>0;});
 if(G.won&&G.wonT<=0)finishLevel();}
function snapCam(instant){var p=G.p;var playH=VV-(portrait?0:110/S);
 var ty=G.L.ground*TS+36-(playH*0.78);var minY=Math.min(0,G.L.mapH-VV),maxY=Math.max(0,G.L.mapH-VV);
 ty=clamp(ty,minY,maxY);var tx=clamp(p.x-viewW*0.38,0,Math.max(0,G.L.mapW-viewW));
 if(instant){G.cam.x=tx;G.cam.y=ty;}else{G.cam.x+=(tx-G.cam.x)*0.18;G.cam.y+=(ty-G.cam.y)*0.12;}}

function drawBG(){var th=STORY.themes[G.spec.theme],im=IMG[th.bg],skyH=portrait?gameH:H;
 var g=c.createLinearGradient(0,0,0,skyH);g.addColorStop(0,th.sky[0]);g.addColorStop(1,th.sky[1]);c.fillStyle=g;c.fillRect(0,0,W,skyH);
 if(im){var groundSy=(G.L.ground*TS-70-G.cam.y)*S;var h=Math.max(skyH*0.92,groundSy/0.86),w=h*im.width/im.height;
  var off=-((G.cam.x*S*0.22)%(w*2)),y=groundSy-h*0.86;
  for(var i=0,x=off-w;x<W+w;i++,x+=w){c.save();if(i%2){c.translate(x+w,y);c.scale(-1,1);c.drawImage(im,0,0,w,h);}else c.drawImage(im,x,y,w,h);c.restore();}}
 if(th.night){c.fillStyle='rgba(16,8,36,.2)';c.fillRect(0,0,W,skyH);}}
function drawTiles(){var th=STORY.themes[G.spec.theme],L=G.L,x0=Math.max(0,Math.floor(G.cam.x/TS)-1),x1=Math.min(L.w-1,Math.floor((G.cam.x+viewW)/TS)+1);
 var patt=null;
 if(th.ground!=='sand'&&IMG[th.ter]){if(!PAT[th.ter]){var p=c.createPattern(IMG[th.ter],'repeat');try{p.setTransform(new DOMMatrix().scale(0.5));}catch(e){}PAT[th.ter]=p;}patt=PAT[th.ter];}
 for(var ty=0;ty<L.h;ty++)for(var tx=x0;tx<=x1;tx++){var t=L.grid[ty][tx];if(!t)continue;var x=tx*TS,y=ty*TS;
  if(t===3&&ty===L.ground){c.fillStyle=th.pit||'#d7b56a';c.fillRect(x,y+6,TS,TS*2.2);c.fillStyle='rgba(255,255,255,.28)';c.fillRect(x,y+10+Math.sin(G.t*3+tx)*2,TS,4);}
  else if(t===1){c.fillStyle=th.ground==='sand'?'#e4c07a':(patt||'#6a5344');c.fillRect(x,y,TS+0.6,TS+40);
   if(ty===0||L.grid[ty-1][tx]!==1){c.fillStyle=th.ground==='sand'?'#f3dea0':'rgba(255,255,255,.22)';c.fillRect(x,y,TS+0.6,5);}}
  else if(t===2){c.fillStyle=th.plank;roundRect(x+1,y+8,TS-2,14,4);c.fill();c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x+5,y+10,TS-10,3);}}}
function drawWorld(){drawTiles();
 if(STORY.drawUnder)STORY.drawUnder();
 G.L.ents.forEach(function(e){if(STORY.drawEnt)STORY.drawEnt(e);});
 if(STORY.drawGoal)STORY.drawGoal(G.L.goal);
 if(STORY.drawActor)STORY.drawActor(G.p);
 G.parts.forEach(function(q){c.globalAlpha=Math.max(0,q.l*2);c.fillStyle=q.c;c.beginPath();c.arc(q.x,q.y,q.s,0,TAU);c.fill();});c.globalAlpha=1;
 G.texts.forEach(function(t){c.globalAlpha=Math.max(0,t.l);c.fillStyle=t.col;c.font="16px 'Lilita One',system-ui";c.textAlign='center';c.fillText(t.txt,t.x,t.y);c.globalAlpha=1;});
 if(STORY.drawOver)STORY.drawOver();
 drawArrow();}
function drawArrow(){var target=STORY.arrow?STORY.arrow():G.L.goal;if(!target)return;
 var sx=(target.x-G.cam.x)*S,sy=(target.y-G.cam.y)*S,lim=portrait?gameH:H;
 if(sx>36&&sx<W-36&&sy>36&&sy<lim-36)return;
 var ax=clamp(sx,48,W-48),ay=clamp(sy,48,lim-48);c.save();c.translate(ax,ay);c.rotate(Math.atan2(sy-ay,sx-ax));c.globalAlpha=0.85;c.fillStyle='#fff6d0';c.strokeStyle='#c07010';c.lineWidth=2;
 c.beginPath();c.moveTo(14,0);c.lineTo(-8,-9);c.lineTo(-8,-3);c.lineTo(-14,-3);c.lineTo(-14,3);c.lineTo(-8,3);c.lineTo(-8,9);c.closePath();c.fill();c.stroke();c.restore();}
function hudText(text,x,y,fill,size){c.font=size+"px 'Lilita One',system-ui";c.lineWidth=4;c.strokeStyle='rgba(10,12,28,.8)';c.strokeText(text,x,y);c.fillStyle=fill;c.fillText(text,x,y);}
function heart(x,y,full){c.save();c.translate(x,y);c.scale(0.7,0.7);c.beginPath();c.moveTo(0,6);c.bezierCurveTo(-12,-4,-12,-14,-6,-14);c.bezierCurveTo(-2,-14,0,-10,0,-8);c.bezierCurveTo(0,-10,2,-14,6,-14);c.bezierCurveTo(12,-14,12,-4,0,6);c.fillStyle=full?'#ff5a7a':'#3a3040';c.fill();c.restore();}
function drawHUD(){var top=SAFE.t+14,left=SAFE.l+14;c.textAlign='left';
 if(STORY.needsAge){c.fillStyle='#8d1828';c.strokeStyle='#fff';c.lineWidth=2;roundRect(left,top-12,46,22,11);c.fill();c.stroke();c.font="14px 'Lilita One',system-ui";c.fillStyle='#fff';c.fillText('21+',left+8,top+4);left+=56;}
 for(var i=0;i<Math.max(3,G.hearts);i++){if(i<5)heart(left+i*26,top+4,i<G.hearts);}
 hudText(SESSION.score.toLocaleString(),left,top+48,'#fff','20');
 var line=STORY.hudLine?STORY.hudLine():'';
 if(line)hudText(line,left+118,top+48,'#ffe080','18');
 hudText(G.spec.id+'  '+G.spec.name,left,top+70,'#ffe8c0','15');
 if(G.banner>0&&G.spec.banner){c.globalAlpha=Math.min(1,G.banner);c.textAlign='center';c.lineWidth=4;c.strokeStyle='rgba(10,12,28,.75)';c.font="18px 'Lilita One',system-ui";
  var by=portrait?gameH*0.24:(top+98);c.strokeText(G.spec.banner,W/2,by);c.fillStyle='#fff6d0';c.fillText(G.spec.banner,W/2,by);c.globalAlpha=1;c.textAlign='left';}}
function render(){c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);
 var showG=G&&(state==='play'||state==='pause'||state==='shop'||state==='clear'||state==='fail');
 if(!showG)return;
 drawBG();c.save();if(portrait){c.beginPath();c.rect(0,0,W,gameH);c.clip();}
 var sh=G.shake>0?(Math.random()-0.5)*G.shake:0;c.translate(sh,0);c.scale(S,S);c.translate(-G.cam.x,-G.cam.y);drawWorld();c.restore();
 if(state==='play')drawHUD();}

var ui=$('ui');
function show(html,cls){if(window.SkipBtn)SkipBtn.hide();var old=$('toast');if(old)old.classList.remove('on');ui.innerHTML='<div class="scr '+(cls||'')+'">'+html+'</div>';document.body.classList.add('uiopen');gpIdx=0;
 ui.querySelectorAll('[data-a]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();AU.unlock();AU.fx('menu');act(b.dataset.a,b.dataset.v);});});
 if(GP.on||kbUsed)setTimeout(function(){gpFocus(0,1);},30);
 var bg=$('bgart');if(bg)bg.hidden=!(cls&&cls.indexOf('title')>=0);
 var dock=$('dock');if(dock)dock.classList.toggle('on',cls==='title');}
function hideUI(){if(window.SkipBtn)SkipBtn.hide();ui.innerHTML='';document.body.classList.remove('uiopen');var bg=$('bgart');if(bg)bg.hidden=true;var dock=$('dock');if(dock)dock.classList.remove('on');}
function ctlLine(){return GP.on?'Stick or D-pad moves · A jumps · X or B is ACTION · Start pauses':'Swipe & hold to move · swipe up to jump · tap ACTION';}
function refreshCtl(){var h=document.querySelector('#ui .ctl');if(h)h.innerHTML=ctlLine();}
function ageScreen(){state='gate';
 show('<div class="age">21+ ONLY</div><h2>ADULTS ONLY</h2><p class="big">This cartoon is about cannabis. You have to be 21 or older to play.</p><p class="sub">Nothing here has a price. No real brands. It is a pretend errand.</p><div class="tbtns"><button class="btn go" data-a="ageyes">I AM 21 OR OLDER</button><button class="btn alt" data-a="ageno">I AM NOT 21</button></div>','title');
 AU.music('title');}
function ageNo(){state='ageno';
 show('<div class="age">21+ ONLY</div><h2>NOT THIS ONE</h2><p class="big">This cartoon is for adults 21 and older.</p><p class="sub">Come back when you are 21. The couch will keep.</p>','title');}
function titleScreen(){state='title';G=null;AU.music('title');
 if(STORY.needsAge&&!agedOk){ageScreen();return;}
 var cont=!!(save.run&&save.run.i<STORY.levels.length);
 var playLabel=cont?'CONTINUE':(save.cleared?'PLAY AGAIN':'PLAY');
 var age=STORY.needsAge?'<div class="age">21+ ONLY</div>':'';
 show(age+STORY.logo+'<div class="tbtns"><button class="btn go" data-a="play">'+playLabel+'</button>'+(cont||save.cleared?'<button class="btn alt" data-a="new">'+STORY.newLabel+'</button>':'')+
 '<button class="btn alt2" data-a="levels">'+STORY.pathsLabel+'</button><button class="btn dim" data-a="how">HOW TO PLAY</button></div><p class="tag">'+STORY.tagline+'</p>'+
 (save.best?'<p class="sub">Best on this phone: '+save.best.toLocaleString()+'</p>':'')+'<p class="ctl sub">'+ctlLine()+'</p>','title');}
function storyScreen(){if(!STORY.intro){planScreen(0,false,0);return;}
 if(window.SkipBtn&&SkipBtn.seen(STORY.introKey)){planScreen(0,false,0);return;}
 state='story';show(STORY.intro,'menu');AU.music('title');
 if(window.SkipBtn)SkipBtn.show(function(){if(window.SkipBtn)SkipBtn.seen(STORY.introKey,1);planScreen(0,false,0);},{top:portrait});}
function planScreen(i,practice,score){state='plan';pending={i:i,practice:!!practice,score:score||0};var s=STORY.levels[i];
 show('<div class="board"><div class="ct">'+STORY.pathWord+' '+s.id+' OF '+STORY.levels.length+'</div><h2>'+s.name+'</h2><div class="chalk"><div class="ct">THE PLAN</div>'+s.plan.map(function(l,k){return '<p>'+(k+1)+'. '+l+'</p>';}).join('')+'</div></div><button class="btn go" data-a="go">LET\'S GO</button><button class="btn alt" data-a="back">BACK</button>','menu');AU.music('title');}
function clearScreen(){state='clear';var s=G.spec,last=!G.practice&&G.si>=STORY.levels.length-1;
 var extra=STORY.clearRows?STORY.clearRows():'';
 show('<h2>'+STORY.clearTitle+'</h2><p class="tag">'+s.done+'</p><table class="st"><tr><td>Time bonus</td><td>'+G.timeBonus+'</td></tr><tr><td>Heart bonus</td><td>'+G.heartBonus+'</td></tr>'+extra+'<tr><td>Score</td><td>'+SESSION.score.toLocaleString()+'</td></tr></table><div class="tbtns">'+(G.practice?'<button class="btn go" data-a="levels">'+STORY.pathsLabel+'</button>':(last?'':'<button class="btn go" data-a="next">NEXT</button>'))+'<button class="btn alt" data-a="title">TITLE</button></div>','menu');AU.music('win');}
function endingScreen(){state='ending';var age=STORY.needsAge?'<div class="age">21+ ONLY</div>':'';
 show(age+(STORY.ending?STORY.ending():'<h2>DONE</h2>')+'<p class="sub">'+STORY.parent+'</p><div class="tbtns"><button class="btn go" data-a="new">'+STORY.againLabel+'</button><button class="btn alt" data-a="levels">'+STORY.pathsLabel+'</button><button class="btn dim" data-a="title">TITLE</button></div>','menu');AU.music('win');}
function levelsScreen(){state='levels';var h='<h2>'+STORY.pathsLabel+'</h2><div class="lvls">';
 STORY.levels.forEach(function(s,i){var lock=i>save.reached;var best=save.levelBest[s.id]|0;
  h+='<button class="btn lv '+(lock?'dim':'')+'" data-a="'+(lock?'locked':'lvl')+'" data-v="'+i+'"><span class="n">'+s.id+'</span> '+s.name+'<span class="st">'+(lock?'locked':(best?best.toLocaleString():'open'))+'</span></button>';});
 show(h+'</div><p class="sub">'+STORY.pathsNote+'</p><button class="btn alt" data-a="back">BACK</button>','menu');}
function howScreen(){state='how';show('<h2>HOW TO PLAY</h2><ul class="how">'+STORY.how.map(function(li){return '<li>'+li+'</li>';}).join('')+'</ul><p class="sub">'+STORY.parent+'</p><button class="btn alt" data-a="back">BACK</button>','menu');}
function pauseGame(){if(state!=='play'||!G)return;state='pause';clearInput();
 show('<h2>PAUSED</h2><p class="sub">'+STORY.pathWord+' '+G.spec.id+' · '+G.spec.name+'</p><div class="tbtns"><button class="btn go" data-a="resume">RESUME</button><button class="btn alt" data-a="retry">RESTART</button><button class="btn alt2" data-a="levels">'+STORY.pathsLabel+'</button><button class="btn dim" data-a="title">TITLE</button></div><p class="ctl sub">'+ctlLine()+'</p>','menu');}
function resumeGame(){hideUI();state='play';clearInput();last=performance.now();}
function openMenu(html){state='shop';show(html,'menu');}
var pending=null;
function startLevel(i,practice,score){
 var spec=STORY.levels[i];if(!spec)return;
 var L=buildLevel(spec);
 var gy=spec.ground*TS;
 G={si:i,spec:spec,L:L,practice:!!practice,t:0,hearts:spec.hearts||3,banner:3.6,scoreAt:score||0,levelStart:score||0,won:0,fail:0,nagged:0,parts:[],texts:[],cam:{x:0,y:0},shake:0,got:{},checkpoint:{x:(spec.player+0.5)*TS,y:gy},cpT:0};
 SESSION.score=G.levelStart;
 var hb=STORY.hitbox?STORY.hitbox(spec):{w:30,h:54};
 G.p=makePlayer((spec.player+0.5)*TS,gy,hb);
 if(STORY.begin)STORY.begin(spec,!!practice);
 if(!practice){save.run={i:i,score:G.levelStart};persist();}
 hideUI();state='play';clearInput();AU.music(spec.song||'play');last=performance.now();snapCam(true);}
function finishLevel(){var spec=G.spec,elapsed=G.t,timeBonus=Math.max(0,Math.round((spec.par-elapsed)*8)),heartBonus=G.hearts*80;
 addScore(timeBonus+heartBonus);G.timeBonus=timeBonus;G.heartBonus=heartBonus;
 if(STORY.onClear)STORY.onClear();
 var gained=SESSION.score-G.levelStart;save.levelBest[spec.id]=Math.max(save.levelBest[spec.id]|0,gained);
 if(!G.practice){save.reached=Math.max(save.reached,Math.min(STORY.levels.length-1,G.si+1));
  if(G.si>=STORY.levels.length-1){save.cleared=true;save.run=null;if(SESSION.score>save.best)save.best=SESSION.score;}
  else save.run={i:G.si+1,score:SESSION.score};}
 persist();
 if(!G.practice&&G.si>=STORY.levels.length-1)endingScreen();else clearScreen();}
function failLevel(){SESSION.score=G.levelStart;if(!G.practice&&save.run)save.run.score=G.levelStart;persist();
 state='fail';AU.music('title');show('<h2>'+STORY.failTitle+'</h2><p class="big">'+STORY.failBody+'</p><div class="tbtns"><button class="btn go" data-a="retry">TRY AGAIN</button><button class="btn alt" data-a="levels">'+STORY.pathsLabel+'</button><button class="btn dim" data-a="title">TITLE</button></div>','menu');}
function act(a,v){
 if(STORY.menu&&STORY.menu(a,v))return;
 if(a==='ageyes'){agedOk=true;titleScreen();}
 else if(a==='ageno')ageNo();
 else if(a==='play'){if(save.run)planScreen(save.run.i,false,save.run.score);else storyScreen();}
 else if(a==='new'){save.run=null;save.flags={};persist();if(window.SkipBtn)SkipBtn.seen(STORY.introKey,1);planScreen(0,false,0);}
 else if(a==='storygo'){if(window.SkipBtn)SkipBtn.seen(STORY.introKey,1);planScreen(0,false,0);}
 else if(a==='go'&&pending)startLevel(pending.i,pending.practice,pending.score);
 else if(a==='levels')levelsScreen();
 else if(a==='how')howScreen();
 else if(a==='lvl')planScreen(+v,true,0);
 else if(a==='locked'){AU.fx('nope');toast(STORY.lockText||'Finish the earlier one first.');}
 else if(a==='back'||a==='title')titleScreen();
 else if(a==='resume')resumeGame();
 else if(a==='retry'&&G)startLevel(G.si,G.practice,G.levelStart);
 else if(a==='next'&&G)planScreen(G.si+1,false,SESSION.score);}
function toggleMute(){AU.setMuted(!AU.muted);save.muted=AU.muted;persist();var b=$('bMute');if(b)b.textContent=AU.muted?'🔇':'🔊';toast(AU.muted?'Sound off':'Sound on');}

var last=performance.now(),booted=false;
function loop(now){requestAnimationFrame(loop);var dt=Math.min(0.034,(now-last)/1000);last=now;
 if(state==='play'&&G){readInput();var n=dt>0.02?2:1;for(var i=0;i<n&&state==='play';i++){update(dt/n);inp.jumpP=0;inp.actP=0;inp.swapP=0;}if(state==='play')snapCam(false);}
 else pollPad();
 render();}
function boot(){if(booted)return;booted=true;var l=$('load');if(l)l.remove();
 if(STORY.needsAge)ageScreen();else titleScreen();}
resize();bindSurface(cv);bindSurface($('pad'));bindBtn($('bJump'),'jump');bindBtn($('bAct'),'act');
var muteBtn=$('bMute');if(muteBtn){muteBtn.textContent=AU.muted?'🔇':'🔊';muteBtn.addEventListener('click',function(e){e.stopPropagation();AU.unlock();toggleMute();});}
var pauseBtn=$('bPause');if(pauseBtn)pauseBtn.addEventListener('click',function(e){e.stopPropagation();if(state==='play')pauseGame();});
loadArt(function(f){var b=document.querySelector('#load .bar i');if(b)b.style.width=Math.round(f*100)+'%';}).then(boot);
setTimeout(boot,8000);
requestAnimationFrame(loop);
window.__probe=function(){if(!G||!G.p)return {state:state,aged:agedOk,errs:(window.__ERR||[]).slice()};
 var p=G.p;return {state:state,aged:agedOk,si:G.si,name:G.spec.name,x:Math.round(p.x),y:Math.round(p.y),vx:Math.round(p.vx),vy:Math.round(p.vy),onG:p.onG,hearts:G.hearts,won:!!G.won,dead:!!p.dead,face:p.face,score:SESSION.score,got:G.got,flags:save.flags,goal:Math.round(G.L.goal.x),who:G.spec.who,puzzle:G.puzzle||0,order:G.order||null,
  ents:G.L.ents.filter(function(e){return !e.got;}).map(function(e){return {k:e.k,kind:e.kind||e.role||e.art||'',i:e.i,rot:e.rot,x:Math.round(e.x),y:Math.round(e.y)};}),
  holeAhead:(function(){var tx=Math.floor((p.x+p.face*36)/TS);return !!(G.L.grid[G.L.ground]&&G.L.grid[G.L.ground][tx]===3);})(),
  errs:(window.__ERR||[]).slice()};};
