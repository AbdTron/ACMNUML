// Firebase Cloud Messaging Service Worker
// Compatible with main service worker - handles background notifications

// Use the version that matches your package.json (10.7.1)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration - must match your firebase.js config
const firebaseConfig = {
  apiKey: 'AIzaSyADJkqr8ATnC-4ZT2CKzhRAvoKsocRXt6Q',
  authDomain: 'acmnuml.firebaseapp.com',
  projectId: 'acmnuml',
  storageBucket: 'acmnuml.firebasestorage.app',
  messagingSenderId: '1097867001966',
  appId: '1:1097867001966:web:083e5e54bd9e433936267f',
  measurementId: 'G-28E0JMMKY8',
}

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig)
  console.log('[FCM SW] ✅ Firebase initialized successfully')
  console.log('[FCM SW] Firebase app name:', firebase.app().name)
} catch (error) {
  console.error('[FCM SW] ❌ Firebase initialization error:', error)
  console.error('[FCM SW] Error details:', error.message, error.stack)
}

// Retrieve an instance of Firebase Messaging
let messaging = null
try {
  messaging = firebase.messaging()
  console.log('[FCM SW] ✅ Firebase Messaging initialized')
  console.log('[FCM SW] Messaging instance:', messaging ? 'created' : 'null')
} catch (error) {
  console.error('[FCM SW] ❌ Firebase Messaging initialization error:', error)
  console.error('[FCM SW] Error details:', error.message, error.stack)
}

// ✅ 8. Install and activate - FCM service worker must take control
self.addEventListener('install', (event) => {
  console.log('[FCM SW] Installing FCM service worker')
  // Skip waiting to activate immediately and take control
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Activating FCM service worker - taking control')
  console.log('[FCM SW] Current controller:', self.registration.active ? 'This SW is active' : 'Not active yet')
  
  // Claim all clients immediately to ensure FCM SW controls the page
  event.waitUntil(
    Promise.all([
      self.clients.claim().then(() => {
        console.log('[FCM SW] ✅ Claimed all clients')
        return self.clients.matchAll().then(clients => {
          console.log(`[FCM SW] Controlling ${clients.length} client(s)`)
        })
      }),
      // Clear any old caches (force clear all to ensure fresh content)
      caches.keys().then(cacheNames => {
        console.log(`[FCM SW] Found ${cacheNames.length} cache(s) to delete`)
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[FCM SW] Deleting cache:', cacheName)
            return caches.delete(cacheName)
          })
        )
      }).then(() => {
        console.log('[FCM SW] ✅ All caches cleared')
      })
    ]).then(() => {
      console.log('[FCM SW] ✅ Activation complete')
      console.log('[FCM SW] Service worker is now controlling the page')
    })
  )
})

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload)
    console.log('[FCM SW] Full payload:', JSON.stringify(payload, null, 2))

    // Handle both notification payload and data-only payloads
    const notificationTitle = payload.notification?.title || payload.data?.title || 'ACM NUML'
    const notificationBody = payload.notification?.body || payload.data?.body || payload.data?.message || 'You have a new notification'
    
    // Use a consistent tag based on message content to prevent duplicates
    // This ensures if Firebase auto-shows a notification, ours will replace it
    const messageId = payload.data?.messageId || payload.messageId || payload.fcmMessageId || 
                      `${notificationTitle}-${notificationBody}`.substring(0, 50)
    const notificationTag = `acmnuml-${messageId}`
    
    const notificationOptions = {
      body: notificationBody,
      icon: '/badge.png', // Main notification icon in dropdown panel
      badge: '/badge.png', // Badge for status bar
      image: payload.notification?.image || payload.data?.image,
      data: {
        ...payload.data,
        url: payload.data?.url || payload.fcmOptions?.link || payload.notification?.click_action || '/',
      },
      tag: notificationTag, // Consistent tag prevents duplicates
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      renotify: true, // Replace existing notifications with same tag
    }

    console.log('[FCM SW] Showing notification:', notificationTitle, notificationOptions)
    console.log('[FCM SW] Notification tag:', notificationTag)
    
    // Close ALL existing notifications first to prevent duplicates (Firebase auto-shows one, we show one)
    // This is especially important when sending to "all" users
    return self.registration.getNotifications()
      .then(allNotifications => {
        console.log(`[FCM SW] Found ${allNotifications.length} total existing notification(s)`)
        
        // Close ALL existing notifications to prevent duplicates
        // This ensures Firebase's auto-notification is closed before we show ours
        allNotifications.forEach(notification => {
          console.log('[FCM SW] Closing existing notification:', notification.tag || 'no-tag', notification.title)
          notification.close()
        })
        
        // Longer delay to ensure old notifications (including Firebase auto-notifications) are closed
        return new Promise(resolve => setTimeout(resolve, 300))
      })
      .then(() => {
        // Show new notification (this will be the only one visible)
        return self.registration.showNotification(notificationTitle, notificationOptions)
      })
      .then(() => {
        console.log('[FCM SW] ✅ Notification shown successfully')
      })
      .catch((error) => {
        console.error('[FCM SW] ❌ Error showing notification:', error)
      })
  })
} else {
  console.error('[FCM SW] Messaging not initialized, cannot handle background messages')
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event)
  
  event.notification.close()

  // Get the URL from notification data or use default
  const urlToOpen = event.notification.data?.url || event.notification.data?.click_action || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url && 'focus' in client) {
          return client.focus()
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
