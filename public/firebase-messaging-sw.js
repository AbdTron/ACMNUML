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
  console.log('[FCM SW] Firebase initialized successfully')
} catch (error) {
  console.error('[FCM SW] Firebase initialization error:', error)
}

// Retrieve an instance of Firebase Messaging
let messaging = null
try {
  messaging = firebase.messaging()
  console.log('[FCM SW] Firebase Messaging initialized')
} catch (error) {
  console.error('[FCM SW] Firebase Messaging initialization error:', error)
}

// ✅ 8. Same cache strategy - Network-first for FCM worker
// This ensures FCM worker doesn't conflict with main service worker
self.addEventListener('install', (event) => {
  console.log('[FCM SW] Installing FCM service worker')
  // Skip waiting to activate immediately
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Activating FCM service worker')
  // Claim clients immediately
  event.waitUntil(self.clients.claim())
})

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload)

    const notificationTitle = payload.notification?.title || payload.data?.title || 'ACM NUML'
    const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new notification'
    
    const notificationOptions = {
      body: notificationBody,
      icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
      badge: '/icon-192.png',
      image: payload.notification?.image || payload.data?.image,
      data: {
        ...payload.data,
        url: payload.data?.url || payload.fcmOptions?.link || '/',
      },
      tag: payload.data?.tag || 'acmnuml-notification',
      requireInteraction: false,
      silent: false,
    }

    console.log('[FCM SW] Showing notification:', notificationTitle, notificationOptions)
    return self.registration.showNotification(notificationTitle, notificationOptions)
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
