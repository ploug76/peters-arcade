/* Helene's Candy Quest: a match-3. The pieces are the jewels from Helene's chest. */
'use strict';
const $=id=>document.getElementById(id);
const LEVELS=window.CANDY_LEVELS;
const Q=new URLSearchParams(location.search);
const FAST=Q.get('fast')==='1';
const SPEED=FAST?0.12:1;
const CNAME=['Ruby Heart','Blue Drop','Green Square','Gold Diamond','Purple Point','Pearl'];
const SK='pa-test-hcq_save_v2';
let SV; try{SV=JSON.parse(localStorage.getItem(SK))||{}}catch(e){SV={}}
SV=Object.assign({stars:{}, best:{}, music:1, sound:1}, SV);
function persist(){try{localStorage.setItem(SK, JSON.stringify(SV))}catch(e){}}
function journeyTotal(){let t=0; for(const k in SV.best) t+=SV.best[k]|0; return t}
function soundMuted(){return !SV.sound}
var state='title';

const cv=$('cv'), ctx=cv.getContext('2d');
const gemsImg=new Image(); gemsImg.onload=()=>{if(B){draw(); kick()}}; gemsImg.src='art/gems.webp';
let playId=0, G=null, B=null, busy=false, sel=null, hint=null, cursor={r:3,c:3,on:false};
let CELL=48, boardPx=384, dpr=1, camShake=0;
const dying=[], tweens=[], floaters=[];
let raf=0, lastTs=0, running=false, clock=0;

