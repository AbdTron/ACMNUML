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
  FiMail
} from 'react-icons/fi'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useState, useEffect } from 'react'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    events: 0,
    notifications: 0,
    teamMembers: 0,
    galleryImages: 0,
    contacts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!db) {
        setLoading(false)
        return
      }
      try {
        const [eventsSnap, notificationsSnap, teamSnap, gallerySnap, contactsSnap] = await Promise.all([
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'notifications')),
          getDocs(collection(db, 'team')),
          getDocs(collection(db, 'gallery')),
          getDocs(collection(db, 'contacts'))
        ])

        setStats({
          events: eventsSnap.size,
          notifications: notificationsSnap.size,
          teamMembers: teamSnap.size,
          galleryImages: gallerySnap.size,
          contacts: contactsSnap.size
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const quickActions = [
    {
      icon: FiCalendar,
      title: 'Manage Events',
      description: 'Add, edit, or move events',
      link: '/admin/events',
      color: '#2563eb'
    },
    {
      icon: FiUsers,
      title: 'Team Profiles',
      description: 'Showcase and edit team members',
      link: '/admin/team',
      color: '#10b981'
    },
    {
      icon: FiBell,
      title: 'Notifications',
      description: 'Create and manage popup notifications',
      link: '/admin/notifications',
      color: '#7c3aed'
    },
    {
      icon: FiImage,
      title: 'Galleries',
      description: 'Manage photo galleries and images',
      link: '/admin/gallery',
      color: '#10b981'
    },
    {
      icon: FiSettings,
      title: 'Settings',
      description: 'Update form links and site details',
      link: '/admin/settings',
      color: '#f59e0b'
    },
  ]

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Welcome back, {currentUser?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <FiLogOut />
              Logout
            </button>
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
          </div>

          {/* Quick Actions */}
          <div className="section-title">
            <h2>Quick Actions</h2>
            <p>Manage your website content</p>
          </div>

          <div className="actions-grid">
            {quickActions.map((action, index) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

