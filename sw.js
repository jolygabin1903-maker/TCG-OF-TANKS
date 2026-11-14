/* ===== TCG de chars : service worker =====
   Rend le jeu installable comme une appli.
   Le jeu est toujours chargé depuis le site en premier (donc toujours la dernière version) ;
   la copie gardée sur l’appareil ne sert que quand il n’y a pas d’internet (on joue alors en invité). */
const CACHE = "tcg-chars-v1";
const BASE = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return; // Firebase, Google… : on ne touche à rien
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res.ok && res.type === "basic") {
          const copie = res.clone();
          caches.open(CACHE).then(c => c.put(r.mode === "navigate" ? "./" : r, copie));
        }
        return res;
      })
      .catch(() =>
        caches.match(r.mode === "navigate" ? "./" : r, { ignoreSearch: true })
          .then(m => m || Response.error())
      )
  );
});
