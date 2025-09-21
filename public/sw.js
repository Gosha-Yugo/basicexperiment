self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Push受信
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch {}
  const title = data.title || '通知';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.clickUrl ? { clickUrl: data.clickUrl } : {}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// クリックで起動/復帰
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.clickUrl || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const client = list.find(w => w.url.includes(self.registration.scope));
      if (client) { client.focus(); client.navigate(url); }
      else { clients.openWindow(url); }
    })
  );
});
