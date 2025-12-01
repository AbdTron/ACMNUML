import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  where 
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useAdminPermission } from '../../hooks/useAdminPermission'
import { 
  FiMessageCircle, 
  FiZap, 
  FiAlertCircle, 
  FiStar,
  FiFilter,
  FiSearch,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiX,
  FiMail
} from 'react-icons/fi'
import './AdminFeedback.css'

const AdminFeedback = () => {
  const { currentUser } = useAuth()
  useAdminPermission() // Check permission for this route
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, feedback, feature, bug, survey
  const [statusFilter, setStatusFilter] = useState('all') // all, new, in-progress, resolved, closed
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0
  })

  useEffect(() => {
    fetchFeedback()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [feedback])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const feedbackQuery = query(
        collection(db, 'feedback'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(feedbackQuery)
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
      setFeedback(feedbackData)
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const newStats = {
      total: feedback.length,
      new: feedback.filter(f => f.status === 'new').length,
      inProgress: feedback.filter(f => f.status === 'in-progress').length,
      resolved: feedback.filter(f => f.status === 'resolved').length
    }
    setStats(newStats)
  }

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), {
        status: newStatus,
        updatedAt: new Date()
      })
      setFeedback(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, status: newStatus } : f
      ))
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
    }
  }

  const handleDelete = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    try {
      await deleteDoc(doc(db, 'feedback', feedbackId))
      setFeedback(prev => prev.filter(f => f.id !== feedbackId))
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback(null)
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'feedback': return <FiMessageCircle />
      case 'feature': return <FiZap />
      case 'bug': return <FiAlertCircle />
      case 'survey': return <FiStar />
      default: return <FiMessageCircle />
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'feedback': return 'Feedback'
      case 'feature': return 'Feature Request'
      case 'bug': return 'Bug Report'
      case 'survey': return 'Survey'
      default: return 'Feedback'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'status-new'
      case 'in-progress': return 'status-in-progress'
      case 'resolved': return 'status-resolved'
      case 'closed': return 'status-closed'
      default: return 'status-new'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'priority-critical'
      case 'high': return 'priority-high'
      case 'medium': return 'priority-medium'
      case 'low': return 'priority-low'
      default: return 'priority-medium'
    }
  }

  const filteredFeedback = feedback.filter(item => {
    const matchesType = filter === 'all' || item.type === filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })

  return (
    <div className="admin-feedback-page">
      {/* Header */}
      <div className="admin-header">
        <h1>Feedback Management</h1>
        <p>Review and manage user feedback, feature requests, and bug reports</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiMessageCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Feedback</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon new">
            <FiClock />
          </div>
          <div className="stat-info">
            <span className="stat-label">New</span>
            <span className="stat-value">{stats.new}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon in-progress">
            <FiFilter />
          </div>
          <div className="stat-info">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats.inProgress}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon resolved">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Resolved</span>
            <span className="stat-value">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="feedback">Feedback</option>
            <option value="feature">Feature Requests</option>
            <option value="bug">Bug Reports</option>
            <option value="survey">Surveys</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="feedback-content">
        <div className="feedback-list">
          {loading ? (
            <div className="loading-state">Loading feedback...</div>
          ) : filteredFeedback.length === 0 ? (
            <div className="empty-state">
              <FiMessageCircle />
              <p>No feedback found</p>
            </div>
          ) : (
            filteredFeedback.map(item => (
              <div 
                key={item.id} 
                className={`feedback-item ${selectedFeedback?.id === item.id ? 'active' : ''}`}
                onClick={() => setSelectedFeedback(item)}
              >
                <div className="feedback-item-header">
                  <div className="type-badge">
                    {getTypeIcon(item.type)}
                    <span>{getTypeLabel(item.type)}</span>
                  </div>
                  <span className={`status-badge ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p className="feedback-preview">{item.description}</p>
                <div className="feedback-item-footer">
                  <span className="feedback-date">
                    {item.createdAt?.toLocaleDateString()}
                  </span>
                  {item.category && (
                    <span className="feedback-category">{item.category}</span>
                  )}
                  {item.priority && (
                    <span className={`priority-badge ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Feedback Detail Panel */}
        {selectedFeedback && (
          <div className="feedback-detail">
            <div className="detail-header">
              <div className="type-badge large">
                {getTypeIcon(selectedFeedback.type)}
                <span>{getTypeLabel(selectedFeedback.type)}</span>
              </div>
              <button 
                className="close-detail-btn"
                onClick={() => setSelectedFeedback(null)}
              >
                <FiX />
              </button>
            </div>

            <h2>{selectedFeedback.title}</h2>

            <div className="detail-meta">
              <div className="meta-item">
                <strong>Status:</strong>
                <select
                  value={selectedFeedback.status}
                  onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value)}
                  className={`status-select ${getStatusColor(selectedFeedback.status)}`}
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {selectedFeedback.category && (
                <div className="meta-item">
                  <strong>Category:</strong>
                  <span>{selectedFeedback.category}</span>
                </div>
              )}
              {selectedFeedback.priority && (
                <div className="meta-item">
                  <strong>Priority:</strong>
                  <span className={`priority-badge ${getPriorityColor(selectedFeedback.priority)}`}>
                    {selectedFeedback.priority}
                  </span>
                </div>
              )}
              {selectedFeedback.rating && (
                <div className="meta-item">
                  <strong>Rating:</strong>
                  <span className="rating-display">
                    {[...Array(5)].map((_, i) => (
                      <FiStar 
                        key={i} 
                        className={i < selectedFeedback.rating ? 'filled' : ''}
                      />
                    ))}
                  </span>
                </div>
              )}
              <div className="meta-item">
                <strong>Submitted:</strong>
                <span>{selectedFeedback.createdAt?.toLocaleString()}</span>
              </div>
            </div>

            {selectedFeedback.eventTitle && (
              <div className="event-info-banner">
                <strong>Event:</strong> {selectedFeedback.eventTitle}
              </div>
            )}

            <div className="detail-description">
              <h3>Description</h3>
              <p>{selectedFeedback.description}</p>
            </div>

            {selectedFeedback.email && (
              <div className="contact-info">
                <FiMail />
                <a href={`mailto:${selectedFeedback.email}`}>
                  {selectedFeedback.email}
                </a>
              </div>
            )}

            <div className="detail-actions">
              <button 
                className="delete-btn"
                onClick={() => handleDelete(selectedFeedback.id)}
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminFeedback

