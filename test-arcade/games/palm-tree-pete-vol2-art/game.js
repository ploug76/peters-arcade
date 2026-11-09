/* RESCUE FROM PALM TREE PETE'S ISLAND 2: The Great Escape — a FIVE8NINE Studios game (Vol 2). Built on kit.js.
   Side-view stealth: sneak past flashlights, bonk goons from behind, free the kids, lead them to the exit. VS boss fights end every world. */
(function(){'use strict';
const {X}=K;const clamp=K.clamp,lerp=K.lerp,rand=K.rand,TAU=Math.PI*2;
K.FONT='"Lilita One","Arial Rounded MT Bold",system-ui,sans-serif';
const SAVEK='pa-test-ptp-island-2-save-v1';
const save=K.load(SAVEK,{stars:{},unlocked:1,muted:false,seenIntro:false,kids:0});
K.au.muted=save.muted;const persist=()=>K.store(SAVEK,save);
const QA=/[?&]qa=1/.test(location.search);
const T=32,NR=12,GY=10*T;
/* ---------- worlds & levels ---------- */
const WORLDS=[
 {n:'Moonlit Beach',night:.38,gr:['#cdb98c','#e7d7b0','#8f7c58'],acc:'#4fd0d0',tint:'#d7fff8',key:57,bpm:96,seed:5,boss:'Big Sal',bc:{shirt:'#d8d8d0',pants:'#3a3f48',skin:'#c48a64',hair:'#2a1a12',sc:1.25},exit:'boat',
  tip:'Drag left or right to walk. Drag farther to run. Hide in bushes by dragging down!'},
 {n:'Jungle Trail',night:.22,gr:['#4a3320','#3d6a33','#33220f'],acc:'#7CFC9A',tint:'#d6ffb0',key:55,bpm:100,seed:17,boss:'Jungle Jake',bc:{shirt:'#4d5a2a',pants:'#3a4020',skin:'#b98058',hair:'#5a3a1a',sc:1.2,cam:1},exit:'gate',
  tip:'Climb ladders by dragging up. Running near a goon makes noise, so walk when you sneak up behind!'},
 {n:'The White Villa',night:.3,gr:['#eadfc8','#f2eee6','#5a3e2c'],acc:'#f6d47c',tint:'#fff1c4',key:53,bpm:92,seed:29,boss:'Butler Boris',bc:{shirt:'#15151a',pants:'#15151a',skin:'#e0b090',hair:'#101010',sc:1.15,tux:1},exit:'gate',
  tip:'Security cameras sweep back and forth. Wait for the beam to pass, or crouch behind a crate.'},
 {n:'The Striped House',night:.12,gr:['#f4f2ea','#2756bf','#d4a640'],acc:'#c8424f',tint:'#ffd0d4',key:52,bpm:104,seed:41,boss:'Gatekeeper Gus',bc:{shirt:'stripe',pants:'#1e2a5a',skin:'#c99272',hair:'#3a2a1a',sc:1.3},exit:'gate',
  tip:'Searchlights sweep the plaza. Duck into a bush before the light reaches you.'},
 {n:'The Getaway Docks',night:0,gr:['#86613f','#a07650','#5d4029'],acc:'#ffb44a',tint:'#ffe7b8',key:60,bpm:108,seed:53,boss:'Palm Tree Pete',bc:{pete:1,sc:1.2},exit:'boat',
  tip:'Everything at once! Jump the gaps, dodge the lights, and get every kid onto the rescue boat.'}];
const LEVELS=[];WORLDS.forEach((w,wi)=>{for(let li=0;li<6;li++){const boss=li===5;
 LEVELS.push({i:wi*6+li,w:wi,li,boss,label:(wi+1)+'-'+(li+1),hp:[7,9,11,12,16][wi],name:boss?w.boss:w.n+' '+(li+1)})}});
const SONGS=WORLDS.map(w=>K.compose(w.seed,{key:w.key,bpm:w.bpm,drum:'half',wave:{lead:'triangle',bass:'sine'},scale:[0,3,5,7,10,12,15],dens:.4}));
const SONG_T=K.compose(9,{key:57,bpm:100,drum:'rock',wave:{lead:'square',bass:'triangle'},scale:[0,2,4,7,9,12,14]});
const SONG_B=K.compose(88,{key:52,bpm:138,drum:'four',wave:{lead:'square',bass:'sawtooth'},scale:[0,3,5,6,7,10,12],dens:.6});
SONGS.forEach(s=>s.lv=.05);SONG_T.lv=.05;SONG_B.lv=.05;
/* ---------- audio ---------- */
const AU=K.au;Object.assign(K.SFX,{
 jump(){AU.tone(330,.12,'square',.06,620)},
 bonk(){AU.tone(220,.12,'square',.14,90);AU.noise(.12,.16,1200);AU.tone(1400,.08,'sine',.06,900,.08)},
 free(){[523,659,784,1047].forEach((f,i)=>AU.tone(f,.16,'triangle',.09,null,i*.07))},
 alarm(){for(let i=0;i<3;i++){AU.tone(880,.12,'square',.08,null,i*.24);AU.tone(660,.12,'square',.08,null,i*.24+.12)}},
 sus(){AU.tone(520,.08,'sine',.05,700)},
 splash(){AU.noise(.4,.2,900);AU.tone(200,.3,'sine',.08,80)},
 punch(){AU.noise(.08,.18,2200,'bandpass');AU.tone(160,.1,'square',.1,70)},
 block(){AU.tone(1200,.05,'square',.06,800)},
 hurt(){AU.tone(300,.25,'sawtooth',.12,90)},
 cp(){AU.tone(784,.1,'triangle',.08);AU.tone(1175,.14,'triangle',.07,null,.08)},
 win(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>AU.tone(f,.2,'triangle',.09,null,i*.11))},
 noise(){AU.tone(180,.05,'sine',.03)},
 star(){AU.tone(1047,.12,'square',.08,1568)},
 whoosh(){AU.noise(.25,.1,600,'bandpass')}});
/* ---------- helpers ---------- */
let RT=0;
function rng(seed){let r=seed>>>0;return()=>{r=(r*1664525+1013904223)>>>0;return r/4294967296}}
function bg(wi,pan,dark){PTP.scene(X,wi%5,{W:K.W,H:K.H,floor:K.H*(K.land?.78:.64),t:RT,pan:(pan||0)*40});if(dark){X.fillStyle='rgba(8,6,24,'+Math.min(.85,dark)+')';X.fillRect(0,0,K.W,K.H)}}
/* ---------- characters: Vol 1 drawMan (same rig, palette and outfits) ---------- */
const TF='"PTP Anton",Impact,"Arial Black","Franklin Gothic Heavy",system-ui,sans-serif';
function kidKind(i){return 'kid'+((i||0)%6)}
function gaitAmp(gait){return gait?Math.min(1.15,(gait.amp||0)/.55):0}
/* drawPerson stays for the story panels and the QA hook. It draws with Vol 1's rig. */
function drawPerson(k,x,y,f,p,o){o=o||{};p=p||{};let kind=k==='kid'?kidKind(o.kid||0):k;if(k==='kid'&&o.kind)kind=o.kind;
 let pose=o.pose||'idle',amp=o.amp,ph=o.ph;
 if(o.down)pose='ko';else if(o.crouch)pose='crouch';else if(o.emo==='sad')pose='scared';else if(o.emo==='dizzy')pose='hurt';
 else if(!o.pose&&p.arms&&p.arms[0]&&p.arms[0].sh>2.15)pose='cheer';
 else if(!o.pose&&p.legs&&Math.abs(p.legs[0].hip||0)>.22){pose='walk';if(amp==null)amp=Math.min(1.15,Math.abs(p.legs[0].hip)/.55)}
 if(ph==null)ph=pose==='walk'||pose==='cheer'||pose==='scared'?RT*3:RT;
 PTP.use(X);X.save();if(o.alpha!=null)X.globalAlpha*=o.alpha;
 PTP.drawMan(kind,x,y,PTP.S*(o.sc||1),f||1,pose,ph,{amp:amp==null?(pose==='walk'?1:0):amp,dizzy:!!(o.down||o.emo==='dizzy'),look:o.look,noLight:o.noLight,flash:o.flash,noShadow:o.noShadow});
 X.restore()}
function bossLook(wi){const b=WORLDS[wi].bc;if(b.pete)return{kind:'pete',sc:b.sc||1};
 const look={};if(b.tux){look.shirt='#1a1d28';look.shirtD='#0c0e14';look.pants='#12131a';look.shades=0}
 else if(b.shirt==='stripe'){look.shirt='stripe';if(b.pants)look.pants=b.pants}
 else{if(b.shirt){look.shirt=b.shirt;look.shirtD=PTP.hexShade(b.shirt,.72)}if(b.pants)look.pants=b.pants}
 if(b.skin){look.skin=b.skin;look.skinD=PTP.hexShade(b.skin,.72)}
 if(b.hair){look.hair=b.hair;look.hairD=PTP.hexShade(b.hair,.62)}
 return{kind:'thug',look,sc:b.sc||1}}
/* ---------- level generation ---------- */
function genLevel(L){const r=rng(L.i*7919+101+(L.seedAdd||0)),wi=L.w,li=L.li;
 const nC=44+li*7+wi*5;const g=Array.from({length:NR},(_,ri)=>Array(nC).fill(ri>=10?'#':' '));
 const set=(c,ri,ch)=>{if(c>=0&&c<nC&&ri>=0&&ri<NR)g[ri][c]=ch};
 const lv={cols:nC,g,thugs:[],bushes:[],lights:[],cams:[],cages:[],cps:[],ladders:[],water:[],decor:[]};
 const kinds=['patrol','ledge','crates'];if(wi===0||wi===4)kinds.push('gap');if(wi>=1)kinds.push('upper');if(wi===0||wi>=3)kinds.push('search');if(wi>=2)kinds.push('cam');
 if(wi===4)kinds.push('gap','search');
 let nCages=1+(li>=2?1:0)+(li>=4?1:0)+(wi>=2?1:0);const chunks=[];let x=7,n=0;
 const plan=[];while(x<nC-12){let k=kinds[Math.floor(r()*kinds.length)];if(n===0&&li===0&&wi===0)k='patrol';if(plan.length&&plan[plan.length-1]===k&&r()<.6)k=kinds[Math.floor(r()*kinds.length)];
  const len={patrol:10,ledge:11,crates:10,gap:8,upper:12,search:12,cam:11}[k];if(x+len>nC-10)break;plan.push(k);chunks.push({k,c:x});x+=len;n++;if(n%3===0&&x<nC-14){lv.cps.push({x:(x+1)*T,fy:GY,on:0});lv.decor.push({k:'torch',x:(x+.5)*T});x+=3}}
 lv.cols=nC;const ex=x;// fill rest flat until exit
 const cageable=chunks.filter(c=>c.k!=='gap');nCages=Math.min(nCages,cageable.length);const cagePick=new Set();for(let i=0;i<nCages;i++)cagePick.add(cageable[Math.floor((i+.6)*cageable.length/nCages)]);
 const spd=()=>26+wi*4+r()*8;const thug=(a,b,fy)=>lv.thugs.push({x0:a*T,x1:b*T,fy,spd:spd(),f:r()<.5?1:-1,sx:0});
 const bush=(c,fy)=>lv.bushes.push({x:c*T,fy,w:T*1.9,sd:Math.floor(r()*99)});
 const cage=(c,fy)=>{const n=r()<.45?2:1;lv.cages.push({x:c*T,fy,n,open:0,kidsC:[Math.floor(r()*6),Math.floor(r()*6)]})};
 const ladder=(c,r0,r1)=>{lv.ladders.push({x:c*T+T/2,y0:r0*T,y1:r1*T+T})};
 for(const ch of chunks){const c=ch.c,hasCage=cagePick.has(ch);
  if(ch.k==='patrol'){bush(c+1.5,GY);thug(c+4,c+9.5,GY);if(r()<.5)bush(c+7,GY);if(hasCage)cage(c+9.3,GY)}
  else if(ch.k==='ledge'){for(let i=c+3;i<=c+8;i++)set(i,7,'=');ladder(c+3,7,9);const top=wi>=1||r()<.5;if(top)thug(c+4.5,c+8.7,7*T);else{thug(c+1.5,c+10.5,GY);bush(c+.6,GY)}bush(c+9.6,GY);if(hasCage)cage(top?c+5:c+7.5,7*T)}
  else if(ch.k==='crates'){set(c+2,9,'C');set(c+5,9,'C');set(c+5,8,'C');set(c+6,9,'C');thug(c+7.2,c+9.8,GY);if(hasCage)cage(c+9.4,GY);bush(c+.5,GY)}
  else if(ch.k==='gap'){for(let i=c+3;i<=c+4;i++){set(i,10,' ');set(i,11,' ');lv.water.push(i)}set(c+6,9,'C');bush(c+1,GY);if(wi===4)thug(c+5.2,c+7.8,GY)}
  else if(ch.k==='upper'){for(let i=c+1;i<=c+11;i++)set(i,7,'=');for(let i=c+4;i<=c+9;i++)set(i,4,'=');ladder(c+1,7,9);ladder(c+4,4,6);thug(c+5.5,c+10.7,7*T);bush(c+6,GY);bush(c+2.6,7*T);if(hasCage)cage(c+8,4*T)}
  else if(ch.k==='search'){lv.lights.push({x0:(c+1)*T,x1:(c+11)*T,fy:GY,per:6.5-wi*.4+r()*1.5,ph:r()*TAU,r:44});bush(c+3,GY);bush(c+8,GY);if(wi>=3)thug(c+9.5,c+11.5,GY);if(hasCage)cage(c+11,GY)}
  else if(ch.k==='cam'){for(let i=c+2;i<=c+9;i++)set(i,7,'=');ladder(c+2,7,9);lv.cams.push({x:(c+6)*T,y:8*T+4,per:5+r()*2,ph:r()*TAU,fy:GY});bush(c+4,GY);set(c+8,9,'C');if(wi>=3)thug(c+3.5,c+9,7*T);if(hasCage)cage(c+8.4,7*T)}}
 // exit
 lv.exitX=(nC-4)*T;if(WORLDS[wi].exit==='boat'){for(let i=nC-3;i<nC;i++){set(i,10,' ');set(i,11,' ');lv.water.push(i)}}
 lv.kidsTotal=lv.cages.reduce((a,c)=>a+c.n,0);lv.par=Math.round(18+nC*.75+lv.kidsTotal*5+lv.thugs.length*2);
 lv.thugs.forEach(t=>{t.x=lerp(t.x0,t.x1,r());t.sx=t.x;t.sf=t.f;t.meter=0;t.down=0;t.wait=0;t.gait=new K.Gait({leg:29,walk:55,run:115,arm:.9})});
 return lv}
function tile(c,ri){const g=G.lv.g;if(c<0||c>=G.lv.cols)return'#';if(ri<0)return' ';if(ri>=NR)return' ';return g[ri][c]}
const solid=ch=>ch==='#'||ch==='C';
function solidAt(x,y){return solid(tile(Math.floor(x/T),Math.floor(y/T)))}
function losBlocked(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/8);for(let i=1;i<n;i++){const t=i/n;const ch=tile(Math.floor(lerp(x0,x1,t)/T),Math.floor(lerp(y0,y1,t)/T));if(solid(ch)||ch==='=')return true}return false}
/* ---------- game state ---------- */
let G=null;
const IN={dir:0,run:0,down:0,up:0,jump:0,act:0};
function newHero(x,fy){return{x,y:fy,vx:0,vy:0,f:1,onG:true,fy,crouch:false,climb:null,hidden:false,inv:0,punchT:0,drop:0,gait:new K.Gait({leg:27,walk:55,run:95}),air:0}}
function startLevel(i){const L=LEVELS[i];const w=WORLDS[L.w];
 G={L,wi:L.w,t:0,state:'ready',banner:2.4,hearts:L.boss?5:3,maxH:L.boss?5:3,spotted:0,takedowns:0,kidsFreed:0,kids:[],trail:[],float:[],won:false,cam:0,hintI:0,ghost:false,noiseT:0,sus:0,parts:[]};
 if(L.boss){const vw=viewW();const cols=Math.max(14,Math.ceil(vw/T));const g=Array.from({length:NR},(_,ri)=>Array(cols).fill(ri>=10?'#':' '));
  G.lv={cols,g,thugs:[],bushes:[],lights:[],cams:[],cages:[{x:(cols-1.6)*T,fy:GY,n:3,open:0,kidsC:[L.w%6,(L.w+2)%6,(L.w+4)%6]}],cps:[],ladders:[],water:[],decor:[],exitX:1e9,kidsTotal:3,par:60};
  const lk=bossLook(L.w);G.boss={x:(cols-4)*T,y:GY,f:-1,hp:L.hp,mx:L.hp,st:'walk',t:1.2,atk:0,hurt:0,vx:0,lk,gait:new K.Gait({leg:27*lk.sc,walk:55,run:115}),far:0,proj:[],throwT:3};
  G.hero=newHero(3*T,GY)}
 else{G.lv=genLevel(L);G.hero=newHero(2.5*T,GY)}
 G.cp={x:G.hero.x,fy:GY};K.go(Play);K.music.play(L.boss?SONG_B:SONGS[L.w])}