function setState(s){state=s; document.body.dataset.mode=s; document.body.classList.toggle('land', innerWidth>innerHeight*1.08)}
function toast(t){const e=$('toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>e.classList.remove('on'), 1600)}
function say(t, ms){const b=$('bubble'); if(!b) return; b.textContent=t; b.classList.add('on'); clearTimeout(say._t); say._t=setTimeout(()=>b.classList.remove('on'), ms||2400)}

function nextIndex(){
  for(let i=0;i<LEVELS.length;i++) if(!(SV.stars[LEVELS[i].id]>0)) return i;
  return 0;
}
function starCount(){let n=0; for(const k in SV.stars) n+=SV.stars[k]|0; return n}
function refreshTitle(){
  const i=nextIndex();
  const done=LEVELS.every(L=>SV.stars[L.id]>0);
  const sub=$('bPlaySub');
  if(sub) sub.textContent=done? 'Play again from the start' : LEVELS[i].name+' · Level '+LEVELS[i].id;
  const best=$('bestLine');
  if(best){
    const tot=journeyTotal();
    best.textContent=tot? 'Best score '+tot.toLocaleString()+' · ★ '+starCount()+' / '+(LEVELS.length*3) : 'Match 3. Fill the chest.';
  }
}
function renderMap(){
  const box=$('mapList'); if(!box) return;
  box.innerHTML='';
  $('mapStars').textContent='★ '+starCount();
  LEVELS.forEach((L,i)=>{
    const open=i===0||SV.stars[LEVELS[i-1].id]>0;
    const st=SV.stars[L.id]|0;
    const b=document.createElement('button');
    b.type='button';
    b.className='mbtn'+(open?'':' lock')+(open&&i===nextIndex()?' cur':'');
    b.disabled=!open;
    b.innerHTML='<b>'+(open? L.id+'. '+L.name : '🔒 '+L.name)+'</b><small>'+(open?'★'.repeat(st)+'☆'.repeat(3-st):'Locked')+'</small>';
    b.onclick=()=>{ if(!open) return; AU.S.tap(); startLevel(i); };
    box.appendChild(b);
  });
}
function card(html, btns){
  const c=$('card');
  c.innerHTML='<div class="cbody">'+html+'</div><div class="btns"></div>';
  const box=c.querySelector('.btns');
  (btns||[]).forEach(b=>{
    const e=document.createElement('button');
    e.type='button'; e.className='btn '+(b.cls||'');
    e.innerHTML=b.t;
    e.onclick=()=>{ AU.start(); AU.S.tap(); b.fn(); };
    box.appendChild(e);
  });
  $('ov').classList.add('on');
}
function closeCard(){$('ov').classList.remove('on')}
function cardOpen(){return $('ov').classList.contains('on')}

function goalMet(){
  if(!G) return false;
  const g=G.def.goal;
  if(g.type==='score') return G.score>=g.target;
  return g.need.every(([c,n],i)=>(G.got[i]||0)>=n);
}
function hud(){
  if(!G) return;
  $('score').textContent=G.score.toLocaleString();
  $('moves').textContent=G.moves;
  $('lvlName').textContent='Level '+G.def.id+' · '+G.def.name;
  const g=G.def.goal, fill=$('gFill'), txt=$('gTxt');
  if(g.type==='score'){
    const p=Math.min(100, Math.floor(100*G.score/g.target));
    fill.style.width=p+'%';
    txt.textContent='Fill the chest: '+G.score.toLocaleString()+' / '+g.target.toLocaleString();
  }else{
    const bits=g.need.map(([c,n],i)=>{
      const left=Math.max(0, n-(G.got[i]||0));
      return '<span class="need'+(left?'':' done')+'"><i class="gi" style="background-position:'+(c*100/7)+'% 0"></i>'+(left?left:'✓')+'</span>';
    }).join('');
    fill.style.width='0';
    txt.innerHTML=bits;
  }
}
function layout(){
  const land=innerWidth>innerHeight*1.08;
  document.body.classList.toggle('land', land);
  const wrap=$('boardWrap'), hudEl=$('hud');
  if(!wrap) return;
  let size;
  if(!land){
    const top=(hudEl?hudEl.offsetHeight:120)+8;
    size=Math.floor(Math.max(240, Math.min(innerWidth-12, innerHeight-top-10, 620)));
    wrap.style.width=wrap.style.height=size+'px';
    wrap.style.left=((innerWidth-size)/2)+'px';
    wrap.style.top=top+'px';
    if(hudEl){hudEl.style.left='8px'; hudEl.style.right='8px'; hudEl.style.top='calc(6px + env(safe-area-inset-top))'; hudEl.style.width='auto'}
  }else{
    const side=Math.min(340, Math.max(220, innerWidth*0.38));
    size=Math.floor(Math.max(200, Math.min(innerHeight-16, innerWidth-side-20, 640)));
    wrap.style.width=wrap.style.height=size+'px';
    wrap.style.left='8px';
    wrap.style.top=Math.max(8, (innerHeight-size)/2)+'px';
    if(hudEl){
      hudEl.style.left=(size+16)+'px';
      hudEl.style.top='8px';
      hudEl.style.right='8px';
      hudEl.style.width='auto';
    }
  }
  boardPx=size; CELL=size/N;
  dpr=Math.min(2, window.devicePixelRatio||1);
  const px=Math.max(1, Math.round(size*dpr));
  if(cv.width!==px){cv.width=cv.height=px}
  cv.style.width=cv.style.height=size+'px';
}

function tween(obj, props, ms){
  ms=Math.max(16, ms*SPEED);
  return new Promise(res=>{
    const from={};
    for(const k in props) from[k]=obj[k];
    tweens.push({obj, from, to:props, t:0, d:ms, res});
    kick();
  });
}
function wait(ms){return tween({v:0},{v:1}, ms)}
function kick(){if(running) return; running=true; lastTs=0; raf=requestAnimationFrame(loop)}
function loop(ts){
  if(document.hidden){running=false; return}
  const dt=Math.min(40, lastTs?ts-lastTs:16);
  lastTs=ts; clock+=dt;
  for(let i=tweens.length-1;i>=0;i--){
    const w=tweens[i]; w.t+=dt; const p=Math.min(1, w.t/w.d); const e=1-(1-p)*(1-p);
    for(const k in w.to) w.obj[k]=w.from[k]+(w.to[k]-w.from[k])*e;
    if(p>=1){tweens.splice(i,1); w.res()}
  }
  for(let i=floaters.length-1;i>=0;i--){
    const f=floaters[i]; f.life+=dt; f.y-=dt*0.03;
    if(f.life>f.max) floaters.splice(i,1);
  }
  if(camShake>0) camShake*=0.9;
  if(state==='play'||tweens.length||floaters.length||dying.length) draw();
  if(tweens.length||floaters.length||dying.length||state==='play') requestAnimationFrame(loop);
  else running=false;
}
function draw(){
  if(!B) return;
  const p=dpr, c=CELL*p;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,cv.width,cv.height);
  const sh=camShake||0;
  ctx.setTransform(1,0,0,1,(Math.random()-0.5)*sh,(Math.random()-0.5)*sh);
  for(let r=0;r<N;r++) for(let k=0;k<N;k++){
    ctx.fillStyle=(r+k)%2?'rgba(255,255,255,.10)':'rgba(255,255,255,.18)';
    round(k*c+2, r*c+2, c-4, c-4, 8*p); ctx.fill();
  }
  if(sel){ctx.strokeStyle='#ffe08a'; ctx.lineWidth=4*p; strokeRound(sel.c*c+3, sel.r*c+3, c-6, c-6, 10*p)}
  if(hint){
    ctx.fillStyle='rgba(120,255,190,.35)';
    for(const h of hint) ctx.fillRect(h.c*c+4, h.r*c+4, c-8, c-8);
  }
  if(cursor.on && state==='play'){
    ctx.strokeStyle='#ffd400'; ctx.lineWidth=4*p;
    strokeRound(cursor.c*c+4*p, cursor.r*c+4*p, c-8*p, c-8*p, 10*p);
  }
  for(let r=0;r<N;r++) for(let k=0;k<N;k++){const g=B[r][k]; if(g) drawGem(g, c)}
  for(const g of dying) drawGem(g, c);
  ctx.font='800 '+Math.round(22*p)+'px system-ui,sans-serif';
  ctx.textAlign='center';
  for(const f of floaters){
    ctx.globalAlpha=Math.max(0, 1-f.life/f.max);
    ctx.lineWidth=4*p; ctx.strokeStyle='#3a1048';
    ctx.strokeText(f.t, f.x*p, f.y*p);
    ctx.fillStyle=f.col||'#fff6c2';
    ctx.fillText(f.t, f.x*p, f.y*p);
    ctx.globalAlpha=1;
  }
}
function round(x,y,w,h,r){ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath()}
function strokeRound(x,y,w,h,r){round(x,y,w,h,r); ctx.stroke()}
function drawGem(g, c){
  const sc=g.sc==null?1:g.sc, al=g.al==null?1:g.al;
  if(sc<0.02||al<0.02||!gemsImg.complete||!gemsImg.naturalWidth) return;
  const idx=g.s==='x'?7:(g.c>=0?g.c:0);
  const x=(g.x+0.5)*c, y=(g.y+0.5)*c, d=c*0.9*sc;
  ctx.globalAlpha=al;
  ctx.drawImage(gemsImg, idx*112, 0, 112, 112, x-d/2, y-d/2, d, d);
  if(g.s==='h'||g.s==='v'){
    ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.lineWidth=Math.max(2, c*0.06);
    ctx.beginPath();
    if(g.s==='h'){ctx.moveTo(x-d*0.28,y); ctx.lineTo(x+d*0.28,y)}
    else {ctx.moveTo(x,y-d*0.28); ctx.lineTo(x,y+d*0.28)}
    ctx.stroke();
  }else if(g.s==='b'){
    ctx.strokeStyle='rgba(255,220,90,.95)'; ctx.lineWidth=Math.max(2, c*0.07);
    ctx.beginPath(); ctx.arc(x,y,d*0.42,0,6.3); ctx.stroke();
  }
  ctx.globalAlpha=1;
}
function floater(x,y,t,col){floaters.push({x,y,t,col,life:0,max:800}); kick()}

function collectColors(clearSet){
  if(!G||G.def.goal.type!=='collect') return;
  for(const k of clearSet){
    const g=B[KR(k)][KC(k)];
    if(!g||g.c<0) continue;
    G.def.goal.need.forEach(([c],i)=>{ if(g.c===c) G.got[i]=(G.got[i]||0)+1; });
  }
}
async function resolve(pre, prefer){
  const my=playId;
  let chain=0;
  let st=computeStep(B, prefer, pre);
  while(st){
    chain++;
    collectColors(st.clear);
    const pts=st.clear.size*10*chain+st.cre.length*40+st.fx.length*20;
    G.score+=pts;
    const arr=[...st.clear];
    let sx=0, sy=0;
    for(const k of arr){sx+=KC(k); sy+=KR(k)}
    floater((sx/arr.length+0.5)*CELL, (sy/arr.length+0.2)*CELL, '+'+pts, chain>1?'#9effc8':'#fff6c2');
    if(chain>=2) floater(boardPx/2, boardPx*0.4, 'Combo x'+chain, '#ffd75e');
    if(st.cre.length) AU.S.special(); else AU.S.match(chain);
    if(!FAST && chain===2) say(chainLine(), 1400);
    const {gone, born}=applyClear(B, st);
    for(const {g} of gone) dying.push(g);
    const anims=[];
    for(const {g} of gone) anims.push(tween(g, {sc:0.15, al:0}, 150));
    for(const g of born){g.sc=0.3; anims.push(tween(g, {sc:1}, 200))}
    hud();
    await Promise.all(anims);
    if(my!==playId) return;
    dying.length=0;
    const mv=applyGravity(B);
    await Promise.all(mv.map(m=>tween(m.g, {y:m.to}, 120+Math.abs(m.to-m.g.y)*36)));
    if(my!==playId) return;
    for(const m of mv) m.g.y=m.to;
    st=computeStep(B, null, null);
  }
  if(!allMoves(B).length){
    say('Fresh shuffle from the chest!', 1600);
    shuffleBoard(B);
    const anims=[];
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){
      const g=B[r][c]; g.x=c; anims.push(tween(g, {y:r}, 280));
    }
    await Promise.all(anims);
    if(my!==playId) return;
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) B[r][c].y=r;
  }
}
function chainLine(){return ['Lovely!','Ooh, sparkly!','From my chest!','Sweet combo!','Beautiful!'][Math.floor(Math.random()*5)]}

