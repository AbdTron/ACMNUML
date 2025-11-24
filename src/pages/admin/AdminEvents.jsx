import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCalendar,
  FiArrowLeft,
  FiCheck,
  FiX
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminEvents.css'

const AdminEvents = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'Workshop'
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const eventsRef = collection(db, 'events')
      const q = query(eventsRef, orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      const eventsData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        eventsData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        })
      })
      setEvents(eventsData)
    } catch (error) {
      console.error('Error fetching events:', error)
      alert('Error loading events')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const eventData = {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date))
      }

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), eventData)
        alert('Event updated successfully!')
      } else {
        await addDoc(collection(db, 'events'), eventData)
        alert('Event added successfully!')
      }

      setShowForm(false)
      setEditingEvent(null)
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        type: 'Workshop'
      })
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Error saving event')
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title || '',
      description: event.description || '',
      date: format(new Date(event.date), 'yyyy-MM-dd'),
      time: event.time || '',
      location: event.location || '',
      type: event.type || 'Workshop'
    })
    setShowForm(true)
  }

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return

    try {
      await deleteDoc(doc(db, 'events', eventId))
      alert('Event deleted successfully!')
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Error deleting event')
    }
  }

  const handleMoveToPast = async (event) => {
    if (!window.confirm('Move this event to past events?')) return

    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      await updateDoc(doc(db, 'events', event.id), {
        date: Timestamp.fromDate(yesterday)
      })
      alert('Event moved to past events!')
      fetchEvents()
    } catch (error) {
      console.error('Error moving event:', error)
      alert('Error moving event')
    }
  }

  const getEventStatus = (eventDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(eventDate)
    date.setHours(0, 0, 0, 0)
    
    if (date < today) return 'past'
    if (date.getTime() === today.getTime()) return 'today'
    return 'upcoming'
  }

  return (
    <div className="admin-events">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin')} className="btn-back">
                <FiArrowLeft />
                Back to Dashboard
              </button>
              <h1>Manage Events</h1>
            </div>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <FiPlus />
              Add Event
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {showForm && (
            <div className="modal-overlay" onClick={() => {
              setShowForm(false)
              setEditingEvent(null)
              setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                type: 'Workshop'
              })
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowForm(false)
                      setEditingEvent(null)
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="event-form">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Event title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      placeholder="Event description"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Time</label>
                      <input
                        type="text"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        placeholder="e.g., 10:00 AM - 2:00 PM"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Event location"
                      />
                    </div>
                    <div className="form-group">
                      <label>Type *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Workshop">Workshop</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Talk">Talk</option>
                        <option value="Visit">Visit</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => {
                      setShowForm(false)
                      setEditingEvent(null)
                    }} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <FiCheck />
                      {editingEvent ? 'Update' : 'Create'} Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading events...</div>
          ) : (
            <div className="events-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const status = getEventStatus(event.date)
                    return (
                      <tr key={event.id}>
                        <td>
                          <strong>{event.title}</strong>
                          <br />
                          <small>{event.description?.substring(0, 50)}...</small>
                        </td>
                        <td>
                          <FiCalendar />
                          {format(new Date(event.date), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <span className="type-badge">{event.type}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${status}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(event)}
                              className="btn-icon"
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            {status === 'upcoming' && (
                              <button
                                onClick={() => handleMoveToPast(event)}
                                className="btn-icon"
                                title="Move to Past"
                              >
                                Move to Past
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="btn-icon btn-danger"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {events.length === 0 && (
                <div className="empty-state">
                  <p>No events found. Add your first event!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminEvents

