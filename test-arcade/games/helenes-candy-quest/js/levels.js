/* 18 match-3 lands. Pieces are the jewels from Helene's chest.
   Goals get bigger and moves get tighter as the number climbs. */
(function(root){
'use strict';
const NAMES = [
  'Chest Opening','Ruby Hearts','Blue Drops','Garden Greens','Golden Squares',
  'Purple Points','Pearl Shine','Sweet Mix','Ribbon Lesson','Two Colors',
  'Starlight','Deep Chest','Color Shower',"Helene's Pick",'Wrapper Day',
  'Busy Board','Almost Full','The Crown Chest'
];
const INTRO = [
  'Swipe two candies that touch. Make a line of 3 or more!',
  'Fill the score. Match 4 for a Ribbon, 5 for a Chest Star.',
  'Gather the candies shown up top. They fall from my chest.',
  'An L or a T makes a Wrapper. It clears a little square.',
  'Take your time. Invalid swaps bounce back and cost nothing.'
];
function make(){
  const out=[];
  for(let i=0;i<NAMES.length;i++){
    const kind=i%3;
    let moves=Math.max(20, 34-Math.floor(i*0.7));
    if(kind===0) moves+=6;
    if(kind!==0 && i>=12) moves+=4;
    let goal;
    if(kind===0) goal={type:'score', target:600+i*100};
    else if(kind===1) goal={type:'collect', need:[[i%6, 10+Math.floor(i*0.4)]]};
    else goal={type:'collect', need:[[i%6, 8+Math.floor(i/3)], [(i+2)%6, 8+Math.floor(i/3)]]};
    out.push({
      id:i+1,
      name:NAMES[i],
      moves,
      goal,
      intro:i===0?INTRO[0]:INTRO[i%INTRO.length]
    });
  }
  return out;
}
const LEVELS=make();
root.CANDY_LEVELS=LEVELS;
if(typeof module!=='undefined'&&module.exports) module.exports=LEVELS;
})(typeof window!=='undefined'?window:globalThis);
