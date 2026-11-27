// Cache exclusivamente de uma página pública e estática; nunca mensagens, tokens ou API.
const CACHE='rfb-public-offline-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/offline.html'))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rfb-public-offline-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||event.request.mode!=='navigate'||url.origin!==self.location.origin||url.pathname!=='/'||url.search)return;event.respondWith(fetch(event.request).catch(async()=>{const page=await caches.match('/offline.html');return page||new Response('Sem conexão',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}));});
