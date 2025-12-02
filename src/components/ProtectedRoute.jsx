import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAdmin, userRole } = useAuth()

  // If user is logged in but we're still checking admin status (userRole is null but currentUser exists)
  // Don't redirect immediately - wait a moment for the check to complete
  if (currentUser && userRole === null) {
    // Still loading admin status - show nothing or a minimal loading state
    // This prevents flashing the login page when user is actually an admin
    return null
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default ProtectedRoute

