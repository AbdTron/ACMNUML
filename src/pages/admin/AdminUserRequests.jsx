import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc,
  where,
  getDoc
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { 
  FiArrowLeft,
  FiUser,
  FiCheck,
  FiX,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiBookOpen,
  FiHash,
  FiUsers,
  FiSun,
  FiMoon,
  FiAward
} from 'react-icons/fi'
import './AdminUserRequests.css'

const AdminUserRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected
  const [processing, setProcessing] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const requestsRef = collection(db, 'profileChangeRequests')
      let q
      
      if (filter === 'all') {
        q = query(requestsRef, orderBy('createdAt', 'desc'))
      } else {
        q = query(
          requestsRef,
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        )
      }
      
      const snapshot = await getDocs(q)
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
      }))
      
      setRequests(requestsData)
    } catch (error) {
      console.error('Error fetching requests:', error)
      // If index error, fallback to fetching all and filtering client-side
      if (error.code === 'failed-precondition') {
        try {
          const requestsRef = collection(db, 'profileChangeRequests')
          const q = query(requestsRef, orderBy('createdAt', 'desc'))
          const snapshot = await getDocs(q)
          const allRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
          }))
          setRequests(allRequests)
        } catch (fallbackError) {
          console.error('Error in fallback fetch:', fallbackError)
          alert('Error loading requests')
        }
      } else {
        alert('Error loading requests')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request) => {
    if (!confirm(`Approve change request from ${request.userName || 'user'}? This will allow them to edit their academic information once.`)) {
      return
    }

    setProcessing(request.id)
    try {
      // Update user's profile to allow editing
      const userRef = doc(db, 'users', request.userId)
      await updateDoc(userRef, {
        canEditAcademic: true,
        updatedAt: new Date().toISOString()
      })

      // Update the request status
      const requestRef = doc(db, 'profileChangeRequests', request.id)
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewNotes: 'Approved - user can now edit academic information once'
      })

      // Refresh the list
      await fetchRequests()
      alert('Request approved successfully')
    } catch (error) {
      console.error('Error approving request:', error)
      alert('Failed to approve request. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (request) => {
    const reason = prompt('Enter reason for rejection (optional):')
    
    if (reason === null) return // User cancelled

    setProcessing(request.id)
    try {
      // Update the request status
      const requestRef = doc(db, 'profileChangeRequests', request.id)
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewNotes: reason || 'Request rejected by admin'
      })

      // Refresh the list
      await fetchRequests()
      alert('Request rejected')
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('Failed to reject request. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', text: 'Pending' },
      approved: { class: 'status-approved', text: 'Approved' },
      rejected: { class: 'status-rejected', text: 'Rejected' }
    }
    return badges[status] || badges.pending
  }

  // Requests are already filtered by the query, but we can use this for client-side filtering if needed
  const filteredRequests = requests

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }

  return (
    <div className="admin-user-requests">
      <div className="container">
        <Link to="/admin" className="back-link">
          <FiArrowLeft /> Back to Admin Dashboard
        </Link>

        <div className="page-header">
          <div className="header-content">
            <h1>User Requests</h1>
            <p>Review and manage academic profile change requests</p>
          </div>
          <button onClick={fetchRequests} className="btn btn-secondary" disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card stat-approved">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card stat-rejected">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <FiFilter />
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button
              className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <FiUser />
            <h3>No requests found</h3>
            <p>No requests match your current filter.</p>
          </div>
        ) : (
          <div className="requests-list">
            {filteredRequests.map(request => {
              const statusBadge = getStatusBadge(request.status)
              const currentData = request.currentData || {}
              
              return (
                <div key={request.id} className="request-card">
                  <div className="card-header">
                    <div className="request-info">
                      <div className="request-title-row">
                        <h3><FiUser /> {request.userName || 'Unknown User'}</h3>
                        {getStatusBadge(request.status).text === 'Pending' ? (
                          <span className={`status-badge ${statusBadge.class}`}>
                            <FiClock /> {statusBadge.text}
                          </span>
                        ) : getStatusBadge(request.status).text === 'Approved' ? (
                          <span className={`status-badge ${statusBadge.class}`}>
                            <FiCheck /> {statusBadge.text}
                          </span>
                        ) : (
                          <span className={`status-badge ${statusBadge.class}`}>
                            <FiX /> {statusBadge.text}
                          </span>
                        )}
                      </div>
                      <div className="request-meta">
                        <span className="meta-item">
                          <FiUser />
                          {request.userEmail || 'N/A'}
                        </span>
                        <span className="meta-item">
                          <FiClock />
                          Submitted: {formatDate(request.createdAt)}
                        </span>
                        {request.reviewedAt && (
                          <span className="meta-item">
                            Reviewed: {formatDate(request.reviewedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="card-actions">
                        <button
                          onClick={() => handleApprove(request)}
                          className="btn btn-success btn-small"
                          disabled={processing === request.id}
                        >
                          <FiCheck />
                          {processing === request.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          className="btn btn-danger btn-small"
                          disabled={processing === request.id}
                        >
                          <FiX />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="request-content">
                    <div className="info-section">
                      <h4>Current Academic Information:</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <FiHash />
                          <span className="info-label">Roll Number:</span>
                          <span className="info-value">{currentData.rollNumber || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <FiBookOpen />
                          <span className="info-label">Department:</span>
                          <span className="info-value">{currentData.department || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <FiAward />
                          <span className="info-label">Degree:</span>
                          <span className="info-value">{currentData.degree || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <FiBookOpen />
                          <span className="info-label">Semester:</span>
                          <span className="info-value">{currentData.semester || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <FiUsers />
                          <span className="info-label">Section:</span>
                          <span className="info-value">{currentData.section || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          {currentData.shift === 'Morning' ? <FiSun /> : <FiMoon />}
                          <span className="info-label">Shift:</span>
                          <span className="info-value">{currentData.shift || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="reason-section">
                        <h4>Reason for Change</h4>
                        <p><strong>Reason:</strong> {request.reason}</p>
                      </div>
                    )}

                    {request.reviewNotes && (
                      <div className="reason-section">
                        <h4>Admin Notes</h4>
                        <p><strong>Admin Notes:</strong> {request.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUserRequests
