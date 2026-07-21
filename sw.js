const CACHE_NAME = "neha-guide-v20260721-edge-auth-headers";
const APP_ASSETS = [
  "./",
  "index.html",
  "styles.css?v=20260701-aec-copy",
  "app.js?v=20260721-edge-auth-headers",
  "supabase-client.js?v=20260721-edge-auth-headers",
  "data-bundle.js?v=20260623-domain-backend",
  "lead-config.js?v=20260721-edge-auth-headers",
  "manifest.webmanifest",
  "assets/hs-govtech-logo.png?v=20260623-domain-backend",
  "assets/bdmp-icon-color.png",
  "assets/hsgt-navigator-icon-192.png?v=20260624-navigator-icon",
  "assets/hsgt-navigator-icon-512.png?v=20260624-navigator-icon",
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
