/* test-arcade: cache name starts with pa-test- and only those caches are deleted. Requests outside this folder are not intercepted. */
/* auto-update: HTML/JS/CSS/JSON always revalidated with the server (no stale copies); cache is the offline fallback */
const __NC=r=>{try{const u=new URL(r.url);return u.origin==location.origin&&(r.mode=='navigate'||/(\/|\.html?|\.m?js|\.css|\.json)$/.test(u.pathname))?{cache:'no-cache'}:{}}catch(e){return {}}};
const P='pa-test-tams-road-to-emmaus-',V=P+'v21',OLD=[],FILES=['./','index.html','gamepad.js?v=1','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!=V&&(n.startsWith(P)||OLD.some(o=>n.startsWith(o)))).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(!new URL(e.request.url).href.startsWith(self.registration.scope))return;if(e.request.method!='GET')return;e.respondWith(fetch(e.request,__NC(e.request)).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.open(V).then(c=>c.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode=='navigate'?c.match('./'):undefined)))))});