async function trySwap(a, b){
  if(busy||state!=='play'||!G||G.over) return;
  if(a.r===b.r&&a.c===b.c) return;
  if(Math.abs(a.r-b.r)+Math.abs(a.c-b.c)!==1) return;
  const A=B[a.r][a.c], C=B[b.r][b.c];
  if(!A||!C) return;
  const my=playId;
  busy=true; sel=null; hint=null;
  const ok=moveValid(B, a, b);
  AU.S.tap();
  await Promise.all([tween(A,{x:b.c,y:b.r},120), tween(C,{x:a.c,y:a.r},120)]);
  if(my!==playId) return;
  if(!ok){
    await Promise.all([tween(A,{x:a.c,y:a.r},120), tween(C,{x:b.c,y:b.r},120)]);
    if(my!==playId) return;
    busy=false; return;
  }
  swapCells(B, a, b);
  A.x=b.c; A.y=b.r; C.x=a.c; C.y=a.r;
  G.moves--;
  hud();
  const pre=swapPre(B, a, b);
  await resolve(pre, [K(a.r,a.c), K(b.r,b.c)]);
  if(my!==playId) return;
  await finishMove();
  busy=false;
}
function starsFor(){
  const left=G.moves, start=G.def.moves;
  if(left>=Math.ceil(start*0.25)) return 3;
  if(left>=2) return 2;
  return 1;
}
async function finishMove(){
  hud();
  if(goalMet()){await levelWon(); return}
  if(G.moves<=0){levelFailed(); return}
}
async function levelWon(){
  if(!G||G.over) return;
  G.over=true; busy=true;
  const stars=starsFor();
  const id=G.def.id;
  SV.stars[id]=Math.max(SV.stars[id]|0, stars);
  SV.best[id]=Math.max(SV.best[id]|0, G.score);
  persist();
  AU.S.win();
  const last=G.index===LEVELS.length-1;
  const starHtml='<div class="stars">'+[0,1,2].map(i=>i<stars?'★':'<span class="off">★</span>').join('')+'</div>';
  const line='<p>Score <b>'+G.score.toLocaleString()+'</b> · '+G.moves+' moves left</p>';
  if(last){
    setState('finale');
    AU.play('finale');
    card('<img class="hero" src="art/helene.webp" alt="Helene holding her chest of candies"><h2>The chest is full!</h2>'+starHtml+line+
      '<p>Every candy is home with Helene. She is so proud of you.</p><p>Quest score <b>'+journeyTotal().toLocaleString()+'</b> · ★ '+starCount()+' / '+(LEVELS.length*3)+'</p>',
      [{t:'▶ Play again', cls:'gold', fn:()=>startLevel(0)},
       {t:'🏆 Leaderboard', cls:'teal', fn:()=>{try{PALB.show('quest')}catch(e){}}},
       {t:'🗺️ Levels', cls:'dim', fn:goMap},
       {t:'🏠 Home', cls:'dim', fn:goTitle}]);
    setTimeout(()=>{ if(state!=='finale') return; try{PALB.gameOver(journeyTotal(),{board:'quest', heading:'🏆 THE CHEST IS FULL', label:'Your quest score'})}catch(e){} }, 1200);
  }else{
    setState('clear');
    card('<div class="face"></div><h2>'+G.def.name+' complete!</h2>'+starHtml+line+'<p>Next: <b>'+LEVELS[G.index+1].name+'</b></p>',
      [{t:'▶ Next', cls:'gold', fn:()=>startLevel(G.index+1)},
       {t:'🗺️ Levels', cls:'dim', fn:goMap},
       {t:'🏠 Home', cls:'dim', fn:goTitle}]);
  }
}
function levelFailed(){
  if(!G||G.over) return;
  G.over=true; busy=true;
  setState('fail');
  AU.S.fail();
  const g=G.def.goal;
  let how='';
  if(g.type==='score') how='<p>Chest: <b>'+G.score.toLocaleString()+'</b> / '+g.target.toLocaleString()+'</p>';
  else how='<p>So close. The candies will pour again.</p>';
  card('<div class="face"></div><h2>Out of moves</h2>'+how+'<p>Helene tips the chest. Try this one again?</p>',
    [{t:'▶ Try again', cls:'gold', fn:()=>startLevel(G.index)},
     {t:'🗺️ Levels', cls:'dim', fn:goMap},
     {t:'🏠 Home', cls:'dim', fn:goTitle}]);
}

