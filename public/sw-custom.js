importScripts('./ngsw-worker.js');

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlPath = event.action === 'add' ? '/add' : '/today';

  event.waitUntil(
    clients
      .matchAll({type: 'window', includeUncontrolled: true})
      .then((windowClients) => {
        // Reuse an existing window if possible
        for (const client of windowClients) {
          if ('navigate' in client) {
            return client.navigate(urlPath).then((c) => c && c.focus());
          }
        }
        return clients.openWindow(urlPath);
      }),
  );
});
