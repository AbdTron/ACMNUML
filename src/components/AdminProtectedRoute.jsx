import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdminPermission } from '../hooks/useAdminPermission'
import { isMainAdmin } from '../utils/permissions'

/**
 * Route protection component that checks admin permissions for specific features
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.featureId - Feature ID required to access this route
 */
const AdminProtectedRoute = ({ children, featureId }) => {
  const { currentUser, isAdmin, userRole } = useAuth()
  const { hasPermission, loading } = useAdminPermission(featureId)

  // If user is logged in but we're still checking admin status (userRole is null but currentUser exists)
  // Wait for the check to complete before making decisions
  if (currentUser && userRole === null) {
    // Still loading admin status - show nothing (prevents flashing login page)
    return null
  }

  // First check if user is logged in and is an admin
  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  // If loading permissions, show nothing (or a loading spinner)
  if (loading) {
    return null
  }

  // Super admin always has access
  if (isMainAdmin(userRole)) {
    return children
  }

  // Check if admin has permission for this feature
  if (!hasPermission) {
    // Redirect to dashboard with error message in URL
    return <Navigate to="/admin?error=You do not have permission to access this page." replace />
  }

  return children
}

export default AdminProtectedRoute