async function startLevel(i){
  closeCard();
  playId++;
  const my=playId;
  const def=LEVELS[i];
  setNC(6); setSPC(0);
  G={index:i, def, score:0, moves:def.moves, got:[], over:false};
  B=newBoard();
  sel=hint=null; cursor.on=false; dying.length=0; floaters.length=0;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){B[r][c].y=r-N; B[r][c].x=c}
  setState('play');
  layout(); hud();
  AU.start(); AU.play(['meadow','lane','taffy','hills','peaks','castle'][i%6]);
  say(def.intro, 3200);
  busy=true;
  await Promise.all(B.flat().map((g,n)=>tween(g, {y:Math.floor(n/N)}, 280+(n%N)*24)));
  if(my!==playId) return;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) B[r][c].y=r;
  busy=false;
  draw();
}
function goTitle(){playId++; closeCard(); G=null; B=null; setState('title'); refreshTitle(); AU.play('title')}
function goMap(){playId++; closeCard(); setState('map'); renderMap(); AU.play('title')}
function pauseGame(){
  if(state!=='play'||busy||!G||G.over) return;
  setState('pause');
  card('<h2>Paused</h2><p>'+G.def.name+'</p><p>The candies will wait.</p>',
    [{t:'▶ Resume', cls:'gold', fn:resumeGame},
     {t:'🔄 Restart', cls:'dim', fn:()=>startLevel(G.index)},
     {t:'💡 How to play', cls:'dim', fn:()=>howTo(pauseGame)},
     {t:'🗺️ Levels', cls:'dim', fn:goMap},
     {t:'🏠 Home', cls:'dim', fn:goTitle}]);
}
function resumeGame(){if(state!=='pause') return; closeCard(); setState('play'); kick()}
function goBack(){
  const palb=document.getElementById('palbOv');
  if(palb&&palb.classList.contains('on')){try{PALB.close()}catch(e){} return true}
  if(cardOpen()){if(state==='pause') resumeGame(); else closeCard(); return true}
  if(state==='map'){goTitle(); return true}
  if(state==='play'){pauseGame(); return true}
  return false;
}
function howTo(back){
  card('<h2>How to play</h2><ul>'+
    '<li><b>Swipe</b> a candy up, down, left, or right. Or <b>tap</b> one, then tap the one beside it.</li>'+
    '<li>Line up <b>3 or more</b> of the same candy from Helene\'s chest. They clear, the ones above fall, and new candies pour in.</li>'+
    '<li><b>Match 4</b> makes a <b>Ribbon</b>. It clears a whole row or column. An <b>L or T</b> makes a <b>Wrapper</b>, which clears a square. <b>Match 5</b> makes a <b>Chest Star</b>. Swap it to clear one color.</li>'+
    '<li>Each level has a goal and a limited number of moves. Leftover moves mean more stars.</li>'+
    '<li>A swap that does not match bounces back and does not spend a move.</li>'+
    '<li>⌨️ Arrows move the gold box. Space or Enter swaps. P pauses. M is sound.</li>'+
    '</ul>',
    [{t:'Got it!', cls:'gold', fn:()=>back?back():closeCard()}]);
}
function settings(back){
  const row=(k,label)=>'<div class="set"><span>'+label+'</span><button type="button" data-k="'+k+'" class="'+(SV[k]?'on':'')+'">'+(SV[k]?'On':'Off')+'</button></div>';
  card('<h2>Settings</h2>'+row('music','🎵 Music')+row('sound','🔔 Sounds'),
    [{t:'📖 How to play', cls:'dim', fn:()=>howTo(()=>settings(back))},
     {t:'✔ Done', cls:'gold', fn:()=>back?back():closeCard()}]);
  $('card').querySelectorAll('.set button').forEach(b=>b.onclick=()=>{
    const k=b.dataset.k; SV[k]=SV[k]?0:1; persist();
    b.classList.toggle('on', !!SV[k]); b.textContent=SV[k]?'On':'Off';
    AU.setMusic(!!SV.music); AU.setSound(!!SV.sound); AU.S.tap();
  });
}

