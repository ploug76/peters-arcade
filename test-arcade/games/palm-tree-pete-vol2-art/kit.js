/* kit.js — shared canvas game kit for the Vol 2 remakes (FIVE8NINE / Book of Heaven).
   Canvas UI buttons (finger-safe: matched by id on release), touch gestures, keyboard + full Gamepad API
   (menus navigable with D-pad/stick, A select, B back), WebAudio synth + music sequencer, saves,
   story player with SKIP, particles/shake, jointed limb rig with speed-tied gait. */
(function(){'use strict';
const K=window.K={};
const cv=document.getElementById('cv'),X=cv.getContext('2d');K.cv=cv;K.X=X;
K.W=360;K.H=640;K.DPR=1;K.safe={t:0,r:0,b:0,l:0};K.land=false;K.t=0;K.dt=0;
const sp=document.getElementById('sp');
function resize(){K.W=innerWidth;K.H=innerHeight;K.DPR=Math.min(2.5,devicePixelRatio||1);cv.width=Math.round(K.W*K.DPR);cv.height=Math.round(K.H*K.DPR);cv.style.width=K.W+'px';cv.style.height=K.H+'px';
 if(sp){const c=getComputedStyle(sp);K.safe={t:parseFloat(c.paddingTop)||0,r:parseFloat(c.paddingRight)||0,b:parseFloat(c.paddingBottom)||0,l:parseFloat(c.paddingLeft)||0}}
 K.land=K.W>K.H;document.body.classList.toggle('land',K.land);if(K.scene&&K.scene.resize)K.scene.resize()}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
K.resize=resize;
/* ---------- math ---------- */
K.clamp=(v,a,b)=>v<a?a:v>b?b:v;K.lerp=(a,b,t)=>a+(b-a)*t;K.rand=(a,b)=>a+Math.random()*(b-a);K.ri=(a,b)=>Math.floor(K.rand(a,b+1));K.pick=a=>a[Math.floor(Math.random()*a.length)];
K.ease={out:t=>1-Math.pow(1-t,3),inout:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,back:t=>{const c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}};
K.hit=(px,py,r)=>px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h;
K.overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
/* ---------- save ---------- */
K.load=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:Object.assign(Array.isArray(d)?[]:{},d,v)}catch(e){return d}};
K.store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
/* ---------- draw helpers ---------- */
K.font=(px,w,fam)=>(w||800)+' '+px+'px '+(fam||K.FONT||'"Lilita One","Arial Rounded MT Bold",system-ui,sans-serif');
K.rr=(x,y,w,h,r)=>{r=Math.max(0,Math.min(r,w/2,h/2));X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath()};
K.text=(s,x,y,px,fill,o)=>{o=o||{};X.font=K.font(px,o.w,o.fam);X.textAlign=o.align||'center';X.textBaseline=o.base||'middle';
 if(o.max){let p=px;while(p>10&&X.measureText(s).width>o.max){p--;X.font=K.font(p,o.w,o.fam)}}
 if(o.glow){X.shadowColor=o.glow;X.shadowBlur=o.gb||12}
 if(o.stroke){X.lineJoin='round';X.strokeStyle=o.stroke;X.lineWidth=o.lw||Math.max(2,px*.14);X.strokeText(s,x,y)}X.fillStyle=fill||'#fff';X.fillText(s,x,y);X.shadowBlur=0};
