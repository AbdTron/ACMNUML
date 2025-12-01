import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useMemberAuth } from '../../context/MemberAuthContext'
import { 
  FiCalendar, 
  FiUser, 
  FiLogOut, 
  FiSettings,
  FiAward,
  FiCheckCircle,
  FiClock,
  FiArrowRight
} from 'react-icons/fi'
import { format } from 'date-fns'
import './MemberDashboard.css'

const MemberDashboard = () => {
  const { currentUser, userProfile, logout } = useMemberAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    confirmedEvents: 0,
    waitlistEvents: 0,
    checkedInEvents: 0
  })
  const [recentRegistrations, setRecentRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      navigate('/member/login')
      return
    }
    
    // Check if profile is complete, if not redirect to onboarding
    if (userProfile && !userProfile.profileComplete) {
      navigate('/member/onboarding')
      return
    }
    
    // Check if profile is incomplete and redirect to onboarding
    if (userProfile && !userProfile.profileComplete) {
      // Check if user has required academic fields
      const hasRequiredFields = userProfile.rollNumber && 
                                userProfile.department && 
                                userProfile.degree && 
                                userProfile.semester && 
                                userProfile.section && 
                                userProfile.shift
      
      if (!hasRequiredFields) {
        navigate('/member/onboarding')
        return
      }
    }
    
    fetchDashboardData()
  }, [currentUser, userProfile, navigate])

  const fetchDashboardData = async () => {
    if (!db || !currentUser) {
      setLoading(false)
      return
    }

    try {
      // Fetch user's registrations
      const registrationsRef = collection(db, 'eventRegistrations')
      const userRegQuery = query(
        registrationsRef,
        where('userId', '==', currentUser.uid)
      )
      const registrationsSnap = await getDocs(userRegQuery)
      
      const registrations = []
      let confirmedCount = 0
      let waitlistCount = 0
      let checkedInCount = 0

      registrationsSnap.forEach((doc) => {
        const data = doc.data()
        const registration = {
          id: doc.id,
          ...data,
          registeredAt: data.registeredAt?.toDate ? data.registeredAt.toDate() : (data.registeredAt ? new Date(data.registeredAt) : null)
        }
        registrations.push(registration)
        
        if (data.status === 'confirmed') confirmedCount++
        if (data.status === 'waitlist') waitlistCount++
        if (data.checkedIn) checkedInCount++
      })

      // Sort by registeredAt descending (most recent first)
      registrations.sort((a, b) => {
        if (!a.registeredAt && !b.registeredAt) return 0
        if (!a.registeredAt) return 1
        if (!b.registeredAt) return -1
        return b.registeredAt.getTime() - a.registeredAt.getTime()
      })

      // Fetch event details for recent registrations
      const recentWithEvents = await Promise.all(
        registrations.slice(0, 5).map(async (reg) => {
          try {
            const eventRef = doc(db, 'events', reg.eventId)
            const eventSnap = await getDoc(eventRef)
            if (eventSnap.exists()) {
              const eventData = eventSnap.data()
              return {
                ...reg,
                event: {
                  id: eventSnap.id,
                  ...eventData,
                  date: eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date)
                }
              }
            }
            return reg
          } catch (error) {
            console.error('Error fetching event:', error)
            return reg
          }
        })
      )

      setStats({
        totalRegistrations: registrations.length,
        confirmedEvents: confirmedCount,
        waitlistEvents: waitlistCount,
        checkedInEvents: checkedInCount
      })
      setRecentRegistrations(recentWithEvents)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/member/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { label: 'Confirmed', class: 'status-confirmed' },
      waitlist: { label: 'Waitlist', class: 'status-waitlist' },
      pending: { label: 'Pending', class: 'status-pending' },
      cancelled: { label: 'Cancelled', class: 'status-cancelled' }
    }
    return badges[status] || { label: status, class: 'status-default' }
  }

  return (
    <div className="member-dashboard">
      <div className="member-header">
        <div className="container">
          <div className="member-header-content">
            <div>
              <h1>Member Dashboard</h1>
              <p>Welcome back, {userProfile?.name || currentUser?.displayName || currentUser?.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/member/profile" className="btn-icon-link">
                <FiSettings />
                Settings
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                <FiLogOut />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="member-content">
        <div className="container">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <FiCalendar style={{ color: '#2563eb' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.totalRegistrations}</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#d1fae5' }}>
                <FiCheckCircle style={{ color: '#10b981' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.confirmedEvents}</h3>
                <p>Confirmed Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <FiClock style={{ color: '#f59e0b' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.waitlistEvents}</h3>
                <p>Waitlist</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0e7ff' }}>
                <FiAward style={{ color: '#6366f1' }} />
              </div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.checkedInEvents}</h3>
                <p>Events Attended</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section-title">
            <h2>Quick Actions</h2>
            <p>Manage your account and events</p>
          </div>

          <div className="actions-grid">
            <Link to="/member/events" className="action-card">
              <div className="action-icon" style={{ background: '#2563eb15', color: '#2563eb' }}>
                <FiCalendar />
              </div>
              <h3>My Events</h3>
              <p>View all your event registrations</p>
            </Link>
            <Link to="/member/profile" className="action-card">
              <div className="action-icon" style={{ background: '#6366f115', color: '#6366f1' }}>
                <FiUser />
              </div>
              <h3>Edit Profile</h3>
              <p>Update your personal information</p>
            </Link>
            <Link to="/member/certificates" className="action-card">
              <div className="action-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
                <FiAward />
              </div>
              <h3>Certificates</h3>
              <p>View your event certificates</p>
            </Link>
          </div>

          {/* Recent Registrations */}
          {recentRegistrations.length > 0 && (
            <div className="recent-section">
              <div className="section-header">
                <h2>Recent Registrations</h2>
                <Link to="/member/events" className="view-all-link">
                  View All <FiArrowRight />
                </Link>
              </div>
              <div className="registrations-list">
                {recentRegistrations.map((registration) => (
                  <div key={registration.id} className="registration-card">
                    <div className="registration-info">
                      <h3>{registration.event?.title || 'Event'}</h3>
                      {registration.event?.date && (
                        <p className="event-date">
                          <FiCalendar />
                          {format(registration.event.date, 'MMM dd, yyyy')}
                        </p>
                      )}
                      <div className="registration-meta">
                        <span className={`status-badge ${getStatusBadge(registration.status).class}`}>
                          {getStatusBadge(registration.status).label}
                        </span>
                        {registration.checkedIn && (
                          <span className="checked-in-badge">
                            <FiCheckCircle /> Checked In
                          </span>
                        )}
                      </div>
                    </div>
                    <Link 
                      to={`/events/${registration.eventId}`} 
                      className="btn-view-event"
                    >
                      View Event
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberDashboard

