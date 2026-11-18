/* Review copy. Only this game's own cache prefix is deleted. The 21+ gate stays in the page. */
var PREFIX = 'pa-petes-420-';
var CACHE = PREFIX + 'v1';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PREFIX) === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.href.indexOf(self.registration.scope) !== 0) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var cp = r.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, cp); }).catch(function () {});
    return r;
  }).catch(function () { return caches.match(e.request); }));
});
