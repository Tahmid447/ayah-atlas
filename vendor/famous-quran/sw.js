/* Versioned offline shell. OAuth callbacks and private API responses are excluded. */
const SHELL='fq-shell-__REVISION__';
const ASSETS=['/','/index.html','/styles.css','/v2.css','/words.js','/core.js','/app-v2.js','/hadith-v2.js','/media-v2.js','/account.js','/config.js','/passages-1.js','/passages-2.js','/passages-3.js','/logo.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(SHELL).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('fq-shell-')&&n!==SHELL).map(n=>caches.delete(n)));await self.clients.claim();})()));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin||u.search||r.headers.has('Authorization'))return;if(r.mode==='navigate'){e.respondWith(caches.open(SHELL).then(async c=>(await c.match('/index.html'))||fetch(r)));return;}if(ASSETS.includes(u.pathname))e.respondWith(caches.open(SHELL).then(async c=>(await c.match(u.pathname))||fetch(r)));});
