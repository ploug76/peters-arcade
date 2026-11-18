/* ===== Helene's Treasure Chest: rules engine (pure, no drawing) ===== */
var N=8;/* board size, visible to the game page */let NC=6,GID=1,SPC=0;/* SPC = chance a falling candy arrives already a striped stick */
function K(r,c){return r*N+c}function KR(k){return Math.floor(k/N)}function KC(k){return k%N}
function setNC(n){NC=n}function setSPC(p){SPC=p}
function rndColor(){return Math.floor(Math.random()*NC)}
function mk(c,s=0){return{id:GID++,c,s,x:0,y:0,sc:1,al:1,rot:0}}
function same(a,b){return !!(a&&b&&a.c>=0&&a.c===b.c)}
function boardOK(B){return !findGroups(B).length&&!!findMove(B)}
function newBoard(){let B;for(let t=0;t<200;t++){B=[];for(let r=0;r<N;r++){B[r]=[];for(let c=0;c<N;c++){let k,n=0;do{k=rndColor();n++}while(n<50&&((c>=2&&B[r][c-1].c===k&&B[r][c-2].c===k)||(r>=2&&B[r-1][c].c===k&&B[r-2][c].c===k)));const g=mk(k);g.x=c;g.y=r;B[r][c]=g}}if(findMove(B))break}return B}
function findGroups(B){const runs=[];
 for(let r=0;r<N;r++){let c=0;while(c<N){let e=c+1;while(e<N&&same(B[r][c],B[r][e]))e++;if(e-c>=3&&B[r][c]&&B[r][c].c>=0){const cells=[];for(let x=c;x<e;x++)cells.push(K(r,x));runs.push({h:1,cells})}c=e}}
 for(let c=0;c<N;c++){let r=0;while(r<N){let e=r+1;while(e<N&&same(B[r][c],B[e][c]))e++;if(e-r>=3&&B[r][c]&&B[r][c].c>=0){const cells=[];for(let y=r;y<e;y++)cells.push(K(y,c));runs.push({h:0,cells})}r=e}}
 let groups=[];for(const run of runs){const hit=groups.filter(g=>run.cells.some(k=>g.set.has(k)));const ng={runs:[run],set:new Set(run.cells)};for(const g of hit){ng.runs.push(...g.runs);g.set.forEach(k=>ng.set.add(k))}groups=groups.filter(g=>!hit.includes(g));groups.push(ng)}
 return groups.map(g=>({runs:g.runs,cells:[...g.set]}))}
function groupSpecial(g){let mx=0,hasH=0,hasV=0,r4=null;for(const r of g.runs){if(r.cells.length>mx){mx=r.cells.length;r4=r}if(r.h)hasH=1;else hasV=1}
 if(mx>=5)return'x';if(hasH&&hasV)return'b';if(mx===4)return r4.h?'h':'v';return 0}
function groupPos(g,prefer,type){for(const k of prefer||[])if(g.cells.includes(k))return k;
 if(type==='b'){const hs=new Set(),vs=new Set();g.runs.forEach(r=>r.cells.forEach(k=>(r.h?hs:vs).add(k)));for(const k of hs)if(vs.has(k))return k}
 let best=g.runs[0];for(const r of g.runs)if(r.cells.length>best.cells.length)best=r;return best.cells[Math.floor((best.cells.length-1)/2)]}
function lineAt(B,r,c){const g=B[r][c];if(!g||g.c<0)return false;let h=1,v=1;
 for(let x=c-1;x>=0&&same(B[r][x],g);x--)h++;for(let x=c+1;x<N&&same(B[r][x],g);x++)h++;
 for(let y=r-1;y>=0&&same(B[y][c],g);y--)v++;for(let y=r+1;y<N&&same(B[y][c],g);y++)v++;return h>=3||v>=3}
function swapCells(B,a,b){const t=B[a.r][a.c];B[a.r][a.c]=B[b.r][b.c];B[b.r][b.c]=t}
function moveValid(B,a,b){const A=B[a.r][a.c],Bb=B[b.r][b.c];if(!A||!Bb)return false;if(A.s==='x'||Bb.s==='x')return true;if(A.s&&Bb.s)return true;
 swapCells(B,a,b);const ok=lineAt(B,a.r,a.c)||lineAt(B,b.r,b.c);swapCells(B,a,b);return ok}
