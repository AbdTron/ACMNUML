import { useState, useEffect } from 'react'
import { FiDownload, FiX } from 'react-icons/fi'
import './InstallPrompt.css'

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if already shown in this session
    const hasShownPrompt = sessionStorage.getItem('pwa-install-prompt-shown')
    if (hasShownPrompt) {
      return
    }

    // Listen for the beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
    sessionStorage.setItem('pwa-install-prompt-shown', 'true')
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('pwa-install-prompt-shown', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">
          <FiDownload />
        </div>
        <div className="install-prompt-text">
          <h3>Install ACM NUML App</h3>
          <p>Add to your home screen for quick access and offline support</p>
        </div>
        <div className="install-prompt-actions">
          <button className="install-btn" onClick={handleInstall}>
            Install
          </button>
          <button className="dismiss-btn" onClick={handleDismiss} aria-label="Dismiss">
            <FiX />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt






