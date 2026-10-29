const CACHE = "hoc-trung-v36";
const CORE = ["./", "index.html", "style.css", "app.js", "data.js", "dialogues.js", "examples.js", "wordimg.js", "strokes.js", "hanzi-writer.min.js", "manifest.json",
  "bg.webp", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "icon-180.png", "fonts/nunito-latin.woff2", "fonts/nunito-latin-ext.woff2", "fonts/nunito-vietnamese.woff2"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {}))))); self.skipWaiting(); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("hoc-trung-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((r) => { if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((m) => m || (e.request.mode === "navigate" ? caches.match("index.html") : undefined))));
});