function viewScale(){return K.land?(K.H-K.safe.t-K.safe.b)/(10.3*T):Math.min((K.W-K.safe.l-K.safe.r)/(9.5*T),(K.H*.7)/(NR*T))}
function viewW(){return (K.W)/viewScale()}
function floorUnder(x,y){// returns surface y if standing at (x,y)
 const c=Math.floor(x/T),ri=Math.floor((y+1)/T);const ch=tile(c,ri);return ch}
/* ---------- hero physics ---------- */
function ladderAt(x,y){for(const l of G.lv.ladders)if(Math.abs(x-l.x)<T*.55&&y>l.y0-2&&y<=l.y1+1)return l;return null}
/* respawn fix (Oct 30): a fall while blinking costs nothing (back on solid ground, backed off the edge) */
function rfOk(x,y,m){for(let xx=x-m;xx<=x+m;xx+=4){if(!solidAt(xx,y+2)||solidAt(xx,y-6)||solidAt(xx,y-40))return false}return true}
function rfRestore(H){const s=H.safe||{x:G.cp.x,y:G.cp.fy};const d=Math.sign(H.x-s.x)||H.f||1;let x=s.x,k=0;while(k<400&&rfOk(x+d*(k+4),s.y,10))k+=4;if(k<30){for(let n=30-k;n>0;n-=4)if(rfOk(s.x-d*n,s.y,10)){x=s.x-d*n;break}}Object.assign(H,{x,y:s.y,fy:s.y,vx:0,vy:0,onG:true,climb:null,drop:0});H.inv=Math.max(H.inv,1);return true}
function heroUpdate(dt){const H=G.hero,L=G.L;if(H.inv>0)H.inv-=dt;if(H.punchT>0)H.punchT-=dt;if(H.drop>0)H.drop-=dt;
 const run=IN.run,dir=IN.dir;
 // ladder
 const lad=ladderAt(H.x,H.y);
 if(!H.climb&&lad&&((IN.up&&H.y>lad.y0+2)||(IN.down&&H.y<lad.y1-2&&H.onG&&H.y<=lad.y0+2))){H.climb=lad;H.vx=0}
 if(H.climb){const l=H.climb;H.x=lerp(H.x,l.x,Math.min(1,dt*12));const v=IN.up?-75:IN.down?75:0;const oy=H.y;H.y=clamp(H.y+v*dt,l.y0,l.y1);H.climbPh=(H.climbPh||0)+Math.abs(H.y-oy)/14;H.vy=0;H.onG=false;
  if(H.y<=l.y0+.5&&IN.up){H.y=l.y0;H.climb=null;H.onG=true;H.fy=l.y0}
  else if(H.y>=l.y1-.5&&IN.down){H.y=l.y1;H.climb=null;H.onG=true}
  else if(dir&&!IN.up&&!IN.down&&(H.y<=l.y0+4||H.y>=l.y1-4)){H.climb=null}
  else if(IN.jump){H.climb=null;H.vy=-380;IN.jump=0}
  H.gait.update(0,dt);return}
 H.crouch=IN.down&&H.onG&&!H.climb;
 // drop through one-way
 if(IN.down&&H.onG&&tile(Math.floor(H.x/T),Math.floor((H.y+1)/T))==='='&&!inBush(H)){if(!H.dropHold)H.dropHold=0;H.dropHold+=dt;if(H.dropHold>.25){H.drop=.25;H.onG=false;H.y+=2;H.dropHold=0}}else H.dropHold=0;
 let tv=dir*(H.crouch?28:run?95:55);if(L.boss&&H.punchT>0)tv*=.3;
 const acc=H.onG?900:600;H.vx=H.vx<tv?Math.min(tv,H.vx+acc*dt):Math.max(tv,H.vx-acc*dt);if(dir)H.f=dir;
 if(IN.jump&&(H.onG||H.coyote>0)){H.vy=-640;H.onG=false;H.coyote=0;K.sfx('jump');IN.jump=0}
 if(!H.onG){H.vy=Math.min(900,H.vy+1500*dt);H.coyote=(H.coyote||0)-dt}
 // x move
 const ox=H.x;H.x+=H.vx*dt;const hw=10,hh=H.crouch?36:58;
 for(const yy of [H.y-4,H.y-hh/2,H.y-hh+2]){if(solidAt(H.x+hw,yy)){H.x=Math.floor((H.x+hw)/T)*T-hw-.01;H.vx=0}if(solidAt(H.x-hw,yy)){H.x=Math.floor((H.x-hw)/T+1)*T+hw+.01;H.vx=0}}
 H.x=clamp(H.x,12,G.lv.cols*T-12);
 // y move
 const oy=H.y;H.y+=H.vy*dt;const wasG=H.onG;H.onG=false;
 if(H.vy>=0){for(const xx of [H.x-hw+2,H.x+hw-2]){const c=Math.floor(xx/T),ri=Math.floor(H.y/T);const ch=tile(c,ri);const top=ri*T;
   if(solid(ch)&&oy<=top+6){H.y=top;H.vy=0;H.onG=true}else if(ch==='='&&oy<=top+.5&&H.drop<=0){H.y=top;H.vy=0;H.onG=true}}}
 else{for(const xx of [H.x-hw+2,H.x+hw-2]){if(solidAt(xx,H.y-hh)){H.y=Math.floor((H.y-hh)/T+1)*T+hh;H.vy=0}}}
 if(!H.onG&&wasG&&H.vy>=0)H.coyote=.1;
 if(H.onG){H.fy=H.y;if(!wasG&&oy<H.y-2)K.burst(H.x,H.y,['#e8d3a0','#fff'],4,60,{g:200,life:.4,size:.7})}
 H.gait.update(H.onG?H.x-ox:0,dt);
 if(H.onG&&!H.climb&&rfOk(H.x,H.y,22))H.safe={x:H.x,y:H.y};
 if(H.y>NR*T+40){if(!L.boss){if(H.inv>0&&rfRestore(H))return;K.sfx('splash');K.burst(H.x,NR*T,['#6ad0ff','#fff'],20,200);hurt('splash')}}
 H.hidden=H.crouch&&inBush(H)}
