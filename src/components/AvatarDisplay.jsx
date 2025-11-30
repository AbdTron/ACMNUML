import { FiUser } from 'react-icons/fi'
import { getAvatarUrlOrDefault } from '../utils/avatarUtils'
import './AvatarDisplay.css'

/**
 * Avatar Display Component
 * Displays user avatar with fallback to default icon
 */
const AvatarDisplay = ({ 
  avatarPath, 
  name, 
  size = 'medium',
  className = '' 
}) => {
  const avatarUrl = getAvatarUrlOrDefault(avatarPath)
  const sizeClass = `avatar-${size}`

  return (
    <div className={`avatar-display ${sizeClass} ${className}`}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={name || 'User avatar'} 
          onError={(e) => {
            // Fallback to default icon if image fails to load
            e.target.style.display = 'none'
            const parent = e.target.parentElement
            if (parent && !parent.querySelector('svg')) {
              const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
              icon.setAttribute('viewBox', '0 0 24 24')
              icon.setAttribute('fill', 'none')
              icon.setAttribute('stroke', 'currentColor')
              icon.setAttribute('stroke-width', '2')
              icon.innerHTML = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
              parent.appendChild(icon)
            }
          }}
        />
      ) : (
        <FiUser />
      )}
    </div>
  )
}

export default AvatarDisplay


