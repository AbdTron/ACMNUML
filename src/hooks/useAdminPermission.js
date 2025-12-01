import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { isMainAdmin, ROLES } from '../utils/permissions'

/**
 * Hook to check if current admin has permission for a specific feature
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

      // Main admin always has all permissions
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
        // Get admin document to check permissions
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid))
        if (adminDoc.exists()) {
          const adminData = adminDoc.data()
          // Check if feature is enabled in permissions
          const permissions = adminData.permissions || {}
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

      // Main admin always has all permissions
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
        // Get admin document to check permissions
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid))
        if (adminDoc.exists()) {
          const adminData = adminDoc.data()
          setPermissions(adminData.permissions || {})
        } else {
          setPermissions({})
        }
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


