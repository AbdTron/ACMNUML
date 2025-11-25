import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiX, FiBell } from 'react-icons/fi'
import './NotificationPopup.css'

const NotificationPopup = () => {
  const [notification, setNotification] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)
  const [dismissKey, setDismissKey] = useState(null)

  const buildDismissKey = (note) => {
    if (!note) return null
    const baseToken = note.reactivationToken ?? (note.createdAt ? new Date(note.createdAt).getTime() : 'default')
    return `notification_${note.id}_${baseToken}`
  }

  useEffect(() => {
    const fetchActiveNotification = async () => {
      if (!db) return
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
            const key = buildDismissKey(latest)
            const legacyKey = `notification_${latest.id}_dismissed`

            if (localStorage.getItem(legacyKey)) {
              localStorage.removeItem(legacyKey)
            }

            const dismissed = key ? localStorage.getItem(key) : null
            if (!dismissed) {
              setNotification(latest)
              setDismissKey(key)
              setHasAcknowledged(false)
              setIsVisible(true)
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
    if (!notification || !hasAcknowledged) return

    if (dismissKey) {
      localStorage.setItem(dismissKey, 'true')
    }
    setIsVisible(false)
    setNotification(null)
    setDismissKey(null)
  }

  useEffect(() => {
    if (notification) {
      setHasAcknowledged(false)
    }
  }, [notification])

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
          <div className="notification-ack">
            <label>
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(event) => setHasAcknowledged(event.target.checked)}
              />
              <span>I have read it</span>
            </label>
            {!hasAcknowledged && (
              <p className="notification-ack-hint">Please confirm before closing.</p>
            )}
          </div>
        </div>
        <button
          className="notification-close"
          onClick={handleDismiss}
          aria-label="Close"
          disabled={!hasAcknowledged}
        >
          <FiX />
        </button>
      </div>
    </div>
  )
}

export default NotificationPopup

