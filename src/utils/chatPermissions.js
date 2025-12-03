/**
 * Chat Permissions Utility
 * Checks if a user can message another user based on chat settings
 * Uses caching to minimize API calls
 */

const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes
const CACHE_PREFIX = 'cometchat_permission_'

/**
 * Get cached permission result
 */
const getCachedPermission = (recipientId) => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${recipientId}`)
    if (cached) {
      const { result, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return result
      }
    }
  } catch (e) {
    console.warn('Error reading permission cache:', e)
  }
  return null
}

/**
 * Cache permission result
 */
const setCachedPermission = (recipientId, canMessage) => {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${recipientId}`,
      JSON.stringify({
        result: canMessage,
        timestamp: Date.now(),
      })
    )
  } catch (e) {
    console.warn('Error caching permission:', e)
  }
}

/**
 * Invalidate cache for a user
 */
export const invalidatePermissionCache = (userId) => {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${userId}`)
  } catch (e) {
    console.warn('Error invalidating permission cache:', e)
  }
}

/**
 * Check if sender can message recipient
 * @param {string} senderEmail - Email of the sender
 * @param {string} recipientId - CometChat UID of the recipient
 * @param {Function} getChatSettings - Function to get chat settings from CometChat
 * @returns {Promise<boolean>} - True if sender can message recipient
 */
export const canUserMessage = async (senderEmail, recipientId, getChatSettings) => {
  if (!senderEmail || !recipientId || !getChatSettings) {
    return false
  }

  // Check cache first
  const cached = getCachedPermission(recipientId)
  if (cached !== null) {
    return cached
  }

  try {
    // Get recipient's chat settings
    const settings = await getChatSettings(recipientId)
    if (!settings) {
      // Default to allowing if we can't get settings
      setCachedPermission(recipientId, true)
      return true
    }

    // If chat is enabled, anyone can message
    if (settings.chatEnabled) {
      setCachedPermission(recipientId, true)
      return true
    }

    // If chat is disabled, check allow list
    if (!settings.chatEnabled) {
      const canMessage = Array.isArray(settings.chatAllowList) && 
                        settings.chatAllowList.includes(senderEmail)
      setCachedPermission(recipientId, canMessage)
      return canMessage
    }

    // Default to allowing
    setCachedPermission(recipientId, true)
    return true
  } catch (error) {
    console.error('Error checking chat permissions:', error)
    // Default to allowing on error
    setCachedPermission(recipientId, true)
    return true
  }
}

/**
 * Batch check permissions for multiple users
 * @param {string} senderEmail - Email of the sender
 * @param {string[]} recipientIds - Array of CometChat UIDs
 * @param {Function} getChatSettings - Function to get chat settings from CometChat
 * @returns {Promise<Object>} - Object mapping recipientId to boolean
 */
export const batchCheckPermissions = async (senderEmail, recipientIds, getChatSettings) => {
  const results = {}
  
  // Check cache for all users first
  const uncachedIds = []
  for (const recipientId of recipientIds) {
    const cached = getCachedPermission(recipientId)
    if (cached !== null) {
      results[recipientId] = cached
    } else {
      uncachedIds.push(recipientId)
    }
  }

  // Check uncached users
  const promises = uncachedIds.map(async (recipientId) => {
    const canMessage = await canUserMessage(senderEmail, recipientId, getChatSettings)
    results[recipientId] = canMessage
  })

  await Promise.all(promises)
  return results
}

