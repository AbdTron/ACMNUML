/**
 * Admin permission checking utilities
 * Main Admin always has all permissions
 */

import { isMainAdmin, MAIN_ADMIN_EMAIL } from './permissions'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Check if current admin has permission for a specific feature
 * @param {string} currentUserEmail - Current admin's email
 * @param {string} currentUserId - Current admin's user ID
 * @param {string} featureId - Feature ID to check (e.g., 'manageEvents', 'userManagement')
 * @returns {Promise<boolean>} - True if admin has permission
 */
export const hasAdminPermission = async (currentUserEmail, currentUserId, featureId) => {
  // Main admin always has all permissions
  if (isMainAdmin(currentUserEmail)) {
    return true
  }

  if (!db || !currentUserId) {
    return false
  }

  try {
    // Get admin document from admins collection
    const adminDoc = await getDoc(doc(db, 'admins', currentUserId))
    if (!adminDoc.exists()) {
      return false
    }

    const adminData = adminDoc.data()
    const permissions = adminData.permissions || {}

    // Check if feature is enabled for this admin
    return permissions[featureId] === true
  } catch (error) {
    console.error('Error checking admin permission:', error)
    return false
  }
}

/**
 * Feature IDs mapping
 */
export const ADMIN_FEATURES = {
  MANAGE_EVENTS: 'manageEvents',
  TEAM_PROFILES: 'teamProfiles',
  NOTIFICATIONS: 'notifications',
  GALLERIES: 'galleries',
  SETTINGS: 'settings',
  USER_MANAGEMENT: 'userManagement',
  FORM_TEMPLATES: 'formTemplates',
  USER_REQUESTS: 'userRequests',
  FEEDBACK: 'feedback',
  FORUM_MODERATION: 'forumModeration'
}


