// AUTO UPDATE SERVICE WORKER
const CACHE_NAME = "dar-attendance-v2"; // CHANGE VERSION TO FORCE UPDATE

const urlsToCache = [
  "/",
  "index.html",
  "dashboard.html",
  "style.css",
  "app.js",
  "supabase.js",
  "logo_dar.png"
];

self.addEventListener("install", event => {
  self.skipWaiting(); // activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
