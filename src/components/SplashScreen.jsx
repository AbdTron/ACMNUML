import { useState, useEffect } from 'react'
import acmlogSplash from '../assets/acmlogSplash.png'
import { isPWA } from '../utils/isPWA'
import './SplashScreen.css'

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Only show splash screen in PWA mode, not in browser
    if (!isPWA()) {
      onFinish()
      return
    }

    // Show splash screen for 1 second
    const timer = setTimeout(() => {
      setIsVisible(false)
      // Wait for fade out animation to complete before calling onFinish
      setTimeout(() => {
        onFinish()
      }, 300) // Match the CSS transition duration
    }, 1000)

    return () => clearTimeout(timer)
  }, [onFinish])

  // Don't render if not in PWA mode
  if (!isPWA() || !isVisible) return null

  return (
    <div className={`splash-screen ${!isVisible ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <img 
          src={acmlogSplash} 
          alt="ACM NUML Logo" 
          className="splash-logo"
        />
        <h2 className="splash-title">ACM NUML</h2>
        <p className="splash-credit">by Abdullah Irshad</p>
      </div>
    </div>
  )
}

export default SplashScreen

