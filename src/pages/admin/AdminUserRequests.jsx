import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, orderBy, getDocs, doc, updateDoc, getDoc, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { FiArrowLeft, FiCheck, FiX, FiClock, FiUser, FiMail, FiHash, FiBookOpen, FiCalendar, FiFilter, FiRefreshCw } from 'react-icons/fi'
import './AdminUserRequests.css'

const AdminUserRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [filter, setFilter] = useState('pending') // pending, approved, rejected, all

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
        ...doc.data()
      }))
      
      setRequests(requestsData)
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request) => {
    if (!confirm(`Approve change request from ${request.userName}? This will allow them to edit their academic information once.`)) {
      return
    }

    setProcessing(request.id)
    try {
      // Update user's profile to allow editing
      const userRef = doc(db, 'users', request.userId)
      await updateDoc(userRef, {
        canEditAcademic: true,
        updatedAt: serverTimestamp()
      })

      // Update the request status
      const requestRef = doc(db, 'profileChangeRequests', request.id)
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewNotes: 'Approved - user can now edit academic information once'
      })

      // Refresh the list
      await fetchRequests()
    } catch (err) {
      console.error('Error approving request:', err)
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
        reviewedAt: serverTimestamp(),
        reviewNotes: reason || 'Request rejected by admin'
      })

      // Refresh the list
      await fetchRequests()
    } catch (err) {
      console.error('Error rejecting request:', err)
      alert('Failed to reject request. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending"><FiClock /> Pending</span>
      case 'approved':
        return <span className="status-badge approved"><FiCheck /> Approved</span>
      case 'rejected':
        return <span className="status-badge rejected"><FiX /> Rejected</span>
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  return (
    <div className="admin-user-requests">
      <div className="container">
        <Link to="/admin" className="back-link">
          <FiArrowLeft /> Back to Admin Dashboard
        </Link>

        <div className="page-header">
          <div className="header-content">
            <h1>Profile Change Requests</h1>
            <p>Review and manage user requests to change their academic information</p>
          </div>
          <button onClick={fetchRequests} className="btn btn-secondary" disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="filters">
          <FiFilter />
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
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <FiUser />
            <h3>No {filter !== 'all' ? filter : ''} requests found</h3>
            <p>
              {filter === 'pending' 
                ? 'All caught up! No pending requests to review.'
                : `No ${filter} requests in the system.`}
            </p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="user-info">
                    <h3><FiUser /> {request.userName}</h3>
                    <span className="user-email"><FiMail /> {request.userEmail}</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="request-body">
                  <div className="current-data">
                    <h4>Current Academic Information:</h4>
                    <div className="data-grid">
                      <div className="data-item">
                        <FiHash />
                        <span className="label">Roll Number:</span>
                        <span className="value">{request.currentData?.rollNumber || 'N/A'}</span>
                      </div>
                      <div className="data-item">
                        <FiBookOpen />
                        <span className="label">Department:</span>
                        <span className="value">{request.currentData?.department || 'N/A'}</span>
                      </div>
                      <div className="data-item">
                        <FiBookOpen />
                        <span className="label">Degree:</span>
                        <span className="value">{request.currentData?.degree || 'N/A'}</span>
                      </div>
                      <div className="data-item">
                        <FiCalendar />
                        <span className="label">Semester:</span>
                        <span className="value">{request.currentData?.semester || 'N/A'}</span>
                      </div>
                      <div className="data-item">
                        <FiUser />
                        <span className="label">Section:</span>
                        <span className="value">{request.currentData?.section || 'N/A'}</span>
                      </div>
                      <div className="data-item">
                        <FiClock />
                        <span className="label">Shift:</span>
                        <span className="value">{request.currentData?.shift || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="request-reason">
                      <strong>Reason:</strong> {request.reason}
                    </div>
                  )}

                  {request.reviewNotes && (
                    <div className="review-notes">
                      <strong>Admin Notes:</strong> {request.reviewNotes}
                    </div>
                  )}
                </div>

                <div className="request-footer">
                  <span className="request-date">
                    <FiCalendar /> Submitted: {formatDate(request.createdAt)}
                  </span>
                  {request.reviewedAt && (
                    <span className="reviewed-date">
                      Reviewed: {formatDate(request.reviewedAt)}
                    </span>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      onClick={() => handleApprove(request)}
                      className="btn btn-success"
                      disabled={processing === request.id}
                    >
                      <FiCheck />
                      {processing === request.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      className="btn btn-danger"
                      disabled={processing === request.id}
                    >
                      <FiX />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUserRequests




