const CACHE_NAME = "neha-guide-v20260623-notes-email";
const APP_ASSETS = [
  "./",
  "index.html",
  "styles.css?v=20260623-notes-email",
  "app.js?v=20260623-notes-email",
  "data-bundle.js?v=20260623-notes-email",
  "lead-config.js?v=20260623-notes-email",
  "manifest.webmanifest",
  "assets/hs-govtech-logo.png?v=20260623-notes-email",
  "assets/bdmp-icon-color.png",
  "assets/icon-192.png?v=20260623-notes-email",
  "assets/icon-512.png?v=20260623-notes-email",
  "assets/sheraton-exhibit-hall-map.png",
  "assets/sheraton-meeting-overview.png",
  "assets/sheraton-floor-overview.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("index.html")));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("index.html")))
  );
});
