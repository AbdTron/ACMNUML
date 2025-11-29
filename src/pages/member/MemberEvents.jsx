import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useMemberAuth } from '../../context/MemberAuthContext'
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiMapPin, 
  FiClock,
  FiCheckCircle,
  FiX,
  FiSearch,
  FiFilter,
  FiMaximize2
} from 'react-icons/fi'
import { format } from 'date-fns'
import { generateRegistrationQR } from '../../utils/qrCode'
import QRCodeGenerator from '../../components/QRCodeGenerator'
import './MemberEvents.css'

const MemberEvents = () => {
  const { currentUser } = useMemberAuth()
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showQRCode, setShowQRCode] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      navigate('/member/login')
      return
    }
    fetchRegistrations()
  }, [currentUser, navigate])

  const fetchRegistrations = async () => {
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
      
      const registrationsData = []
      for (const regDoc of registrationsSnap.docs) {
        const data = regDoc.data()
        try {
          // Fetch event details
          const eventRef = doc(db, 'events', data.eventId)
          const eventSnap = await getDoc(eventRef)
          if (eventSnap.exists()) {
            const eventData = eventSnap.data()
            registrationsData.push({
              id: regDoc.id,
              ...data,
              event: {
                id: eventSnap.id,
                ...eventData,
                date: eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date)
              },
              registeredAt: data.registeredAt?.toDate ? data.registeredAt.toDate() : (data.registeredAt ? new Date(data.registeredAt) : null)
            })
          }
        } catch (error) {
          console.error('Error fetching event:', error)
        }
      }

      // Sort by registeredAt descending (most recent first)
      registrationsData.sort((a, b) => {
        if (!a.registeredAt && !b.registeredAt) return 0
        if (!a.registeredAt) return 1
        if (!b.registeredAt) return -1
        return b.registeredAt.getTime() - a.registeredAt.getTime()
      })

      setRegistrations(registrationsData)
    } catch (error) {
      console.error('Error fetching registrations:', error)
      // Show error to user
      alert('Error loading your events. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return
    if (!db) return

    try {
      await updateDoc(doc(db, 'eventRegistrations', registrationId), {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      fetchRegistrations()
    } catch (error) {
      console.error('Error cancelling registration:', error)
      alert('Failed to cancel registration. Please try again.')
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

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = !searchTerm || 
      reg.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.event?.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="member-events-page">
        <div className="container">
          <div className="loading">Loading your events...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-events-page">
      <div className="container">
        <Link to="/member" className="back-link">
          <FiArrowLeft /> Back to Dashboard
        </Link>

        <div className="page-header">
          <h1>My Events</h1>
          <p>View and manage all your event registrations</p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="waitlist">Waitlist</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <FiCalendar />
            <h3>No registrations found</h3>
            <p>
              {registrations.length === 0
                ? "You haven't registered for any events yet."
                : "No registrations match your search criteria."}
            </p>
            {registrations.length === 0 && (
              <Link to="/events" className="btn btn-primary">
                Browse Events
              </Link>
            )}
          </div>
        ) : (
          <div className="registrations-grid">
            {filteredRegistrations.map((registration) => (
              <div key={registration.id} className="registration-card">
                <div className="registration-header">
                  <h3>{registration.event?.title || 'Event'}</h3>
                  <span className={`status-badge ${getStatusBadge(registration.status).class}`}>
                    {getStatusBadge(registration.status).label}
                  </span>
                </div>

                {registration.event && (
                  <div className="event-details">
                    {registration.event.date && (
                      <div className="detail-item">
                        <FiCalendar />
                        <span>{format(registration.event.date, 'EEEE, MMMM dd, yyyy')}</span>
                      </div>
                    )}
                    {registration.event.time && (
                      <div className="detail-item">
                        <FiClock />
                        <span>{registration.event.time}</span>
                      </div>
                    )}
                    {registration.event.location && (
                      <div className="detail-item">
                        <FiMapPin />
                        <span>{registration.event.location}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="registration-meta">
                  {registration.checkedIn && (
                    <div className="checked-in-badge">
                      <FiCheckCircle /> Checked In
                    </div>
                  )}
                  {registration.registeredAt && (
                    <p className="registered-date">
                      Registered: {format(registration.registeredAt, 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>

                <div className="registration-actions">
                  {registration.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        const qrData = generateRegistrationQR(
                          registration.eventId,
                          registration.id,
                          currentUser.uid
                        )
                        setShowQRCode({ registration, qrData })
                      }}
                      className="btn btn-primary event-register-btn"
                    >
                      <FiMaximize2 /> Show QR Code
                    </button>
                  )}
                  <Link 
                    to={`/events/${registration.eventId}`} 
                    className="btn btn-secondary event-view-btn"
                  >
                    View Details
                  </Link>
                  {registration.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelRegistration(registration.id)}
                      className="btn-icon btn-cancel"
                      title="Cancel Registration"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="qr-modal-overlay" onClick={() => setShowQRCode(null)}>
            <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="qr-modal-header">
                <h3>Your Check-in QR Code</h3>
                <button 
                  className="qr-modal-close"
                  onClick={() => setShowQRCode(null)}
                >
                  <FiX />
                </button>
              </div>
              <div className="qr-modal-body">
                <p className="qr-event-title">{showQRCode.registration.event?.title || 'Event'}</p>
                <p className="qr-instructions">Show this QR code at the event for check-in</p>
                <div className="qr-code-display">
                  <QRCodeGenerator data={showQRCode.qrData} size={250} />
                </div>
                <p className="qr-status">
                  Status: <span className={`status-badge ${getStatusBadge(showQRCode.registration.status).class}`}>
                    {getStatusBadge(showQRCode.registration.status).label}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemberEvents

