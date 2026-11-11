self.addEventListener('push', event => {
  let data = { title: '契约提醒', body: '你有一条新的提醒', icon: '/icon-512.png' };
  try { 
    if (event.data) { 
      const parsed = event.data.json(); 
      data = Object.assign(data, parsed); 
    } 
  } catch (e) {}
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: data.icon, badge: data.icon, requireInteraction: false }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
    for (const client of windowClients) { if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus(); }
    if (clients.openWindow) return clients.openWindow('/');
  }));
});