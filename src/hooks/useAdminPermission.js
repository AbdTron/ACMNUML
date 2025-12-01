import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccessRoute, ROUTE_FEATURES } from '../utils/adminPermissions'

/**
 * Hook to check if admin has permission to access current route
 * Redirects to dashboard if no permission
 */
export const useAdminPermission = () => {
  const { currentUser, userRole, adminPermissions } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!currentUser || !userRole) {
      // Not logged in or not an admin - redirect handled by AuthContext
      return
    }

    // Check if admin can access this route
    const canAccess = canAccessRoute(userRole, adminPermissions, location.pathname)
    
    if (!canAccess) {
      // Redirect to dashboard with error message
      navigate('/admin', { 
        replace: true,
        state: { 
          error: 'You do not have permission to access this page.' 
        }
      })
    }
  }, [currentUser, userRole, adminPermissions, location.pathname, navigate])
}