K.wrap=(s,maxW,px,w)=>{X.font=K.font(px,w);const out=[];for(const para of String(s).split('\n')){let line='';for(const wd of para.split(' ')){const t=line?line+' '+wd:wd;if(X.measureText(t).width>maxW&&line){out.push(line);line=wd}else line=t}out.push(line)}return out};
K.para=(s,x,y,maxW,px,fill,o)=>{o=o||{};const ls=K.wrap(s,maxW,px,o.w);const lh=px*(o.lh||1.25);let yy=y-(o.center?(ls.length-1)*lh/2:0);for(const l of ls){K.text(l,x,yy,px,fill,o);yy+=lh}return ls.length*lh};
/* ---------- images ---------- */
K.img={};K.loadImages=(map,done)=>{const ks=Object.keys(map);let n=ks.length;if(!n){done();return}ks.forEach(k=>{const im=new Image();im.onload=im.onerror=()=>{if(--n===0)done()};im.src=map[k];K.img[k]=im})};
K.drawImg=(k,x,y,h,o)=>{const im=K.img[k];if(!im||!im.complete||!im.naturalWidth)return false;o=o||{};const w=o.w||h*im.naturalWidth/im.naturalHeight;X.save();X.translate(x,y);if(o.rot)X.rotate(o.rot);if(o.sx||o.sy)X.scale(o.sx||1,o.sy||1);if(o.a!=null)X.globalAlpha*=o.a;X.drawImage(im,-w*(o.ax==null?.5:o.ax),-h*(o.ay==null?.5:o.ay),w,h);X.restore();return true};
K.cover=(k,o)=>{const im=K.img[k];if(!im||!im.naturalWidth)return false;o=o||{};const s=Math.max(K.W/im.naturalWidth,K.H/im.naturalHeight)*(o.zoom||1.04);const w=im.naturalWidth*s,h=im.naturalHeight*s;X.drawImage(im,(K.W-w)/2+(o.px||0)*(w-K.W)/2,(K.H-h)*(o.ay==null?.5:o.ay)+(o.py||0),w,h);return true};
/* ---------- studio logo (tiny, title corner) ---------- */
K.logo=(corner)=>{const im=K.img.logo;if(!im||!im.naturalWidth)return null;const s=K.safe;const h=K.studioH||(K.land?30:34);const w=h*im.naturalWidth/im.naturalHeight;
 const x=corner&&corner.indexOf('r')>=0?K.W-s.r-8-w:s.l+8;const y=corner&&corner.indexOf('b')>=0?K.H-s.b-8-h:s.t+8;X.save();X.globalAlpha=.92;X.drawImage(im,x,y,w,h);X.restore();return{x,y,w,h}};
/* ---------- UI buttons ---------- */
K.btns=[];K.focus=null;K.pressed=null;K.charRects=[];K.menuOn=true;
K.button=(id,x,y,w,h,label,o)=>{o=o||{};const b={id,x,y,w,h,label,cb:o.cb,dis:!!o.dis,o};K.btns.push(b);
 const down=K.pressed&&K.pressed.id===id&&K.pressed.over;const foc=K.focus===id&&K.showFocus;const c=o.color||'#6a4fd0',c2=o.color2||shade(c,-.35);
 X.save();X.translate(0,down?2:0);if(b.dis)X.globalAlpha=.5;
 X.fillStyle='rgba(0,0,0,.35)';K.rr(x,y+4,w,h,o.r||Math.min(16,h/2));X.fill();
 const g=X.createLinearGradient(0,y,0,y+h);g.addColorStop(0,c);g.addColorStop(1,c2);X.fillStyle=g;K.rr(x,y,w,h,o.r||Math.min(16,h/2));X.fill();
 X.strokeStyle=o.edge||'rgba(255,255,255,.75)';X.lineWidth=2;X.stroke();
 X.fillStyle='rgba(255,255,255,.18)';K.rr(x+4,y+3,w-8,h*.38,Math.min(12,h/3));X.fill();
 if(foc){X.strokeStyle='#ffe14d';X.lineWidth=4;K.rr(x-4,y-4,w+8,h+8,(o.r||Math.min(16,h/2))+4);X.stroke()}
 if(o.draw)o.draw(x,y,w,h);else K.text(label,x+w/2,y+h/2+1,o.px||Math.min(22,h*.42),o.fg||'#fff',{stroke:'rgba(0,0,0,.35)',lw:3,max:w-14});
 X.restore();return b};
