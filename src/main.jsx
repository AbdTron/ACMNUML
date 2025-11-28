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
      // First, clear all old caches to force refresh
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Clearing old cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
      
      // Register Firebase Messaging service worker FIRST (required for FCM)
      try {
        const fcmRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        })
        console.log('Firebase Messaging Service Worker registered:', fcmRegistration.scope)
        
        // Wait for it to be ready
        if (fcmRegistration.installing) {
          await new Promise((resolve) => {
            fcmRegistration.installing.addEventListener('statechange', () => {
              if (fcmRegistration.installing.state === 'activated') {
                resolve()
              }
            })
          })
        }
      } catch (fcmError) {
        console.error('Firebase Messaging Service Worker registration failed:', fcmError)
      }

      // Register main service worker for PWA
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully:', registration.scope)
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available - prompt user to reload
              console.log('New service worker available. Reloading...')
              window.location.reload()
            }
          })
        }
      })
      
      // Force update check
      await registration.update()
    } catch (error) {
      console.error('Service Worker registration error:', error)
    }
  })
  
  // Clear old service workers and caches on page load (for development)
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

