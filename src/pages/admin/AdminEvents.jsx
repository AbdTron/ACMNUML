import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
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
  FiX,
  FiUsers,
  FiCamera,
  FiClock
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminEvents.css'
import ImageUploader from '../../components/ImageUploader'
import { getCropBackgroundStyle } from '../../utils/cropStyles'
import { uploadToSupabase } from '../../config/supabase'
import FormBuilder from '../../components/FormBuilder'

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
    type: 'Workshop',
    sessions: '',
    coverUrl: '',
    coverFilePath: '',
    coverCrop: null,
    registerLink: '',
    additionalImages: [], // Array of image URLs
    registrationEnabled: false,
    capacity: ''
  })
  const [formConfig, setFormConfig] = useState({ fields: [], description: '' })
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [formTemplates, setFormTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  const createEventId = (title) => {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return slug || `event-${Date.now()}`
  }

  useEffect(() => {
    fetchEvents()
    fetchFormTemplates()
  }, [])

  const fetchFormTemplates = async () => {
    if (!db) return
    setLoadingTemplates(true)
    try {
      const templatesRef = collection(db, 'formTemplates')
      const q = query(templatesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const templatesData = []
      querySnapshot.forEach((doc) => {
        templatesData.push({
          id: doc.id,
          ...doc.data()
        })
      })
      setFormTemplates(templatesData)
    } catch (error) {
      console.error('Error fetching form templates:', error)
      // Try without orderBy if it fails
      try {
        const templatesRef = collection(db, 'formTemplates')
        const querySnapshot = await getDocs(templatesRef)
        const templatesData = []
        querySnapshot.forEach((doc) => {
          templatesData.push({
            id: doc.id,
            ...doc.data()
          })
        })
        setFormTemplates(templatesData)
      } catch (err) {
        console.error('Error fetching templates:', err)
      }
    } finally {
      setLoadingTemplates(false)
    }
  }

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
        const eventData = {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        }
        eventsData.push(eventData)
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
      // Ensure coverUrl is a string, and include crop data
      const coverUrl = typeof formData.coverUrl === 'string'
        ? formData.coverUrl
        : (formData.coverUrl?.url || formData.coverUrl || '')

      // Ensure coverCrop is properly structured
      let coverCropToSave = null
      if (formData.coverCrop) {
        // If it's already an object with x, y, width, height, use it directly
        if (typeof formData.coverCrop === 'object' && 'x' in formData.coverCrop && 'y' in formData.coverCrop) {
          coverCropToSave = formData.coverCrop
        } else if (formData.coverCrop.cover) {
          // If it's wrapped in { cover: ... }, extract it
          coverCropToSave = formData.coverCrop.cover
        }
      }

      const eventData = {
        ...formData,
        coverUrl: coverUrl,
        coverFilePath: formData.coverFilePath || '',
        coverCrop: coverCropToSave,
        date: Timestamp.fromDate(new Date(formData.date))
      }
      
      // Remove undefined values to avoid Firestore issues
      Object.keys(eventData).forEach(key => {
        if (eventData[key] === undefined) {
          delete eventData[key]
        }
      })

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), eventData)
        alert('Event updated successfully!')
      } else {
        const eventId = createEventId(formData.title)
        await setDoc(doc(db, 'events', eventId), eventData)
        alert('Event added successfully!')
      }

      setShowForm(false)
      setEditingEvent(null)
      // Save form configuration if registration is enabled
      if (formData.registrationEnabled && formConfig.fields.length > 0) {
        const eventId = editingEvent ? editingEvent.id : createEventId(formData.title)
        await setDoc(doc(db, 'eventForms', eventId), {
          ...formConfig,
          updatedAt: new Date().toISOString()
        })
      }
      
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        type: 'Workshop',
        sessions: '',
        coverUrl: '',
        coverFilePath: '',
        coverCrop: null,
        registerLink: '',
        additionalImages: [],
        registrationEnabled: false,
        capacity: ''
      })
      setFormConfig({ fields: [], description: '' })
      setShowFormBuilder(false)
      setSelectedTemplate('')
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Error saving event')
    }
  }

  const handleEdit = async (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title || '',
      description: event.description || '',
      date: format(new Date(event.date), 'yyyy-MM-dd'),
      time: event.time || '',
      location: event.location || '',
      type: event.type || 'Workshop',
      sessions: event.sessions || '',
      coverUrl: event.coverUrl || '',
      coverFilePath: event.coverFilePath || '',
      coverCrop: event.coverCrop || null,
      registerLink: event.registerLink || '',
      additionalImages: Array.isArray(event.additionalImages) ? event.additionalImages : [],
      registrationEnabled: event.registrationEnabled || false,
      capacity: event.capacity || ''
    })
    
    // Load form configuration if it exists
    if (event.id && db) {
      try {
        const formRef = doc(db, 'eventForms', event.id)
        const formSnap = await getDoc(formRef)
        if (formSnap.exists()) {
          setFormConfig(formSnap.data())
          setSelectedTemplate('') // Clear template selection when editing existing event
        } else {
          setFormConfig({ fields: [], description: '' })
          setSelectedTemplate('')
        }
      } catch (error) {
        console.error('Error loading form config:', error)
        setFormConfig({ fields: [], description: '' })
        setSelectedTemplate('')
      }
    }
    
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

  const handleAddAdditionalImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadToSupabase(file, 'events')
      if (result?.url) {
        setFormData({
          ...formData,
          additionalImages: [...(formData.additionalImages || []), result.url]
        })
      }
    } catch (error) {
      console.error('Error uploading additional image:', error)
      alert('Error uploading image')
    }
    // Reset input
    e.target.value = ''
  }

  const handleRemoveAdditionalImage = (index) => {
    const newImages = [...(formData.additionalImages || [])]
    newImages.splice(index, 1)
    setFormData({
      ...formData,
      additionalImages: newImages
    })
  }

  const handleMoveToPast = async (event) => {
    if (!window.confirm('Mark this event as finished and move it to past events?')) return

    try {
      // Set date to yesterday to move it to past events
      // This works for both upcoming and today's events
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(23, 59, 59, 999) // Set to end of yesterday
      
      await updateDoc(doc(db, 'events', event.id), {
        date: Timestamp.fromDate(yesterday)
      })
      alert('Event marked as finished and moved to past events!')
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
                type: 'Workshop',
                sessions: '',
                registrationEnabled: false,
                capacity: ''
              })
              setFormConfig({ fields: [], description: '' })
              setShowFormBuilder(false)
              setSelectedTemplate('')
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
                  <div className="form-group">
                    <label>Sessions</label>
                    <textarea
                      name="sessions"
                      value={formData.sessions}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="e.g., Session 1: 10:00 AM - 11:30 AM&#10;Session 2: 2:00 PM - 3:30 PM"
                    />
                    <small>Enter session details, one per line or separated by commas</small>
                  </div>
                <ImageUploader
                  label="Event Cover (Crop for card preview)"
                  folder="events"
                  value={{ url: formData.coverUrl, filePath: formData.coverFilePath, crops: formData.coverCrop ? { cover: formData.coverCrop } : null }}
                  onChange={(payload) => {
                    // Same pattern as AdminTeam - store original image URL and crop data
                    if (!payload || payload === '' || (typeof payload === 'object' && (!payload.url || payload.url === ''))) {
                      setFormData({ ...formData, coverUrl: '', coverFilePath: '', coverCrop: null })
                      return
                    }
                    if (typeof payload === 'string') {
                      setFormData({ ...formData, coverUrl: payload, coverFilePath: '', coverCrop: null })
                      return
                    }
                    if (typeof payload === 'object' && payload.url) {
                      const cropData = payload.crops?.cover || null
                      setFormData({ 
                        ...formData, 
                        coverUrl: payload.url,
                        coverFilePath: payload.filePath || payload.path || '',
                        coverCrop: cropData
                      })
                    }
                  }}
                  aspect={16 / 9}
                />
                  <div className="form-group">
                    <label>Additional Images (Displayed on event detail page)</label>
                    <div className="additional-images-manager">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddAdditionalImage}
                        style={{ display: 'none' }}
                        id="additional-image-upload"
                      />
                      <label htmlFor="additional-image-upload" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
                        <FiPlus /> Add Image
                      </label>
                      {formData.additionalImages && formData.additionalImages.length > 0 && (
                        <div className="additional-images-preview">
                          {formData.additionalImages.map((imgUrl, idx) => (
                            <div key={idx} className="additional-image-item">
                              <img src={imgUrl} alt={`Additional ${idx + 1}`} />
                              <button
                                type="button"
                                onClick={() => handleRemoveAdditionalImage(idx)}
                                className="remove-image-btn"
                                title="Remove image"
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <small>Upload additional images to display in a gallery on the event detail page</small>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.registrationEnabled}
                        onChange={(e) => {
                          setFormData({ ...formData, registrationEnabled: e.target.checked })
                          if (!e.target.checked) {
                            setFormConfig({ fields: [], description: '' })
                            setShowFormBuilder(false)
                            setSelectedTemplate('')
                          }
                        }}
                      />
                      Enable Built-in Registration Form
                    </label>
                    <small>Check this to use the form builder below instead of external link</small>
                  </div>

                  {formData.registrationEnabled && (
                    <>
                      <div className="form-group">
                        <label>Capacity (Optional)</label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          placeholder="e.g., 50"
                          min="1"
                        />
                        <small>Maximum number of attendees. Leave empty for unlimited.</small>
                      </div>

                      <div className="form-group">
                        <label>Use Form Template (Optional)</label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => {
                            const templateId = e.target.value
                            setSelectedTemplate(templateId)
                            if (templateId) {
                              const template = formTemplates.find(t => t.id === templateId)
                              if (template && template.formConfig) {
                                setFormConfig(template.formConfig)
                                setShowFormBuilder(true)
                              }
                            } else {
                              setFormConfig({ fields: [], description: '' })
                            }
                          }}
                          style={{ marginBottom: '0.5rem' }}
                        >
                          <option value="">Create New Form</option>
                          {formTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                        <small>
                          Select a template to use its form fields, or choose "Create New Form" to build from scratch.
                          {formTemplates.length === 0 && (
                            <span> No templates available. <a href="/admin/form-templates" target="_blank" style={{ color: 'var(--primary-color)' }}>Create one here</a>.</span>
                          )}
                        </small>
                      </div>

                      <div className="form-group">
                        <label>
                          <button
                            type="button"
                            onClick={() => setShowFormBuilder(!showFormBuilder)}
                            className="btn btn-secondary"
                          >
                            {showFormBuilder ? 'Hide' : 'Show'} Form Builder
                          </button>
                        </label>
                        {showFormBuilder && (
                          <div style={{ marginTop: '1rem' }}>
                            <FormBuilder
                              formConfig={formConfig}
                              onChange={(config) => {
                                setFormConfig(config)
                                setSelectedTemplate('') // Clear template selection when manually editing
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Registration Link (External - if not using built-in form)</label>
                    <input
                      type="url"
                      name="registerLink"
                      value={formData.registerLink}
                      onChange={handleInputChange}
                      placeholder="https://forms.gle/..."
                      disabled={formData.registrationEnabled}
                    />
                    <small>{formData.registrationEnabled ? 'Disabled when built-in registration is enabled' : 'Leave empty if using built-in registration form'}</small>
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
                    <th>Cover</th>
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
                          {event.coverUrl ? (
                            <div 
                              className="cover-thumb"
                              style={getCropBackgroundStyle(
                                typeof event.coverUrl === 'string' ? event.coverUrl : (event.coverUrl?.url || ''),
                                event.coverCrop
                              )}
                            />
                          ) : (
                            <span className="no-cover">No cover</span>
                          )}
                        </td>
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
                            {event.registrationEnabled && (
                              <>
                                <button
                                  onClick={() => navigate(`/admin/registrations?eventId=${event.id}`)}
                                  className="btn-icon"
                                  title="View Registrations"
                                >
                                  <FiUsers />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/checkin?eventId=${event.id}`)}
                                  className="btn-icon"
                                  title="Check-In"
                                >
                                  <FiCamera />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(event)}
                              className="btn-icon"
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            {(status === 'upcoming' || status === 'today') && (
                              <button
                                onClick={() => handleMoveToPast(event)}
                                className="btn-icon btn-move-past"
                                title="Mark as Finished & Move to Past"
                              >
                                <FiClock />
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

