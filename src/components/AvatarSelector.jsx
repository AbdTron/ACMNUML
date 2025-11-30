import { useState, useEffect } from 'react'
import { FiUser, FiCheck } from 'react-icons/fi'
import { getAvailableAvatarFolders, getAvatarUrl } from '../utils/avatarUtils'
import './AvatarSelector.css'

/**
 * Avatar Selector Component
 * Allows users to select an avatar based on their role
 */
const AvatarSelector = ({ 
  currentAvatar, 
  acmRole, 
  isAdmin, 
  onSelect,
  className = '' 
}) => {
  const [availableAvatars, setAvailableAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSelectedAvatar(currentAvatar || '')
  }, [currentAvatar])

  useEffect(() => {
    const loadAvailableAvatars = async () => {
      setLoading(true)
      try {
        // Get folders user can access
        const folders = getAvailableAvatarFolders(acmRole, isAdmin)
        
        // Load avatar manifest or discover avatars
        const avatars = []
        
        // Try to load from manifest file first
        try {
          const manifestResponse = await fetch('/AvatarCollection/manifest.json')
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json()
            folders.forEach(folder => {
              if (manifest[folder] && Array.isArray(manifest[folder])) {
                manifest[folder].forEach(filename => {
                  avatars.push({
                    path: `${folder}/${filename}`,
                    folder,
                    filename
                  })
                })
              }
            })
          } else {
            // If manifest doesn't exist, try common image patterns
            await discoverAvatars(folders, avatars)
          }
        } catch (err) {
          // Manifest not found, try to discover avatars
          await discoverAvatars(folders, avatars)
        }
        
        setAvailableAvatars(avatars)
      } catch (error) {
        console.error('Error loading avatars:', error)
        setAvailableAvatars([])
      } finally {
        setLoading(false)
      }
    }

    loadAvailableAvatars()
  }, [acmRole, isAdmin])

  // Helper function to discover avatars by trying common patterns
  const discoverAvatars = async (folders, avatars) => {
    const commonExtensions = ['png', 'jpg', 'jpeg', 'webp', 'svg']
    const maxAttempts = 20 // Try up to 20 avatars per folder
    
    for (const folder of folders) {
      for (let i = 1; i <= maxAttempts; i++) {
        // Try common naming patterns
        const patterns = [
          `avatar${i}`,
          `avatar_${i}`,
          `Avatar${i}`,
          `Avatar_${i}`,
          `${folder.toLowerCase()}${i}`,
          `user${i}`,
          `member${i}`
        ]
        
        for (const pattern of patterns) {
          for (const ext of commonExtensions) {
            const path = `${folder}/${pattern}.${ext}`
            const url = getAvatarUrl(path)
            
            // Check if image exists by trying to load it
            const exists = await checkImageExists(url)
            if (exists) {
              // Avoid duplicates
              if (!avatars.find(a => a.path === path)) {
                avatars.push({
                  path,
                  folder,
                  filename: `${pattern}.${ext}`
                })
              }
              break // Found one, move to next pattern
            }
          }
        }
      }
    }
  }

  // Check if an image exists by trying to load it
  const checkImageExists = (url) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
      // Timeout after 2 seconds
      setTimeout(() => resolve(false), 2000)
    })
  }

  const handleSelect = (avatarPath) => {
    setSelectedAvatar(avatarPath)
    if (onSelect) {
      onSelect(avatarPath)
    }
  }

  const handleClear = () => {
    setSelectedAvatar('')
    if (onSelect) {
      onSelect('')
    }
  }

  if (loading) {
    return (
      <div className={`avatar-selector ${className}`}>
        <div className="avatar-selector-loading">Loading avatars...</div>
      </div>
    )
  }

  if (availableAvatars.length === 0) {
    return (
      <div className={`avatar-selector ${className}`}>
        <div className="avatar-selector-empty">
          <p>No avatars available. Please add avatars to the AvatarCollection folders.</p>
        </div>
      </div>
    )
  }

  // Group avatars by folder
  const avatarsByFolder = {}
  availableAvatars.forEach(avatar => {
    if (!avatarsByFolder[avatar.folder]) {
      avatarsByFolder[avatar.folder] = []
    }
    avatarsByFolder[avatar.folder].push(avatar)
  })

  return (
    <div className={`avatar-selector ${className}`}>
      <label className="avatar-selector-label">Profile Avatar</label>
      <p className="avatar-selector-description">
        Choose an avatar to display on your profile and forum posts
      </p>
      
      {/* Default option */}
      <div className="avatar-option-group">
        <div 
          className={`avatar-option ${!selectedAvatar ? 'selected' : ''}`}
          onClick={handleClear}
        >
          <div className="avatar-preview default">
            <FiUser />
          </div>
          <span className="avatar-option-name">Default</span>
          {!selectedAvatar && (
            <div className="avatar-check">
              <FiCheck />
            </div>
          )}
        </div>
      </div>

      {/* Avatars grouped by folder */}
      {Object.keys(avatarsByFolder).map(folder => (
        <div key={folder} className="avatar-option-group">
          <h4 className="avatar-folder-name">{folder} Avatars</h4>
          <div className="avatar-grid">
            {avatarsByFolder[folder].map(avatar => {
              const avatarUrl = getAvatarUrl(avatar.path)
              const isSelected = selectedAvatar === avatar.path
              
              return (
                <div
                  key={avatar.path}
                  className={`avatar-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(avatar.path)}
                >
                  <div className="avatar-preview">
                    <img 
                      src={avatarUrl} 
                      alt={avatar.filename}
                      onError={(e) => {
                        // Hide broken images
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                  <span className="avatar-option-name">{avatar.filename}</span>
                  {isSelected && (
                    <div className="avatar-check">
                      <FiCheck />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default AvatarSelector


