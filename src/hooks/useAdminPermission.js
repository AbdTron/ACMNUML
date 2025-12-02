import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { isMainAdmin, ROLES } from '../utils/permissions'

/**
 * In-memory cache for admin permissions
 * Key: userId, Value: { permissions: Object, timestamp: number }
 */
const permissionsCache = new Map()

// Cache expiration time: 5 minutes
const CACHE_EXPIRY_MS = 5 * 60 * 1000

/**
 * Get cached admin permissions or fetch from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Admin permissions object or null
 */
const getCachedAdminPermissions = async (userId) => {
  if (!userId || !db) {
    return null
  }

  // Check cache first
  const cached = permissionsCache.get(userId)
  const now = Date.now()

  // Return cached data if it exists and hasn't expired
  if (cached && (now - cached.timestamp) < CACHE_EXPIRY_MS) {
    return cached.permissions
  }

  // Fetch from Firestore
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId))
    if (adminDoc.exists()) {
      const adminData = adminDoc.data()
      const permissions = adminData.permissions || {}

      // Store in cache
      permissionsCache.set(userId, {
        permissions,
        timestamp: now
      })

      return permissions
    }
    return null
  } catch (error) {
    console.error('Error fetching admin permissions:', error)
    return null
  }
}

/**
 * Clear permissions cache for a user (useful when permissions are updated)
 * @param {string} userId - User ID to clear cache for
 */
export const clearAdminPermissionsCache = (userId) => {
  if (userId) {
    permissionsCache.delete(userId)
  }
}

/**
 * Clear all permissions cache
 */
export const clearAllAdminPermissionsCache = () => {
  permissionsCache.clear()
}

/**
 * Hook to check if current admin has permission for a specific feature
 * Uses in-memory caching to avoid repeated Firestore reads when navigating admin pages
 * @param {string} featureId - Feature ID to check (e.g., 'manageEvents', 'userRequests')
 * @returns {Object} { hasPermission: boolean, loading: boolean }
 */
export const useAdminPermission = (featureId) => {
  const { currentUser, userRole } = useAuth()
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPermission = async () => {
      if (!currentUser || !db) {
        setHasPermission(false)
        setLoading(false)
        return
      }

      // Super admin always has all permissions
      if (isMainAdmin(userRole)) {
        setHasPermission(true)
        setLoading(false)
        return
      }

      // Check if user is admin
      if (userRole !== ROLES.ADMIN) {
        setHasPermission(false)
        setLoading(false)
        return
      }

      try {
        // Get admin permissions from cache (or fetch if not cached)
        const permissions = await getCachedAdminPermissions(currentUser.uid)
        if (permissions) {
          // Check if feature is enabled in permissions
          setHasPermission(permissions[featureId] === true)
        } else {
          setHasPermission(false)
        }
      } catch (error) {
        console.error('Error checking admin permission:', error)
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [currentUser, userRole, featureId])

  return { hasPermission, loading }
}

/**
 * Hook to get all admin permissions at once
 * Uses in-memory caching to avoid repeated Firestore reads
 * @returns {Object} { permissions: Object, loading: boolean }
 */
export const useAdminPermissions = () => {
  const { currentUser, userRole } = useAuth()
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!currentUser || !db) {
        setPermissions({})
        setLoading(false)
        return
      }

      // Super admin always has all permissions
      if (isMainAdmin(userRole)) {
        // Return all features as true for main admin
        const allFeatures = [
          'manageEvents',
          'teamProfiles',
          'notifications',
          'galleries',
          'settings',
          'userManagement',
          'formTemplates',
          'userRequests',
          'feedback',
          'forumModeration'
        ]
        const allPermissions = allFeatures.reduce((acc, feature) => {
          acc[feature] = true
          return acc
        }, {})
        setPermissions(allPermissions)
        setLoading(false)
        return
      }

      // Check if user is admin
      if (userRole !== ROLES.ADMIN) {
        setPermissions({})
        setLoading(false)
        return
      }

      try {
        // Get admin permissions from cache (or fetch if not cached)
        const cachedPermissions = await getCachedAdminPermissions(currentUser.uid)
        setPermissions(cachedPermissions || {})
      } catch (error) {
        console.error('Error fetching admin permissions:', error)
        setPermissions({})
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [currentUser, userRole])

  return { permissions, loading }
}


