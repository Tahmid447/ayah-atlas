/* Retire the old Famous Quran root shell after the unified deployment.
   Public shell caches only: private notes, downloaded media and reading packs stay. */
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('fq-shell-'))await caches.delete(key);
 await self.clients.claim();
 const tabs=await self.clients.matchAll({type:'window'});
 await self.registration.unregister();
 for(const tab of tabs)await tab.navigate(tab.url);
})()));