function shade(hex,p){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=p<0?0:255,t=Math.abs(p);r=Math.round((f-r)*t+r);g=Math.round((f-g)*t+g);b=Math.round((f-b)*t+b);return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
K.shade=shade;
function btnAt(x,y){for(let i=K.btns.length-1;i>=0;i--){const b=K.btns[i];if(!b.dis&&K.hit(x,y,{x:b.x-4,y:b.y-4,w:b.w+8,h:b.h+8}))return b}return null}
function fire(id){const b=K.btns.find(q=>q.id===id);if(b&&!b.dis&&b.cb){K.sfx('click');try{b.cb()}catch(e){report(e)}}}
K.fire=fire;
/* ---------- pointers ---------- */
K.ptrs=new Map();
cv.addEventListener('pointerdown',e=>{K.au.unlock();e.preventDefault();K.showFocus=false;const b=btnAt(e.clientX,e.clientY);
 if(b){K.pressed={id:b.id,pid:e.pointerId,over:true};return}
 const p={id:e.pointerId,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,t0:performance.now(),px:e.clientX,py:e.clientY,moved:false};K.ptrs.set(e.pointerId,p);
 if(K.scene&&K.scene.down)K.scene.down(p)});
cv.addEventListener('pointermove',e=>{if(K.pressed&&K.pressed.pid===e.pointerId){const b=btnAt(e.clientX,e.clientY);K.pressed.over=!!(b&&b.id===K.pressed.id);return}
 const p=K.ptrs.get(e.pointerId);if(!p)return;p.px=p.x;p.py=p.y;p.x=e.clientX;p.y=e.clientY;if(Math.hypot(p.x-p.x0,p.y-p.y0)>10)p.moved=true;if(K.scene&&K.scene.move)K.scene.move(p)});
function up(e,cancel){if(K.pressed&&K.pressed.pid===e.pointerId){const id=K.pressed.id;const b=btnAt(e.clientX,e.clientY);K.pressed=null;if(!cancel&&b&&b.id===id)fire(id);return}
 const p=K.ptrs.get(e.pointerId);if(!p)return;K.ptrs.delete(e.pointerId);p.x=e.clientX;p.y=e.clientY;p.dt=performance.now()-p.t0;p.cancel=cancel;if(K.scene&&K.scene.up)K.scene.up(p)}
cv.addEventListener('pointerup',e=>up(e,false));cv.addEventListener('pointercancel',e=>up(e,true));
cv.addEventListener('contextmenu',e=>e.preventDefault());
/* ---------- keyboard ---------- */
K.keys={};K.kp={};
addEventListener('keydown',e=>{K.au.unlock();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code))e.preventDefault();if(!K.keys[e.code])K.kp[e.code]=1;K.keys[e.code]=1;
 if(K.scene&&K.scene.menu&&!e.repeat)menuKey(e.code)});
