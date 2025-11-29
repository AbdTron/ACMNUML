// Service Worker for ACM NUML PWA
// Network-first caching strategy with automatic updates

// ✅ 2. Cache versioning - UPDATE THIS ON EACH DEPLOY
const CACHE_VERSION = 'v4' // Increment manually: v2, v3, v4...
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

  // Skip service worker and FCM worker files (they should never be cached)
  const url = new URL(event.request.url)
  if (url.pathname === '/sw.js' || url.pathname === '/firebase-messaging-sw.js') {
    return
  }

  // Check if this is an external request (cross-origin)
  const isExternalRequest = url.origin !== self.location.origin

  event.respondWith(
    // ✅ Network-first: Try network first
    fetch(event.request, {
      // Only add cache-control for same-origin requests to avoid CORS issues
      ...(isExternalRequest ? {} : { cache: 'no-store' })
    })
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Only cache same-origin requests
        if (!isExternalRequest) {
          // Clone the response for caching
          const responseToCache = response.clone()

          // Update cache with fresh content (background update)
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          }).catch((error) => {
            console.warn('[SW] Failed to cache response:', error)
          })
        }

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