function inBush(H){for(const b of G.lv.bushes)if(Math.abs(H.x-b.x)<b.w*.42&&Math.abs(H.y-b.fy)<4)return b;return null}
/* ---------- trail + kids ---------- */
function kidsUpdate(dt){const H=G.hero,tr=G.trail;const lp=tr[tr.length-1];if(!lp||Math.hypot(H.x-lp.x,H.y-lp.y)>3)tr.push({x:H.x,y:H.y});if(tr.length>600)tr.shift();
 G.kids.forEach((k,i)=>{const idx=Math.max(0,tr.length-1-(i+1)*11);const p=tr[idx]||{x:H.x,y:H.y};const ox=k.x;k.x=lerp(k.x,p.x-(G.state==='win'?0:0),Math.min(1,dt*9));k.y=lerp(k.y,p.y,Math.min(1,dt*9));if(Math.abs(k.x-ox)>.05)k.f=k.x>ox?1:-1;k.gait.update(k.x-ox,dt)})}
/* ---------- guards / detection ---------- */
function coneHit(ex,ey,ang,len,half,H){const pts=[[H.x,H.y-(H.crouch?22:50)],[H.x,H.y-(H.crouch?12:24)]];for(const [px,py] of pts){const dx=px-ex,dy=py-ey,d=Math.hypot(dx,dy);if(d>len)continue;let a=Math.atan2(dy,dx)-ang;a=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(a)>half)continue;if(!losBlocked(ex,ey,px,py))return d}return -1}
function thugEye(t){return{x:t.x+t.f*14,y:t.fy-47,a:t.f>0?.12:Math.PI-.12}}
function guardsUpdate(dt){const H=G.hero;let maxM=0;
 for(const t of G.lv.thugs){if(t.down){t.downT=(t.downT||0)+dt;continue}
  const e=thugEye(t);let d=(G.ghost||H.hidden||G.state!=='play')?-1:coneHit(e.x,e.y,e.a,175,.4,H);
  // noise: running close behind
  const near=Math.abs(H.x-t.x)<90&&Math.abs(H.y-t.fy)<10&&Math.abs(H.vx)>80&&H.onG&&!G.ghost;
  if(near){G.noiseT-=dt;if(G.noiseT<=0){G.noiseT=.35;K.sfx('noise');K.float('♪',H.x,H.y-70,'#fff',18)}t.meter+=dt*.9;if(t.meter>.35&&Math.sign(H.x-t.x)!==t.f){t.f=Math.sign(H.x-t.x)||t.f;K.sfx('sus')}}
  if(d>=0){const was=t.meter;t.meter+=dt*(1.1+2.6*(1-d/175));if(was<.15&&t.meter>=.15)K.sfx('sus')}else if(!near)t.meter=Math.max(0,t.meter-dt*.45);
  const ox=t.x;
  if(t.meter>.12){/* stop + stare */}
  else if(t.wait>0)t.wait-=dt;
  else{t.x+=t.f*t.spd*dt;if(t.x>t.x1){t.x=t.x1;t.f=-1;t.wait=1+Math.random()*.8}if(t.x<t.x0){t.x=t.x0;t.f=1;t.wait=1+Math.random()*.8}}
  t.gait.update(t.x-ox,dt);maxM=Math.max(maxM,t.meter)}
 // searchlights
 for(const l of G.lv.lights){l.cx=lerp(l.x0,l.x1,.5+.5*Math.sin(G.t*TAU/l.per+l.ph));if(!G.ghost&&!H.hidden&&G.state==='play'&&Math.abs(H.x-l.cx)<l.r+6&&Math.abs(H.y-l.fy)<6){l.m=(l.m||0)+dt*2.2}else l.m=Math.max(0,(l.m||0)-dt*.8);maxM=Math.max(maxM,l.m)}
 for(const c of G.lv.cams){c.a=Math.PI/2+Math.sin(G.t*TAU/c.per+c.ph)*.95;const d=(G.ghost||H.hidden||G.state!=='play')?-1:coneHit(c.x,c.y,c.a,150,.26,H);if(d>=0)c.m=(c.m||0)+dt*2;else c.m=Math.max(0,(c.m||0)-dt*.6);maxM=Math.max(maxM,c.m)}
 G.sus=maxM;if(maxM>=1&&G.state==='play')spotted()}
function spotted(){G.state='caught';G.ct=1.5;G.spotted++;K.sfx('alarm');K.shake=8;K.float('SPOTTED!',G.hero.x,G.hero.y-90,'#ff4a4a',30)}
function hurt(why){if(G.state!=='play')return;G.state='caught';G.ct=1.2;G.spotted++;if(why==='splash')K.float('SPLASH!',G.hero.x,NR*T-60,'#6ad0ff',30)}
function respawn(){const H=G.hero;G.hearts--;if(G.hearts<=0){finish(false);return}
 G.hero=newHero(G.cp.x,G.cp.fy);G.hero.inv=1.5;G.trail=[];G.kids.forEach((k,i)=>{k.x=G.cp.x-20-i*14;k.y=G.cp.fy});
 for(const t of G.lv.thugs){if(!t.down){t.x=t.sx;t.f=t.sf;t.meter=0;t.wait=.8}}G.lv.lights.forEach(l=>l.m=0);G.lv.cams.forEach(c=>c.m=0);G.state='play';G.sus=0;K.sfx('cp')}
/* ---------- actions ---------- */
function actTarget(){const H=G.hero;if(G.L.boss)return{k:'punch'};
 for(const t of G.lv.thugs){if(t.down)continue;const dx=t.x-H.x;if(Math.abs(dx)<46&&Math.abs(t.fy-H.y)<10&&(Math.sign(H.x-t.x)!==t.f||t.meter<.12&&Math.abs(dx)<30&&Math.sign(H.x-t.x)!==t.f))return{k:'bonk',t}}
 for(const c of G.lv.cages){if(!c.open&&Math.abs(c.x-H.x)<44&&Math.abs(c.fy-H.y)<10)return{k:'free',c}}return null}
function doAction(){const H=G.hero;const a=actTarget();if(!a)return false;
 if(a.k==='bonk'){const t=a.t;t.down=1;t.meter=0;G.takedowns++;H.punchT=.28;H.f=Math.sign(t.x-H.x)||H.f;K.sfx('bonk');K.burst(t.x,t.fy-50,['#ffd700','#fff'],14,160,{g:0,life:.6});K.float('BONK!',t.x,t.fy-80,'#ffd700',28);return true}
 if(a.k==='free'){const c=a.c;c.open=1;K.sfx('free');K.burst(c.x,c.fy-30,['#ffd700','#fff','#9be05a'],22,200);K.float(c.n>1?c.n+' KIDS FREE!':'KID FREE!',c.x,c.fy-90,'#9be05a',26);
  for(let i=0;i<c.n;i++){G.kids.push({x:c.x+(i-.5)*10,y:c.fy,f:-1,kind:kidKind(c.kidsC[i]),gait:new K.Gait({leg:20,walk:55,run:95})})}G.kidsFreed+=c.n;return true}
 if(a.k==='punch')return punch();return false}
function tapAction(){if(G.state!=='play')return;if(!doAction())IN.jump=1}
/* ---------- boss fight ---------- */
function punch(){const H=G.hero,B=G.boss;if(H.punchT>0)return true;H.punchT=.38;K.sfx('whoosh');const dx=B.x-H.x;
 if(B.st!=='down'&&Math.abs(dx)<70&&Math.sign(dx)===H.f&&Math.abs(B.y-H.y)<40){const vul=(B.st==='rest'&&(B.hits||0)<2)||(B.st==='dizzy'&&(B.hits||0)<3)||(B.st==='walk'&&Math.sign(H.x-B.x)!==B.f);
  if(vul){const dm=B.st==='dizzy'?2:1;B.hp-=dm;B.hits=(B.hits||0)+1;if(B.st==='rest'&&B.hits>=2){B.t=Math.min(B.t,.25)}B.hurt=.3;B.x+=H.f*14;K.sfx('punch');K.shake=6;K.burst(B.x-H.f*10,B.y-60*B.lk.sc,['#ffd700','#fff','#ff8a3a'],12,180,{g:0,life:.5});K.float(dm>1?'POW! x2':'POW!',B.x,B.y-110,'#ffd700',28);
   if(B.hp<=0){B.st='down';B.t=0;K.sfx('win');G.state='bosswin';G.bt=1.8}}
  else{K.sfx('block');K.float('BLOCKED',B.x,B.y-110,'#fff',20)}}return true}
