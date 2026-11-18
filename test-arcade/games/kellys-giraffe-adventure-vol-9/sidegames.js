/* Lantern Lake side games. Logic is pure so tests can run it in Node.
   Art on screen uses the painted lake colors. No trademarked game names. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.SideGames=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const COLS=['#ff5a7a','#ffb03a','#5ddea0','#6ec8ff','#c49bff','#ffe56a'];
const CATALOG=[
  {id:'jewel',name:'Jewel Glow',blurb:'Match 3 glowing gems.'},
  {id:'stack',name:'Lantern Stack',blurb:'Stack falling lantern blocks. Clear a full row.'},
  {id:'crunch',name:'Tree Crunch',blurb:'Snatch the matching fruit with Kelly\'s tongue.'},
  {id:'memory',name:'Lantern Memory',blurb:'Flip lanterns and find the pairs.'},
  {id:'lights',name:'Light the Gate',blurb:'Tap lanterns until every one is lit.'},
  {id:'fish',name:'Lake Fishing',blurb:'Press ACTION when the fish is in the glow.'}
];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function shuffle(a,rnd){for(let i=a.length-1;i>0;i--){const j=(rnd()* (i+1))|0;const t=a[i];a[i]=a[j];a[j]=t}return a}

/* ----- jewel match ----- */
function jewelMatches(grid){
  const h=grid.length,w=grid[0].length,hit={};
  const add=(x,y)=>{hit[x+','+y]=1};
  for(let y=0;y<h;y++){let run=1;for(let x=1;x<=w;x++){if(x<w&&grid[y][x]&&grid[y][x]===grid[y][x-1])run++;else{if(run>=3)for(let k=0;k<run;k++)add(x-1-k,y);run=1}}}
  for(let x=0;x<w;x++){let run=1;for(let y=1;y<=h;y++){if(y<h&&grid[y][x]&&grid[y][x]===grid[y-1][x])run++;else{if(run>=3)for(let k=0;k<run;k++)add(x,y-1-k);run=1}}}
  return Object.keys(hit).map(s=>s.split(',').map(Number));
}
function jewelFill(n,colors,rnd){
  const g=[];
  for(let y=0;y<n;y++){const row=[];for(let x=0;x<n;x++){let c;let guard=0;do{c=1+(rnd()*colors|0);row[x]=c;guard++}while(guard<20&&jewelMatches(g.concat([row])).some(([mx,my])=>my===y&&mx===x))}g.push(row)}
  return g;
}
function jewelCreate(diff,seed){
  const d=diff|0,n=d>=3?7:6,colors=4+Math.min(2,d),rnd=rng(seed==null?1000+d*17:seed);
  const moves=16+d*2,goal=6+d*3;
  return {id:'jewel',n,colors,grid:jewelFill(n,colors,rnd),moves,goal,got:0,sel:null,score:0,won:0,over:0,seed:seed==null?1000+d*17:seed,msg:'Swap two gems that touch'};
}
function jewelSwap(st,x1,y1,x2,y2){
  if(st.won||st.over)return st;
  if(Math.abs(x1-x2)+Math.abs(y1-y2)!==1)return st;
  const g=st.grid.map(r=>r.slice());
  const t=g[y1][x1];g[y1][x1]=g[y2][x2];g[y2][x2]=t;
  let cells=jewelMatches(g);
  if(!cells.length){st.msg='Those do not match';st.sel=null;return st}
  st.moves--;let pops=0;
  while(cells.length){
    pops+=cells.length;
    for(const [x,y] of cells)g[y][x]=0;
    for(let x=0;x<st.n;x++){const col=[];for(let y=0;y<st.n;y++)if(g[y][x])col.push(g[y][x]);while(col.length<st.n)col.unshift(1+((st.seed+=(x+1)*13)%st.colors));for(let y=0;y<st.n;y++)g[y][x]=col[y]}
    cells=jewelMatches(g);
  }
  st.grid=g;st.got+=pops;st.score+=pops*10;st.sel=null;
  if(st.got>=st.goal){st.won=1;st.msg='The gems are glowing!'}
  else if(st.moves<=0){st.over=1;st.msg='Out of swaps'}
  else st.msg='Matches '+st.got+' / '+st.goal;
  return st;
}

