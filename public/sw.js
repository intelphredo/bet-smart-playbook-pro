// Service Worker for Push Notifications
const CACHE_NAME = 'sharp-betting-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {
    title: 'Sharp Betting Alert',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {}
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('Failed to parse push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: getActionsForType(data.data?.type),
    tag: data.data?.match_id || 'general',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'game_start':
      return [
        { action: 'view', title: 'View Bet' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'bet_won':
      return [
        { action: 'view', title: 'View Results' },
        { action: 'share', title: 'Share Win' }
      ];
    case 'bet_lost':
      return [
        { action: 'view', title: 'View Results' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'clv_alert':
      return [
        { action: 'view', title: 'View CLV' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'line_movement':
      return [
        { action: 'view', title: 'View Odds' },
        { action: 'bet', title: 'Place Bet' }
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
  }
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Determine URL based on action and type
  if (event.action === 'view' || !event.action) {
    switch (data.type) {
      case 'game_start':
      case 'bet_won':
      case 'bet_lost':
        url = '/bet-history';
        break;
      case 'clv_alert':
        url = '/bet-history';
        break;
      case 'line_movement':
        url = '/';
        break;
      default:
        url = '/';
    }
  } else if (event.action === 'bet') {
    url = '/';
  } else if (event.action === 'share') {
    // Could implement share functionality
    url = '/bet-history';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Background sync for offline bet tracking
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bets') {
    console.log('Syncing bets in background...');
    // Could implement offline bet syncing here
  }
});