function heroHit(dir){const H=G.hero;if(H.inv>0||G.state!=='play')return;G.hearts--;G.spotted++;H.inv=1.3;H.vx=dir*240;H.vy=-280;H.onG=false;K.sfx('hurt');K.shake=10;K.float('OUCH!',H.x,H.y-80,'#ff4a4a',24);if(G.hearts<=0){G.state='caught';G.ct=1;G.bossLose=1}}
function bossUpdate(dt){const B=G.boss,H=G.hero,wi=G.wi;if(B.hurt>0)B.hurt-=dt;const dx=H.x-B.x,ad=Math.abs(dx);const minX=1.5*T,maxX=(G.lv.cols-1.5)*T;const ox=B.x;B.t-=dt;
 if(B.st==='down'){B.gait.update(0,dt);return}
 if(B.st==='walk'){B.f=Math.sign(dx)||B.f;if(ad>58)B.x+=B.f*(42+wi*6)*dt;B.far+=ad>150?dt:0;
  if(B.atk%3===2&&ad>110||B.far>2.6){B.st='cwind';B.t=.8;B.far=0;K.sfx('alarm')}else if(ad<=70&&B.t<=0){B.st='wind';B.t=.62-wi*.04;K.float('!',B.x,B.y-120*B.lk.sc,'#ff4a4a',34)}
  if(wi>=2&&G.state==='play'){B.throwT-=dt;if(B.throwT<=0&&ad>90){B.throwT=3.2-wi*.3;const tt=1.0;B.proj.push({x:B.x,y:B.y-70,vx:dx/tt,vy:-(.5*1500*tt)+(-30)/tt,r:9,k:wi})}}}
 else if(B.st==='wind'){if(B.t<=0){B.st='strike';B.t=.22;B.atk++;if(ad<86&&H.y>B.y-45)heroHit(Math.sign(dx)||1)}}
 else if(B.st==='strike'){if(B.t<=0){B.st='rest';B.t=.95;B.hits=0}}
 else if(B.st==='rest'){if(B.t<=0){B.st='walk';B.t=.5}}
 else if(B.st==='cwind'){B.f=Math.sign(dx)||B.f;if(B.t<=0){B.st='charge';B.atk++}}
 else if(B.st==='charge'){B.x+=B.f*(300+wi*15)*dt;if(Math.random()<dt*30)K.burst(B.x-B.f*20,B.y,['#e8d3a0','#fff'],2,60,{g:100,life:.4,size:.8});if(Math.abs(H.x-B.x)<34&&H.y>B.y-48)heroHit(B.f);if(B.x<=minX||B.x>=maxX){B.st='dizzy';B.t=1.9;B.hits=0;K.shake=10;K.sfx('bonk');K.burst(B.x+B.f*20,B.y-60,['#fff','#ffd700'],16,200)}}
 else if(B.st==='dizzy'){if(B.t<=0){B.st='walk';B.t=.6}}
 B.x=clamp(B.x,minX,maxX);B.gait.update(B.st==='charge'?0:B.x-ox,dt);
 for(let i=B.proj.length-1;i>=0;i--){const p=B.proj[i];p.vy+=1500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(Math.hypot(p.x-H.x,p.y-(H.y-30))<p.r+16){heroHit(Math.sign(p.vx)||1);B.proj.splice(i,1);continue}if(p.y>GY){K.burst(p.x,GY,['#6b4a2a','#fff'],8,120);B.proj.splice(i,1)}}}
/* ---------- QA bot ---------- */
function bot(dt){const H=G.hero;IN.dir=0;IN.run=0;IN.down=0;IN.up=0;
 if(G.L.boss){const B=G.boss,dx=B.x-H.x,ad=Math.abs(dx);const vul=B.st==='rest'||B.st==='dizzy';
  for(const p of B.proj)if(Math.abs(p.x-H.x)<90&&p.vy>0&&H.onG){IN.jump=1}
  if(B.st==='charge'){if(Math.abs(dx)<120&&Math.sign(-dx)===B.f&&H.onG)IN.jump=1;IN.dir=0}
  else if(B.st==='wind'||B.st==='strike'||B.st==='cwind'){IN.dir=-Math.sign(dx)||1;IN.run=1;if(H.x<2*T||H.x>(G.lv.cols-2)*T){IN.jump=1;IN.dir=Math.sign(dx)}}
  else if(vul){if(ad>56){IN.dir=Math.sign(dx);IN.run=1}else{H.f=Math.sign(dx)||1;if(H.punchT<=0)punch()}}
  else{if(ad<100){IN.dir=-Math.sign(dx)||1}else if(ad>140){IN.dir=Math.sign(dx)}}return}
 const tgt=G.lv.cages.find(c=>!c.open)||{x:G.lv.exitX+20,fy:GY,exit:1};const dx=tgt.x-H.x;
 IN.dir=Math.abs(dx)>14?Math.sign(dx):0;IN.run=1;
 const a=actTarget();if(a){doAction();return}
 if(H.climb){IN.up=H.climb.y0<tgt.fy+4?0:1;IN.up=tgt.fy<H.y?1:0;IN.down=tgt.fy>H.y?1:0;if(!IN.up&&!IN.down)IN.dir=Math.sign(dx)||1;return}
 if(H.onG){if(tgt.fy<H.y-4&&Math.abs(dx)<70){IN.jump=1}
  if(tgt.fy>H.y+4&&Math.abs(dx)<40){IN.down=1}
  const f=IN.dir||H.f;const fc=Math.floor((H.x+f*22)/T);if(solid(tile(fc,Math.floor((H.y-4)/T)))||(!solid(tile(fc,Math.floor((H.y+4)/T)))&&tile(fc,Math.floor((H.y+4)/T))!=='='&&H.y>=GY-1))IN.jump=1}
 G.botStuck=(G.botStuck||0)+dt;if(Math.abs(H.x-(G.botLX||0))>20){G.botLX=H.x;G.botStuck=0}if(G.botStuck>1.2&&H.onG){IN.jump=1;G.botStuck=0;IN.dir=G.botFlip?-IN.dir:IN.dir;G.botFlip=!G.botFlip}}
/* ---------- world drawing (Vol 1 tile paints) ---------- */
function drawTiles(c0,c1){const lv=G.lv;PTP.tiles(X,G.wi,c0,c1,tile,T,lv.water,RT);for(const l of lv.ladders)PTP.ladder(X,l,G.wi===2)}
function drawBush(b){PTP.bush(X,b,RT)}
function drawCage(c){const x=c.x,y=c.fy,w=T*1.5,h=T*1.65;
 if(!c.open)for(let i=0;i<c.n;i++){const kx=x+(c.n>1?(i-.5)*16:0);PTP.use(X);PTP.drawMan(kidKind(c.kidsC[i]),kx,y,PTP.S*.92,i?-1:1,'scared',RT+i,{})}
 X.strokeStyle=c.open?'rgba(180,180,190,.55)':'#9aa0a8';X.lineWidth=3;const bars=6;for(let i=0;i<=bars;i++){const bx=x-w/2+i*w/bars;if(c.open&&i>0&&i<bars)continue;X.beginPath();X.moveTo(bx,y);X.lineTo(bx,y-h);X.stroke()}
 X.lineWidth=4;X.strokeStyle='#6a6f78';X.beginPath();X.moveTo(x-w/2-2,y-h);X.lineTo(x+w/2+2,y-h);X.moveTo(x-w/2-2,y-1);X.lineTo(x+w/2+2,y-1);X.stroke();
 if(c.open){X.save();X.translate(x+w/2,y);X.scale(.25,1);X.strokeStyle='#9aa0a8';X.lineWidth=3;for(let i=0;i<5;i++){X.beginPath();X.moveTo(i*w/5,0);X.lineTo(i*w/5,-h);X.stroke()}X.restore()}
 else{X.fillStyle='#d4a640';X.fillRect(x+w/2-10,y-h*.55,8,11)}}
function drawExit(){const lv=G.lv,w=WORLDS[G.wi];const x=lv.exitX;
 if(w.exit==='boat'){const bx=(lv.cols-1.6)*T,by=GY+8+Math.sin(RT*1.6)*3;X.fillStyle='rgba(0,0,0,.28)';X.beginPath();X.ellipse(bx,by+6,46,8,0,0,TAU);X.fill();X.fillStyle='#2b2d33';X.beginPath();X.moveTo(bx-48,by-8);X.quadraticCurveTo(bx,by+16,bx+48,by-8);X.lineTo(bx+40,by-18);X.quadraticCurveTo(bx,by-4,bx-40,by-18);X.closePath();X.fill();X.fillStyle='#45484f';X.beginPath();X.moveTo(bx-32,by-12);X.quadraticCurveTo(bx,by-2,bx+32,by-12);X.lineTo(bx+28,by-16);X.quadraticCurveTo(bx,by-6,bx-28,by-16);X.closePath();X.fill();X.fillStyle='#d8d2c2';X.fillRect(bx-16,by-28,32,8);X.fillStyle='#111';X.fillRect(bx-3,by-44,6,16)}
 else{const gx=x+T*1.2;X.fillStyle='#6b4423';X.fillRect(gx-28,GY-92,8,92);X.fillRect(gx+20,GY-92,8,92);X.fillStyle='#3d2612';X.fillRect(gx-32,GY-100,64,10);const g=X.createLinearGradient(0,GY-90,0,GY);g.addColorStop(0,'rgba(124,252,154,.12)');g.addColorStop(1,'rgba(124,252,154,.55)');X.fillStyle=g;X.fillRect(gx-18,GY-88,36,88)}
 const sx=x-8,open=G.kidsFreed>=lv.kidsTotal;X.strokeStyle='#ddd';X.lineWidth=3;X.beginPath();X.moveTo(sx,GY);X.lineTo(sx,GY-64);X.stroke();X.fillStyle=open?'#3bd16f':'#ffb44a';X.beginPath();X.moveTo(sx,GY-64);X.lineTo(sx+26+Math.sin(RT*4)*2,GY-54);X.lineTo(sx,GY-44);X.fill();
 K.text(open?'EXIT':'🔒 '+G.kidsFreed+'/'+lv.kidsTotal,sx+8,GY-78,15,'#fff',{stroke:'#000',lw:3,max:70})}