addEventListener('keyup',e=>{K.keys[e.code]=0});
addEventListener('blur',()=>{K.keys={}});
function menuKey(c){const dir={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'}[c];
 if(dir){K.showFocus=true;nav(dir);return}
 if(c==='Tab'){K.showFocus=true;cycle(1);return}
 if(c==='Enter'||c==='Space'||c==='NumpadEnter'){if(K.focus&&K.showFocus)fire(K.focus);else if(K.scene.primary)fire(K.scene.primary);return}
 if(c==='Escape'||c==='Backspace'){if(K.scene.back)K.scene.back()}}
function cycle(d){const bs=K.btns.filter(b=>!b.dis&&!b.o.nofocus);if(!bs.length)return;let i=bs.findIndex(b=>b.id===K.focus);i=(i+d+bs.length)%bs.length;K.focus=bs[i].id;K.sfx('tick')}
function nav(dir){const bs=K.btns.filter(b=>!b.dis&&!b.o.nofocus);if(!bs.length)return;let cur=bs.find(b=>b.id===K.focus);if(!cur){K.focus=(bs.find(b=>b.id===K.scene.primary)||bs[0]).id;K.sfx('tick');return}
 const cx=cur.x+cur.w/2,cy=cur.y+cur.h/2;let best=null,bd=1e9;for(const b of bs){if(b===cur)continue;const dx=b.x+b.w/2-cx,dy=b.y+b.h/2-cy;
  const ok=dir==='up'?dy<-4:dir==='down'?dy>4:dir==='left'?dx<-4:dx>4;if(!ok)continue;const along=dir==='up'||dir==='down'?Math.abs(dy):Math.abs(dx),across=dir==='up'||dir==='down'?Math.abs(dx):Math.abs(dy);const d=along+across*2.2;if(d<bd){bd=d;best=b}}
 if(!best){cycle(dir==='down'||dir==='right'?1:-1);return}K.focus=best.id;K.sfx('tick')}
/* ---------- gamepad (standard mapping; USB or Bluetooth) ---------- */
K.pad={on:false,held:{},pr:{},ax:{x:0,y:0}};const PADN=['a','b','x','y','lb','rb','lt','rt','select','start','ls','rs','up','down','left','right'];let padRep={};
function pollPad(dt){let gp=null;try{const a=navigator.getGamepads?navigator.getGamepads():[];for(const g of a)if(g&&g.connected){gp=g;break}}catch(e){}
 const P=K.pad;P.pr={};if(!gp){if(P.on){P.on=false;K.toast('🎮 Controller disconnected');if(K.scene&&K.scene.padLost)K.scene.padLost()}P.held={};return}
 if(!P.on){P.on=true;K.toast('🎮 Controller connected');K.showFocus=true}
 const h={};PADN.forEach((n,i)=>{const b=gp.buttons[i];h[n]=!!(b&&(b.pressed||b.value>.5))});const ax=gp.axes[0]||0,ay=gp.axes[1]||0;P.ax={x:Math.abs(ax)>.2?ax:0,y:Math.abs(ay)>.2?ay:0};
 if(ax<-.55)h.left=true;if(ax>.55)h.right=true;if(ay<-.55)h.up=true;if(ay>.55)h.down=true;
 for(const n of PADN){if(h[n]&&!P.held[n])P.pr[n]=1}
 if(Object.keys(P.pr).length){K.au.unlock()}
 if(K.scene&&K.scene.menu){K.showFocus=true;for(const d of ['up','down','left','right']){if(P.pr[d]){nav(d);padRep[d]=.35}else if(h[d]){padRep[d]-=dt;if(padRep[d]<=0){nav(d);padRep[d]=.14}}}
  if(P.pr.a||P.pr.start&&!K.scene.startBack){if(K.focus)fire(K.focus);else if(K.scene.primary)fire(K.scene.primary)}else if(P.pr.b&&K.scene.back)K.scene.back();else if(P.pr.start&&K.scene.startBack)K.scene.back()}
 P.held=h}
addEventListener('gamepadconnected',()=>{});
/* ---------- audio ---------- */
const AU=K.au={ctx:null,master:null,mus:null,sfx:null,muted:false,
 unlock(){if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return}try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);
  this.mus=this.ctx.createGain();this.mus.gain.value=.32;this.mus.connect(this.master);this.sfx=this.ctx.createGain();this.sfx.gain.value=.6;this.sfx.connect(this.master);
  const n=this.ctx.sampleRate;this.nb=this.ctx.createBuffer(1,n,n);const d=this.nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.apply()}catch(e){}},
 apply(){if(this.master)this.master.gain.value=this.muted?0:1},
 tone(f,d,type,v,f2,dl,dest){const c=this.ctx;if(!c)return;const t=c.currentTime+(dl||0);const o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest||this.sfx);o.start(t);o.stop(t+d+.05)},
 noise(d,v,ff,ft,dl,dest){const c=this.ctx;if(!c)return;const t=c.currentTime+(dl||0);const s=c.createBufferSource();s.buffer=this.nb;const f=c.createBiquadFilter();f.type=ft||'lowpass';f.frequency.value=ff||2000;const g=c.createGain();
  g.gain.setValueAtTime(v||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(dest||this.sfx);s.start(t,Math.random()*.5);s.stop(t+d+.05)}};
