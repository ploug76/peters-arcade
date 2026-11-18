/* skip-btn v1 (Oct 30 2026): one big, clearly visible SKIP button for stories, intros and cutscenes.
   SkipBtn.show(fn[,opt])  shows it; tapping SKIP, a quick second tap anywhere, Esc, or gamepad Start/B (on release) calls fn once.
   SkipBtn.hide()          hides it.  SkipBtn.seen(key[,set]) remembers that an intro was watched/skipped (localStorage). */
(function(){var el=null,fn=null,last=0,pv={},raf=0,armT=0;
 function mk(){el=document.createElement('button');el.type='button';el.id='skipBtn';el.innerHTML='SKIP &#9197;';el.setAttribute('aria-label','Skip the story');
  el.style.cssText='position:fixed;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:2147483000;min-width:118px;height:56px;padding:0 22px;border-radius:28px;border:3px solid #fff;background:#e0312f;color:#fff;font:900 23px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:1px;box-shadow:0 4px 14px rgba(0,0,0,.55);display:none;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent';
  ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup'].forEach(function(t){el.addEventListener(t,function(e){e.stopPropagation()},{passive:true})});
  el.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();go()});(document.body||document.documentElement).appendChild(el)}
 function go(){var f=fn;hide();if(f)try{f()}catch(e){setTimeout(function(){throw e})}}
 function show(f,o){if(!el)mk();fn=f;last=0;armT=performance.now();o=o||{};if(o.top){el.style.top='calc(12px + env(safe-area-inset-top,0px))';el.style.bottom='auto'}else{el.style.top='auto';el.style.bottom='calc(18px + env(safe-area-inset-bottom,0px))'}
  el.style.display='block';pv=pads();if(!raf)raf=requestAnimationFrame(poll)}
 function hide(){fn=null;if(el)el.style.display='none'}
 function pads(){var r={};try{var g=navigator.getGamepads?navigator.getGamepads():[];for(var i=0;i<g.length;i++)if(g[i]){var b=g[i].buttons;r[i]=[b[1]&&b[1].pressed,b[9]&&b[9].pressed]}}catch(e){}return r}
 function poll(){raf=0;if(!fn)return;var c=pads();for(var k in c){var p=pv[k]||[];if((p[0]&&!c[k][0])||(p[1]&&!c[k][1])){pv=c;go();return}}pv=c;raf=requestAnimationFrame(poll)}
 addEventListener('pointerdown',function(e){if(!fn||e.target===el)return;var n=performance.now();if(n-armT<250)return;if(last&&n-last<650){last=0;go()}else last=n},true);
 addEventListener('keydown',function(e){if(fn&&e.key==='Escape'){e.preventDefault();e.stopPropagation();go()}},true);
 window.SkipBtn={show:show,hide:hide,active:function(){return !!fn},seen:function(k,v){try{if(v){localStorage.setItem('skip:'+k,'1');return true}return localStorage.getItem('skip:'+k)==='1'}catch(e){return false}}}})();