/* ---------- input ---------- */
function cellAt(e){
  const r=cv.getBoundingClientRect();
  return {c:Math.floor((e.clientX-r.left)/(r.width/N)), r:Math.floor((e.clientY-r.top)/(r.height/N)), x:e.clientX, y:e.clientY};
}
const inB=p=>p.r>=0&&p.r<N&&p.c>=0&&p.c<N;
let pd=null;
cv.addEventListener('pointerdown', e=>{
  AU.start();
  if(state!=='play'||busy) return;
  const p=cellAt(e);
  if(!inB(p)) return;
  cursor.on=false;
  pd=p;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
});
cv.addEventListener('pointermove', e=>{
  if(!pd||busy) return;
  const dx=e.clientX-pd.x, dy=e.clientY-pd.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<CELL*0.28) return;
  const t=Math.abs(dx)>Math.abs(dy)?{r:pd.r,c:pd.c+Math.sign(dx)}:{r:pd.r+Math.sign(dy),c:pd.c};
  const a=pd; pd=null; sel=null;
  if(inB(t)) trySwap(a, t);
});
cv.addEventListener('pointerup', e=>{
  if(!pd) return;
  const p=pd; pd=null;
  tapCell(p);
});
cv.addEventListener('pointercancel', ()=>{pd=null});
function tapCell(p){
  if(state!=='play'||busy||!inB(p)) return;
  if(sel&&sel.r===p.r&&sel.c===p.c){sel=null; draw(); return}
  if(sel&&Math.abs(sel.r-p.r)+Math.abs(sel.c-p.c)===1){const a=sel; sel=null; trySwap(a,p); return}
  sel={r:p.r,c:p.c}; AU.S.tap(); draw();
}
addEventListener('keydown', e=>{
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return;
  AU.start();
  const k=e.key;
  if(k.startsWith('Arrow')) e.preventDefault();
  if(k===' '&&state==='play') e.preventDefault();
  if(e.repeat) return;
  if(k==='p'||k==='P'){ if(state==='play') pauseGame(); else if(state==='pause') resumeGame(); return }
  if(k==='Escape'){ goBack(); return }
  if(k==='m'||k==='M'){SV.music=SV.sound=(SV.music&&SV.sound)?0:1; persist(); AU.setMusic(!!SV.music); AU.setSound(!!SV.sound); toast(SV.music?'Sound on':'Sound off'); return}
  if(k==='h'||k==='H'){ showHint(); return }
  if(state!=='play'||busy) return;
  const mv={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[k];
  if(mv){cursor.on=true; cursor.r=Math.max(0,Math.min(N-1,cursor.r+mv[0])); cursor.c=Math.max(0,Math.min(N-1,cursor.c+mv[1])); window.__lastDir=k; draw(); return}
  if(k==='Enter'||k===' '){
    const dir={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[window.__lastDir||'ArrowRight'];
    const t={r:cursor.r+dir[0], c:cursor.c+dir[1]};
    if(inB(t)) trySwap({r:cursor.r,c:cursor.c}, t);
  }
});
function showHint(){
  if(state!=='play'||busy||!B) return;
  const m=findMove(B);
  if(!m) return;
  hint=m; draw(); AU.S.tap();
  say('Try the glowing pair.', 1600);
}

$('bPlay').onclick=()=>{AU.start(); AU.S.tap(); const done=LEVELS.every(L=>SV.stars[L.id]>0); startLevel(done?0:nextIndex())};
$('bMap').onclick=()=>{AU.start(); AU.S.tap(); goMap()};
$('mapHome').onclick=()=>{AU.S.tap(); goTitle()};
$('btnPause').onclick=()=>{AU.S.tap(); pauseGame()};
$('bSet').onclick=()=>{AU.start(); AU.S.tap(); settings()};
$('bHint').onclick=()=>{AU.start(); showHint()};

const PUBLIC_URL='https://ploug76.github.io/kellys-arcade/games/helenes-candy-quest/';
$('shareBtn').onclick=async()=>{
  const d={title:"Helene's Candy Quest", text:'Match the candies from Helene\'s chest!', url:PUBLIC_URL};
  try{if(navigator.share){await navigator.share(d); return}}catch(e){return}
  try{await navigator.clipboard.writeText(d.url); toast('Link copied!')}catch(e){toast(d.url)}
};
let deferred=null;
addEventListener('beforeinstallprompt', e=>{e.preventDefault(); deferred=e});
$('instBtn').onclick=async()=>{
  if(deferred){deferred.prompt(); deferred=null; return}
  toast(/iphone|ipad/i.test(navigator.userAgent)?'Tap Share, then Add to Home Screen':'Use the browser menu: Add to Home screen');
};
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){AU.suspend(); if(state==='play'&&!busy) pauseGame()}
  else {AU.resume(); kick()}
});
addEventListener('resize', ()=>{ if(state==='play'||state==='pause') layout(); });

window.__HCQ={
  get state(){return state},
  get G(){return G},
  get B(){return B},
  get busy(){return busy},
  startLevel, goTitle, journeyTotal,
  trySwap
};

AU.setMusic(!!SV.music); AU.setSound(!!SV.sound);
setState('title'); refreshTitle(); AU.play('title');
['pointerdown','keydown'].forEach(ev=>addEventListener(ev, ()=>AU.start(), {capture:true}));
if('serviceWorker' in navigator && location.protocol==='https:'){
  addEventListener('load', ()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{}));
}
