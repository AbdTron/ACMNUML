import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft,
  FiEdit2, 
  FiTrash2,
  FiUser,
  FiMail,
  FiCalendar,
  FiShield,
  FiXCircle
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminUsers.css'
import { ROLES, isMainAdmin } from '../../utils/permissions'
import { logRoleChanged, logUserUpdated, logActivity, ACTIVITY_TYPES } from '../../utils/activityLogger'
import { getAvatarUrlOrDefault } from '../../utils/avatarUtils'
import { computeFlairsForStorage } from '../../utils/flairUtils'
import { addToBanList } from '../../utils/banListUtils'

const AdminUsers = () => {
  const { currentUser, userRole } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.USER,
    acmRole: '',
    showInDirectory: true
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('joinDate', 'desc'))
      const querySnapshot = await getDocs(q)
      const usersData = []
      
      // Fetch all admin roles in parallel
      const adminRolesMap = new Map()
      try {
        const adminsRef = collection(db, 'admins')
        const adminsSnap = await getDocs(adminsRef)
        adminsSnap.forEach((adminDoc) => {
          adminRolesMap.set(adminDoc.id, adminDoc.data().role || 'admin')
        })
      } catch (err) {
        console.error('Error fetching admin roles:', err)
      }
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const adminRole = adminRolesMap.get(doc.id)
        const isMainAdminUser = adminRole === ROLES.MAIN_ADMIN
        usersData.push({
          id: doc.id,
          ...data,
          isMainAdmin: isMainAdminUser,
          adminRole: adminRole, // Store admin role if exists
          joinDate: data.joinDate?.toDate ? data.joinDate.toDate() : (data.joinDate ? new Date(data.joinDate) : null)
        })
      })
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Error loading users')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || ROLES.USER,
      acmRole: user.acmRole || '',
      showInDirectory: user.showInDirectory !== false // Default to true if not set
    })
    setShowEditModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!editingUser || !db) return

    try {
      const userRef = doc(db, 'users', editingUser.id)
      const oldRole = editingUser.role
      const updates = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        acmRole: formData.acmRole.trim() || null,
        showInDirectory: formData.showInDirectory,
        updatedAt: new Date().toISOString()
      }

      // Manage admins collection based on role changes
      const adminRef = doc(db, 'admins', editingUser.id)
      let newAdminRole = null
      
      if (formData.role === ROLES.ADMIN || formData.role === ROLES.MAIN_ADMIN) {
        // User is being set to Admin or Main Admin - create/update admin document
        const adminData = {
          role: formData.role,
          email: formData.email,
          updatedAt: new Date().toISOString()
        }
        
        // Check if admin document exists
        const adminDoc = await getDoc(adminRef)
        if (adminDoc.exists()) {
          // Update existing admin document
          await updateDoc(adminRef, adminData)
          newAdminRole = formData.role
        } else {
          // Create new admin document
          adminData.createdAt = new Date().toISOString()
          await setDoc(adminRef, adminData)
          newAdminRole = formData.role
        }
      } else if ((oldRole === ROLES.ADMIN || oldRole === ROLES.MAIN_ADMIN) && formData.role === ROLES.USER) {
        // User was Admin/Main Admin but is being changed to User - remove from admins collection
        // Prevent deleting main admin documents (main admin cannot be demoted)
        if (oldRole === ROLES.MAIN_ADMIN) {
          alert('Cannot demote Main Admin. Only Main Admin can change their own role.')
          return
        }
        
        // Only allow deleting regular admin documents
        if (oldRole === ROLES.ADMIN) {
          try {
            await deleteDoc(adminRef)
            newAdminRole = null
          } catch (err) {
            console.error('Error removing from admins collection:', err)
            // Don't fail the whole operation if this fails
          }
        }
      }

      // Get current user profile to recompute flairs
      const currentUserDoc = await getDoc(userRef)
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {}
      
      // Merge updates with current profile
      const mergedProfile = { ...currentUserData, ...updates }
      
      // Recompute flairs based on updated profile and admin role
      const flairs = computeFlairsForStorage(mergedProfile, newAdminRole || (formData.role === ROLES.ADMIN || formData.role === ROLES.MAIN_ADMIN ? formData.role : false))
      
      // Add flairs to updates
      updates.flairs = flairs

      await updateDoc(userRef, updates)

      // Log role change if role was changed
      if (oldRole !== formData.role) {
        await logRoleChanged(editingUser.id, oldRole, formData.role, currentUser.uid)
      } else {
        await logUserUpdated(editingUser.id, currentUser.uid, updates)
      }

      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
      alert('User updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  const handleDeleteUser = async (userId, userData) => {
    const userName = userData.name || userData.email || 'User'
    if (!window.confirm(`Are you sure you want to delete ${userName}? This will permanently delete all their data from the website and database. This action cannot be undone.`)) {
      return
    }

    if (!db) return

    try {
      // Delete all user-related data
      // 1. Delete forum posts
      const forumPostsRef = collection(db, 'forumPosts')
      const postsQuery = query(forumPostsRef, where('authorId', '==', userId))
      const postsSnapshot = await getDocs(postsQuery)
      const deletePostsPromises = postsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePostsPromises)

      // 2. Delete forum replies
      const forumRepliesRef = collection(db, 'forumReplies')
      const repliesQuery = query(forumRepliesRef, where('authorId', '==', userId))
      const repliesSnapshot = await getDocs(repliesQuery)
      const deleteRepliesPromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteRepliesPromises)

      // 3. Delete event registrations
      const registrationsRef = collection(db, 'eventRegistrations')
      const registrationsQuery = query(registrationsRef, where('userId', '==', userId))
      const registrationsSnapshot = await getDocs(registrationsQuery)
      const deleteRegistrationsPromises = registrationsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteRegistrationsPromises)

      // 4. Delete profile change requests
      const changeRequestsRef = collection(db, 'profileChangeRequests')
      const requestsQuery = query(changeRequestsRef, where('userId', '==', userId))
      const requestsSnapshot = await getDocs(requestsQuery)
      const deleteRequestsPromises = requestsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteRequestsPromises)

      // 5. Delete activity logs
      const activityLogsRef = collection(db, 'activityLogs')
      const logsQuery = query(activityLogsRef, where('userId', '==', userId))
      const logsSnapshot = await getDocs(logsQuery)
      const deleteLogsPromises = logsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteLogsPromises)

      // 6. Delete from admins collection if they were an admin
      try {
        await deleteDoc(doc(db, 'admins', userId))
      } catch (err) {
        // Ignore if not an admin
      }

      // 7. Delete user profile
      await deleteDoc(doc(db, 'users', userId))

      // 8. Delete Firebase Auth user (if possible - requires admin SDK in production)
      // Note: This requires Firebase Admin SDK, so we'll log it for manual deletion
      console.log(`Firebase Auth user ${userId} should be deleted manually via Firebase Console`)

      await logActivity(currentUser.uid, ACTIVITY_TYPES.USER_DELETED, `User deleted: ${userName}`, { userId, userName, email: userData.email })
      fetchUsers()
      alert('User and all their data deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + error.message)
    }
  }

  const handleBanUser = async (userId, userData) => {
    const userName = userData.name || userData.email || 'User'
    const reason = window.prompt(`Enter reason for banning ${userName} (optional):`)
    if (reason === null) return // User cancelled

    if (!window.confirm(`Are you sure you want to BAN ${userName}? This will:\n1. Delete their account and all data\n2. Add their email and roll number to ban list\n3. Prevent them from creating a new account\n\nThis action cannot be undone.`)) {
      return
    }

    if (!db) return

    try {
      // 1. Add to ban list before deleting
      await addToBanList(
        userData.email || '',
        userData.rollNumber || null,
        reason || '',
        currentUser.uid
      )

      // 2. Delete all user data (same as handleDeleteUser)
      // Delete forum posts
      const forumPostsRef = collection(db, 'forumPosts')
      const postsQuery = query(forumPostsRef, where('authorId', '==', userId))
      const postsSnapshot = await getDocs(postsQuery)
      const deletePostsPromises = postsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePostsPromises)

      // Delete forum replies
      const forumRepliesRef = collection(db, 'forumReplies')
      const repliesQuery = query(forumRepliesRef, where('authorId', '==', userId))
      const repliesSnapshot = await getDocs(repliesQuery)
      const deleteRepliesPromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteRepliesPromises)

      // Delete event registrations
      const registrationsRef = collection(db, 'eventRegistrations')
      const registrationsQuery = query(registrationsRef, where('userId', '==', userId))
      const registrationsSnapshot = await getDocs(registrationsQuery)
      const deleteRegistrationsPromises = registrationsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteRegistrationsPromises)

      // Delete profile change requests
      const changeRequestsRef = collection(db, 'profileChangeRequests')
      const requestsQuery = query(changeRequestsRef, where('userId', '==', userId))
      const requestsSnapshot = await getDocs(requestsQuery)
      const deleteRequestsPromises = requestsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteRequestsPromises)

      // Delete activity logs
      const activityLogsRef = collection(db, 'activityLogs')
      const logsQuery = query(activityLogsRef, where('userId', '==', userId))
      const logsSnapshot = await getDocs(logsQuery)
      const deleteLogsPromises = logsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteLogsPromises)

      // Delete from admins collection if they were an admin
      try {
        await deleteDoc(doc(db, 'admins', userId))
      } catch (err) {
        // Ignore if not an admin
      }

      // Delete user profile
      await deleteDoc(doc(db, 'users', userId))

      await logActivity(currentUser.uid, ACTIVITY_TYPES.USER_DELETED, `User banned and deleted: ${userName}`, { 
        userId, 
        userName, 
        email: userData.email,
        rollNumber: userData.rollNumber,
        reason: reason || 'No reason provided'
      })
      
      fetchUsers()
      alert('User banned and deleted successfully. They cannot create a new account with this email or roll number.')
    } catch (error) {
      console.error('Error banning user:', error)
      alert('Error banning user: ' + error.message)
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case ROLES.MAIN_ADMIN:
        return 'role-badge role-badge-main-admin'
      case ROLES.ADMIN:
        return 'role-badge role-badge-admin'
      case ROLES.USER:
        return 'role-badge role-badge-user'
      // Backward compatibility for old 'member' role
      case 'member':
        return 'role-badge role-badge-user'
      default:
        return 'role-badge'
    }
  }

  const canEditUser = (user) => {
    // Only main admin can edit other admins
    if (!isMainAdmin(userRole)) {
      // Non-main admins can only edit regular users
      return user.role === ROLES.USER || user.role === 'member' // Backward compatibility
    }
    
    // Main admin can edit anyone except themselves (to prevent accidental self-modification)
    if (user.id === currentUser.uid) return false
    
    // Main admin can edit all users including other admins
    return true
  }

  const canDeleteUser = (user) => {
    // Only main admin can delete/ban users
    if (!isMainAdmin(userRole)) {
      return false
    }
    
    // Can't delete yourself
    if (user.id === currentUser.uid) return false
    
    // Prevent deleting main admin
    if (user.isMainAdmin) return false
    
    return true
  }

  return (
    <div className="admin-users">
      <div className="admin-header">
        <div className="container">
          <button onClick={() => navigate('/admin')} className="btn-back">
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <div className="admin-header-content">
            <div>
              <h1>User Management</h1>
              <p>Manage user accounts and permissions. Note: "Member" refers to ACM Society role (set in ACM Role field), not user role.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {showEditModal && (
            <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit User</h2>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingUser(null)
                    }}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleUpdateUser} className="user-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      disabled={editingUser?.isMainAdmin && !isMainAdmin(userRole)}
                    >
                      <option value={ROLES.USER}>User</option>
                      {isMainAdmin(userRole) && (
                        <option value={ROLES.ADMIN}>Admin</option>
                      )}
                      {isMainAdmin(userRole) && (
                        <option value={ROLES.MAIN_ADMIN}>Main Admin</option>
                      )}
                    </select>
                    {editingUser?.isMainAdmin && !isMainAdmin(userRole) && (
                      <small style={{ color: '#dc2626' }}>
                        Only Main Admin can modify Main Admin permissions
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>ACM Society Role (Optional)</label>
                    <input
                      type="text"
                      name="acmRole"
                      value={formData.acmRole}
                      onChange={handleInputChange}
                      placeholder="e.g., President, Vice President, Secretary, etc."
                    />
                    <small>This will be displayed on the member directory</small>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="showInDirectory"
                        checked={formData.showInDirectory}
                        onChange={handleInputChange}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                      <span>Show in Member Directory</span>
                    </label>
                    <small>When enabled, this user's profile will be visible in the public member directory</small>
                  </div>
                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingUser(null)
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>ACM Role</th>
                    <th>In Directory</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-info">
                            {(() => {
                              const avatarUrl = getAvatarUrlOrDefault(user.avatar || user.photoURL)
                              return avatarUrl ? (
                                <img src={avatarUrl} alt={user.name} className="user-avatar" />
                              ) : (
                                <div className="user-avatar user-avatar-placeholder">
                                  <FiUser />
                                </div>
                              )
                            })()}
                            <span>{user.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="user-email">
                            <FiMail />
                            <span>{user.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={user.isMainAdmin ? 'role-badge role-badge-main-admin' : getRoleBadgeClass(user.role)}>
                            <FiShield />
                            {user.isMainAdmin ? 'Main Admin' : (user.role === 'member' ? 'User' : (user.role || 'User'))}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted">{user.acmRole || 'N/A'}</span>
                        </td>
                        <td>
                          <span className={user.showInDirectory !== false ? 'status-badge status-active' : 'status-badge status-inactive'}>
                            {user.showInDirectory !== false ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td>
                          {user.joinDate ? (
                            <div className="user-date">
                              <FiCalendar />
                              <span>{format(user.joinDate, 'MMM dd, yyyy')}</span>
                            </div>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {canEditUser(user) && (
                              <button
                                onClick={() => handleEdit(user)}
                                className="btn-icon btn-edit"
                                title="Edit user"
                              >
                                <FiEdit2 />
                              </button>
                            )}
                            {canDeleteUser(user) && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user)}
                                  className="btn-icon btn-delete"
                                  title="Delete user (removes all data)"
                                  style={{ color: '#ef4444' }}
                                >
                                  <FiTrash2 />
                                </button>
                                <button
                                  onClick={() => handleBanUser(user.id, user)}
                                  className="btn-icon btn-ban"
                                  title="Delete and ban user (prevents re-registration)"
                                  style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)' }}
                                >
                                  <FiXCircle />
                                </button>
                              </div>
                            )}
                            {!canEditUser(user) && !canDeleteUser(user) && (
                              <span className="text-muted">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUsers

