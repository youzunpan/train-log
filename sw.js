/* 訓練記錄 service worker:離線快取 + 組間休息通知 */
const CACHE='trainlog-v3';
const ASSETS=['./','./index.html','./icon-180.png','./icon-512.png','./manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

/* 網路優先、離線回退快取:更新能立刻生效,健身房沒訊號也開得起來 */
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const cp=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});

/* 點通知 → 回到 App */
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs) if('focus' in c) return c.focus();
    if(self.clients.openWindow) return self.clients.openWindow('./');
  }));
});
