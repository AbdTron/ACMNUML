import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import app from './firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

// VAPID key - Public key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = 'BJft1ENmeDXCnbDH01zf7irWqPS1ZqUtGW8s_SQfNmcZxyu3kdh8tegKSjwS6au6AUN_34cB4s-j2-o1bZGf9VU'

let messaging = null

// Check if running as PWA (not browser)
const isPWA = () => {
  if (typeof window === 'undefined') return false
  // Check for standalone display mode (most browsers)
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // Check for iOS Safari standalone mode
  if (window.navigator.standalone === true) return true
  // Check for fullscreen mode
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true
  return false
}

// Initialize messaging (only in PWA, not in browser)
const initMessaging = async () => {
  if (typeof window === 'undefined') return null
  
  // Only initialize in PWA mode, not in browser
  if (!isPWA()) {
    console.log('Firebase Messaging only available in PWA mode')
    return null
  }
  
  try {
    const isSupportedBrowser = await isSupported()
    if (!isSupportedBrowser) {
      console.log('Firebase Messaging is not supported in this browser')
      return null
    }
    
    messaging = getMessaging(app)
    return messaging
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error)
    return null
  }
}

// Request notification permission and get FCM token (PWA only)
export const requestNotificationPermission = async () => {
  // Only work in PWA mode, not in browser
  if (!isPWA()) {
    console.log('Notifications only available in PWA mode')
    return null
  }

  try {
    if (!messaging) {
      messaging = await initMessaging()
      if (!messaging) return null
    }

    // Check current permission first
    const currentPermission = Notification.permission
    
    // If permission is already granted, just get the token
    if (currentPermission === 'granted') {
      return await getFCMToken()
    }
    
    // If permission is denied, can't proceed
    if (currentPermission === 'denied') {
      console.log('Notification permission was previously denied')
      return null
    }

    // Request permission (browser will show native dialog)
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      console.log('Notification permission granted')
      return await getFCMToken()
    } else {
      console.log('Notification permission denied')
      return null
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return null
  }
}

// Get FCM token (assumes permission is already granted)
const getFCMToken = async () => {
  try {
    // Get service worker registration for FCM
    let registration = null
    try {
      registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      if (!registration) {
        // Register if not already registered
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        })
        console.log('FCM Service Worker registered:', registration.scope)
      }
    } catch (swError) {
      console.error('Service Worker registration error:', swError)
      // Try to get any existing registration
      const registrations = await navigator.serviceWorker.getRegistrations()
      registration = registrations.find(reg => reg.scope.includes('/'))
    }
    
    // Get FCM token with service worker registration
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    })
    
    if (token) {
      console.log('FCM Token:', token)
      // Save token to Firestore
      await saveTokenToFirestore(token)
      return token
    } else {
      console.log('No registration token available')
      return null
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Save FCM token to Firestore
const saveTokenToFirestore = async (token) => {
  try {
    // Create a unique ID for this device/user
    const deviceId = localStorage.getItem('deviceId') || `device_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem('deviceId', deviceId)
    
    const tokenDoc = {
      token,
      deviceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }
    
    // Save to Firestore collection 'fcmTokens'
    await setDoc(doc(db, 'fcmTokens', deviceId), tokenDoc, { merge: true })
    console.log('FCM token saved to Firestore')
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error)
  }
}

// Listen for foreground messages (when app is open) - PWA only
export const onMessageListener = () => {
  // Only work in PWA mode, not in browser
  if (!isPWA()) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    if (!messaging) {
      initMessaging().then((msg) => {
        if (msg) {
          onMessage(msg, (payload) => {
            console.log('Message received in foreground:', payload)
            resolve(payload)
          })
        } else {
          resolve(null)
        }
      })
    } else {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload)
        resolve(payload)
      })
    }
  })
}

// Get current FCM token (without requesting permission) - PWA only
export const getCurrentToken = async () => {
  // Only work in PWA mode, not in browser
  if (!isPWA()) {
    return null
  }

  try {
    if (!messaging) {
      messaging = await initMessaging()
      if (!messaging) return null
    }
    
    // Only get token if permission is already granted
    if (Notification.permission !== 'granted') {
      return null
    }
    
    // Get service worker registration
    let registration = null
    try {
      registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      if (!registration) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        registration = registrations.find(reg => reg.scope.includes('/'))
      }
    } catch (swError) {
      console.error('Service Worker registration error:', swError)
    }
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    })
    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator
}

// Check current notification permission
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'not-supported'
  return Notification.permission
}

// Don't initialize messaging on import - only initialize when explicitly requested in PWA mode
// This prevents any notification-related code from running in browser mode

export default messaging
