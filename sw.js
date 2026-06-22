const CACHE_NAME = "neha-guide-v20260622-email-status-fix";
const APP_ASSETS = [
  "./",
  "index.html",
  "styles.css?v=20260622-email-status-fix",
  "app.js?v=20260622-email-status-fix",
  "data-bundle.js?v=20260622-email-status-fix",
  "lead-config.js?v=20260619",
  "manifest.webmanifest",
  "assets/hs-govtech-logo.png?v=20260622-email-status-fix",
  "assets/bdmp-icon-color.png",
  "assets/icon-192.png?v=20260622-email-status-fix",
  "assets/icon-512.png?v=20260622-email-status-fix",
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
