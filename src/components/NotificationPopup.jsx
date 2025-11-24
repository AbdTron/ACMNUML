import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiX, FiBell } from 'react-icons/fi'
import './NotificationPopup.css'

const NotificationPopup = () => {
  const [notification, setNotification] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const fetchActiveNotification = async () => {
      if (!db) return
      try {
        const notificationsRef = collection(db, 'notifications')
        const q = query(
          notificationsRef,
          where('active', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const notif = querySnapshot.docs[0].data()
          const notifId = querySnapshot.docs[0].id
          
          // Check if user has dismissed this notification
          const dismissed = localStorage.getItem(`notification_${notifId}_dismissed`)
          if (!dismissed) {
            setNotification({ id: notifId, ...notif })
            setIsVisible(true)
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
      localStorage.setItem(`notification_${notification.id}_dismissed`, 'true')
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
          <p>{notification.message}</p>
          {notification.link && (
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

