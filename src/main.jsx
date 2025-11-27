import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import acmLogo from './assets/acmlog.png'
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

setFavicon(acmLogo)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope)
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available - unregister and reload
                console.log('New service worker available. Updating...')
                registration.unregister().then(() => {
                  window.location.reload()
                })
              }
            })
          }
        })
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error)
      })
  })
  
  // Unregister old service workers on page load (for development)
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
        console.log('Old service worker unregistered')
      })
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

