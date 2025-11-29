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
      // IMPORTANT: In PWA mode, FCM service worker must be the controlling one
      let fcmRegistration = null
      if (isPWA) {
        try {
          // Unregister ALL existing service workers first (to avoid conflicts)
          const existingRegistrations = await navigator.serviceWorker.getRegistrations()
          console.log(`[SW] Found ${existingRegistrations.length} existing service worker(s)`)
          for (const reg of existingRegistrations) {
            const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || ''
            if (scriptURL.includes('/sw.js')) {
              console.log('[SW] Unregistering main service worker to allow FCM SW control')
              await reg.unregister()
              // Wait for unregistration to complete
              await new Promise(resolve => setTimeout(resolve, 200))
            }
          }
          
          // Double-check: if main SW is still controlling, we need to reload
          if (navigator.serviceWorker.controller?.scriptURL?.includes('/sw.js')) {
            console.warn('[SW] Main service worker is still controlling. Will reload after FCM SW registration.')
          }
          
          fcmRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none' // Always check for updates
          })
          console.log('[SW] Firebase Messaging Service Worker registered (PWA mode):', fcmRegistration.scope)
          
          // Wait for FCM service worker to activate and take control
          if (fcmRegistration.installing) {
            const installing = fcmRegistration.installing
            await new Promise((resolve) => {
              if (installing) {
                installing.addEventListener('statechange', () => {
                  if (installing.state === 'activated') {
                    resolve()
                  }
                })
                // If already activated, resolve immediately
                if (installing.state === 'activated') {
                  resolve()
                }
              } else {
                resolve()
              }
            })
          } else if (fcmRegistration.waiting) {
            console.log('[SW] FCM Service Worker is waiting (ready)')
          } else if (fcmRegistration.active) {
            console.log('[SW] FCM Service Worker is already active')
          }
          
          // Check for FCM updates
          await fcmRegistration.update()
        } catch (fcmError) {
          console.error('[SW] Firebase Messaging Service Worker registration failed:', fcmError)
        }
      } else {
        console.log('[SW] FCM Service Worker not registered (browser mode)')
      }

      // Register main service worker ONLY if not in PWA mode (to avoid conflicts)
      if (!isPWA) {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none' // Always check for updates on page load/app open
        })
        console.log('[SW] Main Service Worker registered successfully:', registration.scope)
        
        // Check for updates immediately
        await registration.update()
        
        // Set up update listeners for main SW (browser mode only)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New service worker version detected. Activating...')
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              } else if (newWorker.state === 'activated') {
                console.log('[SW] New service worker activated')
              }
            })
          }
        })
      }
      
      // Check for updates when app becomes visible (important for installed PWAs)
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          try {
            if (fcmRegistration) {
              await fcmRegistration.update()
            } else if (!isPWA) {
              const registrations = await navigator.serviceWorker.getRegistrations()
              const mainSW = registrations.find(reg => reg.active?.scriptURL?.includes('/sw.js'))
              if (mainSW) {
                await mainSW.update()
              }
            }
          } catch (error) {
            console.error('[SW] Error checking for service worker updates:', error)
          }
        }
      })
      
      // Listen for FCM service worker updates (PWA mode)
      if (fcmRegistration) {
        fcmRegistration.addEventListener('updatefound', () => {
          const newWorker = fcmRegistration.installing
          if (newWorker) {
            const worker = newWorker
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New FCM service worker version detected. Activating...')
                worker.postMessage({ type: 'SKIP_WAITING' })
              } else if (worker.state === 'activated') {
                console.log('[SW] New FCM service worker activated')
              }
            })
          }
        })
      }
      
      // ✅ 5. Auto-refresh when new SW takes control (prevent infinite loops)
      // Store reload state in sessionStorage to prevent infinite loops
      const reloadKey = 'sw-reload-pending'
      const hasPendingReload = sessionStorage.getItem(reloadKey) === 'true'
      
      if (hasPendingReload) {
        // Clear the flag - we've already reloaded
        sessionStorage.removeItem(reloadKey)
        console.log('[SW] Reload completed, flag cleared')
      }
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Prevent infinite reload loops
        if (sessionStorage.getItem(reloadKey) === 'true') {
          console.log('[SW] Reload already pending, skipping...')
          return
        }
        
        const currentController = navigator.serviceWorker.controller?.scriptURL
        console.log('[SW] Service worker controller changed:', currentController)
        
        // Only reload if we're in PWA mode and wrong SW is controlling
        if (isPWA && currentController && !currentController.includes('firebase-messaging-sw.js')) {
          console.log('[SW] Wrong service worker controlling in PWA mode, will reload once')
          sessionStorage.setItem(reloadKey, 'true')
          setTimeout(() => {
            window.location.reload()
          }, 500)
        } else {
          console.log('[SW] Controller change detected but no reload needed')
        }
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

import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
