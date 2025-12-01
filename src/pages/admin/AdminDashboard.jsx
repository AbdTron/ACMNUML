import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FiCalendar, 
  FiBell, 
  FiSettings, 
  FiLogOut, 
  FiUsers,
  FiImage,
  FiMail,
  FiRefreshCw,
  FiFileText,
  FiUserCheck,
  FiMessageSquare,
  FiMessageCircle,
  FiShield,
  FiEdit3
} from 'react-icons/fi'
import { isMainAdmin, ROLES } from '../../utils/permissions'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useState, useEffect } from 'react'
import { useAdminPermissions } from '../../hooks/useAdminPermission'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { currentUser, logout, userRole } = useAuth()
  const navigate = useNavigate()
  const { permissions, loading: permissionsLoading } = useAdminPermissions()
  const [stats, setStats] = useState({
    events: 0,
    notifications: 0,
    teamMembers: 0,
    galleryImages: 0,
    contacts: 0,
    users: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

    const fetchStats = async () => {
      if (!db) {
        setLoading(false)
        return
      }
      try {
      const [eventsSnap, notificationsSnap, teamSnap, gallerySnap, contactsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'notifications')),
          getDocs(collection(db, 'team')),
          getDocs(collection(db, 'gallery')),
        getDocs(collection(db, 'contacts')),
        getDocs(collection(db, 'users'))
        ])

        setStats({
          events: eventsSnap.size,
          notifications: notificationsSnap.size,
          teamMembers: teamSnap.size,
          galleryImages: gallerySnap.size,
        contacts: contactsSnap.size,
        users: usersSnap.size
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      // Show more specific error message
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please make sure you are logged in as an admin and that Firestore rules are deployed.')
      } else {
        alert(`Error loading statistics: ${error.message}. Please refresh the page.`)
      }
      } finally {
        setLoading(false)
      setRefreshing(false)
      }
    }

  useEffect(() => {
    fetchStats()
    
    // Show error message if redirected from protected route
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    if (error) {
      alert(error)
      // Remove error from URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Define all possible actions with their feature IDs
  const allActions = [
    {
      icon: FiCalendar,
      title: 'Manage Events',
      description: 'Add, edit, or move events',
      link: '/admin/events',
      color: '#2563eb',
      featureId: 'manageEvents'
    },
    {
      icon: FiUsers,
      title: 'Team Profiles',
      description: 'Showcase and edit team members',
      link: '/admin/team',
      color: '#10b981',
      featureId: 'teamProfiles'
    },
    {
      icon: FiBell,
      title: 'Notifications',
      description: 'Create and manage popup notifications',
      link: '/admin/notifications',
      color: '#7c3aed',
      featureId: 'notifications'
    },
    {
      icon: FiImage,
      title: 'Galleries',
      description: 'Manage photo galleries and images',
      link: '/admin/gallery',
      color: '#10b981',
      featureId: 'galleries'
    },
    {
      icon: FiSettings,
      title: 'Settings',
      description: 'Update form links and site details',
      link: '/admin/settings',
      color: '#f59e0b',
      featureId: 'settings'
    },
    {
      icon: FiUsers,
      title: 'User Management',
      description: 'Manage member accounts and permissions',
      link: '/admin/users',
      color: '#6366f1',
      featureId: 'userManagement'
    },
    {
      icon: FiFileText,
      title: 'Form Templates',
      description: 'Create and manage reusable form templates',
      link: '/admin/form-templates',
      color: '#8b5cf6',
      featureId: 'formTemplates'
    },
    {
      icon: FiUserCheck,
      title: 'User Requests',
      description: 'Review profile change requests',
      link: '/admin/user-requests',
      color: '#f97316',
      featureId: 'userRequests'
    },
    {
      icon: FiMessageSquare,
      title: 'Feedback',
      description: 'View and manage user feedback',
      link: '/admin/feedback',
      color: '#14b8a6',
      featureId: 'feedback'
    },
    {
      icon: FiMessageCircle,
      title: 'Forum Moderation',
      description: 'Moderate forum posts and discussions',
      link: '/admin/forum',
      color: '#8b5cf6',
      featureId: 'forumModeration'
    },
    {
      icon: FiEdit3,
      title: 'Default Post',
      description: 'Manage the default post shown when no events are available',
      link: '/admin/default-post',
      color: '#ec4899',
      featureId: 'settings' // Use settings permission since it's a general site setting
    },
  ]

  // Filter actions based on permissions (main admin sees all)
  const quickActions = allActions.filter(action => {
    if (isMainAdmin(userRole)) {
      return true // Main admin sees all
    }
    // Check if admin has permission for this feature
    return permissions[action.featureId] === true
  })

  // Add Admin Permissions card only for super admin
  if (currentUser && isMainAdmin(userRole)) {
    quickActions.push({
      icon: FiShield,
      title: 'Admin Permissions',
      description: 'Manage admin feature access and permissions',
      link: '/admin/permissions',
      color: '#dc2626',
      featureId: 'adminPermissions' // Special feature, only for main admin
    })
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Welcome back, {currentUser?.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={handleRefresh} 
                className="btn-refresh"
                disabled={refreshing}
                title="Refresh statistics"
              >
                <FiRefreshCw style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            <button onClick={handleLogout} className="btn-logout">
              <FiLogOut />
              Logout
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <FiCalendar style={{ color: '#2563eb' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.events}</h3>
                <p>Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f3e8ff' }}>
                <FiBell style={{ color: '#7c3aed' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.notifications}</h3>
                <p>Notifications</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <FiUsers style={{ color: '#f59e0b' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.teamMembers}</h3>
                <p>Team Members</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#d1fae5' }}>
                <FiImage style={{ color: '#059669' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.galleryImages}</h3>
                <p>Gallery Images</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2' }}>
                <FiMail style={{ color: '#dc2626' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.contacts}</h3>
                <p>Contact Messages</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0e7ff' }}>
                <FiUsers style={{ color: '#6366f1' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.users}</h3>
                <p>Total Users</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section-title">
            <h2>Quick Actions</h2>
            <p>Manage your website content</p>
          </div>

          {permissionsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading permissions...</div>
          ) : (
            <div className="actions-grid">
              {quickActions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                  <p>No actions available. Contact Super Admin to grant permissions.</p>
                </div>
              ) : (
                quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link key={index} to={action.link} className="action-card">
                      <div className="action-icon" style={{ background: `${action.color}15`, color: action.color }}>
                        <Icon />
                      </div>
                      <h3>{action.title}</h3>
                      <p>{action.description}</p>
                    </Link>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

