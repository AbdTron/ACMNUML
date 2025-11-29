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
            // Only show in-app notification for foreground messages
            // Don't show system notification - the service worker handles background notifications
            // This prevents duplicate notifications
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


