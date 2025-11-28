import { useState, useEffect } from 'react'
import acmlogSplash from '../assets/acmlogSplash.png'
import './SplashScreen.css'

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
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

  if (!isVisible) return null

  return (
    <div className={`splash-screen ${!isVisible ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <img 
          src={acmlogSplash} 
          alt="ACM NUML Logo" 
          className="splash-logo"
        />
        <p className="splash-credit">by Abdullah Irshad</p>
      </div>
    </div>
  )
}

export default SplashScreen

