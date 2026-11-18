/* test-arcade: cache name starts with pa-test- and only those caches are deleted. Requests outside this folder are not intercepted. */
/* Harvest Watch cache. HTML/JS/CSS always revalidated; the cache is the offline fallback.
   Named apart from the original game so the two service workers do not delete each other. */
const __NC=r=>{try{const u=new URL(r.url);return u.origin==location.origin&&(r.mode=='navigate'||/(\/|\.html?|\.m?js|\.css|\.json)$/.test(u.pathname))?{cache:'no-cache'}:{}}catch(e){return {}}};
const PREFIX='pa-test-cd-harvest-watch-';const CACHE=PREFIX+'v1';
const FILES=['./','index.html','style.css?v=1','js/logic.js?v=1','js/game.js?v=1','manifest.json','icon-192.png','fonts/lilita.woff2','art/cover.webp','art/face.webp','art/emblem.png','art/street_day.webp','art/street_dusk.webp','art/house.webp','art/square.webp','art/park.webp'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(!new URL(e.request.url).href.startsWith(self.registration.scope))return;const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request,__NC(e.request)).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{})}return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match(e.request,{ignoreSearch:true}))))});
