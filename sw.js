const CACHE="dar-final-v1";

self.addEventListener("install",e=>{
e.waitUntil(
caches.open(CACHE).then(c=>c.addAll([
"./","index.html","dashboard.html","style.css","app.js"
]))
);
self.skipWaiting();
});

self.addEventListener("activate",e=>{
e.waitUntil(
caches.keys().then(keys=>
Promise.all(keys.map(k=>k!==CACHE && caches.delete(k)))
));
});

self.addEventListener("fetch",e=>{
e.respondWith(
caches.match(e.request).then(r=>r||fetch(e.request))
);
});
