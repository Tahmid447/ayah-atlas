import type { Chapter } from "./types";
const INDEX = "ayah-atlas-offline-index";
const POINTER = "/__atlas_offline_active";
export async function sha256(text: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function validateChapter(body: Chapter, surah: number) {
  if (body.surah.id !== surah || body.verses.length !== body.surah.count)
    throw new Error("Incomplete chapter rejected.");
  for (let i = 0; i < body.verses.length; i++) {
    const v = body.verses[i];
    if (v.key !== `${surah}:${i + 1}` || (await sha256(v.text)) !== v.checksum)
      throw new Error("Arabic integrity check failed.");
    if (
      v.translations.length !== 5 ||
      new Set(v.translations.map((p) => p.sourceId)).size !== 5
    )
      throw new Error("Incomplete translation set rejected.");
    for (const p of v.translations)
      if (
        p.key !== v.key ||
        (await sha256(p.text + "\n" + p.footnotes)) !== p.checksum
      )
        throw new Error("Translation integrity check failed.");
  }
}
export async function installReadingPack(progress: (n: number) => void) {
  if (!("serviceWorker" in navigator))
    throw new Error("Offline packs require HTTPS or localhost.");
  await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const name = "ayah-atlas-reading-v2-stage";
  const cache = await caches.open(name);
  const assets = [
    ...new Set([
      "/",
      "/favicon.svg",
      "/fonts/UthmanicHafs1Ver18.woff2",
      "/api/surahs",
      "/api/sources",
      "/api/juz-starts",
      ...performance
        .getEntriesByType("resource")
        .map((x) => x.name)
        .filter(
          (x) =>
            x.startsWith(location.origin) && !/\/api\/|\/reference\//.test(x),
        ),
    ]),
  ];
  for (const url of assets) {
    const r = await fetch(url);
    if (!r.ok)
      throw new Error(
        "Reading shell download failed; the previous pack is unchanged.",
      );
    await cache.put(url, r);
  }
  for (let s = 1; s <= 114; s++) {
    const url = "/api/chapter/" + s;
    const r = await fetch(url);
    if (!r.ok)
      throw new Error(
        "Download interrupted at chapter " +
          s +
          ". Your previous pack is unchanged.",
      );
    await validateChapter(await r.clone().json(), s);
    await cache.put(url, r);
    progress(s);
  }
  // Promote only a complete verified set. A unique snapshot prevents later retries overwriting an active pack.
  const activeName = "ayah-atlas-reading-v2-" + Date.now();
  const active = await caches.open(activeName);
  for (const request of await cache.keys()) {
    const response = await cache.match(request);
    if (response) await active.put(request, response);
  }
  const index = await caches.open(INDEX);
  await index.put(POINTER, new Response(activeName));
  for (const old of await caches.keys())
    if (old.startsWith("ayah-atlas-reading-") && old !== activeName)
      await caches.delete(old);
  return new Date().toISOString();
}
export async function removeReadingPack() {
  for (const name of await caches.keys())
    if (name.startsWith("ayah-atlas-reading-") || name === INDEX)
      await caches.delete(name);
}