function drawFlag(cp){const x=cp.x,y=cp.fy;X.strokeStyle='#ddd';X.lineWidth=3;X.beginPath();X.moveTo(x,y);X.lineTo(x,y-52);X.stroke();X.fillStyle=cp.on?'#3bd16f':'#ffb44a';X.beginPath();X.moveTo(x,y-52);X.lineTo(x+18+Math.sin(RT*5)*2,y-44);X.lineTo(x,y-36);X.fill()}
function cone(x,y,a,len,half,m,warm){X.save();X.globalCompositeOperation='lighter';const g=X.createRadialGradient(x,y,4,x,y,len);const c=m>.5?'255,70,60':warm?'255,240,150':'200,230,255';g.addColorStop(0,'rgba('+c+','+(.42+m*.2)+')');g.addColorStop(1,'rgba('+c+',0)');X.fillStyle=g;X.beginPath();X.moveTo(x,y);X.arc(x,y,len,a-half,a+half);X.closePath();X.fill();X.restore()}
function drawLights(){for(const t of G.lv.thugs){if(t.down)continue;const e=thugEye(t);cone(e.x,e.y,e.a,175,.4,t.meter,1)}
 for(const l of G.lv.lights){const cx=l.cx==null?l.x0:l.cx;X.save();X.globalCompositeOperation='lighter';const m=l.m||0;const c=m>.4?'255,80,70':'255,250,200';X.fillStyle='rgba('+c+',.13)';X.beginPath();X.moveTo(cx+80,-300);X.lineTo(cx-l.r,l.fy-4);X.lineTo(cx+l.r,l.fy-4);X.lineTo(cx+110,-300);X.fill();
  const g=X.createRadialGradient(cx,l.fy-30,4,cx,l.fy-30,l.r+12);g.addColorStop(0,'rgba('+c+',.5)');g.addColorStop(1,'rgba('+c+',0)');X.fillStyle=g;X.beginPath();X.ellipse(cx,l.fy-30,l.r+12,40,0,0,TAU);X.fill();X.restore()}
 for(const c of G.lv.cams){cone(c.x,c.y,c.a==null?Math.PI/2:c.a,150,.26,c.m||0,0);X.fillStyle='#333';X.fillRect(c.x-4,c.y-10,8,10);X.save();X.translate(c.x,c.y);X.rotate(c.a||Math.PI/2);X.fillStyle='#d8d8d8';K.rr(-6,-7,22,14,3);X.fill();X.fillStyle=(c.m||0)>.3||Math.sin(RT*8)>0?'#ff3a3a':'#5a1a1a';X.beginPath();X.arc(16,0,3,0,TAU);X.fill();X.restore()}}
function cast(kind,x,y,f,pose,ph,o){o=o||{};PTP.use(X);PTP.drawMan(kind,x,y,PTP.S*(o.sc||1),f||1,pose,ph,o)}
function drawThug(t){const mv=!t.down&&t.gait.amp>.12;cast('thug',t.x,t.fy,t.f,t.down?'ko':mv?'walk':'idle',mv?t.gait.ph:t.gait.ph, {amp:mv?gaitAmp(t.gait):0,dizzy:!!t.down,noLight:!!t.down})}
function drawHero(H,o){o=o||{};let pose=H.climb?'climb':H.punchT>0?'punch':!H.onG?'jump':H.crouch?'crouch':H.gait.amp>.12?'walk':'idle';
 const ph=pose==='climb'?(H.climbPh||0):pose==='walk'||pose==='crouch'?H.gait.ph:RT;
 X.save();if(H.hidden)X.globalAlpha*=.6;else if(H.inv>0&&Math.sin(RT*30)>0)X.globalAlpha*=.45;
 cast('hero',H.x,H.y,H.f,pose,ph,{amp:pose==='walk'||pose==='crouch'?gaitAmp(H.gait):1});X.restore()}
function drawKid(k){const mv=k.gait.amp>.1;const pose=G.state==='win'?'cheer':mv?'walk':'idle';cast(k.kind||'kid0',k.x,k.y,k.f,pose,pose==='cheer'?RT*2:k.gait.ph,{amp:mv?gaitAmp(k.gait):1,sc:.95})}
function drawBoss(B){const lk=B.lk;let pose='idle',amp=0,ph=B.gait.ph;
 if(B.st==='down'){pose='ko';ph=RT}else if(B.st==='wind'||B.st==='cwind'){pose='windup';ph=RT}else if(B.st==='strike'){pose='punch';ph=RT}
 else if(B.st==='charge'){pose='walk';amp=1.15;ph=RT*8}else if(B.st==='dizzy'){pose='hurt';ph=RT}else if(B.gait.amp>.1){pose='walk';amp=gaitAmp(B.gait)}
 const sh=B.hurt>0?rand(-3,3):0;cast(lk.kind,B.x+sh,B.y,B.f,pose,ph,{amp,sc:lk.sc,look:lk.look,dizzy:B.st==='dizzy'||B.st==='down',flash:B.hurt>0?.08:0,noLight:lk.kind!=='thug'});
 if(B.st==='wind'||B.st==='cwind')K.text('!',B.x,B.y-78*lk.sc,30,'#ff3b3b',{stroke:'#000',lw:5,fam:TF});
 for(const p of B.proj){X.fillStyle='#6a4524';X.beginPath();X.arc(p.x,p.y,p.r,0,TAU);X.fill();X.fillStyle='#4a2c14';X.beginPath();X.arc(p.x-2,p.y-2,p.r*.35,0,TAU);X.fill()}}
function camera(dt){const H=G.hero,vw=viewW(),max=Math.max(0,G.lv.cols*T-vw);let tx=G.L.boss?max/2:clamp(H.x-vw*(K.land?.36:.32)+H.f*20,0,max);G.cam=dt?lerp(G.cam,tx,Math.min(1,dt*5)):tx;return max}
function worldOY(sc){return K.H-K.safe.b-NR*T*sc-(K.land?0:K.H*.07)}
function drawPlay(){const W=K.W,H=K.H,s=K.safe,w=WORLDS[G.wi],sc=viewScale(),vw=viewW();const max=Math.max(1,G.lv.cols*T-vw);const oy=worldOY(sc);
 PTP.scene(X,G.wi,{W:K.W,H:K.H,floor:oy+GY*sc,t:RT,pan:G.cam*.12});
 X.save();if(K.shake>0)X.translate(rand(-K.shake,K.shake)*.4,rand(-K.shake,K.shake)*.4);X.translate(-G.cam*sc,oy);X.scale(sc,sc);
 const c0=Math.max(0,Math.floor(G.cam/T)-1),c1=Math.min(G.lv.cols-1,Math.ceil((G.cam+vw)/T)+1);
 drawLights();drawTiles(c0,c1);G.lv.cps.forEach(drawFlag);if(!G.L.boss)drawExit();G.lv.cages.forEach(drawCage);
 for(const t of G.lv.thugs)if(t.x>G.cam-80&&t.x<G.cam+vw+80)drawThug(t);
 G.kids.forEach(drawKid);if(G.boss)drawBoss(G.boss);drawHero(G.hero);
 G.lv.bushes.forEach(b=>{if(b.x>G.cam-60&&b.x<G.cam+vw+60)drawBush(b)});
 K.drawFx();X.restore();
 const toS=(x,y)=>[(x-G.cam)*sc,oy+y*sc];
 // guard marks
 for(const t of G.lv.thugs){if(t.down||t.meter<.12)continue;const [x,y]=toS(t.x,t.fy-84);const m=Math.min(1,t.meter);K.text(m>.7?'!':'?',x,y,24+m*10,m>.7?'#ff4a4a':'#ffd400',{stroke:'#000',lw:5})}
 // prompt
 const a=G.state==='play'&&!G.L.boss?actTarget():null;if(a){const [x,y]=toS(G.hero.x,G.hero.y-80);const txt=a.k==='bonk'?'TAP: BONK!':'TAP: FREE!';X.font=K.font(20);const tw=X.measureText(txt).width+24;X.fillStyle='rgba(20,20,30,.85)';K.rr(x-tw/2,y-34,tw,36,12);X.fill();X.strokeStyle='#ffd700';X.lineWidth=2;X.stroke();K.text(txt,x,y-15,20,'#ffd700')}
 if(G.hero.hidden){const [x,y]=toS(G.hero.x,G.hero.y-70);K.text('HIDDEN',x,y,18,'#9be05a',{stroke:'#000',lw:4})}
 drawHUD();
 if(G.state==='caught'){X.fillStyle='rgba(160,0,0,'+(.25+.1*Math.sin(RT*10))+')';X.fillRect(0,0,W,H);K.text(G.bossLose?'KNOCKED OUT!':G.hero.y>NR*T?'SPLASH!':'SPOTTED!',W/2,H*.4,44,'#fff',{stroke:'#7a0000',lw:8})}
 if(G.banner>0&&G.state!=='caught'){X.globalAlpha=Math.min(1,G.banner*2);const L=G.L;const bw=Math.min(W-40,520),by=K.land?s.t+66:s.t+120;X.fillStyle='rgba(15,15,30,.82)';K.rr(W/2-bw/2,by,bw,96,18);X.fill();X.strokeStyle=w.acc;X.lineWidth=3;X.stroke();
  K.text(L.boss?'BOSS: '+w.boss:'LEVEL '+L.label,W/2,by+30,28,'#fff',{stroke:'#000',lw:5,max:bw-20});K.text(L.boss?'Tap to punch when he\'s dizzy!':'Free '+G.lv.kidsTotal+(G.lv.kidsTotal>1?' kids':' kid')+' and reach the exit!',W/2,by+68,20,'#ffd700',{max:bw-20});X.globalAlpha=1}
 const hint=hintText();if(hint&&G.state==='play'){const bw=Math.min(W-30,560);const lines=K.wrap(hint,bw-30,19);const bh=lines.length*24+18;const by=K.land?H-s.b-bh-10:oy+NR*T*sc+12;X.fillStyle='rgba(10,10,25,.78)';K.rr(W/2-bw/2,Math.min(by,H-s.b-bh-6),bw,bh,14);X.fill();K.para(hint,W/2,Math.min(by,H-s.b-bh-6)+20,bw-30,19,'#fff',{lh:1.25,w:700})}
 if(G.state==='pause')drawPause()}
function hintText(){const H=G.hero,L=G.L;if(L.boss){return G.t<5?'Swipe up to jump the charges. Back away when you see "!" and TAP to punch while he\'s dizzy.':null}
 if(L.i!==0&&!(L.li===0&&G.t<5))return null;if(L.i!==0)return WORLDS[L.w].tip;
 if(G.t<6)return 'Drag right to walk. Drag farther to run. Swipe up to jump.';
 const t=G.lv.thugs.find(t=>!t.down&&t.x>H.x-40&&t.x-H.x<300&&Math.abs(t.fy-H.y)<10);if(t&&!H.hidden&&Math.sign(H.x-t.x)===t.f)return 'Goon ahead! Stand in a bush and drag DOWN to hide until he turns away.';
 if(t&&Math.sign(H.x-t.x)!==t.f&&!actTarget())return 'He\'s facing away. WALK up behind him (running is noisy!) and TAP to bonk.';
 if(H.x>G.lv.exitX-200&&G.kidsFreed<G.lv.kidsTotal)return 'Free every kid before you leave! Tap a cage when you\'re next to it.';return null}