/* ----- lantern stack (falling blocks) ----- */
const SHAPES=[
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]]
];
function rot(m){const h=m.length,w=m[0].length,o=[];for(let x=0;x<w;x++){o[x]=[];for(let y=0;y<h;y++)o[x][y]=m[h-1-y][x]}return o}
function stackCreate(diff,seed){
  const d=diff|0;
  const cols=10,rows=16;
  const board=[];for(let y=0;y<rows;y++)board.push(new Array(cols).fill(0));
  const st={id:'stack',cols,rows,board,goal:4+d*2,lines:0,score:0,won:0,over:0,drop:0,tick:0,speed:0.55-Math.min(0.3,d*0.06),bag:0,seed:seed==null?3000+d:seed};
  stackSpawn(st);return st;
}
function stackSpawn(st){
  st.bag=(st.bag+1)%SHAPES.length;
  st.shape=SHAPES[st.bag].map(r=>r.slice());
  st.px=(st.cols/2|0)-1;st.py=0;st.color=1+(st.bag%COLS.length);
  if(stackHits(st,st.shape,st.px,st.py)){st.over=1;st.msg='The stack reached the top'}
  else st.msg='Clear '+st.goal+' rows';
}
function stackHits(st,shape,px,py){
  for(let y=0;y<shape.length;y++)for(let x=0;x<shape[0].length;x++)if(shape[y][x]){
    const X=px+x,Y=py+y;
    if(X<0||X>=st.cols||Y>=st.rows)return true;
    if(Y>=0&&st.board[Y][X])return true;
  }
  return false;
}
function stackLock(st){
  const s=st.shape;
  for(let y=0;y<s.length;y++)for(let x=0;x<s[0].length;x++)if(s[y][x]&&st.py+y>=0)st.board[st.py+y][st.px+x]=st.color;
  let cleared=0;
  st.board=st.board.filter(row=>{if(row.every(Boolean)){cleared++;return false}return true});
  while(st.board.length<st.rows)st.board.unshift(new Array(st.cols).fill(0));
  st.lines+=cleared;st.score+=cleared*100;
  if(st.lines>=st.goal){st.won=1;st.msg='Rows cleared!'}
  else stackSpawn(st);
}
function stackMove(st,dx,dy){
  if(st.won||st.over)return st;
  if(!stackHits(st,st.shape,st.px+dx,st.py+dy)){st.px+=dx;st.py+=dy;return st}
  if(dy>0)stackLock(st);
  return st;
}
function stackRotate(st){
  if(st.won||st.over)return st;
  const n=rot(st.shape);
  if(!stackHits(st,n,st.px,st.py))st.shape=n;
  else if(!stackHits(st,n,st.px-1,st.py)){st.px--;st.shape=n}
  else if(!stackHits(st,n,st.px+1,st.py)){st.px++;st.shape=n}
  return st;
}
function stackTick(st,dt){
  if(st.won||st.over)return st;
  st.tick+=dt;
  if(st.tick>=st.speed){st.tick=0;stackMove(st,0,1)}
  return st;
}

/* ----- tree crunch ----- */
function crunchCreate(diff,seed){
  const d=diff|0,rnd=rng(seed==null?5000+d:seed);
  const slots=5+Math.min(2,d);
  const items=[];for(let i=0;i<slots;i++)items.push({c:1+(rnd()*COLS.length|0),k:rnd()<0.5?'fruit':'lantern'});
  return {id:'crunch',items,aim:0,target:1+(rnd()*COLS.length|0),goal:5+d*2,got:0,miss:0,maxMiss:3,score:0,won:0,over:0,msg:'Snatch the color that glows'};
}
function crunchSnatch(st){
  if(st.won||st.over)return st;
  const it=st.items[st.aim];
  if(it.c===st.target){st.got++;st.score+=50;st.target=1+((st.target+st.aim)%COLS.length);if(st.target===it.c)st.target=st.target%COLS.length+1;st.msg='Yum! '+st.got+' / '+st.goal}
  else{st.miss++;st.msg='Not that one'}
  st.items[st.aim]={c:1+((it.c+2)%COLS.length),k:it.k==='fruit'?'lantern':'fruit'};
  if(st.got>=st.goal){st.won=1;st.msg='The tree is picked!'}
  else if(st.miss>=st.maxMiss){st.over=1;st.msg='The branch is empty'}
  return st;
}

