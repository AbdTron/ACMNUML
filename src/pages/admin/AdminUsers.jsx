import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
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
  FiShield
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminUsers.css'
import { ROLES, isSuperAdmin } from '../../utils/permissions'
import { logRoleChanged, logUserUpdated, logActivity, ACTIVITY_TYPES } from '../../utils/activityLogger'

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
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        usersData.push({
          id: doc.id,
          ...data,
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

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }

    if (!db) return

    try {
      await deleteDoc(doc(db, 'users', userId))
      await logActivity(currentUser.uid, ACTIVITY_TYPES.USER_DELETED, `User deleted: ${userName}`, { userId, userName })
      fetchUsers()
      alert('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case ROLES.SUPERADMIN:
        return 'role-badge role-badge-superadmin'
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
    // Superadmins can edit anyone except other superadmins
    if (isSuperAdmin(userRole)) {
      return user.role !== ROLES.SUPERADMIN || user.id === currentUser.uid
    }
    // Admins can edit users only
    if (userRole === ROLES.ADMIN) {
      return user.role === ROLES.USER || user.role === 'member' // Backward compatibility
    }
    return false
  }

  const canDeleteUser = (user) => {
    // Can't delete yourself
    if (user.id === currentUser.uid) return false
    // Superadmins can delete anyone except other superadmins
    if (isSuperAdmin(userRole)) {
      return user.role !== ROLES.SUPERADMIN
    }
    // Admins can delete users only
    if (userRole === ROLES.ADMIN) {
      return user.role === ROLES.USER || user.role === 'member' // Backward compatibility
    }
    return false
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
                    >
                      <option value={ROLES.USER}>User</option>
                      {(isSuperAdmin(userRole) || userRole === ROLES.ADMIN) && (
                        <option value={ROLES.ADMIN}>Admin</option>
                      )}
                      {isSuperAdmin(userRole) && (
                        <option value={ROLES.SUPERADMIN}>Super Admin</option>
                      )}
                    </select>
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
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name} className="user-avatar" />
                            ) : (
                              <div className="user-avatar user-avatar-placeholder">
                                <FiUser />
                              </div>
                            )}
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
                          <span className={getRoleBadgeClass(user.role)}>
                            <FiShield />
                            {user.role === 'member' ? 'User' : (user.role || 'User')}
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
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="btn-icon btn-delete"
                                title="Delete user"
                              >
                                <FiTrash2 />
                              </button>
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

