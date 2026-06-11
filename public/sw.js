/* Deckademics push messaging service worker.
 * This worker handles Web Push only (no app-shell caching), so it never
 * serves stale HTML. It is intentionally minimal. */

/* Best-effort app-icon badge count (Badging API). Supported on Android/desktop
 * Chrome and installed PWAs; silently ignored where unsupported (e.g. most iOS). */
async function setBadgeFromOpenNotifications() {
  try {
    if (!('setAppBadge' in self.navigator)) return;
    const notes = await self.registration.getNotifications();
    const count = notes.length;
    if (count > 0) {
      await self.navigator.setAppBadge(count);
    } else if ('clearAppBadge' in self.navigator) {
      await self.navigator.clearAppBadge();
    }
  } catch (_e) {
    /* ignore */
  }
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: 'Deckademics', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Deckademics';
  const options = {
    body: data.body || '',
    icon: '/app-icon.png',
    badge: '/app-icon.png',
    data: { url: data.url || '/' },
    tag: data.tag || undefined,
    renotify: !!data.tag,
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => setBadgeFromOpenNotifications())
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      // Clearing the opened notification reduces the badge to remaining unread.
      if ('clearAppBadge' in self.navigator) {
        try {
          await self.navigator.clearAppBadge();
        } catch (_e) {
          /* ignore */
        }
      }
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        } catch (_e) {
          /* ignore */
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});

/* Allow the app window to clear the badge when it gains focus. */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_APP_BADGE') {
    if ('clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge().catch(() => {});
    }
  }
});