function allMoves(B){const m=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(c<N-1&&moveValid(B,{r,c},{r,c:c+1}))m.push([{r,c},{r,c:c+1}]);if(r<N-1&&moveValid(B,{r,c},{r:r+1,c}))m.push([{r,c},{r:r+1,c}])}return m}
function findMove(B){const m=allMoves(B);return m.length?m[Math.floor(Math.random()*m.length)]:null}
function mostCommon(B,skip){const n=new Array(NC).fill(0);for(let r=0;r<N;r++)for(let c=0;c<N;c++){const g=B[r][c];if(g&&g.c>=0&&!(skip&&skip.has(K(r,c))))n[g.c]++}let b=0;for(let i=1;i<NC;i++)if(n[i]>n[b])b=i;return b}
/* specials: h/v = striped stick (row or column), b = wrapped candy (3x3), x = candy dish (one flavor) */
function expand(B,clear,forced){const fx=[],done=new Set(),q=[...clear];
 while(q.length){const k=q.shift();if(done.has(k))continue;done.add(k);const r=KR(k),c=KC(k),g=B[r][c];if(!g||!g.s||g.used)continue;g.used=true;const add=[];
  if(g.s==='h'){for(let x=0;x<N;x++)add.push(K(r,x));fx.push({t:'h',r,c,col:g.c})}
  else if(g.s==='v'){for(let y=0;y<N;y++)add.push(K(y,c));fx.push({t:'v',r,c,col:g.c})}
  else if(g.s==='b'){const R=forced&&forced.get(k)==='big'?2:1;for(let y=r-R;y<=r+R;y++)for(let x=c-R;x<=c+R;x++)if(y>=0&&y<N&&x>=0&&x<N)add.push(K(y,x));fx.push({t:'b',r,c,col:g.c,R})}
  else if(g.s==='x'){let t=forced&&forced.has(k)?forced.get(k):mostCommon(B,clear);
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const o=B[y][x];if(o&&(t==='all'||o.c===t))add.push(K(y,x))}fx.push({t:'x',r,c,col:t,cells:add.slice()})}
  for(const a of add)if(!clear.has(a)){clear.add(a);q.push(a)}}
 return fx}
/* What a swap of two specials / a Treasure Star does before normal matching */
function swapPre(B,a,b){const A=B[a.r][a.c],Bb=B[b.r][b.c],clear=new Set(),forced=new Map();const ka=K(a.r,a.c),kb=K(b.r,b.c);
 const X=A.s==='x'?[A,ka,Bb,kb]:Bb.s==='x'?[Bb,kb,A,ka]:null;
 if(X){const [xg,xk,og,ok]=X;if(og.s==='x'){forced.set(xk,'all');og.used=true;clear.add(xk);clear.add(ok);return{clear,forced}}
  forced.set(xk,og.c);clear.add(xk);
  if(og.s){const types=og.s==='b'?['b']:['h','v'];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const o=B[y][x];if(o&&o.c===og.c&&!o.s){o.s=types[(y+x)%types.length]}}}
  return{clear,forced}}
 if(A.s&&Bb.s){clear.add(ka);clear.add(kb);if(A.s==='b'&&Bb.s==='b'){forced.set(ka,'big');forced.set(kb,'big')}
  else if(A.s!=='b'&&Bb.s!=='b'&&A.s===Bb.s){Bb.s=A.s==='h'?'v':'h'}/* two stripes = a cross */
  return{clear,forced}}
 return null}
function computeStep(B,prefer,pre){const groups=findGroups(B),clear=new Set(pre?pre.clear:[]),forced=pre?pre.forced:new Map(),cre=[],used=new Set();
 for(const g of groups){g.cells.forEach(k=>clear.add(k));const t=groupSpecial(g);if(t){let p=groupPos(g,prefer,t);if(used.has(p))p=g.cells.find(k=>!used.has(k));if(p!=null){used.add(p);const src=B[KR(p)][KC(p)];cre.push({k:p,s:t,c:t==='x'?-1:src.c})}}}
 if(!clear.size)return null;const fx=expand(B,clear,forced);return{clear,cre,fx,groups}}
function applyClear(B,st){const gone=[];for(const k of st.clear){const g=B[KR(k)][KC(k)];if(g)gone.push({g,k});B[KR(k)][KC(k)]=null}
 const born=[];for(const c of st.cre){const g=mk(c.c,c.s);g.x=KC(c.k);g.y=KR(c.k);B[KR(c.k)][KC(c.k)]=g;born.push(g)}return{gone,born}}
function applyGravity(B){const moves=[];for(let c=0;c<N;c++){let w=N-1;for(let r=N-1;r>=0;r--){const g=B[r][c];if(g){if(r!==w){B[w][c]=g;B[r][c]=null}if(g.y!==w)moves.push({g,to:w});w--}}
  const n=w+1;for(let r=w;r>=0;r--){const g=mk(rndColor(),SPC&&Math.random()<SPC?(Math.random()<.5?'h':'v'):0);g.x=c;g.y=r-n;B[r][c]=g;moves.push({g,to:r,fresh:1})}}return moves}
function shuffleBoard(B){const all=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)all.push(B[r][c]);
 for(let t=0;t<300;t++){for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
  for(let i=0;i<all.length;i++)B[KR(i)][KC(i)]=all[i];if(boardOK(B))return true}
 for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!B[r][c].s)B[r][c].c=rndColor();/* fallback: recolour plain candies */
 for(let t=0;t<300&&!boardOK(B);t++){const r=Math.floor(Math.random()*N),c=Math.floor(Math.random()*N);if(!B[r][c].s)B[r][c].c=rndColor()}return boardOK(B)}
function serial(B){return B.map(row=>row.map(g=>[g.c,g.s||0]))}
function unserial(S){return S.map((row,r)=>row.map((v,c)=>{const g=mk(v[0],v[1]||0);g.x=c;g.y=r;return g}))}
if(typeof module!=='undefined')module.exports={N,newBoard,findGroups,computeStep,applyClear,applyGravity,allMoves,findMove,moveValid,swapCells,swapPre,shuffleBoard,boardOK,serial,unserial,setNC,setSPC,K,KR,KC,mk,expand};
