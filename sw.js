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
    // Android silhouettes the badge from its alpha channel, so it has to be a transparent
    // PNG with only the mark opaque. Pointing it at the full colour icon renders a white block.
    badge: d.badge || BOARD + 'badge-96.png',
    requireInteraction: false,
    vibrate: [90, 50, 90],
    // Chrome puts its own "Unsubscribe" button on an actionless web push, which silently kills
    // every future notification if he taps it meaning "dismiss". Defining actions replaces it.
    actions: [{ action: 'open', title: 'Open board' }],
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
