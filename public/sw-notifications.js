// Service Worker helper for Cuenta Clara push and background notifications
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache for reminders in SW memory / DB
let cachedReminders = [];

// Listen for messages from client app
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, icon, data: payload } = data;
    await self.registration.showNotification(title || 'Cuenta Clara', {
      body: body || 'Tenés un recordatorio de vencimiento pendiente.',
      icon: icon || '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: tag || 'cuenta-clara-reminder',
      renotify: true,
      requireInteraction: false,
      data: payload || { url: '/' },
      vibrate: [200, 100, 200],
    });
  }

  if (data.type === 'SCHEDULE_REMINDERS') {
    cachedReminders = data.reminders || [];
  }
});

// Notification click handler: opens or focuses the web app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Periodic background sync (supported on modern Android & Chromium when installed)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-due-bills') {
    event.waitUntil(checkAndShowPendingNotifications());
  }
});

// Web Push event listener
self.addEventListener('push', (event) => {
  let notifData = {
    title: 'Cuenta Clara - Recordatorio',
    body: 'Tenés cuentas próximas a vencer.',
    url: '/',
  };

  if (event.data) {
    try {
      notifData = { ...notifData, ...event.data.json() };
    } catch (e) {
      notifData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notifData.title, {
      body: notifData.body,
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      data: { url: notifData.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

async function checkAndShowPendingNotifications() {
  if (!cachedReminders || cachedReminders.length === 0) return;
  const todayStr = new Date().toISOString().split('T')[0];

  for (const reminder of cachedReminders) {
    if (reminder.dueDate === todayStr) {
      await self.registration.showNotification(`¡Vence HOY: ${reminder.accountName}!`, {
        body: `Importe a pagar: ${reminder.currency} ${reminder.amount}. No olvides registrar tu pago.`,
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        tag: `due-${reminder.id}`,
        data: { url: '/' },
      });
    }
  }
}