K.SFX={click(){AU.tone(660,.06,'square',.12,990)},tick(){AU.tone(880,.03,'square',.06)}};
K.sfx=(n,...a)=>{try{const f=K.SFX[n];if(f&&AU.ctx)f(...a)}catch(e){}};
/* music: step sequencer. song={bpm,steps:16,bars:[{ch:[root semis], ...}], lead:[[...16]],bass,drum:'four'|'rock'|'half'|'swing', key:midi, wave:{lead,bass}} */
const NOTE=m=>440*Math.pow(2,(m-69)/12);
K.music={cur:null,step:0,next:0,
 play(song){if(this.cur===song)return;this.cur=song;this.step=0;this.next=0},stop(){this.cur=null},
 tick(){const c=AU.ctx,S=this.cur;if(!c||!S)return;const sd=60/S.bpm/4;if(!this.next||this.next<c.currentTime-.2)this.next=c.currentTime+.05;
  while(this.next<c.currentTime+.12){const st=this.step,bar=Math.floor(st/16)%S.lead.length,s=st%16,t=this.next-c.currentTime;
   const L=S.lead[bar][s];if(L!=null)AU.tone(NOTE(S.key+12+L),sd*(S.leadLen||1.6),S.wave&&S.wave.lead||'square',S.lv||.07,null,t,AU.mus);
   const B=S.bass[bar%S.bass.length][s];if(B!=null)AU.tone(NOTE(S.key-12+B),sd*(S.bassLen||1.8),S.wave&&S.wave.bass||'triangle',S.bv||.16,null,t,AU.mus);
   const D=S.drum||'four';const kick=D==='four'?s%4===0:D==='half'?s%8===0:D==='rock'?(s===0||s===6||s===8||s===10):D==='swing'?(s===0||s===7||s===10):false;const snr=D==='half'?s===8:(s===4||s===12);
   if(kick)AU.tone(140,.12,'sine',.28,40,t,AU.mus);if(snr)AU.noise(.12,.11,3000,'highpass',t,AU.mus);if(s%2===0)AU.noise(.03,.035,8000,'highpass',t,AU.mus);
   if(S.pad&&s===0){const ch=S.chords[bar%S.chords.length];ch.forEach(n=>AU.tone(NOTE(S.key+n),sd*15,'sine',.035,null,t,AU.mus))}
   this.step++;this.next+=sd}}};
/* compose a song from a seed: key, scale, chord roots */
K.compose=(seed,o)=>{let r=seed>>>0;const rnd=()=>{r=(r*1664525+1013904223)>>>0;return r/4294967296};o=o||{};const sc=o.scale||[0,2,4,7,9,12,14,16];const prog=o.prog||[0,5,3,4];const lead=[],bass=[],chords=[];
 const motif=[];for(let i=0;i<16;i++)motif.push(rnd()<(o.dens||.55)?sc[Math.floor(rnd()*sc.length)]:null);
 prog.forEach((root,bi)=>{const ROOT=[0,2,4,5,7,9,11][root%7];const l=motif.map((n,i)=>n==null?null:(bi%2&&i>=8&&rnd()<.5?sc[Math.floor(rnd()*sc.length)]:n)+(i%8===0?0:0)+ (bi===3&&i>11?2:0));lead.push(l);
  const b=[];for(let i=0;i<16;i++)b.push(o.bassPat?o.bassPat(i,ROOT):(i%4===0?ROOT:i%4===2&&rnd()<.6?ROOT+7:null));bass.push(b);chords.push([ROOT,ROOT+4,ROOT+7])});
 return Object.assign({bpm:o.bpm||120,key:o.key||57,lead,bass,chords,drum:o.drum||'four',pad:o.pad!==false,wave:o.wave},o.extra||{})};
