import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  getDoc,
  updateDoc,
  deleteDoc, 
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft,
  FiDownload,
  FiCheck,
  FiX,
  FiSearch,
  FiFilter,
  FiMail,
  FiCalendar,
  FiUser
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminEventRegistrations.css'
import { exportRegistrationsToCSV } from '../../utils/exportToCSV'
import { exportRegistrationsToExcel } from '../../utils/exportToExcel'

const REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  WAITLIST: 'waitlist',
  CANCELLED: 'cancelled'
}

const AdminEventRegistrations = () => {
  const navigate = useNavigate()
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [checkedInFilter, setCheckedInFilter] = useState('all')

  useEffect(() => {
    // Get eventId from URL params or state
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('eventId')
    if (id) {
      setEventId(id)
      fetchEventAndRegistrations(id)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchEventAndRegistrations = async (id) => {
    if (!db || !id) {
      setLoading(false)
      return
    }

    try {
      // Fetch event
      const eventRef = doc(db, 'events', id)
      const eventSnap = await getDoc(eventRef)
      if (eventSnap.exists()) {
        const eventData = eventSnap.data()
        setEvent({
          id: eventSnap.id,
          ...eventData,
          date: eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date)
        })
      }

      // Fetch registrations
      const registrationsRef = collection(db, 'eventRegistrations')
      const q = query(
        registrationsRef,
        where('eventId', '==', id)
      )
      const querySnapshot = await getDocs(q)
      const registrationsData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        registrationsData.push({
          id: doc.id,
          ...data,
          registeredAt: data.registeredAt?.toDate ? data.registeredAt.toDate() : (data.registeredAt ? new Date(data.registeredAt) : null),
          checkInTime: data.checkInTime?.toDate ? data.checkInTime.toDate() : (data.checkInTime ? new Date(data.checkInTime) : null)
        })
      })
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
      alert('Error loading registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (registrationId, newStatus) => {
    if (!db) return

    try {
      await updateDoc(doc(db, 'eventRegistrations', registrationId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      fetchEventAndRegistrations(eventId)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating registration status')
    }
  }

  const handleCheckIn = async (registrationId, checkedIn) => {
    if (!db) return

    try {
      const updateData = {
        checkedIn: !checkedIn,
        updatedAt: new Date().toISOString()
      }
      if (!checkedIn) {
        updateData.checkInTime = new Date().toISOString()
      } else {
        updateData.checkInTime = null
      }
      await updateDoc(doc(db, 'eventRegistrations', registrationId), updateData)
      fetchEventAndRegistrations(eventId)
    } catch (error) {
      console.error('Error updating check-in:', error)
      alert('Error updating check-in status')
    }
  }

  const handleDelete = async (registrationId) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) return

    try {
      await deleteDoc(doc(db, 'eventRegistrations', registrationId))
      fetchEventAndRegistrations(eventId)
    } catch (error) {
      console.error('Error deleting registration:', error)
      alert('Error deleting registration')
    }
  }

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = !searchTerm || 
      reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
    const matchesCheckedIn = checkedInFilter === 'all' || 
      (checkedInFilter === 'checked-in' && reg.checkedIn) ||
      (checkedInFilter === 'not-checked-in' && !reg.checkedIn)
    
    return matchesSearch && matchesStatus && matchesCheckedIn
  })

  const handleExportCSV = () => {
    exportRegistrationsToCSV(filteredRegistrations, event?.title || 'event')
  }

  const handleExportExcel = () => {
    exportRegistrationsToExcel(filteredRegistrations, event?.title || 'event')
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case REGISTRATION_STATUS.CONFIRMED:
        return 'status-confirmed'
      case REGISTRATION_STATUS.WAITLIST:
        return 'status-waitlist'
      case REGISTRATION_STATUS.CANCELLED:
        return 'status-cancelled'
      default:
        return 'status-pending'
    }
  }

  if (loading) {
    return (
      <div className="admin-event-registrations">
        <div className="container">
          <div className="loading">Loading registrations...</div>
        </div>
      </div>
    )
  }

  if (!eventId || !event) {
    return (
      <div className="admin-event-registrations">
        <div className="container">
          <div className="error-message">
            <p>Event not found or no event ID provided.</p>
            <button onClick={() => navigate('/admin/events')} className="btn btn-primary">
              Go to Events
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-event-registrations">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin/events')} className="btn-back">
                <FiArrowLeft />
                Back to Events
              </button>
              <h1>Event Registrations</h1>
              <p className="event-title">{event.title}</p>
            </div>
            <div className="header-actions">
              <button onClick={handleExportCSV} className="btn btn-secondary">
                <FiDownload />
                Export CSV
              </button>
              <button onClick={handleExportExcel} className="btn btn-secondary">
                <FiDownload />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          <div className="filters-section">
            <div className="filter-group">
              <div className="search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="filter-group">
              <label>
                <FiFilter />
                Status:
              </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value={REGISTRATION_STATUS.CONFIRMED}>Confirmed</option>
                <option value={REGISTRATION_STATUS.PENDING}>Pending</option>
                <option value={REGISTRATION_STATUS.WAITLIST}>Waitlist</option>
                <option value={REGISTRATION_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>
            <div className="filter-group">
              <label>
                <FiFilter />
                Check-in:
              </label>
              <select value={checkedInFilter} onChange={(e) => setCheckedInFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
              </select>
            </div>
          </div>

          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{registrations.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confirmed:</span>
              <span className="stat-value">{registrations.filter(r => r.status === REGISTRATION_STATUS.CONFIRMED).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Waitlist:</span>
              <span className="stat-value">{registrations.filter(r => r.status === REGISTRATION_STATUS.WAITLIST).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Checked In:</span>
              <span className="stat-value">{registrations.filter(r => r.checkedIn).length}</span>
            </div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="empty-state">
              <p>No registrations found.</p>
            </div>
          ) : (
            <div className="registrations-table-wrapper">
              <table className="registrations-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Check-in</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map(reg => (
                    <tr key={reg.id}>
                      <td>
                        <div className="user-info">
                          <FiUser />
                          <span>{reg.userName || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="email-info">
                          <FiMail />
                          <span>{reg.userEmail || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          value={reg.status}
                          onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                          className={`status-select ${getStatusBadgeClass(reg.status)}`}
                        >
                          <option value={REGISTRATION_STATUS.PENDING}>Pending</option>
                          <option value={REGISTRATION_STATUS.CONFIRMED}>Confirmed</option>
                          <option value={REGISTRATION_STATUS.WAITLIST}>Waitlist</option>
                          <option value={REGISTRATION_STATUS.CANCELLED}>Cancelled</option>
                        </select>
                      </td>
                      <td>
                        {reg.registeredAt ? (
                          <div className="date-info">
                            <FiCalendar />
                            <span>{format(new Date(reg.registeredAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleCheckIn(reg.id, reg.checkedIn)}
                          className={`check-in-btn ${reg.checkedIn ? 'checked-in' : ''}`}
                          title={reg.checkedIn ? 'Mark as not checked in' : 'Mark as checked in'}
                        >
                          {reg.checkedIn ? <FiCheck /> : <FiX />}
                          {reg.checkedIn ? 'Checked In' : 'Check In'}
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleDelete(reg.id)}
                            className="btn-delete"
                            title="Delete registration"
                          >
                            <FiX />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminEventRegistrations

