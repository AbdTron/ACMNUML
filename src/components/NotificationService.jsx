import { useEffect, useState } from 'react'
import {
  requestNotificationPermission,
  onMessageListener,
  getNotificationPermission,
  isNotificationSupported,
} from '../config/firebaseMessaging'
import './NotificationService.css'

const NotificationService = () => {
  const [permission, setPermission] = useState('default')
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check notification support and permission
    if (!isNotificationSupported()) {
      console.log('Notifications not supported')
      return
    }

    const currentPermission = getNotificationPermission()
    setPermission(currentPermission)

    // If permission is default (not asked yet), show prompt after delay
    if (currentPermission === 'default') {
      // Show prompt after 3 seconds of app usage
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    // If permission is granted, request token and listen for messages
    if (currentPermission === 'granted') {
      requestNotificationPermission()
      setupMessageListener()
    }
  }, [])

  const setupMessageListener = () => {
    onMessageListener()
      .then((payload) => {
        console.log('Foreground message received:', payload)
        // Show notification in app
        showInAppNotification(payload)
      })
      .catch((err) => {
        console.error('Error in message listener:', err)
      })
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
        document.body.removeChild(notification)
      }, 300)
    }, 5000)

    // Click to navigate
    if (payload.data?.url) {
      notification.addEventListener('click', () => {
        window.location.href = payload.data.url
      })
    }
  }

  const handleEnableNotifications = async () => {
    setShowPrompt(false)
    const token = await requestNotificationPermission()
    if (token) {
      setPermission('granted')
      setupMessageListener()
    } else {
      setPermission('denied')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setPermission('denied')
  }

  if (!showPrompt || permission !== 'default') return null

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt">
        <h3>Enable Notifications</h3>
        <p>Stay updated with the latest events, announcements, and news from ACM NUML.</p>
        <div className="notification-prompt-actions">
          <button className="btn btn-primary" onClick={handleEnableNotifications}>
            Enable Notifications
          </button>
          <button className="btn btn-secondary" onClick={handleDismiss}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationService

