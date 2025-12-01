/**
 * Utility functions for checking admin feature permissions
 */

import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { ROLES } from './permissions'

/**
 * Feature ID to route mapping
 */
export const FEATURE_ROUTES = {
  manageEvents: '/admin/events',
  teamProfiles: '/admin/team',
  notifications: '/admin/notifications',
  galleries: '/admin/gallery',
  settings: '/admin/settings',
  userManagement: '/admin/users',
  formTemplates: '/admin/form-templates',
  userRequests: '/admin/user-requests',
  feedback: '/admin/feedback',
  forumModeration: '/admin/forum',
  adminPermissions: '/admin/permissions' // Only for main admin
}

/**
 * Route to feature ID mapping (reverse lookup)
 */
export const ROUTE_FEATURES = {
  '/admin/events': 'manageEvents',
  '/admin/team': 'teamProfiles',
  '/admin/notifications': 'notifications',
  '/admin/gallery': 'galleries',
  '/admin/settings': 'settings',
  '/admin/users': 'userManagement',
  '/admin/form-templates': 'formTemplates',
  '/admin/user-requests': 'userRequests',
  '/admin/feedback': 'feedback',
  '/admin/forum': 'forumModeration',
  '/admin/permissions': 'adminPermissions'
}

/**
 * Check if admin has permission for a specific feature
 * @param {string} adminRole - Admin's role (from admins collection)
 * @param {Object} adminPermissions - Admin's permissions object from admins collection
 * @param {string} featureId - Feature ID to check
 * @returns {boolean} True if admin has permission
 */
export const hasFeaturePermission = (adminRole, adminPermissions, featureId) => {
  // Main admin always has all permissions
  if (adminRole === ROLES.MAIN_ADMIN) {
    return true
  }
  
  // Check if feature is enabled in permissions
  // If permissions object doesn't exist or feature is not explicitly set, default to false
  if (!adminPermissions || typeof adminPermissions !== 'object') {
    return false
  }
  
  return adminPermissions[featureId] === true
}

/**
 * Get admin permissions from Firestore
 * @param {string} adminId - Admin's user ID
 * @returns {Promise<Object>} Admin permissions object
 */
export const getAdminPermissions = async (adminId) => {
  if (!db || !adminId) {
    return null
  }
  
  try {
    const adminDoc = await getDoc(doc(db, 'admins', adminId))
    if (adminDoc.exists()) {
      const adminData = adminDoc.data()
      return {
        role: adminData.role || ROLES.ADMIN,
        permissions: adminData.permissions || {}
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching admin permissions:', error)
    return null
  }
}

/**
 * Check if admin can access a route
 * @param {string} adminRole - Admin's role
 * @param {Object} adminPermissions - Admin's permissions object
 * @param {string} route - Route path to check
 * @returns {boolean} True if admin can access the route
 */
export const canAccessRoute = (adminRole, adminPermissions, route) => {
  // Main admin can access everything
  if (adminRole === ROLES.MAIN_ADMIN) {
    return true
  }
  
  // Get feature ID from route
  const featureId = ROUTE_FEATURES[route]
  if (!featureId) {
    // Unknown route - allow access (for backward compatibility)
    return true
  }
  
  // Admin Permissions page is only for main admin
  if (featureId === 'adminPermissions') {
    return false
  }
  
  return hasFeaturePermission(adminRole, adminPermissions, featureId)
}