/* ----- memory ----- */
function memoryCreate(diff,seed){
  const d=diff|0,pairs=4+Math.min(4,d),rnd=rng(seed==null?7000+d:seed);
  const deck=[];for(let i=0;i<pairs;i++){deck.push(i+1,i+1)}
  shuffle(deck,rnd);
  return {id:'memory',cards:deck.map(c=>({c,up:0,gone:0})),open:[],lock:0,goal:pairs,got:0,score:0,won:0,over:0,moves:0,msg:'Flip two lanterns'};
}
function memoryFlip(st,i){
  if(st.won||st.over||st.lock)return st;
  const card=st.cards[i];
  if(!card||card.gone||card.up)return st;
  if(st.open.length===2){for(const k of st.open)st.cards[k].up=0;st.open=[]}
  card.up=1;st.open.push(i);
  if(st.open.length===2){
    st.moves++;
    const [a,b]=st.open;
    if(st.cards[a].c===st.cards[b].c){st.cards[a].gone=1;st.cards[b].gone=1;st.got++;st.score+=40;st.open=[];st.msg='A pair! '+st.got+' / '+st.goal;if(st.got>=st.goal){st.won=1;st.msg='Every lantern is matched'}}
    else st.msg='Not a pair';
  }
  return st;
}

/* ----- light the gate ----- */
function lightsCreate(diff,seed){
  const d=diff|0,n=5+Math.min(3,d),rnd=rng(seed==null?9000+d:seed);
  const on=new Array(n).fill(1);
  const flips=3+d;
  for(let i=0;i<flips;i++)lightsToggleArr(on,(rnd()*n)|0);
  return {id:'lights',on,n,taps:0,score:0,won:on.every(Boolean)?1:0,over:0,msg:'Tap a lantern. It flips its neighbors too'};
}
function lightsToggleArr(on,i){
  for(const k of [i-1,i,i+1])if(k>=0&&k<on.length)on[k]=on[k]?0:1;
}
function lightsTap(st,i){
  if(st.won||i<0||i>=st.n)return st;
  lightsToggleArr(st.on,i);st.taps++;st.score=Math.max(0,200-st.taps*10);
  if(st.on.every(Boolean)){st.won=1;st.msg='The gate is lit!'}
  else st.msg='Lit '+(st.on.filter(Boolean).length)+' / '+st.n;
  return st;
}

/* ----- fishing ----- */
function fishCreate(diff,seed){
  const d=diff|0;
  return {id:'fish',pos:0.2,dir:1,speed:0.35+d*0.08,zone:0.55,zw:0.22-Math.min(0.08,d*0.02),goal:3+d,got:0,miss:0,maxMiss:4,score:0,won:0,over:0,msg:'Press ACTION inside the glow'};
}
function fishTick(st,dt){
  if(st.won||st.over)return st;
  st.pos+=st.dir*st.speed*dt;
  if(st.pos>1){st.pos=1;st.dir=-1}
  if(st.pos<0){st.pos=0;st.dir=1}
  return st;
}
function fishCatch(st){
  if(st.won||st.over)return st;
  const inside=st.pos>=st.zone-st.zw/2&&st.pos<=st.zone+st.zw/2;
  if(inside){st.got++;st.score+=60;st.zone=clamp(st.zone+(st.got%2?0.15:-0.1),0.25,0.8);st.msg='Caught! '+st.got+' / '+st.goal;if(st.got>=st.goal){st.won=1;st.msg='The basket is full'}}
  else{st.miss++;st.msg='The fish slipped';if(st.miss>=st.maxMiss){st.over=1;st.msg='The lake is quiet'}}
  return st;
}

function create(id,diff,seed){
  if(id==='jewel')return jewelCreate(diff,seed);
  if(id==='stack')return stackCreate(diff,seed);
  if(id==='crunch')return crunchCreate(diff,seed);
  if(id==='memory')return memoryCreate(diff,seed);
  if(id==='lights')return lightsCreate(diff,seed);
  if(id==='fish')return fishCreate(diff,seed);
  return jewelCreate(diff,seed);
}
function rewardOf(st){return st&&st.won?200+st.score:0}

