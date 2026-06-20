const CACHE_NAME = "neha-guide-v20260619-alerts";
const APP_ASSETS = [
  "./",
  "index.html",
  "styles.css?v=20260619-alerts",
  "app.js?v=20260619-alerts",
  "data-bundle.js?v=20260619-lunchbreak",
  "lead-config.js?v=20260619",
  "manifest.webmanifest",
  "assets/hs-govtech-logo.png",
  "assets/bdmp-icon-color.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
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
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("index.html")))
  );
});
