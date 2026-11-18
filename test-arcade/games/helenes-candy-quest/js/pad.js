/* Controller: D-pad moves the gold box, A swaps in the last direction,
   Start pauses, B goes back. Menus use the shared gamepad.js highlight. */
(function(){
'use strict';
if(!window.GamepadSupport) return;
var lastDir='ArrowRight';
function onStart(){ if(state==='play') pauseGame(); else if(state==='pause') resumeGame(); }
['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].forEach(function(k){});
GamepadSupport.init({
  keys:{
    left:'ArrowLeft', right:'ArrowRight', up:'ArrowUp', down:'ArrowDown',
    a:'Space',
    start:function(p){ if(p) onStart(); },
    back:function(p){ if(p) goBack(); }
  },
  menu:function(){
    var palb=document.getElementById('palbOv');
    return state!=='play' || cardOpen() || (palb&&palb.classList.contains('on'));
  },
  isPaused:function(){ return state==='pause'; },
  pause:function(){ if(state==='play') pauseGame(); },
  back:function(){ return goBack(); },
  hint:{
    text:'🎮 D-pad moves the box · A swaps · Start pauses',
    style:'bottom:calc(8px + env(safe-area-inset-bottom));font:700 16px/1.3 system-ui,sans-serif;padding:6px 12px',
    when:function(){
      var g=navigator.getGamepads?navigator.getGamepads():[], any=false;
      for(var i=0;i<g.length;i++) if(g[i]) any=true;
      return any && state==='title';
    }
  }
});
window.__lastDir=lastDir;
})();
