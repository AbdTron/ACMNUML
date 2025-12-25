/**
 * Client-side cache for author data (users + admins) to prevent N+1 Firestore queries
 * 
 * This cache stores:
 * - User profile data from 'users' collection
 * - Admin role data from 'admins' collection
 * 
 * Cache invalidation:
 * - Cache expires after 5 minutes (configurable)
 * - Can be manually cleared if needed
 * 
 * Usage:
 * - getAuthorData(authorId) - Returns cached data or fetches if not cached
 * - clearCache() - Clears all cached data
 * - clearAuthorCache(authorId) - Clears cache for specific author
 */

import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

// Cache storage: Map<authorId, { data, timestamp }>
const cache = new Map()

// Cache expiration time: 5 minutes
const CACHE_EXPIRY_MS = 5 * 60 * 1000

/**
 * Get cached author data or fetch from Firestore if not cached/expired
 * @param {string} authorId - User ID to fetch data for
 * @returns {Promise<{userData: Object|null, adminRole: string|null}>}
 */
export const getAuthorData = async (authorId) => {
  if (!authorId || !db) {
    return { userData: null, adminRole: null }
  }

  // Check cache first
  const cached = cache.get(authorId)
  const now = Date.now()

  // Return cached data if it exists and hasn't expired
  if (cached && (now - cached.timestamp) < CACHE_EXPIRY_MS) {
    return cached.data
  }

  // Fetch from Firestore (both queries in parallel for better performance)
  try {
    const [userDoc, adminDoc] = await Promise.all([
      getDoc(doc(db, 'users', authorId)),
      getDoc(doc(db, 'admins', authorId))
    ])

    const userData = userDoc.exists() ? userDoc.data() : null
    const adminRole = adminDoc.exists() ? (adminDoc.data().role || 'admin') : null

    const data = { userData, adminRole }

    // Store in cache
    cache.set(authorId, {
      data,
      timestamp: now
    })

    // Also cache the lowercase ID mapping
    lowercaseIdMap.set(authorId.toLowerCase(), authorId)

    return data
  } catch (error) {
    console.error('Error fetching author data:', error)
    return { userData: null, adminRole: null }
  }
}

// Secondary cache to map lowercase IDs to original case IDs
const lowercaseIdMap = new Map()

/**
 * Get author data using a lowercase ID (e.g., from Stream Chat)
 * This is useful when Stream Chat lowercases Firebase UIDs
 * @param {string} lowercaseId - Lowercase user ID
 * @returns {Promise<{userData: Object|null, adminRole: string|null, originalId: string|null}>}
 */
export const getAuthorDataByLowercaseId = async (lowercaseId) => {
  if (!lowercaseId || !db) {
    return { userData: null, adminRole: null, originalId: null }
  }

  const lowerId = lowercaseId.toLowerCase()

  // Check if we have a cached mapping
  if (lowercaseIdMap.has(lowerId)) {
    const originalId = lowercaseIdMap.get(lowerId)
    const data = await getAuthorData(originalId)
    return { ...data, originalId }
  }

  // Try the ID as-is first (might already be correct case)
  const directResult = await getAuthorData(lowercaseId)
  if (directResult.userData) {
    lowercaseIdMap.set(lowerId, lowercaseId)
    return { ...directResult, originalId: lowercaseId }
  }

  // Need to search - query all users and find by lowercase match
  // This is expensive but only happens once per user (then cached)
  try {
    const { collection, getDocs, query, limit } = await import('firebase/firestore')

    // Query users collection - we'll check a limited set
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(query(usersRef, limit(500)))

    for (const userDoc of usersSnapshot.docs) {
      if (userDoc.id.toLowerCase() === lowerId) {
        // Found it! Cache the mapping
        const originalId = userDoc.id
        lowercaseIdMap.set(lowerId, originalId)

        // Now use the regular function to get full data and cache it
        const data = await getAuthorData(originalId)
        return { ...data, originalId }
      }
    }

    // Not found
    return { userData: null, adminRole: null, originalId: null }
  } catch (error) {
    console.error('Error in lowercase lookup:', error)
    return { userData: null, adminRole: null, originalId: null }
  }
}

/**
 * Pre-fetch author data for multiple authors (useful for batch loading)
 * @param {string[]} authorIds - Array of user IDs to fetch
 * @returns {Promise<Map<string, {userData: Object|null, adminRole: string|null}>>}
 */
export const getAuthorDataBatch = async (authorIds) => {
  if (!authorIds || authorIds.length === 0 || !db) {
    return new Map()
  }

  // Filter out already cached and non-expired IDs
  const now = Date.now()
  const uncachedIds = authorIds.filter(id => {
    const cached = cache.get(id)
    return !cached || (now - cached.timestamp) >= CACHE_EXPIRY_MS
  })

  if (uncachedIds.length === 0) {
    // All data is cached, return from cache
    const result = new Map()
    authorIds.forEach(id => {
      const cached = cache.get(id)
      if (cached) {
        result.set(id, cached.data)
      }
    })
    return result
  }

  // Fetch uncached data in parallel
  try {
    const fetchPromises = uncachedIds.map(async (authorId) => {
      try {
        const [userDoc, adminDoc] = await Promise.all([
          getDoc(doc(db, 'users', authorId)),
          getDoc(doc(db, 'admins', authorId))
        ])

        const userData = userDoc.exists() ? userDoc.data() : null
        const adminRole = adminDoc.exists() ? (adminDoc.data().role || 'admin') : null

        const data = { userData, adminRole }

        // Store in cache
        cache.set(authorId, {
          data,
          timestamp: now
        })

        return { authorId, data }
      } catch (error) {
        console.error(`Error fetching author data for ${authorId}:`, error)
        return { authorId, data: { userData: null, adminRole: null } }
      }
    })

    const results = await Promise.all(fetchPromises)

    // Build result map including cached data
    const resultMap = new Map()

    // Add newly fetched data
    results.forEach(({ authorId, data }) => {
      resultMap.set(authorId, data)
    })

    // Add cached data for IDs that were already cached
    authorIds.forEach(id => {
      if (!resultMap.has(id)) {
        const cached = cache.get(id)
        if (cached) {
          resultMap.set(id, cached.data)
        }
      }
    })

    return resultMap
  } catch (error) {
    console.error('Error in batch fetch:', error)
    return new Map()
  }
}

/**
 * Clear cache for a specific author
 * @param {string} authorId - User ID to clear cache for
 */
export const clearAuthorCache = (authorId) => {
  if (authorId) {
    cache.delete(authorId)
  }
}

/**
 * Clear all cached author data
 */
export const clearCache = () => {
  cache.clear()
}

/**
 * Get cache statistics (for debugging/monitoring)
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  const now = Date.now()
  let validEntries = 0
  let expiredEntries = 0

  cache.forEach((value) => {
    if ((now - value.timestamp) < CACHE_EXPIRY_MS) {
      validEntries++
    } else {
      expiredEntries++
    }
  })

  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries
  }
}

