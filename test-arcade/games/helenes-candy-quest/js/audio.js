/* Original candy-land score and effects for Helene's Candy Quest.
   WebAudio only: no samples, no brand jingles. A little loud on purpose,
   same as Helene's other games, with a compressor so it does not hurt. */
const AU=(function(){
'use strict';
let ctx=null, master, musG, sfxG, musicOn=true, soundOn=true, timer=0, cur='', nextT=0, step=0;
const mtof=m=>440*Math.pow(2,(m-69)/12);
function init(){
  if(ctx) return true;
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C) return false;
  try{ctx=new C();}catch(e){return false;}
  const comp=ctx.createDynamicsCompressor();
  comp.threshold.value=-14; comp.knee.value=8; comp.ratio.value=6; comp.attack.value=0.003; comp.release.value=0.2;
  master=ctx.createGain(); master.gain.value=1.15; master.connect(comp); comp.connect(ctx.destination);
  musG=ctx.createGain(); musG.gain.value=musicOn?0.22:0; musG.connect(master);
  sfxG=ctx.createGain(); sfxG.gain.value=soundOn?0.7:0; sfxG.connect(master);
  return true;
}
function tone(f,t,d,type,g,dest){
  const o=ctx.createOscillator(), v=ctx.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(f,t);
  v.gain.setValueAtTime(0,t);
  v.gain.linearRampToValueAtTime(g,t+0.012);
  v.gain.exponentialRampToValueAtTime(0.0008,t+d);
  o.connect(v); v.connect(dest||sfxG); o.start(t); o.stop(t+d+0.05);
  return o;
}
function bell(m,t,d,g,dest){tone(mtof(m),t,d,'sine',g,dest); tone(mtof(m+12),t,d*0.45,'sine',g*0.22,dest);}
/* root midi, bpm, pentatonic degrees. Each track is original. */
const T={
  title:  {root:74, bpm:92,  seq:[0,4,7,4, 2,4,7,9, 7,4,2,0, 4,7,9,7]},
  meadow: {root:76, bpm:102, seq:[4,7,9,7, 4,2,4,0, 7,9,11,9, 7,4,2,4]},
  lane:   {root:79, bpm:108, seq:[0,4,7,12, 7,4,5,4, 0,2,4,7, 4,2,0,2]},
  taffy:  {root:72, bpm:96,  seq:[0,3,7,3, 5,7,10,7, 3,5,7,3, 0,3,7,12]},
  hills:  {root:77, bpm:112, seq:[7,4,7,9, 11,9,7,4, 2,4,7,4, 9,7,4,2]},
  peaks:  {root:81, bpm:100, seq:[0,7,4,7, 12,7,4,2, 0,4,7,9, 7,4,2,0]},
  castle: {root:74, bpm:88,  seq:[0,4,7,12, 11,7,4,7, 9,5,2,4, 7,4,0,4]},
  finale: {root:76, bpm:84,  seq:[0,4,7,12, 16,12,9,7, 4,7,12,16, 12,7,4,0]}
};
const PENT=[0,2,4,7,9];
function degree(tr,i){const d=tr.seq[i%tr.seq.length]; return tr.root+PENT[((d%5)+5)%5]+12*Math.floor(d/5);}
function schedule(){
  if(!ctx||!cur||!T[cur]) return;
  const tr=T[cur], spb=60/tr.bpm/2;
  while(nextT<ctx.currentTime+0.4){
    if(musicOn){
      if(step%8===0) tone(mtof(tr.root-24), nextT, spb*8*0.95, 'triangle', 0.18, musG);
      const m=degree(tr, step);
      tone(mtof(m), nextT, spb*1.7, 'triangle', 0.07, musG);
      tone(mtof(m+12), nextT, spb*0.6, 'sine', 0.02, musG);
    }
    nextT+=spb; step++;
  }
}
function play(name){
  if(!T[name]) name='title';
  if(!ctx){cur=name; return;}
  if(name===cur) return;
  cur=name; step=0; nextT=ctx.currentTime+0.05;
  if(!timer) timer=setInterval(schedule, 120);
  schedule();
}
function ok(){return !!(ctx&&soundOn&&ctx.state==='running');}
const S={
  tap(){if(!ok())return; bell(88, ctx.currentTime, 0.12, 0.08);},
  jump(){if(!ok())return; const t=ctx.currentTime, o=tone(420,t,0.16,'sine',0.12); o.frequency.exponentialRampToValueAtTime(760,t+0.12);},
  bounce(){if(!ok())return; const t=ctx.currentTime; bell(86,t,0.2,0.12); bell(93,t+0.06,0.22,0.1);},
  candy(){if(!ok())return; const t=ctx.currentTime; bell(96,t,0.18,0.12); bell(100,t+0.05,0.22,0.1);},
  match(chain){if(!ok())return; const t=ctx.currentTime, b=84+Math.min(12,(chain||1)*2); bell(b,t,0.22,0.14); if(chain>1) bell(b+4,t+0.05,0.2,0.1);},
  special(){if(!ok())return; const t=ctx.currentTime; [0,4,7,12].forEach((d,i)=>bell(86+d,t+i*0.04,0.28,0.1));},
  flag(){if(!ok())return; const t=ctx.currentTime; [0,4,7].forEach((d,i)=>bell(79+d,t+i*0.06,0.3,0.1));},
  hurt(){if(!ok())return; const t=ctx.currentTime; tone(240,t,0.18,'triangle',0.16); tone(180,t+0.06,0.2,'triangle',0.12);},
  fail(){if(!ok())return; const t=ctx.currentTime; [0,-2,-5].forEach((d,i)=>bell(72+d,t+i*0.1,0.35,0.1));},
  win(){if(!ok())return; const t=ctx.currentTime; [0,4,7,12,7,12,16].forEach((d,i)=>bell(74+d,t+i*0.09,0.45,0.14));}
};
function start(){if(!init())return; if(ctx.state!=='running') ctx.resume().catch(()=>{}); if(cur) play(cur); else play('title');}
return {
  start, play, S,
  setMusic(v){musicOn=!!v; if(musG&&ctx) musG.gain.setTargetAtTime(v?0.22:0, ctx.currentTime, 0.05);},
  setSound(v){soundOn=!!v; if(sfxG&&ctx) sfxG.gain.setTargetAtTime(v?0.7:0, ctx.currentTime, 0.05);},
  suspend(){if(ctx&&ctx.state==='running') ctx.suspend().catch(()=>{});},
  resume(){if(ctx&&ctx.state==='suspended') ctx.resume().catch(()=>{});}
};
})();
