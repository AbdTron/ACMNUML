import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import acmlogSplash from './assets/acmlogSplash.png'
import './styles/index.css'

// Set favicon dynamically with larger, more visible size
const setFavicon = (src) => {
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"]')
  existingLinks.forEach(link => link.remove())
  
  // Create canvas to scale up favicon for better visibility
  const img = new Image()
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      // Use larger size for better visibility
      const targetSize = 192
      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext('2d')
      
      // Draw with better quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetSize, targetSize)
      
      const dataUrl = canvas.toDataURL('image/png')
      
      // Create favicon links with the scaled image
      const sizes = [16, 32, 48, 64, 96, 128, 192]
      sizes.forEach(size => {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.type = 'image/png'
        link.href = dataUrl
        link.sizes = `${size}x${size}`
        document.head.appendChild(link)
      })
      
      // Add apple touch icon
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = dataUrl
      appleLink.sizes = '180x180'
      document.head.appendChild(appleLink)
    } catch (error) {
      // Fallback to direct image if canvas fails
      console.warn('Favicon canvas failed, using direct image:', error)
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      link.href = src
      link.sizes = '192x192'
      document.head.appendChild(link)
    }
  }
  img.onerror = () => {
    // Fallback if image fails to load
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = src
    link.sizes = '192x192'
    document.head.appendChild(link)
  }
  img.src = src
}

setFavicon(acmlogSplash)

// ✅ 5. Register Service Workers with automatic update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Check if running as PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true ||
                    window.matchMedia('(display-mode: fullscreen)').matches

      // ✅ 8. Register FCM service worker FIRST (before main SW) in PWA mode
      let fcmRegistration = null
      if (isPWA) {
        try {
          fcmRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none' // Always check for updates
          })
          console.log('[SW] Firebase Messaging Service Worker registered (PWA mode):', fcmRegistration.scope)
          
          // Check for FCM updates
          await fcmRegistration.update()
        } catch (fcmError) {
          console.error('[SW] Firebase Messaging Service Worker registration failed:', fcmError)
        }
      } else {
        console.log('[SW] FCM Service Worker not registered (browser mode)')
      }

      // Register main service worker (works for both browser and installed PWA)
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none' // Always check for updates on page load/app open
      })
      console.log('[SW] Main Service Worker registered successfully:', registration.scope)
      
      // Check for updates immediately
      await registration.update()
      
      // Check for updates when app becomes visible (important for installed PWAs)
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          try {
            await registration.update()
            if (fcmRegistration) {
              await fcmRegistration.update()
            }
          } catch (error) {
            console.error('[SW] Error checking for service worker updates:', error)
          }
        }
      })
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available - automatically activate it
              console.log('[SW] New service worker version detected. Activating...')
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            } else if (newWorker.state === 'activated') {
              // Worker activated, reload will happen via controllerchange
              console.log('[SW] New service worker activated')
            }
          })
        }
      })
      
      // ✅ 5. Auto-refresh when new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Service worker controller changed, reloading...')
        window.location.reload()
      })
      
    } catch (error) {
      console.error('[SW] Service Worker registration error:', error)
    }
  })
  
  // Clear old service workers and caches on page load (for development only)
  if (import.meta.env.DEV) {
    window.addEventListener('load', async () => {
      try {
        // Clear all caches
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        
        // Unregister all service workers
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
        console.log('[SW] Cleared all caches and unregistered service workers (dev mode)')
      } catch (error) {
        console.error('[SW] Error clearing caches:', error)
      }
    })
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