function heart(x,y,r,on){X.fillStyle=on?'#ff3a5a':'rgba(255,255,255,.25)';X.beginPath();X.moveTo(x,y+r*.9);X.bezierCurveTo(x-r*1.3,y,x-r*.9,y-r*1.1,x,y-r*.35);X.bezierCurveTo(x+r*.9,y-r*1.1,x+r*1.3,y,x,y+r*.9);X.fill();X.strokeStyle='rgba(0,0,0,.5)';X.lineWidth=2;X.stroke()}
function drawHUD(){const W=K.W,s=K.safe;const y=s.t+12;X.fillStyle='rgba(10,10,25,.62)';K.rr(s.l+8,y-4,K.land?360:Math.min(W-90,320),48,14);X.fill();
 for(let i=0;i<G.maxH;i++)heart(s.l+30+i*28,y+20,11,i<G.hearts);let x=s.l+30+G.maxH*28+6;
 if(G.L.boss){const B=G.boss;const bw=K.land?150:Math.min(140,W-90-x-60);K.text(G.L.label,x+18,y+20,18,'#fff',{align:'left'});const bx=x+58;X.fillStyle='rgba(0,0,0,.5)';K.rr(bx,y+12,bw,16,8);X.fill();X.fillStyle='#ff4a6a';K.rr(bx,y+12,bw*Math.max(0,B.hp)/B.mx,16,8);X.fill()}
 else{K.text('KIDS '+G.kidsFreed+'/'+G.lv.kidsTotal,x,y+20,20,G.kidsFreed>=G.lv.kidsTotal?'#9be05a':'#fff',{align:'left',stroke:'#000',lw:3});x+=118;K.text(G.L.label,x,y+20,18,'#ffd700',{align:'left'})}
 if(!G.L.boss&&G.sus>.05){const bw=120,bx=W/2-bw/2,by=y+56;X.fillStyle='rgba(0,0,0,.5)';K.rr(bx,by,bw,12,6);X.fill();X.fillStyle=G.sus>.6?'#ff4a4a':'#ffd400';K.rr(bx,by,bw*Math.min(1,G.sus),12,6);X.fill()}
 K.button('pause',W-s.r-62,s.t+8,54,54,'II',{color:'#4a4f6a',px:24,nofocus:1,cb:()=>Play.pause()})}
function drawPause(){const W=K.W,H=K.H;X.fillStyle='rgba(5,5,20,.7)';X.fillRect(0,0,W,H);K.text('PAUSED',W/2,H*.2,40,'#fff',{stroke:'#000',lw:6});const bw=Math.min(300,W-60),bh=56;let y=H*.3;
 K.button('resume',W/2-bw/2,y,bw,bh+6,'▶ RESUME',{color:'#2fae4a',px:24,cb:()=>Play.resume()});y+=bh+18;
 K.button('restart',W/2-bw/2,y,bw,bh,'↻ RESTART',{color:'#3a7ac8',px:22,cb:()=>startLevel(G.L.i)});y+=bh+12;
 K.button('quit',W/2-bw/2,y,bw,bh,'◀ MAP',{color:'#4a4f6a',px:22,cb:()=>{G=null;K.go(Map)}});y+=bh+12;
 K.button('snd',W/2-bw/2,y,bw,bh,AU.muted?'🔇 SOUND OFF':'🔊 SOUND ON',{color:'#6a4fd0',px:20,cb:()=>{AU.muted=!AU.muted;AU.apply();save.muted=AU.muted;persist()}})}
/* ---------- input ---------- */
let TP=null;
function readInput(){let dir=0,run=0,down=0,up=0;
 if(TP){const p=TP.p;const dx=p.x-TP.ax,dy=p.y-TP.ay;if(Math.abs(dx)>16)dir=Math.sign(dx);if(Math.abs(dx)>62)run=1;if(dy>34&&dy>Math.abs(dx)*.7)down=1;if(dy<-30&&-dy>Math.abs(dx)*.7)up=1}
 const k=K.keys;if(k.ArrowLeft||k.KeyA)dir=-1;if(k.ArrowRight||k.KeyD)dir=1;if(k.ShiftLeft||k.ShiftRight)run=1;if(k.ArrowDown||k.KeyS)down=1;if(k.ArrowUp||k.KeyW)up=1;
 const P=K.pad;if(P.on){const ax=P.ax.x;if(Math.abs(ax)>.25){dir=Math.sign(ax);if(Math.abs(ax)>.75)run=1}if(P.held.left)dir=-1;if(P.held.right)dir=1;if(P.held.rb||P.held.rt)run=1;if(P.held.down||P.held.b||P.ax.y>.6)down=1;if(P.held.up||P.ax.y<-.6)up=1;
  if(P.pr.a)IN.jump=1;if(P.pr.x||P.pr.y)tapAction()}
 if(K.kp.Space||K.kp.KeyK)IN.jump=1;if((K.kp.ArrowUp||K.kp.KeyW)&&!ladderAt(G.hero.x,G.hero.y))IN.jump=1;if(K.kp.KeyX||K.kp.KeyJ||K.kp.Enter)tapAction();
 IN.dir=dir;IN.run=run;IN.down=down;IN.up=up}
/* ---------- play scene ---------- */
function finish(win){const g=G;g.state='done';g.won=win;Play.menu=false;const L=g.L;
 if(win){let st=1;if(g.spotted===0)st++;if(g.t<=(L.boss?75:g.lv.par))st++;g.stars=st;save.stars[L.i]=Math.max(save.stars[L.i]||0,st);save.unlocked=Math.max(save.unlocked,Math.min(30,L.i+2));save.kids+=g.kidsFreed;persist()}
 setTimeout(()=>{if(G===g)K.go(Result)},win?600:900)}
const Play={menu:false,primary:'resume',enter(){this.menu=false;K.focus=null;TP=null;camera(0)},
 down(p){if(!G||G.state==='pause')return;if(!TP){TP={p,ax:p.x0,ay:p.y0,hist:[{y:p.y,t:performance.now()}],jl:0}}else p.second=1},
 move(p){if(!TP||p!==TP.p)return;const now=performance.now();const dx=p.x-TP.ax,dy=p.y-TP.ay;if(Math.abs(dx)>100)TP.ax=p.x-Math.sign(dx)*100;if(Math.abs(dy)>90)TP.ay=p.y-Math.sign(dy)*90;
  TP.hist.push({y:p.y,t:now});while(TP.hist.length&&now-TP.hist[0].t>150)TP.hist.shift();
  if(TP.hist.length&&TP.hist[0].y-p.y>40&&now-TP.jl>350&&G.state==='play'){if(!ladderAt(G.hero.x,G.hero.y)||G.L.boss){IN.jump=1;TP.jl=now;TP.ay=p.y}}},
 up(p){if(TP&&p===TP.p){if(!p.moved&&p.dt<280)tapAction();TP=null}else if(p.second&&p.dt<320&&!p.moved)tapAction()},
 pause(){if(G&&(G.state==='play'||G.state==='ready')){G.prev=G.state;G.state='pause';this.menu=true;K.focus='resume';TP=null}},
 back(){if(G.state==='pause')this.resume();else this.pause()},
 resume(){G.state=G.prev||'play';this.menu=false;K.focus=null},
 update(dt){const g=G;if(!g)return;RT+=dt;const P=K.pad.pr;
  if(g.state==='pause'){return}
  if(P.start||K.kp.Escape||K.kp.KeyP){if(g.state==='play'||g.state==='ready'){this.pause();return}}
  K.updFx(dt);if(g.banner>0)g.banner-=dt;
  if(g.state==='ready'){g.state='play'}
  if(g.state==='play'){g.t+=dt;readInput();if(window.__ES&&__ES.bot)bot(dt);heroUpdate(dt);IN.jump=0;
   if(g.L.boss)bossUpdate(dt);else{for(const cp of g.lv.cps)if(!cp.on&&g.hero.x>cp.x-6&&Math.abs(g.hero.y-cp.fy)<4){cp.on=1;g.cp={x:cp.x,fy:cp.fy};K.sfx('cp');K.float('CHECKPOINT',cp.x,cp.fy-90,'#9be05a',22)}
    if(g.hero.x>=g.lv.exitX&&g.hero.onG){if(g.kidsFreed>=g.lv.kidsTotal){g.state='win';g.wt=0;K.sfx('win');K.float('RESCUED!',g.hero.x,g.hero.y-100,'#ffd700',34)}else if(!g.exitWarn){g.exitWarn=1;K.toast('Free all the kids first! '+(g.lv.kidsTotal-g.kidsFreed)+' left')}}else g.exitWarn=0}
   if(g.state==='play'&&!g.L.boss)guardsUpdate(dt);else if(g.L.boss)guardsUpdate(dt)}
  else if(g.state==='caught'){g.ct-=dt;if(g.L.boss&&g.boss)g.boss.gait.update(0,dt);if(g.ct<=0){if(g.bossLose){finish(false)}else respawn()}}
  else if(g.state==='win'){g.wt+=dt;const H=g.hero;IN.dir=1;IN.run=0;IN.down=0;IN.up=0;heroUpdate(dt);if(H.y>NR*T)H.y=GY;if(g.wt>1.8)finish(true)}
  else if(g.state==='bosswin'){g.bt-=dt;const B=g.boss;B.gait.update(0,dt);IN.dir=0;heroUpdate(dt);if(g.bt<1.2&&!g.lv.cages[0].open){g.lv.cages[0].open=1;K.sfx('free');g.kidsFreed=3;const c=g.lv.cages[0];for(let i=0;i<3;i++){g.kids.push({x:c.x+(i-1)*12,y:c.fy,f:-1,kind:kidKind(c.kidsC[i]),gait:new K.Gait({leg:20,walk:55,run:95})})}}if(g.bt<=0)finish(true)}
  kidsUpdate(dt);camera(dt)},
 draw(){if(G)drawPlay()}};
