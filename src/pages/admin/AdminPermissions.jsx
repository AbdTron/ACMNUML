import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiShield,
  FiCheck,
  FiX,
  FiSave,
  FiUser,
  FiMail,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi'
import { isMainAdmin, ROLES } from '../../utils/permissions'
import './AdminPermissions.css'

const AdminPermissions = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState({}) // { adminId: { feature: true/false } }
  const [expandedAdmins, setExpandedAdmins] = useState({}) // { adminId: true/false }

  // Define all admin features
  const adminFeatures = [
    { id: 'manageEvents', label: 'Manage Events', description: 'Add, edit, or move events' },
    { id: 'teamProfiles', label: 'Team Profiles', description: 'Showcase and edit team members' },
    { id: 'notifications', label: 'Notifications', description: 'Create and manage popup notifications' },
    { id: 'galleries', label: 'Galleries', description: 'Manage photo galleries and images' },
    { id: 'settings', label: 'Settings', description: 'Update form links and site details' },
    { id: 'userManagement', label: 'User Management', description: 'Manage member accounts and permissions' },
    { id: 'formTemplates', label: 'Form Templates', description: 'Create and manage reusable form templates' },
    { id: 'userRequests', label: 'User Requests', description: 'Review profile change requests' },
    { id: 'feedback', label: 'Feedback', description: 'View and manage user feedback' },
    { id: 'forumModeration', label: 'Forum Moderation', description: 'Moderate forum posts and discussions' },
    { id: 'userWarnings', label: 'User Warnings', description: 'Send targeted warnings to users' }
  ]

  useEffect(() => {
    // Check if user is main admin - need to check role from admins collection
    if (!currentUser) {
      navigate('/admin')
      return
    }
    checkMainAdminAndFetch()
  }, [currentUser, navigate])

  const checkMainAdminAndFetch = async () => {
    if (!db || !currentUser) {
      navigate('/admin')
      return
    }

    try {
      // Check if user is super admin by checking their role in admins collection
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid))
      if (!adminDoc.exists() || adminDoc.data().role !== ROLES.MAIN_ADMIN) {
        navigate('/admin')
        return
      }
      // User is super admin, fetch admins
      fetchAdmins()
    } catch (error) {
      console.error('Error checking super admin status:', error)
      navigate('/admin')
    }
  }

  const fetchAdmins = async () => {
    if (!db) {
      setLoading(false)
      return
    }

    try {
      // Get all admins from admins collection
      const adminsRef = collection(db, 'admins')
      const adminsSnap = await getDocs(adminsRef)

      const adminsList = []
      const permissionsMap = {}

      for (const adminDoc of adminsSnap.docs) {
        const adminData = adminDoc.data()
        const adminId = adminDoc.id

        // Get user details from users collection
        let userData = null
        try {
          const userDoc = await getDoc(doc(db, 'users', adminId))
          if (userDoc.exists()) {
            userData = userDoc.data()
          }
        } catch (err) {
          console.error('Error fetching user data:', err)
        }

        const isMainAdminUser = adminData?.role === ROLES.MAIN_ADMIN

        adminsList.push({
          id: adminId,
          email: userData?.email || adminData?.email || 'Unknown',
          name: userData?.name || 'Unknown',
          role: adminData?.role || 'admin',
          isMainAdmin: isMainAdminUser,
          permissions: adminData?.permissions || {}
        })

        // Initialize permissions map (all features enabled by default for main admin, empty for others)
        permissionsMap[adminId] = isMainAdminUser
          ? adminFeatures.reduce((acc, feature) => ({ ...acc, [feature.id]: true }), {})
          : { ...(adminData?.permissions || {}) }
      }

      setAdmins(adminsList)
      setPermissions(permissionsMap)
    } catch (error) {
      console.error('Error fetching admins:', error)
      console.error('Current user:', currentUser?.uid)
      alert(`Error loading admins: ${error.message}. Please ensure you have Super Admin role and that Firestore rules have been deployed.`)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = (adminId, featureId) => {
    // Don't allow changing super admin permissions
    const admin = admins.find(a => a.id === adminId)
    if (admin?.isMainAdmin) {
      alert('Super Admin has all permissions and cannot be modified.')
      return
    }

    setPermissions(prev => ({
      ...prev,
      [adminId]: {
        ...prev[adminId],
        [featureId]: !prev[adminId]?.[featureId]
      }
    }))
  }

  const handleSavePermissions = async () => {
    if (!db) return

    setSaving(true)
    try {
      // Update permissions for each admin
      const updatePromises = admins.map(async (admin) => {
        // Skip main admin - they always have all permissions
        if (admin.isMainAdmin) return

        const adminRef = doc(db, 'admins', admin.id)
        const adminPermissions = permissions[admin.id] || {}

        await updateDoc(adminRef, {
          permissions: adminPermissions,
          updatedAt: new Date().toISOString()
        })
      })

      await Promise.all(updatePromises)
      alert('Permissions updated successfully!')
    } catch (error) {
      console.error('Error saving permissions:', error)
      alert('Error saving permissions. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-permissions">
        <div className="container">
          <div className="loading">Loading admins...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-permissions">
      <div className="admin-header">
        <div className="container">
          <button onClick={() => navigate('/admin')} className="btn-back">
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <div className="admin-header-content">
            <div>
              <h1>Admin Permissions</h1>
              <p>Manage which admins have access to which features</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          <div className="permissions-info">
            <FiShield />
            <p>
              As Super Admin, you can control which features each admin can access.
              Super Admin always has full access to all features.
            </p>
          </div>

          {admins.length === 0 ? (
            <div className="no-admins">
              <p>No admins found</p>
            </div>
          ) : (
            <>
              <div className="admins-list">
                {admins.map((admin) => (
                  <div key={admin.id} className="admin-permission-card">
                    <div className="admin-header-card">
                      <div className="admin-info">
                        <div className="admin-avatar">
                          <FiUser />
                        </div>
                        <div>
                          <h3>{admin.name}</h3>
                          <div className="admin-email">
                            <FiMail />
                            <span>{admin.email}</span>
                          </div>
                          {admin.isMainAdmin && (
                            <span className="main-admin-badge">
                              <FiShield />
                              Super Admin
                            </span>
                          )}
                        </div>
                      </div>
                      {!admin.isMainAdmin && (
                        <button
                          className="permissions-toggle-btn"
                          onClick={() => setExpandedAdmins(prev => ({
                            ...prev,
                            [admin.id]: !prev[admin.id]
                          }))}
                        >
                          {expandedAdmins[admin.id] ? (
                            <>
                              <span>Hide Permissions</span>
                              <FiChevronUp />
                            </>
                          ) : (
                            <>
                              <span>Show Permissions</span>
                              <FiChevronDown />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {(!admin.isMainAdmin && expandedAdmins[admin.id]) && (
                      <div className="permissions-list">
                        {adminFeatures.map((feature) => {
                          const hasPermission = permissions[admin.id]?.[feature.id] || false

                          return (
                            <div key={feature.id} className="permission-item">
                              <div className="permission-info">
                                <h4>{feature.label}</h4>
                                <p>{feature.description}</p>
                              </div>
                              <div className="permission-toggle">
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={hasPermission}
                                    onChange={() => handlePermissionToggle(admin.id, feature.id)}
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="permissions-actions">
                <button
                  onClick={handleSavePermissions}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <FiSave />
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPermissions

