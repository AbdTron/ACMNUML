import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Activity logging system
 * Logs user actions for audit trail
 */

export const ACTIVITY_TYPES = {
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  PROFILE_UPDATED: 'profile_updated',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PERMISSION_CHANGED: 'permission_changed',
  ROLE_CHANGED: 'role_changed'
}

/**
 * Log an activity
 * @param {string} userId - User ID who performed the action
 * @param {string} activityType - Type of activity (from ACTIVITY_TYPES)
 * @param {string} description - Human-readable description
 * @param {object} metadata - Additional metadata (optional)
 * @returns {Promise<void>}
 */
export const logActivity = async (userId, activityType, description, metadata = {}) => {
  if (!db) {
    console.warn('Firestore not initialized, activity not logged')
    return
  }
  
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      activityType,
      description,
      metadata,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Log user creation
 * @param {string} userId - New user's ID
 * @param {string} email - User's email
 * @param {string} role - User's role
 * @param {string} createdBy - ID of user who created this account
 * @returns {Promise<void>}
 */
export const logUserCreated = async (userId, email, role, createdBy = null) => {
  return logActivity(
    createdBy || userId,
    ACTIVITY_TYPES.USER_CREATED,
    `User account created: ${email} (${role})`,
    { userId, email, role }
  )
}

/**
 * Log user update
 * @param {string} userId - User ID being updated
 * @param {string} updatedBy - ID of user performing the update
 * @param {object} changes - Object describing what changed
 * @returns {Promise<void>}
 */
export const logUserUpdated = async (userId, updatedBy, changes) => {
  return logActivity(
    updatedBy,
    ACTIVITY_TYPES.USER_UPDATED,
    `User profile updated: ${userId}`,
    { userId, changes }
  )
}

/**
 * Log role change
 * @param {string} userId - User ID whose role changed
 * @param {string} oldRole - Previous role
 * @param {string} newRole - New role
 * @param {string} changedBy - ID of user who made the change
 * @returns {Promise<void>}
 */
export const logRoleChanged = async (userId, oldRole, newRole, changedBy) => {
  return logActivity(
    changedBy,
    ACTIVITY_TYPES.ROLE_CHANGED,
    `Role changed from ${oldRole} to ${newRole}`,
    { userId, oldRole, newRole }
  )
}

/**
 * Log login
 * @param {string} userId - User ID who logged in
 * @param {string} method - Login method (email, google, etc.)
 * @returns {Promise<void>}
 */
export const logLogin = async (userId, method = 'email') => {
  return logActivity(
    userId,
    ACTIVITY_TYPES.LOGIN,
    `User logged in via ${method}`,
    { method }
  )
}