/* ---------- result ---------- */
const Result={menu:true,primary:'next',enter(){this.t=0;K.music.play(SONG_T);if(G.won)for(let i=0;i<G.stars;i++)setTimeout(()=>K.sfx('star'),400+i*300);this.primary=G.won?'next':'again'},update(dt){RT+=dt;this.t+=dt;K.updFx(dt);this.ph=(this.ph||0)+dt},back(){K.go(Map)},
 draw(){const g=G,W=K.W,H=K.H,s=K.safe,land=K.land;bg(g.wi,0,.35);X.fillStyle='rgba(10,8,30,.45)';X.fillRect(0,0,W,H);
  const cx=land?W*.62:W/2;const hs=land?2.1:2.4;const hx=land?W*.2:W/2,hy=land?H*.82:s.t+250;
  const jump=g.won?Math.abs(Math.sin(this.ph*5))*14:0;cast('hero',hx,hy-jump,1,g.won?'cheer':'hurt',this.ph,{sc:hs});
  if(g.won)g.kids.slice(0,4).forEach((k,i)=>{const kx=hx+(i%2?1:-1)*(40+Math.floor(i/2)*34)*hs*.5;cast(k.kind||'kid0',kx,hy-Math.abs(Math.sin(this.ph*5+i))*10,i%2?-1:1,'cheer',this.ph+i,{sc:hs*.95})});
  K.charRects.push({x:hx-28*hs,y:hy-64*hs,w:56*hs,h:66*hs,name:'hero'});
  let y=land?s.t+50:hy+30;
  if(g.won){K.text(g.L.boss?'BOSS BEATEN!':'RESCUED!',cx,y,38,'#ffd700',{stroke:'#000',lw:7,glow:'#fff38a'});y+=54;for(let j=0;j<3;j++){const on=j<g.stars&&this.t>.4+j*.3;K.text('★',cx+(j-1)*56,y,54,on?'#ffd700':'rgba(255,255,255,.25)',{stroke:'#000',lw:4})}y+=48;
   K.text('Kids saved: '+g.kidsFreed+'   Bonks: '+g.takedowns,cx,y,21,'#fff',{stroke:'#000',lw:4,max:land?W*.6:W-30});y+=32;K.text((g.L.boss?'Hits taken: ':'Times spotted: ')+g.spotted+'   Time: '+Math.round(g.t)+'s',cx,y,19,'#ffe9a8',{stroke:'#000',lw:4,max:land?W*.6:W-30});y+=30;
   K.text('★ finish  ★ '+(g.L.boss?'no hits':'never spotted')+'  ★ under '+(g.L.boss?75:g.lv.par)+'s',cx,y,16,'#cfe8ff',{stroke:'#000',lw:3,max:land?W*.6:W-30});y+=20}
  else{K.text(g.L.boss?'KNOCKED OUT!':'CAUGHT!',cx,y,40,'#ff6a6a',{stroke:'#000',lw:7});y+=52;K.para(g.L.boss?'Back away when you see "!", jump over the charge, and punch while he\'s dizzy.':'Out of hearts. Hide in bushes, wait for the lights to pass, and sneak up from behind!',cx,y,land?W*.5:W-60,20,'#fff',{stroke:'#000',lw:4});y+=70}
  const bw=Math.min(150,((land?W*.62:W)-50)/3),bh=58;const bx=cx-(bw*3+20)/2;const by=Math.min(H-s.b-bh-16,y+16);
  const last=g.L.i===29;
  K.button('map',bx,by,bw,bh,'◀ MAP',{color:'#4a4f6a',px:20,cb:()=>{G=null;K.go(Map)}});
  K.button('again',bx+bw+10,by,bw,bh,'↻ AGAIN',{color:'#3a7ac8',px:20,cb:()=>startLevel(g.L.i)});
  K.button('next',bx+2*(bw+10),by,bw,bh,last?'THE END ▶':'NEXT ▶',{color:'#2fae4a',px:20,dis:!g.won,cb:()=>{if(last){G=null;K.go(new K.Story(ENDING,()=>K.go(Title),{go:'THE END',px:20,bg:()=>bg(4,0,.2)}))}else{const n=g.L.i+1;G=null;K.go(Card,n)}}});
  K.drawFx()}};
/* ---------- title ---------- */
function titleLock(s,x,y,px,gold,maxW){X.font='700 '+px+'px '+TF;X.textAlign='center';X.textBaseline='middle';X.lineJoin='round';if(maxW){let p=px;while(p>14&&X.measureText(s).width>maxW){p-=1;X.font='700 '+p+'px '+TF;px=p}}X.lineWidth=Math.max(5,px*.16);X.strokeStyle='#2a0818';X.strokeText(s,x,y);if(gold){const gr=X.createLinearGradient(0,y-px*.6,0,y+px*.65);gr.addColorStop(0,'#fff6b0');gr.addColorStop(.5,'#ffc23a');gr.addColorStop(1,'#e8582a');X.fillStyle=gr}else X.fillStyle='#fff';X.fillText(s,x,y)}
function paintKey(x,y,w,h,key,fy){const im=K.img[key];X.fillStyle='#0a0618';X.fillRect(x,y,w,h);if(!im||!im.naturalWidth){PTP.scene(X,0,{W:K.W,H:K.H,floor:K.H*.72,t:RT,pan:0});return}const k=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;X.save();X.beginPath();X.rect(x,y,w,h);X.clip();X.drawImage(im,x+(w-dw)/2,y+(h-dh)*(fy==null?.45:fy),dw,dh);X.restore()}
const Title={menu:true,primary:'play',enter(){G=null;K.music.play(SONG_T)},update(dt){RT+=dt;K.updFx(dt)},back(){},
 draw(){const W=K.W,H=K.H,s=K.safe,land=K.land;
  const cx=W/2;const short=land&&H<520;const tp=short?Math.min(26,W*.03):land?Math.min(42,W*.038):Math.min(38,W*.092);const tY=land?s.t+tp+6:s.t+96;
  const bh=short?46:56,gap=short?8:10;const tot=Object.values(save.stars).reduce((a,b)=>a+b,0);
  let bx,by,bw;if(short){bw=Math.min(148,(W-s.l-s.r-gap*4)/5);const row=bw*5+gap*4;bx=s.l+(W-s.l-s.r-row)/2;by=H-s.b-bh-8}
  else if(land){bw=Math.min(560,W-s.l-s.r-32);bx=(W-bw)/2;by=H-s.b-(bh+8+gap+bh+gap+bh+36)}
  else{const fy=Math.min(H*.6,tY+tp*2.4+70*Math.min(2.6,W/150)+12);bw=Math.min(330,W-50);bx=(W-bw)/2;by=Math.max(fy+16,H-s.b-(bh*4+gap*3)-56)}
  if(land){paintKey(0,0,W,H,'wide',.34);const fz=X.createLinearGradient(0,by-70,0,by+16);fz.addColorStop(0,'rgba(10,6,24,0)');fz.addColorStop(1,'rgba(10,6,24,.82)');X.fillStyle=fz;X.fillRect(0,by-70,W,H-(by-70));const top=X.createLinearGradient(0,0,0,tY+tp*2.4);top.addColorStop(0,'rgba(10,6,30,.45)');top.addColorStop(1,'rgba(10,6,30,0)');X.fillStyle=top;X.fillRect(0,0,W,tY+tp*2.6)}
  else{paintKey(0,0,W,Math.max(by-8,H*.45),'tall',.42);const fz=X.createLinearGradient(0,by-78,0,by+8);fz.addColorStop(0,'rgba(10,6,24,0)');fz.addColorStop(1,'rgba(10,6,24,1)');X.fillStyle=fz;X.fillRect(0,by-78,W,86);X.fillStyle='#0a0618';X.fillRect(0,by,W,H-by);const top=X.createLinearGradient(0,0,0,s.t+tp*4);top.addColorStop(0,'rgba(10,6,30,.5)');top.addColorStop(1,'rgba(10,6,30,0)');X.fillStyle=top;X.fillRect(0,0,W,s.t+tp*4.2)}
  const maxT=land?W*.7:W-24;titleLock('RESCUE FROM',cx,tY-tp*.95,tp*.5,0,maxT);titleLock("PALM TREE PETE'S",cx,tY,tp,1,maxT);titleLock('ISLAND 2',cx,tY+tp*1.05,tp*1.08,1,maxT);titleLock('THE GREAT ESCAPE',cx,tY+tp*1.85,tp*.42,0,maxT);
  const vsY=short?H*.46:land?H*.5:Math.min(by-40,H*.58),pul=1+.1*Math.sin(RT*6),flash=Math.sin(RT*3)>.7;K.text('VS',cx,vsY,Math.min(short?36:land?64:40,tp*1.35)*pul,flash?'#fff':'#ffe14a',{stroke:'#a0102a',lw:8,fam:TF});
  const faceTop=land?H*.18:by-Math.min(300,by*.62),faceH=Math.max(40,(by-10)-faceTop);
  K.charRects.push({x:land?W*.02:4,y:faceTop,w:land?W*.34:W*.46,h:faceH,name:'hero'},{x:land?W*.64:W*.5,y:faceTop,w:land?W*.34:W*.48,h:faceH,name:'pete'});
  const goPlay=()=>{if(!save.seenIntro){save.seenIntro=true;persist();K.go(new K.Story(STORY,()=>K.go(Map),{px:20,bg:()=>bg(0,0,.3)}))}else K.go(Map)};
  const snd=()=>{AU.muted=!AU.muted;AU.apply();save.muted=AU.muted;persist()};
  if(short){K.button('play',bx,by,bw,bh,save.unlocked>1?'▶ CONT':'▶ PLAY',{color:'#d1302f',px:15,cb:goPlay});K.button('levels',bx+bw+gap,by,bw,bh,'LEVELS',{color:'#2a5cc8',px:14,cb:()=>K.go(Map)});K.button('how',bx+2*(bw+gap),by,bw,bh,'HOW TO PLAY',{color:'#3a7a3a',px:13,cb:()=>K.go(How)});K.button('story',bx+3*(bw+gap),by,bw,bh,'STORY',{color:'#7a5ad0',px:15,cb:()=>K.go(new K.Story(STORY,()=>K.go(Title),{px:20,bg:()=>bg(0,0,.3)}))});K.button('snd',bx+4*(bw+gap),by,bw,bh,AU.muted?'🔇 OFF':'🔊 ON',{color:'#4a4f6a',px:13,cb:snd});
   K.text('★ '+tot+'/90',cx,by-16,14,'#fff',{stroke:'#000',lw:3})}
  else{K.button('play',bx,by,bw,bh+8,save.unlocked>1?'▶ CONTINUE':'▶ PLAY',{color:'#d1302f',px:28,cb:goPlay});by+=bh+8+gap;
   const hw=(bw-gap)/2;K.button('levels',bx,by,hw,bh,'LEVELS',{color:'#2a5cc8',px:22,cb:()=>K.go(Map)});K.button('how',bx+hw+gap,by,hw,bh,'HOW TO PLAY',{color:'#3a7a3a',px:20,cb:()=>K.go(How)});by+=bh+gap;
   K.button('story',bx,by,hw,bh,'STORY',{color:'#7a5ad0',px:22,cb:()=>K.go(new K.Story(STORY,()=>K.go(Title),{px:20,bg:()=>bg(0,0,.3)}))});
   K.button('snd',bx+hw+gap,by,hw,bh,AU.muted?'🔇 OFF':'🔊 ON',{color:'#4a4f6a',px:20,cb:snd});by+=bh+gap;
   K.text('★ '+tot+' / 90     Kids saved: '+save.kids,bx+bw/2,by+14,18,'#fff',{stroke:'#000',lw:4,max:bw})}
  K.logo('tl');K.drawFx()}};
