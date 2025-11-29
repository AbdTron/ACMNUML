import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  getDoc,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft,
  FiCheck,
  FiX,
  FiSearch,
  FiCamera
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminCheckIn.css'
import QRCodeScanner from '../../components/QRCodeScanner'
import { parseQRData } from '../../utils/qrCode'

const AdminCheckIn = () => {
  const navigate = useNavigate()
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    // Get eventId from URL params
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
      setRegistrations(registrationsData)
    } catch (error) {
      console.error('Error fetching registrations:', error)
      alert('Error loading registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = async (qrData) => {
    if (!db || !eventId) return

    try {
      const parsedData = parseQRData(qrData)
      if (!parsedData || parsedData.eventId !== eventId) {
        setMessage({ type: 'error', text: 'Invalid QR code for this event' })
        setTimeout(() => setMessage(null), 3000)
        return
      }

      const registrationId = parsedData.registrationId
      const registration = registrations.find(r => r.id === registrationId)
      
      if (!registration) {
        setMessage({ type: 'error', text: 'Registration not found' })
        setTimeout(() => setMessage(null), 3000)
        return
      }

      if (registration.checkedIn) {
        setMessage({ type: 'warning', text: 'Already checked in' })
        setTimeout(() => setMessage(null), 3000)
        return
      }

      // Check in
      await updateDoc(doc(db, 'eventRegistrations', registrationId), {
        checkedIn: true,
        checkInTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      setMessage({ 
        type: 'success', 
        text: `${registration.userName || 'User'} checked in successfully!` 
      })
      setTimeout(() => setMessage(null), 3000)
      
      setShowScanner(false)
      fetchEventAndRegistrations(eventId)
    } catch (error) {
      console.error('Error processing check-in:', error)
      setMessage({ type: 'error', text: 'Error processing check-in' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleManualCheckIn = async (registrationId) => {
    if (!db) return

    try {
      const registration = registrations.find(r => r.id === registrationId)
      if (registration.checkedIn) {
        alert('Already checked in')
        return
      }

      await updateDoc(doc(db, 'eventRegistrations', registrationId), {
        checkedIn: true,
        checkInTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      setMessage({ 
        type: 'success', 
        text: `${registration.userName || 'User'} checked in successfully!` 
      })
      setTimeout(() => setMessage(null), 3000)
      
      fetchEventAndRegistrations(eventId)
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Error checking in user')
    }
  }

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchTerm) return true
    return (
      reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="admin-checkin">
        <div className="container">
          <div className="loading">Loading check-in page...</div>
        </div>
      </div>
    )
  }

  if (!eventId || !event) {
    return (
      <div className="admin-checkin">
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
    <div className="admin-checkin">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin/events')} className="btn-back">
                <FiArrowLeft />
                Back to Events
              </button>
              <h1>Event Check-In</h1>
              <p className="event-title">{event.title}</p>
            </div>
            <button onClick={() => setShowScanner(true)} className="btn btn-primary">
              <FiCamera />
              Scan QR Code
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="checkin-stats">
            <div className="stat-card">
              <div className="stat-value">{registrations.length}</div>
              <div className="stat-label">Total Registered</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{registrations.filter(r => r.checkedIn).length}</div>
              <div className="stat-label">Checked In</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {registrations.length > 0 
                  ? Math.round((registrations.filter(r => r.checkedIn).length / registrations.length) * 100)
                  : 0}%
              </div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>

          <div className="search-section">
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

          <div className="checkin-list">
            {filteredRegistrations.length === 0 ? (
              <div className="empty-state">
                <p>No registrations found.</p>
              </div>
            ) : (
              filteredRegistrations.map(reg => (
                <div key={reg.id} className={`checkin-item ${reg.checkedIn ? 'checked-in' : ''}`}>
                  <div className="checkin-info">
                    <div className="checkin-name">{reg.userName || 'N/A'}</div>
                    <div className="checkin-email">{reg.userEmail || 'N/A'}</div>
                    {reg.checkInTime && (
                      <div className="checkin-time">
                        Checked in: {format(new Date(reg.checkInTime), 'MMM dd, yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                  <div className="checkin-actions">
                    {reg.checkedIn ? (
                      <div className="checked-in-badge">
                        <FiCheck />
                        Checked In
                      </div>
                    ) : (
                      <button
                        onClick={() => handleManualCheckIn(reg.id)}
                        className="btn btn-primary btn-sm"
                      >
                        <FiCheck />
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showScanner && (
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}

export default AdminCheckIn

