// Service Worker for ACM NUML PWA
// Network-first caching strategy with automatic updates

// ✅ 2. Cache versioning - UPDATE THIS ON EACH DEPLOY
const CACHE_VERSION = 'v9' // Increment manually: v2, v3, v4...
const CACHE_NAME = `app-cache-${CACHE_VERSION}`


// ✅ 1. Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with cache:', CACHE_NAME)

  // ✅ 4. Skip waiting to activate immediately
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache:', CACHE_NAME)
        // Cache only essential offline resources
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/icon-192.png',
          '/icon-512.png',
          '/apple-touch-icon.png'
        ])
      })
      .catch((error) => {
        console.error('[SW] Cache install failed:', error)
      })
  )
})

// Listen for skip waiting message from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message')
    self.skipWaiting()
  }
})

// ✅ 3. Activate event - clear ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker, clearing old caches...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL caches except current CACHE_NAME
      const deletePromises = cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName)
          return caches.delete(cacheName)
        })

      return Promise.all(deletePromises)
    }).then(() => {
      // ✅ 4. Force claim all clients to use new service worker immediately
      console.log('[SW] Service worker activated, claiming clients...')
      return self.clients.claim()
    })
  )
})

// ✅ 1. Fetch event - Network-first strategy for all resources
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  // Skip service worker and FCM worker files (they should never be cached)
  if (url.pathname === '/sw.js' || url.pathname === '/firebase-messaging-sw.js') {
    return
  }

  // Skip Firestore API calls (they should not be intercepted)
  if (url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('googleapis.com')) {
    return // Let these pass through without service worker interception
  }

  // Skip external API calls and fonts (let browser handle them)
  const isExternalRequest = url.origin !== self.location.origin

  // For external requests (fonts, CDNs, etc.), don't intercept at all
  if (isExternalRequest) {
    return // Let browser handle external resources normally
  }

  // Only handle same-origin requests
  event.respondWith(
    // ✅ Network-first: Try network first
    fetch(event.request, {
      cache: 'no-store' // Always fetch fresh from network for same-origin
    })
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response for caching
        const responseToCache = response.clone()

        // Update cache with fresh content (background update)
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        }).catch((error) => {
          console.warn('[SW] Failed to cache response:', error)
        })

        return response
      })
      .catch(() => {
        // ✅ Network failed - fallback to cache
        console.log('[SW] Network failed, using cache for:', event.request.url)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // If no cache and it's a document request, return index.html
          if (event.request.destination === 'document') {
            return caches.match('/index.html')
          }
        })
      })
  )
})

// ===== PUSH NOTIFICATIONS (No Firebase Required) =====

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge.png',
    tag: 'default-notification',
    data: { url: '/' }
  }

  // Try to parse the push data
  if (event.data) {
    try {
      const pushData = event.data.json()
      console.log('[SW] Push data:', pushData)

      // Handle Stream Chat push format
      if (pushData.message) {
        notificationData = {
          title: pushData.sender?.name || pushData.title || 'New Message',
          body: pushData.message.text || pushData.body || 'You have a new message',
          icon: pushData.sender?.image || '/icon-192.png',
          badge: '/badge.png',
          tag: `message-${pushData.message.id || Date.now()}`,
          data: {
            url: '/chat',
            messageId: pushData.message.id,
            channelId: pushData.channel?.id
          },
          vibrate: [200, 100, 200],
          requireInteraction: false
        }
      }
      // Handle call notifications
      else if (pushData.call || pushData.type === 'call') {
        notificationData = {
          title: `Incoming ${pushData.call?.type === 'video' ? 'Video' : 'Voice'} Call`,
          body: `${pushData.caller?.name || 'Someone'} is calling you`,
          icon: pushData.caller?.image || '/icon-192.png',
          badge: '/badge.png',
          tag: `call-${pushData.call?.id || Date.now()}`,
          data: {
            url: '/chat',
            callId: pushData.call?.id
          },
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true
        }
      }
      // Generic notification format
      else if (pushData.title || pushData.notification) {
        notificationData = {
          title: pushData.title || pushData.notification?.title || 'Notification',
          body: pushData.body || pushData.notification?.body || '',
          icon: pushData.icon || pushData.notification?.icon || '/icon-192.png',
          badge: '/badge.png',
          tag: pushData.tag || `notification-${Date.now()}`,
          data: { url: pushData.url || pushData.data?.url || '/' }
        }
      }
    } catch (e) {
      console.warn('[SW] Could not parse push data:', e)
      // Try as text
      try {
        notificationData.body = event.data.text()
      } catch (e2) {
        console.warn('[SW] Could not read push data as text:', e2)
      }
    }
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: notificationData.vibrate || [200, 100, 200],
      requireInteraction: notificationData.requireInteraction || false,
      actions: notificationData.actions || []
    })
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    // Check if a window/tab is already open
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus()
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              data: event.notification.data
            })
            return
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(urlToOpen)
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag)
})

// Handle push subscription change (important for push reliability)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed')

  event.waitUntil(
    // Re-subscribe and update the subscription on your server
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      // You would typically get the applicationServerKey from your server
    }).then((subscription) => {
      console.log('[SW] New subscription:', subscription)
      // Post message to clients to update subscription on server
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: subscription.toJSON()
          })
        })
      })
    }).catch((error) => {
      console.error('[SW] Failed to re-subscribe:', error)
    })
  )
})