/* live controls: arrows move, ACTION confirms, JUMP drops / second button */
function press(st,inp,dt){
  if(!st||st.won||st.over)return st;
  if(st.id==='jewel'){
    if(!st.cur)st.cur={x:0,y:0};
    if(inp.L)st.cur.x=clamp(st.cur.x-1,0,st.n-1);
    if(inp.R)st.cur.x=clamp(st.cur.x+1,0,st.n-1);
    if(inp.U)st.cur.y=clamp(st.cur.y-1,0,st.n-1);
    if(inp.D)st.cur.y=clamp(st.cur.y+1,0,st.n-1);
    if(inp.act){if(!st.sel)st.sel={x:st.cur.x,y:st.cur.y};else{jewelSwap(st,st.sel.x,st.sel.y,st.cur.x,st.cur.y);st.sel=null}}
    if(inp.tap){const cell=inp.tap.cell;if(cell){if(!st.sel)st.sel=cell;else{jewelSwap(st,st.sel.x,st.sel.y,cell.x,cell.y);st.sel=null}st.cur=cell}}
  }else if(st.id==='stack'){
    if(inp.L)stackMove(st,-1,0);
    if(inp.R)stackMove(st,1,0);
    if(inp.act||inp.U)stackRotate(st);
    if(inp.D||inp.jump)stackMove(st,0,1);
    stackTick(st,inp.D||inp.jump?dt*6:dt);
  }else if(st.id==='crunch'){
    if(inp.L)st.aim=clamp(st.aim-1,0,st.items.length-1);
    if(inp.R)st.aim=clamp(st.aim+1,0,st.items.length-1);
    if(inp.act||inp.jump)crunchSnatch(st);
    if(inp.tap&&inp.tap.i!=null){st.aim=inp.tap.i;crunchSnatch(st)}
  }else if(st.id==='memory'){
    if(inp.tap&&inp.tap.i!=null)memoryFlip(st,inp.tap.i);
    if(inp.act)memoryFlip(st,st.cur||0);
    if(inp.L||inp.R){const n=st.cards.length;st.cur=clamp((st.cur||0)+(inp.R?1:-1),0,n-1)}
  }else if(st.id==='lights'){
    if(inp.tap&&inp.tap.i!=null)lightsTap(st,inp.tap.i);
    if(inp.L)st.cur=clamp((st.cur||0)-1,0,st.n-1);
    if(inp.R)st.cur=clamp((st.cur||0)+1,0,st.n-1);
    if(inp.act)lightsTap(st,st.cur||0);
  }else if(st.id==='fish'){
    fishTick(st,dt);
    if(inp.act||inp.jump)fishCatch(st);
  }
  return st;
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h)}
function paintGem(ctx,x,y,s,col){
  const g=ctx.createLinearGradient(x,y,x+s,y+s);
  g.addColorStop(0,'#fff6d8');g.addColorStop(0.35,col);g.addColorStop(1,'#2a1840');
  ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(x+s/2,y+3);ctx.lineTo(x+s-4,y+s*0.38);ctx.lineTo(x+s/2,y+s-4);ctx.lineTo(x+4,y+s*0.38);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(x+s*0.38,y+s*0.32,s*0.08,s*0.14, -0.4,0,Math.PI*2);ctx.fill();
}
function paintLantern(ctx,x,y,sc,col,lit){
  const w=18*sc,h=24*sc;
  ctx.strokeStyle='#6a4020';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-h-6*sc);ctx.lineTo(x,y-h);ctx.stroke();
  if(lit){ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y-h*0.45,h*0.7,0,Math.PI*2);ctx.fill();ctx.restore()}
  const g=ctx.createLinearGradient(x-w/2,y-h,x+w/2,y);
  g.addColorStop(0,'#fff4d0');g.addColorStop(0.4,col);g.addColorStop(1,'#6a3818');
  ctx.fillStyle=g;roundRect(ctx,x-w/2,y-h,w,h*0.9,6);ctx.fill();
  ctx.strokeStyle='rgba(70,30,10,.8)';ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.moveTo(x,y-h+3);ctx.lineTo(x,y-4);ctx.stroke();
}
function paintFruit(ctx,x,y,r,col){
  const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,2,x,y,r);
  g.addColorStop(0,'#fff');g.addColorStop(0.45,col);g.addColorStop(1,'#4a2010');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2f6a32';ctx.beginPath();ctx.ellipse(x,y-r,r*0.45,r*0.22,0.4,0,Math.PI*2);ctx.fill();
}
function draw(ctx,st,W,H){
  if(!ctx||!st)return;
  ctx.save();
  const wash=ctx.createLinearGradient(0,0,0,H);
  wash.addColorStop(0,'rgba(16,10,36,.45)');wash.addColorStop(1,'rgba(8,4,18,.62)');
  ctx.fillStyle=wash;ctx.fillRect(0,0,W,H);
  const pad=Math.max(10,Math.min(W,H)*0.03);
  const panel={x:pad,y:pad+28,w:W-pad*2,h:Math.max(120,H-pad*2-36)};
  const sky=ctx.createLinearGradient(panel.x,panel.y,panel.x,panel.y+panel.h);
  sky.addColorStop(0,'#2a1a52');sky.addColorStop(0.45,'#3a2868');sky.addColorStop(1,'#1a1030');
  ctx.fillStyle=sky;roundRect(ctx,panel.x,panel.y,panel.w,panel.h,18);ctx.fill();
  ctx.fillStyle='rgba(255,244,210,.9)';ctx.beginPath();ctx.arc(panel.x+panel.w-36,panel.y+28,16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffe7a0';ctx.font='bold '+Math.max(18,W*0.045|0)+'px "Lilita One",sans-serif';ctx.textAlign='center';
  const title=CATALOG.find(x=>x.id===st.id);ctx.fillText(title?title.name:st.id,W/2,panel.y-8);
  ctx.fillStyle='#fff8e4';ctx.font=Math.max(13,W*0.03|0)+'px "Baloo 2",sans-serif';
  ctx.fillText(st.msg||'',W/2,panel.y+panel.h-10);
  if(st.id==='jewel')drawJewel(ctx,st,panel);
  else if(st.id==='stack')drawStack(ctx,st,panel);
  else if(st.id==='crunch')drawCrunch(ctx,st,panel);
  else if(st.id==='memory')drawMemory(ctx,st,panel);
  else if(st.id==='lights')drawLights(ctx,st,panel);
  else if(st.id==='fish')drawFish(ctx,st,panel);
  ctx.restore();
  st._panel=panel;
}
function cellAt(st,px,py){
  const p=st._panel;if(!p)return null;
  if(st.id==='jewel'){const s=Math.min(p.w,p.h-36)/st.n;const ox=p.x+(p.w-s*st.n)/2,oy=p.y+14;const x=((px-ox)/s)|0,y=((py-oy)/s)|0;if(x>=0&&y>=0&&x<st.n&&y<st.n)return {cell:{x,y}}}
  if(st.id==='memory'){const n=st.cards.length,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols);const s=Math.min(p.w/cols,(p.h-36)/rows);const ox=p.x+(p.w-s*cols)/2,oy=p.y+10;const x=((px-ox)/s)|0,y=((py-oy)/s)|0;const i=y*cols+x;if(i>=0&&i<n)return {i}}
  if(st.id==='lights'){const s=Math.min(64,p.w/st.n-8);const ox=p.x+(p.w-st.n*s)/2;const i=((px-ox)/s)|0;if(i>=0&&i<st.n)return {i}}
  if(st.id==='crunch'){const s=Math.min(70,p.w/st.items.length-8);const ox=p.x+(p.w-st.items.length*s)/2;const i=((px-ox)/s)|0;if(i>=0&&i<st.items.length)return {i}}
  return null;
}
function drawJewel(ctx,st,p){
  const s=Math.min(p.w,p.h-36)/st.n,ox=p.x+(p.w-s*st.n)/2,oy=p.y+14;
  ctx.fillStyle='rgba(90,50,24,.55)';roundRect(ctx,ox-6,oy-6,s*st.n+12,s*st.n+12,12);ctx.fill();
  for(let y=0;y<st.n;y++)for(let x=0;x<st.n;x++){
    paintGem(ctx,ox+x*s+3,oy+y*s+3,s-6,COLS[(st.grid[y][x]-1+COLS.length)%COLS.length]);
    if(st.sel&&st.sel.x===x&&st.sel.y===y){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke()}
    if(st.cur&&st.cur.x===x&&st.cur.y===y){ctx.strokeStyle='#ffe7a0';ctx.lineWidth=2;roundRect(ctx,ox+x*s+2,oy+y*s+2,s-4,s-4,6);ctx.stroke()}
  }
}
function drawStack(ctx,st,p){
  const s=Math.min(p.w*0.86/st.cols,(p.h-28)/st.rows),ox=p.x+(p.w-s*st.cols)/2,oy=p.y+8;
  ctx.fillStyle='rgba(8,6,20,.45)';roundRect(ctx,ox-4,oy-4,s*st.cols+8,s*st.rows+8,8);ctx.fill();
  ctx.strokeStyle='rgba(255,200,96,.35)';ctx.stroke();
  const cell=(x,y,col)=>{paintLantern(ctx,ox+x*s+s/2,oy+y*s+s-2,Math.max(0.45,s/28),col,true)};
  for(let y=0;y<st.rows;y++)for(let x=0;x<st.cols;x++)if(st.board[y][x])cell(x,y,COLS[(st.board[y][x]-1)%COLS.length]);
  if(!st.over&&st.shape)for(let y=0;y<st.shape.length;y++)for(let x=0;x<st.shape[0].length;x++)if(st.shape[y][x]&&st.py+y>=0)cell(st.px+x,st.py+y,COLS[(st.color-1)%COLS.length]);
}
function drawCrunch(ctx,st,p){
  const top=p.y+8,bot=p.y+p.h-28;
  const leaf=ctx.createLinearGradient(p.x,top,p.x,bot);
  leaf.addColorStop(0,'#3e9a48');leaf.addColorStop(1,'#1c4a28');
  ctx.fillStyle=leaf;roundRect(ctx,p.x+12,top,p.w-24,bot-top,22);ctx.fill();
  ctx.fillStyle='#6a4424';roundRect(ctx,p.x+p.w/2-10,top+8,20,(bot-top)*0.92,8);ctx.fill();
  const s=Math.min(70,p.w/st.items.length-8),ox=p.x+(p.w-st.items.length*s)/2,oy=top+(bot-top)*0.34;
  ctx.fillStyle='#ffe7a0';ctx.font='15px "Lilita One",sans-serif';ctx.textAlign='center';
  ctx.fillText('SNATCH THIS',p.x+p.w/2,oy-s*0.55);
  paintFruit(ctx,p.x+p.w/2,oy-s*0.22,12,COLS[(st.target-1)%COLS.length]);
  st.items.forEach((it,i)=>{
    const cx=ox+i*s+s/2,cy=oy+Math.sin(i)*6;
    ctx.strokeStyle='#2a1810';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,top+18);ctx.lineTo(cx,cy-16);ctx.stroke();
    if(it.k==='lantern')paintLantern(ctx,cx,cy+10,0.85,COLS[(it.c-1)%COLS.length],true);
    else paintFruit(ctx,cx,cy,Math.min(16,s*0.28),COLS[(it.c-1)%COLS.length]);
    if(i===st.aim){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,18,0,Math.PI*2);ctx.stroke()}
  });
  const aim=st.items[st.aim]||st.items[0];
  const ax=ox+st.aim*s+s/2,ay=oy;
  const hx=p.x+36,hy=bot-18;
  ctx.strokeStyle='#e8c07a';ctx.lineWidth=16;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo(hx+40,hy-80,ax-10,ay+8);ctx.stroke();
  ctx.strokeStyle='#c48a3a';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(hx+6,hy-10);ctx.quadraticCurveTo(hx+36,hy-70,ax-16,ay+4);ctx.stroke();
  ctx.fillStyle='#f0c878';ctx.beginPath();ctx.arc(hx,hy,16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3a2414';ctx.beginPath();ctx.arc(hx+6,hy-2,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#5ddea0';roundRect(ctx,hx-18,hy+2,22,8,4);ctx.fill();
  ctx.strokeStyle='#e8507a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hx+12,hy-4);ctx.quadraticCurveTo((hx+ax)/2,ay+30,ax,ay);ctx.stroke();
  ctx.fillStyle='#ff7aa0';ctx.beginPath();ctx.arc(ax,ay,6,0,Math.PI*2);ctx.fill();
  if(aim){/* tongue lands on the aimed fruit */}
}
function drawMemory(ctx,st,p){
  const n=st.cards.length,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols);
  const s=Math.min(p.w/cols,(p.h-36)/rows),ox=p.x+(p.w-s*cols)/2,oy=p.y+10;
  st.cards.forEach((card,i)=>{
    const x=ox+(i%cols)*s,y=oy+((i/cols)|0)*s;
    if(card.gone){ctx.globalAlpha=0.15}
    if(card.up&&!card.gone)paintLantern(ctx,x+s/2,y+s*0.72,Math.min(1.3,s/40),COLS[(card.c-1)%COLS.length],true);
    else{ctx.fillStyle='#4a2e78';roundRect(ctx,x+6,y+6,s-12,s-12,10);ctx.fill();ctx.strokeStyle='#ffc860';ctx.stroke();ctx.fillStyle='#ffe7a0';ctx.font='18px "Lilita One",sans-serif';ctx.textAlign='center';ctx.fillText(card.gone?'':'?',x+s/2,y+s/2+6)}
    ctx.globalAlpha=1;
    if((st.cur||0)===i){ctx.strokeStyle='#fff';ctx.lineWidth=2;roundRect(ctx,x+4,y+4,s-8,s-8,10);ctx.stroke()}
  });
}
function drawLights(ctx,st,p){
  const s=Math.min(72,(p.w-20)/st.n),ox=p.x+(p.w-s*st.n)/2,oy=p.y+p.h*0.42;
  ctx.strokeStyle='#8a6840';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(ox,oy-s*0.2);ctx.lineTo(ox+s*st.n,oy-s*0.2);ctx.stroke();
  ctx.strokeStyle='#6a4424';ctx.lineWidth=8;
  ctx.beginPath();ctx.moveTo(ox+8,oy+s*0.55);ctx.lineTo(ox+8,oy-s*0.55);ctx.moveTo(ox+s*st.n-8,oy+s*0.55);ctx.lineTo(ox+s*st.n-8,oy-s*0.55);ctx.stroke();
  for(let i=0;i<st.n;i++){
    paintLantern(ctx,ox+i*s+s/2,oy+8,0.95,st.on[i]?COLS[i%COLS.length]:'#3a3050',!!st.on[i]);
    if((st.cur||0)===i){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ox+i*s+s/2,oy-6,20,0,Math.PI*2);ctx.stroke()}
  }
}
function drawFish(ctx,st,p){
  const x=p.x+18,y=p.y+p.h*0.48,w=p.w-36,h=54;
  const water=ctx.createLinearGradient(x,y-h/2,x,y+h/2);
  water.addColorStop(0,'#7ec8e8');water.addColorStop(1,'#1a3c78');
  ctx.fillStyle=water;roundRect(ctx,x,y-h/2,w,h,16);ctx.fill();
  const zx=x+(st.zone-st.zw/2)*w,zw=st.zw*w;
  ctx.fillStyle='rgba(255,230,140,.45)';ctx.fillRect(zx,y-h/2,zw,h);
  const fx=x+st.pos*w;
  ctx.save();ctx.translate(fx,y);ctx.scale(st.dir||1,1);
  ctx.fillStyle='#ffb03a';ctx.beginPath();ctx.ellipse(0,0,16,9,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-26,-8);ctx.lineTo(-26,8);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1a1030';ctx.beginPath();ctx.arc(8,-2,2,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.fillStyle='#fff8e4';ctx.font='16px "Lilita One",sans-serif';ctx.textAlign='center';
  ctx.fillText(st.got+' / '+st.goal+' fish',p.x+p.w/2,p.y+36);
}

return {COLS,CATALOG,create,jewelSwap,jewelMatches,stackMove,stackRotate,stackTick,stackHits,crunchSnatch,memoryFlip,lightsTap,lightsCreate,fishTick,fishCatch,press,draw,cellAt,rewardOf,rot,SHAPES};
});
