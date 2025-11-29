import { useEffect } from 'react'
import {
  requestNotificationPermission,
  onMessageListener,
  getNotificationPermission,
  isNotificationSupported,
} from '../config/firebaseMessaging'
import { isPWA } from '../utils/isPWA'

const NotificationService = () => {
  useEffect(() => {
    // Only enable notifications in PWA mode, not in browser
    if (!isPWA()) {
      return
    }

    // Check notification support
    if (!isNotificationSupported()) {
      console.log('Notifications not supported')
      return
    }

    const currentPermission = getNotificationPermission()

    // Automatically request permission if not yet asked
    if (currentPermission === 'default') {
      // Automatically request permission (browser will show native dialog)
      // No custom prompt UI - just request directly
      requestNotificationPermission().then((token) => {
        if (token) {
          console.log('FCM token obtained:', token)
          // Set up message listener if permission was granted
          setupMessageListener()
        }
      })
    } else if (currentPermission === 'granted') {
      // Permission already granted, just get token and listen
      requestNotificationPermission().then((token) => {
        if (token) {
          console.log('FCM token obtained:', token)
        }
      })
      setupMessageListener()
    }
  }, [])

  const setupMessageListener = () => {
    // Set up a continuous listener (not just one-time)
    const listenForMessages = () => {
      onMessageListener()
        .then((payload) => {
          if (payload) {
            console.log('Foreground message received:', payload)
            // Show system notification when app is open (foreground)
            // This ensures notifications are shown even when app is open
            showSystemNotification(payload)
            // Also show in-app notification for better UX
            showInAppNotification(payload)
          }
          // Continue listening for more messages
          listenForMessages()
        })
        .catch((err) => {
          console.error('Error in message listener:', err)
          // Retry after a delay
          setTimeout(listenForMessages, 5000)
        })
    }
    
    // Start listening
    listenForMessages()
  }

  const showSystemNotification = async (payload) => {
    // Check if notifications are supported and permission is granted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('Cannot show system notification - permission not granted')
      return
    }

    const notificationTitle = payload.notification?.title || payload.data?.title || 'ACM NUML'
    const notificationBody = payload.notification?.body || payload.data?.body || payload.data?.message || 'You have a new notification'
    
    // Use same tag logic as service worker to prevent duplicates
    const messageId = payload.data?.messageId || payload.messageId || payload.fcmMessageId || 
                      `${notificationTitle}-${notificationBody}`.substring(0, 50)
    const notificationTag = `acmnuml-${messageId}`

    const notificationOptions = {
      body: notificationBody,
      icon: payload.notification?.icon || payload.data?.icon || '/icon-512.png',
      badge: '/badge.png',
      image: payload.notification?.image || payload.data?.image,
      data: {
        ...payload.data,
        url: payload.data?.url || payload.fcmOptions?.link || payload.notification?.click_action || '/',
      },
      tag: notificationTag,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      renotify: true,
    }

    // Close existing notifications with same tag first
    const existingNotifications = await navigator.serviceWorker.getRegistration()
      .then(registration => registration?.getNotifications({ tag: notificationTag }) || [])
    
    existingNotifications.forEach(notification => notification.close())

    // Small delay to ensure old notifications are closed
    await new Promise(resolve => setTimeout(resolve, 100))

    // Show system notification
    const notification = new Notification(notificationTitle, notificationOptions)
    
    // Handle click
    notification.onclick = (event) => {
      event.preventDefault()
      const url = payload.data?.url || payload.fcmOptions?.link || payload.notification?.click_action || '/'
      window.focus()
      window.location.href = url
      notification.close()
    }
  }

  const showInAppNotification = (payload) => {
    // Create a notification element
    const notification = document.createElement('div')
    notification.className = 'fcm-notification'
    notification.innerHTML = `
      <div class="fcm-notification-content">
        <strong>${payload.notification?.title || 'New Notification'}</strong>
        <p>${payload.notification?.body || ''}</p>
      </div>
    `
    document.body.appendChild(notification)

    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out')
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 5000)

    // Click to navigate
    if (payload.data?.url) {
      notification.addEventListener('click', () => {
        window.location.href = payload.data.url
      })
    }
  }

  // This component doesn't render anything - it just handles notifications in the background
  return null
}

export default NotificationService


