self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { title: 'New issue', body: 'You have a new issue' }; }

  // Show notification
  const title = data.title || 'New issue';
  const options = {
    body: 'A new issue was created',
    data: data,
    tag: 'issue-created'
  };

  // Update IndexedDB count 
  event.waitUntil(
    (async () => {
      await incrementIssueCountInIDB(); 
      await self.registration.showNotification(title, options);
      // notify open clients
      const clientList = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clientList.forEach(client => client.postMessage({ type: 'issue:created', payload: data }));
    })()
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/admin/issues'));
});

/* Basic IDB helper */
async function incrementIssueCountInIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('admin-notifications', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('meta');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      const getReq = store.get('unreadIssues');
      getReq.onsuccess = () => {
        const current = getReq.result || 0;
        store.put(current + 1, 'unreadIssues');
        tx.oncomplete = () => resolve();
      };
      getReq.onerror = reject;
    };
    req.onerror = reject;
  });
}
