/**
 * Avatar utility functions
 * Handles avatar selection and display based on user roles
 */

/**
 * Get available avatar folders based on user role
 * Three categories:
 * 1. President - can access President, Members, and User folders
 * 2. ACM Member (any ACM role except president, like vice president, treasurer, etc.) - can access Members and User folders
 * 3. User (regular user, no ACM role) - can only access User folder
 * 
 * @param {string} acmRole - User's ACM role (e.g., 'President', 'Vice President', 'Treasurer', null)
 * @param {boolean} isAdmin - Whether user is an admin (not used for avatar access, but kept for compatibility)
 * @returns {string[]} Array of folder names user can access
 */
export const getAvailableAvatarFolders = (acmRole, isAdmin = false) => {
  const folders = []
  
  // Category 1: President - can use all folders (President, Members, User)
  if (acmRole && acmRole.toLowerCase().trim() === 'president') {
    folders.push('President', 'Members', 'User')
    return folders
  }
  
  // Category 2: ACM Member (any ACM role except president) - can use Members and User folders
  // This includes: Vice President, Treasurer, Secretary, Member, etc.
  if (acmRole && acmRole.toLowerCase().trim() !== 'president') {
    folders.push('Members', 'User')
    return folders
  }
  
  // Category 3: Regular User (no ACM role) - can only use User folder
  folders.push('User')
  return folders
}

/**
 * Get the full path to an avatar image
 * @param {string} avatarPath - Avatar path stored in user profile (e.g., 'User/avatar1.png')
 * @returns {string} Full path to avatar image
 */
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null
  // Remove leading slash if present and ensure proper path
  const cleanPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath
  return `/AvatarCollection/${cleanPath}`
}

/**
 * Get default avatar (returns null to use default icon)
 * @returns {null}
 */
export const getDefaultAvatar = () => {
  return null // Return null to use default FiUser icon
}

/**
 * Get avatar URL or default
 * @param {string} avatarPath - Avatar path from user profile
 * @returns {string|null} Avatar URL or null for default
 */
export const getAvatarUrlOrDefault = (avatarPath) => {
  if (!avatarPath) return null
  return getAvatarUrl(avatarPath)
}

/**
 * List all available avatar files from a folder
 * This is a helper for the AvatarSelector component
 * Note: In a real app, you might want to fetch this from an API
 * For now, we'll use a static list or require manual configuration
 * 
 * @param {string} folder - Folder name ('User', 'Members', 'President')
 * @returns {Promise<string[]>} Array of avatar filenames
 */
export const getAvatarsFromFolder = async (folder) => {
  // Since we can't easily list files from public folder in browser,
  // we'll need to either:
  // 1. Maintain a manifest file with all avatars
  // 2. Use a build-time script to generate the list
  // 3. Have the component fetch from a known list
  
  // For now, return empty array - the AvatarSelector will handle this
  // by trying to load images and checking if they exist
  return []
}

/**
 * Check if user can access a specific avatar folder
 * @param {string} folder - Folder name to check
 * @param {string} acmRole - User's ACM role
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {boolean}
 */
export const canAccessAvatarFolder = (folder, acmRole, isAdmin = false) => {
  const availableFolders = getAvailableAvatarFolders(acmRole, isAdmin)
  return availableFolders.includes(folder)
}

