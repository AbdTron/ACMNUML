/**
 * Role-based permission system
 * Supports: user, admin, mainadmin roles
 * Note: "Member" is for ACM Society role (handled by acmRole field), not user role
 */

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MAIN_ADMIN: 'mainadmin'
}

/**
 * Check if user is the main admin
 * @param {string} role - User's role from admins collection
 * @returns {boolean}
 */
export const isMainAdmin = (role) => {
  return role === ROLES.MAIN_ADMIN
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
    [ROLES.USER]: 1,
    [ROLES.ADMIN]: 2,
    [ROLES.MAIN_ADMIN]: 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if user is admin or main admin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN || userRole === ROLES.MAIN_ADMIN
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
  // Main admin can do everything
  if (isMainAdmin(userRole)) return true
  
  // Admin can do most things
  if (isAdmin(userRole)) {
    // Admins can manage users
    if (action === 'manage_users') return true
    // Admins can manage content
    if (action === 'manage_content') return true
    // Admins can view activity logs
    if (action === 'view_logs') return true
  }
  
  // Users can view their own data
  if (userRole === ROLES.USER) {
    if (action === 'view_own_profile' && resourceOwnerId === currentUserId) return true
    if (action === 'edit_own_profile' && resourceOwnerId === currentUserId) return true
  }
  
  return false
}





