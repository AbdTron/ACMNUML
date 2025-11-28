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

// Register Service Workers for PWA and FCM
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Only register FCM service worker in PWA mode, not in browser
      // Check if running as PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true ||
                    window.matchMedia('(display-mode: fullscreen)').matches

      if (isPWA) {
        // Register Firebase Messaging service worker (PWA only)
        try {
          const fcmRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none' // Always check for updates on page load
          })
          console.log('Firebase Messaging Service Worker registered (PWA mode):', fcmRegistration.scope)
          
          // Service workers automatically check for updates when files change (on new deploys)
          // No need for periodic checks - browser handles this automatically
        } catch (fcmError) {
          console.error('Firebase Messaging Service Worker registration failed:', fcmError)
        }
      } else {
        console.log('FCM Service Worker not registered (browser mode - notifications disabled)')
      }

      // Register main service worker (works for both browser and installed PWA)
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none' // Always check for updates on page load/app open
      })
      console.log('Service Worker registered successfully:', registration.scope)
      
      // Check for updates immediately (works when app opens - browser or installed PWA)
      // Service workers automatically detect file changes when you deploy new version
      await registration.update()
      
      // Also check for updates when app becomes visible (important for installed PWAs)
      // This ensures updates are detected even if app was in background
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          // App became visible - check for updates
          try {
            await registration.update()
          } catch (error) {
            console.error('Error checking for service worker updates:', error)
          }
        }
      })
      
      // Listen for service worker updates (only fires when new version is deployed)
      // This works the same for browser tabs and installed PWA apps
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker available (new deploy detected) - automatically activate it
                // This works for both browser and installed PWA
                console.log('New service worker version detected. Activating and reloading...')
                // Tell the new worker to skip waiting and activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                // Reload to use the new service worker and clear old cache
                // Works in both browser tabs and installed PWA windows
                window.location.reload()
              } else {
                // First time installation
                console.log('Service Worker installed for the first time')
              }
            }
          })
        }
      })
    } catch (error) {
      console.error('Service Worker registration error:', error)
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
        console.log('Cleared all caches and unregistered service workers (dev mode)')
      } catch (error) {
        console.error('Error clearing caches:', error)
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

