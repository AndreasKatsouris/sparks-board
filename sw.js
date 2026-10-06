// Service worker for the Sparks Board. Only job is push: the board itself is a single
// HTML file and is deliberately not cached here, because a stale cached board that cannot
// be refreshed is far worse than a board that needs signal to load.
const BOARD = '/sparks-board/';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: 'Sparks Board', body: event.data ? event.data.text() : '' }; }

  const title = d.title || 'Sparks Board';
  const opts = {
    body: d.body || '',
    // Tagging by card id means a second notification about the same card replaces the
    // first instead of stacking. One card, one line in the shade.
    tag: d.tag || 'sparks-board',
    renotify: true,
    data: { url: d.url || BOARD, id: d.id || null },
    icon: d.icon || BOARD + 'icon-192.png',
    badge: d.badge || BOARD + 'icon-192.png',
    requireInteraction: false,
    vibrate: [90, 50, 90],
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || BOARD;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Reuse the board if it is already open, otherwise he ends up with five copies of it.
    for (const w of wins) {
      if (w.url.includes('/sparks-board')) { await w.focus(); return; }
    }
    await self.clients.openWindow(url);
  })());
});
