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
      // Register Firebase Messaging service worker FIRST (required for FCM)
      try {
        const fcmRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates on page load
        })
        console.log('Firebase Messaging Service Worker registered:', fcmRegistration.scope)
        
        // Service workers automatically check for updates when files change (on new deploys)
        // No need for periodic checks - browser handles this automatically
      } catch (fcmError) {
        console.error('Firebase Messaging Service Worker registration failed:', fcmError)
      }

      // Register main service worker for PWA
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none' // Always check for updates on page load
      })
      console.log('Service Worker registered successfully:', registration.scope)
      
      // Check for updates on page load (service workers auto-check when files change on deploy)
      // No periodic checks needed - browser automatically detects file changes
      await registration.update()
      
      // Listen for service worker updates (only fires when new version is deployed)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker available (new deploy detected) - automatically activate it
                console.log('New service worker version detected. Activating and reloading...')
                // Tell the new worker to skip waiting and activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                // Reload to use the new service worker and clear old cache
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