/* ---------- fx ---------- */
K.parts=[];K.shake=0;K.floats=[];
K.burst=(x,y,cols,n,spd,o)=>{o=o||{};for(let i=0;i<n;i++){const a=o.a!=null?o.a+K.rand(-(o.spread||3.2),(o.spread||3.2)):K.rand(0,6.283),s=K.rand(.3,1)*(spd||220);K.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:o.g==null?380:o.g,life:K.rand(.4,.9)*(o.life||1),t:0,r:K.rand(2,5)*(o.size||1),c:K.pick(cols),sq:o.sq})}};
K.float=(s,x,y,col,px)=>{K.floats.push({s,x,y,col:col||'#fff',px:px||22,t:0})};
K.updFx=dt=>{for(let i=K.parts.length-1;i>=0;i--){const p=K.parts[i];p.t+=dt;if(p.t>=p.life){K.parts.splice(i,1);continue}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.99}
 for(let i=K.floats.length-1;i>=0;i--){const f=K.floats[i];f.t+=dt;f.y-=40*dt;if(f.t>1.1)K.floats.splice(i,1)}K.shake=Math.max(0,K.shake-dt*30)};
K.drawFx=()=>{for(const p of K.parts){X.globalAlpha=Math.max(0,1-p.t/p.life);X.fillStyle=p.c;if(p.sq)X.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);else{X.beginPath();X.arc(p.x,p.y,p.r,0,6.283);X.fill()}}X.globalAlpha=1;
 for(const f of K.floats){X.globalAlpha=Math.max(0,1-f.t/1.1);K.text(f.s,f.x,f.y,f.px,f.col,{stroke:'#000',lw:4});X.globalAlpha=1}};
/* ---------- toast ---------- */
let toastS='',toastT=0;K.toast=(s,t)=>{toastS=s;toastT=t||2.2};
function drawToast(){if(toastT<=0)return;X.globalAlpha=Math.min(1,toastT*3);X.font=K.font(16,800,'system-ui,sans-serif');const w=X.measureText(toastS).width+28;const x=(K.W-w)/2,y=K.safe.t+60;X.fillStyle='rgba(15,15,25,.92)';K.rr(x,y,w,36,18);X.fill();X.strokeStyle='#ffd400';X.lineWidth=2;X.stroke();K.text(toastS,K.W/2,y+18,16,'#fff',{fam:'system-ui,sans-serif'});X.globalAlpha=1}
/* ---------- jointed limbs + gait (see /workspace/leg-check/GUIDE.md) ----------
   Gait: phase advances with DISTANCE moved, so stride ties to ground speed (no foot slide).
   Cadence target: walk ~1.5-2 steps/s, run ~2.5-3 steps/s (capped 3). Swing amplitude is solved from step length. */
K.Gait=function(o){o=o||{};this.L=o.leg||30;this.vw=o.walk||60;this.vr=o.run||160;this.ph=0;this.amp=0;this.spd=0;this.steps=0;this.kneeMax=o.knee||1.0;this.armAmp=o.arm==null?1:o.arm};
K.Gait.prototype.cadence=function(v){const vw=this.vw,vr=this.vr;if(v<=vw)return K.lerp(1.5,1.9,K.clamp(v/vw,0,1));return Math.min(3,K.lerp(1.9,2.9,K.clamp((v-vw)/(vr-vw),0,1)))};
K.Gait.prototype.update=function(dist,dt){const v=dt>0?Math.abs(dist)/dt:0;this.spd=K.lerp(this.spd,v,Math.min(1,dt*10));
 if(this.spd>3){const c=this.cadence(this.spd);const step=this.spd/c;const A=Math.asin(K.clamp(step/(2*this.L*.95),0,.85));this.amp=K.lerp(this.amp,A,Math.min(1,dt*8));
  const dph=Math.PI*Math.abs(dist)/Math.max(1e-3,step);this.ph+=dph;this.steps+=dph/Math.PI}
 else{this.amp=K.lerp(this.amp,0,Math.min(1,dt*8));const tgt=Math.round(this.ph/Math.PI)*Math.PI;this.ph=K.lerp(this.ph,tgt,Math.min(1,dt*6))}
 this.run=this.spd>(this.vw+this.vr)/2};
