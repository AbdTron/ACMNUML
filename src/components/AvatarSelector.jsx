import { useState, useEffect } from 'react'
import { FiUser, FiCheck, FiX } from 'react-icons/fi'
import { getAvailableAvatarFolders, getAvatarUrl } from '../utils/avatarUtils'
import './AvatarSelector.css'

/**
 * Avatar Selector Component
 * Allows users to select an avatar based on their role
 * Opens in a modal with tabs for better UX
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
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    setSelectedAvatar(currentAvatar || '')
  }, [currentAvatar])

  useEffect(() => {
    const loadAvailableAvatars = async () => {
      setLoading(true)
      try {
        // Get folders user can access
        const folders = getAvailableAvatarFolders(acmRole, isAdmin)
        console.log('[AvatarSelector] ACM Role:', acmRole, 'Available folders:', folders)
        
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
        
        // Set initial active tab to first available folder
        if (folders.length > 0) {
          setActiveTab(folders[0])
        }
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
    // Close modal after selection
    setShowModal(false)
  }

  const handleClear = () => {
    setSelectedAvatar('')
    if (onSelect) {
      onSelect('')
    }
    // Close modal after selection
    setShowModal(false)
  }

  // Group avatars by folder
  const avatarsByFolder = {}
  availableAvatars.forEach(avatar => {
    if (!avatarsByFolder[avatar.folder]) {
      avatarsByFolder[avatar.folder] = []
    }
    avatarsByFolder[avatar.folder].push(avatar)
  })

  // Get available folders
  const folders = getAvailableAvatarFolders(acmRole, isAdmin)

  // Get current avatar display
  const getCurrentAvatarDisplay = () => {
    if (!selectedAvatar) {
      return (
        <div className="avatar-current-preview default">
          <FiUser />
        </div>
      )
    }
    const avatarUrl = getAvatarUrl(selectedAvatar)
    return (
      <div className="avatar-current-preview">
        <img src={avatarUrl} alt="Current avatar" />
      </div>
    )
  }

  return (
    <>
      <div className={`avatar-selector-trigger ${className}`}>
        <label className="avatar-selector-label">Profile Avatar</label>
        <p className="avatar-selector-description">
          Choose an avatar to display on your profile and forum posts
        </p>
        <button
          type="button"
          className="avatar-selector-button"
          onClick={() => setShowModal(true)}
        >
          <div className="avatar-button-content">
            {getCurrentAvatarDisplay()}
            <div className="avatar-button-info">
              <span className="avatar-button-text">
                {selectedAvatar ? 'Change Avatar' : 'Select Avatar'}
              </span>
              <span className="avatar-button-subtext">
                {selectedAvatar ? selectedAvatar.split('/').pop() : 'Click to choose'}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="avatar-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="avatar-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="avatar-modal-header">
              <h2>Select Avatar</h2>
              <button 
                className="avatar-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {loading ? (
              <div className="avatar-modal-loading">
                <p>Loading avatars...</p>
              </div>
            ) : availableAvatars.length === 0 ? (
              <div className="avatar-modal-empty">
                <p>No avatars available. Please add avatars to the AvatarCollection folders.</p>
              </div>
            ) : (
              <div className="avatar-modal-body">
                {/* Tabs */}
                <div className="avatar-modal-tabs">
                  <button
                    className={`avatar-tab ${!activeTab || activeTab === 'default' ? 'active' : ''}`}
                    onClick={() => setActiveTab('default')}
                  >
                    Default
                  </button>
                  {folders.map(folder => (
                    <button
                      key={folder}
                      className={`avatar-tab ${activeTab === folder ? 'active' : ''}`}
                      onClick={() => setActiveTab(folder)}
                    >
                      {folder} {avatarsByFolder[folder] && `(${avatarsByFolder[folder].length})`}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="avatar-modal-tab-content">
                  {/* Default Tab */}
                  {(!activeTab || activeTab === 'default') && (
                    <div className="avatar-tab-panel">
                      <div className="avatar-grid">
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
                    </div>
                  )}

                  {/* Folder Tabs */}
                  {folders.map(folder => (
                    activeTab === folder && (
                      <div key={folder} className="avatar-tab-panel">
                        <div className="avatar-grid">
                          {avatarsByFolder[folder]?.map(avatar => {
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
                                <span className="avatar-option-name" title={avatar.filename}>
                                  {avatar.filename.length > 15 
                                    ? avatar.filename.substring(0, 15) + '...' 
                                    : avatar.filename}
                                </span>
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
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default AvatarSelector