/* ---------- story ---------- */
function panel(wi,fn){return(x,y,w,h,t)=>{X.save();X.beginPath();X.rect(x,y,w,h);X.clip();X.translate(x,y);PTP.scene(X,wi,{W:w,H:h,floor:h*.86,t:t,pan:t*12});fn(w,h,t);X.restore()}}
const SG=new K.Gait({leg:27});let sgT=0;
function storyWalk(t,dist){const dt=Math.max(0,Math.min(.05,t-sgT));sgT=t;SG.update(dist*dt,dt);return SG.pose()}
const STORY=[
 {draw:panel(4,(w,h,t)=>{const sc=w/110;drawPerson('pete',w*.55,h*.92,-1,{legs:[{hip:.06,knee:.08},{hip:-.06,knee:.08}],arms:[{sh:.5,el:1.9},{sh:.45+Math.sin(t*3)*.05,el:1.9}],bob:0},{sc});K.text('HA HA HA!',w*.55,h*.14,w*.1,'#ffd23f',{stroke:'#3a1a00',lw:5})}),t:"Palm Tree Pete is back! He's built a brand-new island hideout with goons on every corner."},
 {draw:panel(3,(w,h,t)=>{const sc=w/110;X.save();X.scale(sc,sc);drawCage({x:w*.5/sc,fy:h*.9/sc,n:2,open:0,kidsC:[0,3]});X.restore();}),t:'His goons have locked kids in cages all over the island: on the beach, in the jungle, at the villa and up at the striped house on the hill.'},
 {draw:panel(0,(w,h,t)=>{const sc=w/120;const p=storyWalk(t,40);const x=((t*40)%(w/sc+40))-20;X.save();X.scale(sc,sc);drawPerson('hero',x,h*.92/sc,1,p,{});X.restore()}),t:'Tonight, one hero rows ashore. No noise. No fuss. Just a backpack and a plan.'},
 {draw:panel(1,(w,h,t)=>{const sc=w/150;X.save();X.scale(sc,sc);const fy=h*.92/sc;drawBush({x:40,fy,w:60,sd:3});drawPerson('thug',110,fy,-1,{legs:[{hip:.05,knee:.1},{hip:-.05,knee:.1}],arms:[{sh:1.3,el:.15},{sh:-.1,el:.3}],bob:0},{hold:1});X.restore();K.text('SHHH!',w*.28,h*.18,w*.1,'#9be05a',{stroke:'#000',lw:5})}),t:'Hide in the bushes, stay out of the flashlights, bonk the goons from behind, free every kid and get them all to the exit!'}];
const ENDING=[
 {draw:panel(4,(w,h,t)=>{const sc=w/120;drawPerson('pete',w*.5,h*.92,1,{legs:[{hip:.0,knee:.0},{hip:0,knee:0}],arms:[{sh:.05,el:.05},{sh:.05,el:.05}],bob:0},{sc,emo:'dizzy'});X.strokeStyle='#c9a35a';X.lineWidth=5;for(let i=0;i<4;i++){X.beginPath();X.moveTo(w*.5-sc*14,h*.92-sc*(22+i*8));X.lineTo(w*.5+sc*14,h*.92-sc*(18+i*8));X.stroke()}}),t:"Palm Tree Pete is tied up on his own dock, and the Coast Guard is on the way. No more hideouts for Pete!"},
 {draw:panel(4,(w,h,t)=>{const sc=w/170;X.save();X.scale(sc,sc);const fy=h*.92/sc;for(let i=0;i<5;i++)cast(kidKind(i),30+i*26,fy-Math.abs(Math.sin(t*5+i))*8,i%2?-1:1,'cheer',t*3+i,{sc:1.15});X.restore()}),t:'Every kid is safe on the rescue boat, heading home to their families. Hooray!'},
 {draw:panel(0,(w,h,t)=>{K.text('THE END',w/2,h*.3,w*.14,'#ffd23f',{stroke:'#3a1a00',lw:6});K.text('Thanks for playing!',w/2,h*.5,w*.075,'#fff',{stroke:'#000',lw:4})}),t:'Thanks for playing! Go back for any stars you missed.'}];
/* ---------- map ---------- */
const Map={menu:true,primary:'lv0',enter(){K.music.play(SONG_T);const n=Math.min(save.unlocked,30)-1;this.wi=Math.floor(n/6);this.primary='lv'+n;K.focus='lv'+n},update(dt){RT+=dt;K.updFx(dt)},back(){K.go(Title)},
 draw(){const W=K.W,H=K.H,s=K.safe,land=K.land,wi=this.wi,w=WORLDS[wi];bg(wi,Math.sin(RT*.05)*.5,.3);
  K.button('back',s.l+10,s.t+10,110,50,'◀ BACK',{color:'#4a4f6a',px:20,cb:()=>K.go(Title)});
  const tY=s.t+(land?36:100);K.text('WORLD '+(wi+1),W/2,tY-(land?0:32),land?22:24,'#fff',{stroke:'#000',lw:5});K.text(w.n,W/2,tY+(land?28:0),land?32:36,w.tint,{stroke:'#000',lw:6,max:W-150});
  const ab=54;const ay=land?H*.44:tY+56;
  K.button('wl',s.l+10,ay,ab,ab+20,'◀',{color:'#3a7ac8',dis:wi===0,px:28,cb:()=>{this.wi--;K.focus='lv'+this.wi*6}});
  K.button('wr',W-s.r-10-ab,ay,ab,ab+20,'▶',{color:'#3a7ac8',dis:wi===4,px:28,cb:()=>{this.wi++;K.focus='lv'+this.wi*6}});
  const cols=land?6:3,rows=land?1:2,gap=12;const aw=land?W-s.l-s.r-ab*2-80:W-48;const bw=Math.min(land?120:118,(aw-(cols-1)*gap)/cols),bh=land?104:112;
  const gx=(W-(cols*bw+(cols-1)*gap))/2,gy=land?H*.36:ay+ab+50;
  for(let k=0;k<6;k++){const L=LEVELS[wi*6+k],c=k%cols,r=Math.floor(k/cols),x=gx+c*(bw+gap),y=gy+r*(bh+gap),open=L.i<save.unlocked,st=save.stars[L.i]||0;
   K.button('lv'+L.i,x,y,bw,bh,'',{color:L.boss?'#b0304a':open?'#2c7a4a':'#4a4f6a',dis:!open,cb:()=>K.go(Card,L.i),draw:(x,y,w,h)=>{
    K.text(L.boss?'BOSS':L.label,x+w/2,y+h*.36,L.boss?26:32,'#fff',{stroke:'rgba(0,0,0,.4)',lw:4});if(!open)K.text('🔒',x+w/2,y+h*.74,24);else for(let j=0;j<3;j++)K.text('★',x+w/2+(j-1)*24,y+h*.74,24,j<st?'#ffd700':'rgba(255,255,255,.3)',{stroke:'rgba(0,0,0,.4)',lw:3})}})}
  const ty=land?H-s.b-34:gy+rows*(bh+gap)+34;const locked=save.unlocked<=wi*6;K.para(locked?'Finish the world before to unlock '+w.n+'.':w.tip,W/2,ty,Math.min(W-60,600),19,'#fff',{stroke:'rgba(0,0,0,.6)',lw:4,center:true,w:700});
  if(!land){const sc=2.2;const fy=Math.min(H-s.b-30,ty+80+66*sc);cast('hero',W/2,fy,1,'idle',RT,{sc});K.charRects.push({x:W/2-24*sc,y:fy-66*sc,w:48*sc,h:66*sc,name:'hero'})}
  K.drawFx()}};
/* ---------- level card ---------- */
const Card={menu:true,primary:'go',enter(i){this.i=i},update(dt){RT+=dt},back(){K.go(Map)},
 draw(){const W=K.W,H=K.H,s=K.safe,L=LEVELS[this.i],w=WORLDS[L.w];bg(L.w,0,.45);
  const cw=Math.min(480,W-36),ch=Math.min(K.land?H-s.t-s.b-24:440,440),cx=(W-cw)/2,cy=(H-ch)/2;X.fillStyle='rgba(20,18,40,.9)';K.rr(cx,cy,cw,ch,22);X.fill();X.strokeStyle=w.acc;X.lineWidth=3;X.stroke();
  K.text('LEVEL '+L.label,W/2,cy+38,24,w.tint);K.text(L.boss?'BOSS: '+w.boss:w.n,W/2,cy+80,32,'#fff',{stroke:'#000',lw:5,max:cw-30});
  const goal=L.boss?'Beat '+w.boss+' in a one-on-one fight to free the kids he\'s guarding!':'Sneak past the goons, free every kid, and lead them all to the exit.';
  K.para(goal,W/2,cy+126,cw-40,20,'#fff',{lh:1.3,w:700});K.para(L.boss?'Back off when you see "!". Jump the charge. Punch when he\'s dizzy.':w.tip,W/2,cy+(K.land?190:212),cw-40,18,'#cfe8ff',{lh:1.25,w:700});
  K.para('★ finish  ★ '+(L.boss?'no hits':'never spotted')+'  ★ fast',W/2,cy+ch-110,cw-30,18,'#ffd700');
  const bw=(cw-50)/2;K.button('back',cx+18,cy+ch-76,bw,58,'◀ MAP',{color:'#4a4f6a',px:22,cb:()=>K.go(Map)});K.button('go',cx+32+bw,cy+ch-76,bw,58,L.boss?'FIGHT! ▶':'GO! ▶',{color:'#d1302f',px:26,cb:()=>startLevel(this.i)})}};
/* ---------- how ---------- */
const How={menu:true,primary:'ok',update(dt){RT+=dt},back(){K.go(Title)},
 draw(){const W=K.W,H=K.H,s=K.safe;bg(0,0,.6);K.text('HOW TO PLAY',W/2,s.t+44,34,'#ffe14a',{stroke:'#000',lw:5,fam:TF});
  const t='DRAG left or right anywhere to walk. Drag farther to run.\nSWIPE UP to jump. TAP to bonk a goon or open a cage.\nDRAG DOWN in a bush to hide. Drag up or down on a ladder to climb.\n\nStay out of flashlights, searchlights and cameras. Running near a goon is noisy, so walk when you sneak up behind!\n\nFree every kid, then reach the exit. Boss fights: back off at "!", jump the charge, punch when he\'s dizzy.\n\nKeyboard: arrows, Shift run, Space jump, X action. Controller: stick, A jump, X action, B hide, Start pause.';
  K.para(t,W/2,s.t+96,Math.min(W-36,660),K.land?16:19,'#fff',{lh:1.25,w:700});K.button('ok',W/2-120,H-s.b-76,240,60,'GOT IT ▶',{color:'#2fae4a',px:24,cb:()=>K.go(Title)})}};
/* ---------- boot ---------- */
window.__ES={get G(){return G},LEVELS,save,startLevel,bot:false,genLevel,Title,Map,Result,Play,actTarget,doAction,IN,drawPerson,PTP,
 view(){if(!G)return null;const sc=viewScale(),oy=worldOY(sc),H=G.hero,B=G.boss;return{sc,oy,cam:G.cam,W:K.W,Hgt:K.H,hx:(H.x-G.cam)*sc,hy:oy+H.y*sc,boss:B?{x:(B.x-G.cam)*sc,y:oy+B.y*sc,kind:B.lk.kind}:null}}};
const imgs={logo:'logo589.webp',tall:'art/title-tall.jpg',wide:'art/title-wide.jpg'};
K.loadImages(imgs,()=>{});K.start(Title);
})();