/* pose: returns hip angles (+forward), knee bends, shoulder angles, elbow bends for leg/arm 0 and 1, plus body bob */
K.Gait.prototype.pose=function(){const a=this.amp,p=this.ph,run=this.run?1:0;const r={legs:[],arms:[],bob:0};
 for(let i=0;i<2;i++){const ph=p+i*Math.PI;const s=Math.sin(ph),c=Math.cos(ph);r.legs.push({hip:a*s,knee:.08+this.kneeMax*(a/.6)*Math.max(0,c)*(run?1.3:.85)+(run?.25*a:0)});
  r.arms.push({sh:-a*s*1.05*this.armAmp,el:.25+(run?1.0:.35)+.25*Math.max(0,-s)*(a/.6)})}
 r.bob=-Math.abs(Math.cos(p))*a*(run?.22:.12)*this.L+a*(run?.11:.06)*this.L;return r};
/* draw a two-segment limb from (x,y). a1 = first segment angle from straight down (+ = toward facing f), bend = joint bend.
   legs bend backward (knee), arms bend forward (elbow): pass dir=-1 for legs, +1 for arms. */
K.limb=(x,y,a1,l1,bend,l2,w,col,f,dir,end)=>{f=f||1;const kx=x+Math.sin(a1)*l1*f,ky=y+Math.cos(a1)*l1;const a2=a1+bend*dir;const ex=kx+Math.sin(a2)*l2*f,ey=ky+Math.cos(a2)*l2;
 X.lineCap='round';X.lineJoin='round';X.strokeStyle=col;X.lineWidth=w;X.beginPath();X.moveTo(x,y);X.lineTo(kx,ky);X.lineTo(ex,ey);X.stroke();
 if(end)end(ex,ey,a2);return{kx,ky,ex,ey,a2}};
