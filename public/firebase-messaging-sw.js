// Firebase Cloud Messaging Service Worker
// This handles background notifications when the app is closed

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
firebase.initializeApp(firebaseConfig)

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'ACM NUML'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    image: payload.notification?.image,
    data: payload.data,
    tag: payload.data?.tag || 'acmnuml-notification',
    requireInteraction: false,
    silent: false,
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
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

