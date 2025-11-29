/**
 * Role-based permission system
 * Supports: member, admin, superadmin roles
 */

export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
}

/**
 * Check if user has a specific role
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean}
 */
export const hasRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false
  
  const roleHierarchy = {
    [ROLES.MEMBER]: 1,
    [ROLES.ADMIN]: 2,
    [ROLES.SUPERADMIN]: 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if user is admin or superadmin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN
}

/**
 * Check if user is superadmin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isSuperAdmin = (userRole) => {
  return userRole === ROLES.SUPERADMIN
}

/**
 * Check if user can perform an action
 * @param {string} userRole - User's role
 * @param {string} action - Action to check
 * @param {string} resourceOwnerId - Optional: ID of resource owner
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean}
 */
export const canPerformAction = (userRole, action, resourceOwnerId = null, currentUserId = null) => {
  // Superadmin can do everything
  if (isSuperAdmin(userRole)) return true
  
  // Admin can do most things
  if (isAdmin(userRole)) {
    // Admins can manage users (except superadmins)
    if (action === 'manage_users') return true
    // Admins can manage content
    if (action === 'manage_content') return true
    // Admins can view activity logs
    if (action === 'view_logs') return true
  }
  
  // Members can view their own data
  if (userRole === ROLES.MEMBER) {
    if (action === 'view_own_profile' && resourceOwnerId === currentUserId) return true
    if (action === 'edit_own_profile' && resourceOwnerId === currentUserId) return true
  }
  
  return false
}