/* ---------- story player (SKIP on every page) ---------- */
K.Story=function(pages,done,o){this.pages=pages;this.done=done;this.i=0;this.t=0;this.menu=true;this.primary='next';this.o=o||{}};
K.Story.prototype.enter=function(){this.i=0;this.t=0;K.focus='next'};
K.Story.prototype.update=function(dt){this.t+=dt};
K.Story.prototype.back=function(){this.done()};
K.Story.prototype.up=function(p){if(!p.moved&&!p.cancel)this.adv()};
K.Story.prototype.adv=function(){if(this.i<this.pages.length-1){this.i++;this.t=0;K.sfx('click')}else this.done()};
K.Story.prototype.draw=function(){const P=this.pages[this.i],W=K.W,H=K.H,s=K.safe;if(this.o.bg)this.o.bg();else{X.fillStyle='#0b0b18';X.fillRect(0,0,W,H)}
 const land=K.land;const pad=16;const tw=land?W*.42:W-pad*2;let ix,iy,iw,ih;
 if(land){ih=Math.min(H-s.t-s.b-40,W*.5);iw=ih;ix=s.l+pad+10;iy=(H-ih)/2}else{iw=Math.min(W-pad*2,H*.46);ih=iw;ix=(W-iw)/2;iy=s.t+64}
 X.save();K.rr(ix,iy,iw,ih,18);X.clip();const e=K.ease.out(Math.min(1,this.t*1.6));if(P.img&&K.img[P.img]){const im=K.img[P.img];const z=1.02+.05*Math.min(1,this.t/6);const w=iw*z,h=w*im.naturalHeight/im.naturalWidth;X.globalAlpha=e;X.drawImage(im,ix+(iw-w)/2,iy+(ih-h)/2,w,h)}else if(P.draw){X.globalAlpha=e;P.draw(ix,iy,iw,ih,this.t)}X.restore();X.globalAlpha=1;
 X.strokeStyle='rgba(255,255,255,.7)';X.lineWidth=3;K.rr(ix,iy,iw,ih,18);X.stroke();
 const tx=land?ix+iw+(W-s.r-(ix+iw))/2:W/2,ty=land?H*.42:iy+ih+(H-s.b-90-(iy+ih))/2;const tW=land?W-s.r-(ix+iw)-40:tw;
 const txt=P.t;const n=Math.floor(Math.min(txt.length,this.t*55));const shown=txt.slice(0,n);
 X.fillStyle='rgba(10,10,25,.72)';const lines=K.wrap(txt,tW-24,this.o.px||20);const bh=lines.length*(this.o.px||20)*1.3+24;K.rr(tx-tW/2,ty-bh/2,tW,bh,14);X.fill();
 K.para(shown,tx,ty-bh/2+12+(this.o.px||20)*.65,tW-24,this.o.px||20,'#fff',{lh:1.3,w:700,fam:this.o.fam});
 const bw=Math.min(200,(land?tW:W-40)/2-8),bh2=60,by=land?H-s.b-bh2-14:H-s.b-bh2-18;
 const last=this.i===this.pages.length-1;K.button('next',tx+6,by,bw,bh2,last?(this.o.go||"Let's go! ▶"):'Next ▶',{color:'#2fae4a',px:22,cb:()=>this.adv()});
 K.button('skip',tx-bw-6,by,bw,bh2,'SKIP ⏭',{color:'#e02828',color2:'#a31010',px:24,cb:()=>this.done()});
 for(let j=0;j<this.pages.length;j++){X.fillStyle=j===this.i?'#fff':'rgba(255,255,255,.35)';X.beginPath();X.arc(tx+(j-(this.pages.length-1)/2)*16,by-16,4,0,6.283);X.fill()}};
/* ---------- loop ---------- */
K.go=(sc,arg)=>{K.ptrs.clear();K.pressed=null;const prev=K.scene;if(prev&&prev.exit)prev.exit();K.scene=sc;K.focus=sc.primary||null;if(sc.enter)sc.enter(arg)};
function report(e){(window.__ERR=window.__ERR||[]).push(String(e&&e.stack||e));console.error(e)}
K.TS=1;let last=performance.now(),hidden=false;
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(hidden)return;
 try{for(let i=0;i<K.TS;i++){K.dt=dt;K.t+=dt;pollPad(dt);K.music.tick();if(K.scene&&K.scene.update)K.scene.update(dt);K.kp={};toastT-=dt}
  X.setTransform(K.DPR,0,0,K.DPR,0,0);K.btns=[];K.charRects=[];if(K.scene&&K.scene.draw)K.scene.draw(X);drawToast();
  if(K.focus&&!K.btns.some(b=>b.id===K.focus)&&K.scene&&K.scene.menu)K.focus=(K.btns.find(b=>b.id===K.scene.primary)||K.btns[0]||{}).id||null}catch(e){report(e)}}
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden&&K.scene&&K.scene.pause)K.scene.pause();if(AU.ctx){if(hidden)AU.ctx.suspend().catch(()=>{});else AU.ctx.resume().catch(()=>{})}last=performance.now()});
K.start=first=>{resize();[120,400,1000].forEach(t=>setTimeout(resize,t));K.go(first);requestAnimationFrame(frame)};
/* QA: buttons never cover characters */
K.qaOverlap=()=>{const out=[];for(const b of K.btns)for(const c of K.charRects)if(K.overlap(b,c))out.push(b.id+'×'+(c.name||'char'));return out};
window.__K=K;
})();
