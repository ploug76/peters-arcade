/* Offline fallback for this game folder only. HTML and scripts are rechecked with the server. */
const CACHE = 'ptp3-files-v1';
const FILES = ['./', 'index.html', 'logic.js?v=1', 'kit.js?v=1', 'art.js?v=1', 'game.js?v=1', 'manifest.json', 'icon-192.png', 'icon-512.png', 'cover.png', 'fonts/lilita.woff2', 'fonts/ptp-anton.woff', 'logo589.webp'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).catch(function () {}));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    const cp = r.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, cp); }).catch(function () {});
    return r;
  }).catch(function () { return caches.match(e.request); }));
});
