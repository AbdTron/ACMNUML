import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiX, FiBell } from 'react-icons/fi'
import { parseMessageLinks } from '../utils/parseMessageLinks'
import './NotificationPopup.css'

const NotificationPopup = () => {
  const [notification, setNotification] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const fetchActiveNotification = async () => {
      if (!db) return
      
      // Check cache first (5 minute expiry)
      const cacheKey = 'notification_cache'
      const cacheTime = 'notification_cache_time'
      const cached = localStorage.getItem(cacheKey)
      const cachedTime = localStorage.getItem(cacheTime)
      const now = Date.now()
      const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes
      
      if (cached && cachedTime && (now - parseInt(cachedTime)) < CACHE_EXPIRY) {
        try {
          const notification = JSON.parse(cached)
          // Check if dismissed
          if (notification.persistent !== true) {
            const dismissed = localStorage.getItem(`notification_${notification.id}_dismissed`)
            if (dismissed) return
          }
          setNotification(notification)
          setIsVisible(true)
          return
        } catch (e) {
          // Cache invalid, fetch fresh
        }
      }
      
      try {
        const notificationsRef = collection(db, 'notifications')
        const q = query(notificationsRef, where('active', '==', true))
        
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const sorted = querySnapshot.docs
            .map((docSnap) => {
              const data = docSnap.data()
              const createdAt = data.createdAt?.toDate
                ? data.createdAt.toDate()
                : data.createdAt
              return { id: docSnap.id, ...data, createdAt }
            })
            .sort((a, b) => {
              const first = a.createdAt ? new Date(a.createdAt).getTime() : 0
              const second = b.createdAt ? new Date(b.createdAt).getTime() : 0
              return second - first
            })

          if (sorted.length) {
            const latest = sorted[0]
            // Cache the notification
            localStorage.setItem(cacheKey, JSON.stringify(latest))
            localStorage.setItem(cacheTime, now.toString())
            
            // If notification is persistent, always show it regardless of dismissal
            if (latest.persistent === true) {
              setNotification(latest)
              setIsVisible(true)
            } else {
              // For non-persistent notifications, check if user dismissed it
              const dismissed = localStorage.getItem(`notification_${latest.id}_dismissed`)
              if (!dismissed) {
                setNotification(latest)
                setIsVisible(true)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching notification:', error)
      }
    }

    fetchActiveNotification()
  }, [])

  const handleDismiss = () => {
    if (notification) {
      // Only save dismissal to localStorage if notification is not persistent
      // Persistent notifications will always show again on next page load
      if (notification.persistent !== true) {
        localStorage.setItem(`notification_${notification.id}_dismissed`, 'true')
      }
    }
    setIsVisible(false)
  }

  if (!isVisible || !notification) return null

  return (
    <div className="notification-popup">
      <div className="notification-content">
        <div className="notification-icon">
          <FiBell />
        </div>
        <div className="notification-text">
          <h4>{notification.title}</h4>
          <p 
            dangerouslySetInnerHTML={{ 
              __html: parseMessageLinks(notification.message) 
            }} 
          />
          {notification.buttons && notification.buttons.length > 0 && (
            <div className="notification-buttons">
              {notification.buttons.map((button, index) => (
                <a
                  key={index}
                  href={button.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="notification-button"
                  onClick={handleDismiss}
                >
                  {button.text}
                </a>
              ))}
            </div>
          )}
          {!notification.buttons && notification.link && (
            <a href={notification.link} target="_blank" rel="noopener noreferrer" className="notification-link">
              Learn More →
            </a>
          )}
        </div>
        <button className="notification-close" onClick={handleDismiss} aria-label="Close">
          <FiX />
        </button>
      </div>
    </div>
  )
}

export default NotificationPopup

