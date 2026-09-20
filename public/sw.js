self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
async function cached(request) {
  const index = await caches.open("ayah-atlas-offline-index");
  const pointer = await index.match("/__atlas_offline_active");
  if (!pointer) return null;
  const cache = await caches.open(await pointer.text());
  return (
    (await cache.match(request)) ||
    (request.mode === "navigate" ? await cache.match("/") : null)
  );
}
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (event.request.method !== "GET" || u.origin !== self.location.origin)
    return;
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response.status < 500) return response;
        return (await cached(event.request)) || response;
      } catch {
        return (
          (await cached(event.request)) ||
          new Response(
            JSON.stringify({
              error: "This item is not in your offline reading pack.",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          )
        );
      }
    })(),
  );
});
