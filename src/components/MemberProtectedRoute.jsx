import { Navigate, useLocation } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'

/**
 * Protected route wrapper for member routes
 * - Redirects to login if not authenticated
 * - Redirects to onboarding if profile is incomplete
 * - Allows configured exceptions (like profile page for editing)
 */
const MemberProtectedRoute = ({ children, allowIncompleteProfile = false }) => {
    const { currentUser, userProfile, loading } = useMemberAuth()
    const location = useLocation()

    // Show nothing while loading auth state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh'
            }}>
                <div className="loading">Loading...</div>
            </div>
        )
    }

    // Not logged in -> redirect to login
    if (!currentUser) {
        return <Navigate to="/member/login" state={{ from: location }} replace />
    }

    // Profile incomplete and not allowed -> redirect to onboarding
    // Exception: allow access to profile page so users can complete their profile there too
    if (!allowIncompleteProfile && userProfile && !userProfile.profileComplete) {
        // Check if user has required academic fields
        const hasRequiredFields = userProfile.rollNumber &&
            userProfile.department &&
            userProfile.degree &&
            userProfile.semester &&
            userProfile.section &&
            userProfile.shift

        if (!hasRequiredFields) {
            return <Navigate to="/member/onboarding" replace />
        }
    }

    return children
}

export default MemberProtectedRoute
