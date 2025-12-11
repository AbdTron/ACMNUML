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
import { useNavigate } from 'react-router-dom'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiToggleLeft,
  FiToggleRight
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminNotifications.css'

const AdminNotifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNotification, setEditingNotification] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: '',
    buttons: [],
    active: true,
    persistent: false
  })
  const [buttonText, setButtonText] = useState('')
  const [buttonUrl, setButtonUrl] = useState('')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const notificationsRef = collection(db, 'notifications')
      const q = query(notificationsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const notificationsData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        notificationsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        })
      })
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      alert('Error loading notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleAddButton = () => {
    if (buttonText.trim() && buttonUrl.trim()) {
      setFormData({
        ...formData,
        buttons: [...(formData.buttons || []), { text: buttonText.trim(), url: buttonUrl.trim() }]
      })
      setButtonText('')
      setButtonUrl('')
    }
  }

  const handleRemoveButton = (index) => {
    setFormData({
      ...formData,
      buttons: (formData.buttons || []).filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const notificationData = {
        ...formData,
        buttons: Array.isArray(formData.buttons) ? formData.buttons : [],
        createdAt: editingNotification ? editingNotification.createdAt : Timestamp.now(),
        reactivationToken: editingNotification?.reactivationToken ?? Date.now()
      }

      if (editingNotification) {
        await updateDoc(doc(db, 'notifications', editingNotification.id), notificationData)
        alert('Notification updated successfully!')
      } else {
        await addDoc(collection(db, 'notifications'), notificationData)
        alert('Notification created successfully!')
      }

      setShowForm(false)
      setEditingNotification(null)
      setFormData({
        title: '',
        message: '',
        link: '',
        buttons: [],
        active: true,
        persistent: false
      })
      setButtonText('')
      setButtonUrl('')
      fetchNotifications()
    } catch (error) {
      console.error('Error saving notification:', error)
      alert('Error saving notification')
    }
  }

  const handleEdit = (notification) => {
    setEditingNotification(notification)
    setFormData({
      title: notification.title || '',
      message: notification.message || '',
      link: notification.link || '',
      buttons: Array.isArray(notification.buttons) ? notification.buttons : [],
      active: notification.active !== false,
      persistent: notification.persistent === true
    })
    setButtonText('')
    setButtonUrl('')
    setShowForm(true)
  }

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return

    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
      alert('Notification deleted successfully!')
      fetchNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
      alert('Error deleting notification')
    }
  }

  const toggleActive = async (notification) => {
    try {
      const becomingActive = !notification.active
      const updates = {
        active: becomingActive
      }

      if (becomingActive) {
        updates.reactivationToken = Date.now()
      }

      await updateDoc(doc(db, 'notifications', notification.id), {
        ...updates
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error toggling notification:', error)
      alert('Error updating notification')
    }
  }

  return (
    <div className="admin-notifications">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin')} className="btn-back">
                <FiArrowLeft />
                Back to Dashboard
              </button>
              <h1>Manage Notifications</h1>
              <p>Create popup notifications that appear when users visit the site</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <FiPlus />
              Add Notification
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {showForm && (
            <div className="modal-overlay" onClick={() => {
              setShowForm(false)
              setEditingNotification(null)
              setFormData({
                title: '',
                message: '',
                link: '',
                buttons: [],
                active: true,
                persistent: false
              })
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingNotification ? 'Edit Notification' : 'Create Notification'}</h2>
                  <button
                    className="modal-close"
                    onClick={() => {
                      setShowForm(false)
                      setEditingNotification(null)
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="notification-form">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Notification title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Link (Optional - Legacy)</label>
                    <input
                      type="url"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                    <small>Legacy field - use buttons below for better UX</small>
                  </div>

                  <div className="form-group">
                    <label>Buttons (Optional)</label>
                    <div className="buttons-builder">
                      <div className="button-input-row">
                        <input
                          type="text"
                          placeholder="Button text (e.g., Sign up)"
                          value={buttonText}
                          onChange={(e) => setButtonText(e.target.value)}
                          className="button-text-input"
                        />
                        <input
                          type="url"
                          placeholder="Button URL (e.g., https://acm.atrons.net/member/login)"
                          value={buttonUrl}
                          onChange={(e) => setButtonUrl(e.target.value)}
                          className="button-url-input"
                        />
                        <button
                          type="button"
                          onClick={handleAddButton}
                          className="btn btn-secondary btn-small"
                          disabled={!buttonText.trim() || !buttonUrl.trim()}
                        >
                          <FiPlus />
                          Add
                        </button>
                      </div>
                      {formData.buttons && formData.buttons.length > 0 && (
                        <div className="buttons-list">
                          {formData.buttons.map((button, index) => (
                            <div key={index} className="button-item">
                              <span className="button-preview">
                                <strong>{button.text}</strong> → {button.url}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveButton(index)}
                                className="btn-icon btn-danger btn-small"
                                title="Remove button"
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <small>Add action buttons that appear in the notification. You can add multiple buttons.</small>
                  </div>

                  <div className="form-group">
                    <label>Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      placeholder="Notification message. Use [text](url) format for clickable links, e.g., Visit our [website](https://example.com) for more info."
                    />
                    <small>Use [text](url) format for clickable links in the message. Example: "Visit our [website](https://example.com) for more info."</small>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleInputChange}
                      />
                      <span>Active (show this notification)</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="persistent"
                        checked={formData.persistent}
                        onChange={handleInputChange}
                      />
                      <span>Persistent (always show, even after user dismisses)</span>
                    </label>
                    <small>When enabled, this notification will continue to appear even after users click the X button. Useful for important announcements that should always be visible.</small>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => {
                      setShowForm(false)
                      setEditingNotification(null)
                    }} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <FiCheck />
                      {editingNotification ? 'Update' : 'Create'} Notification
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div key={notification.id} className="notification-card">
                  <div className="notification-header">
                    <div>
                      <h3>{notification.title}</h3>
                      <p className="notification-date">
                        Created: {format(new Date(notification.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="notification-status">
                      <button
                        onClick={() => toggleActive(notification)}
                        className={`toggle-btn ${notification.active ? 'active' : ''}`}
                        title={notification.active ? 'Deactivate' : 'Activate'}
                      >
                        {notification.active ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                      <span className={`status-badge ${notification.active ? 'active' : 'inactive'}`}>
                        {notification.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="notification-body">
                    <p>{notification.message}</p>
                    {notification.buttons && Array.isArray(notification.buttons) && notification.buttons.length > 0 && (
                      <div className="notification-buttons-preview">
                        {notification.buttons.map((button, index) => (
                          <span key={index} className="button-preview-badge">
                            {button.text} → {button.url}
                          </span>
                        ))}
                      </div>
                    )}
                    {notification.link && (
                      <a href={notification.link} target="_blank" rel="noopener noreferrer" className="notification-link">
                        {notification.link}
                      </a>
                    )}
                    {notification.persistent && (
                      <div className="persistent-badge">
                        <span className="badge badge-info">Persistent</span>
                      </div>
                    )}
                  </div>
                  <div className="notification-actions">
                    <button
                      onClick={() => handleEdit(notification)}
                      className="btn-icon"
                      title="Edit"
                    >
                      <FiEdit2 />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="btn-icon btn-danger"
                      title="Delete"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="empty-state">
                  <p>No notifications found. Create your first notification!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminNotifications

