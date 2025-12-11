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
    orderBy,
    where
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
    FiAlertTriangle,
    FiAlertCircle,
    FiInfo,
    FiSearch,
    FiUser,
    FiCopy,
    FiChevronDown,
    FiChevronUp
} from 'react-icons/fi'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import './AdminWarnings.css'

// Warning templates
const WARNING_TEMPLATES = [
    {
        id: 'real_name',
        name: 'Real Name Required',
        title: '⚠️ Action Required: Update Your Name',
        message: 'Your account name does not match your student ID card. Please update your profile to use your real name as shown on your student card. Failure to comply may result in account suspension or deletion.',
        buttons: [{ text: 'Update My Profile', url: '/member/profile' }],
        severity: 'warning'
    },
    {
        id: 'complete_profile',
        name: 'Complete Profile',
        title: '📝 Complete Your Profile',
        message: 'Your profile is missing required information. Please complete your profile with your roll number, department, and other academic details to fully access all features.',
        buttons: [{ text: 'Complete Profile', url: '/member/onboarding' }],
        severity: 'warning'
    },
    {
        id: 'profile_incomplete',
        name: 'Profile Info Missing',
        title: '📝 Add Missing Profile Info',
        message: 'Your profile is incomplete. Please fill in all required fields including your department and roll number to maintain your account.',
        buttons: [{ text: 'Update Profile', url: '/member/profile' }],
        severity: 'info'
    },
    {
        id: 'account_suspension',
        name: 'Account Suspension Warning',
        title: '🚫 Account Suspension Notice',
        message: 'Your account has been flagged for violation of community guidelines. If this behavior continues, your account will be permanently suspended.',
        buttons: [],
        severity: 'critical'
    },
    {
        id: 'custom',
        name: 'Custom Warning',
        title: '',
        message: '',
        buttons: [],
        severity: 'warning'
    }
]

const AdminWarnings = () => {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [warnings, setWarnings] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingWarning, setEditingWarning] = useState(null)
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        buttons: [],
        severity: 'warning'
    })
    const [buttonText, setButtonText] = useState('')
    const [buttonUrl, setButtonUrl] = useState('')
    const [expandedWarnings, setExpandedWarnings] = useState({})

    useEffect(() => {
        fetchWarnings()
        fetchUsers()
    }, [])

    const fetchWarnings = async () => {
        if (!db) {
            setLoading(false)
            return
        }
        try {
            const warningsRef = collection(db, 'userWarnings')
            const q = query(warningsRef, orderBy('createdAt', 'desc'))
            const querySnapshot = await getDocs(q)
            const warningsData = []
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data()
                warningsData.push({
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                })
            })
            setWarnings(warningsData)
        } catch (error) {
            console.error('Error fetching warnings:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        if (!db) return
        try {
            const usersRef = collection(db, 'users')
            const querySnapshot = await getDocs(usersRef)
            const usersData = []
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data()
                usersData.push({
                    id: docSnap.id,
                    name: data.name || 'Unknown',
                    email: data.email || '',
                    rollNumber: data.rollNumber || ''
                })
            })
            setUsers(usersData)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const handleTemplateSelect = (templateId) => {
        const template = WARNING_TEMPLATES.find(t => t.id === templateId)
        if (template) {
            setSelectedTemplate(template)
            setFormData({
                title: template.title,
                message: template.message,
                buttons: [...template.buttons],
                severity: template.severity
            })
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleAddButton = () => {
        if (buttonText.trim() && buttonUrl.trim()) {
            setFormData(prev => ({
                ...prev,
                buttons: [...prev.buttons, { text: buttonText.trim(), url: buttonUrl.trim() }]
            }))
            setButtonText('')
            setButtonUrl('')
        }
    }

    const handleRemoveButton = (index) => {
        setFormData(prev => ({
            ...prev,
            buttons: prev.buttons.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!selectedUser && !editingWarning) {
            alert('Please select a user to warn')
            return
        }

        try {
            const warningData = {
                ...formData,
                userId: editingWarning ? editingWarning.userId : selectedUser.id,
                userName: editingWarning ? editingWarning.userName : selectedUser.name,
                userEmail: editingWarning ? editingWarning.userEmail : selectedUser.email,
                acknowledged: false,
                createdAt: editingWarning ? editingWarning.createdAt : Timestamp.now(),
                createdBy: currentUser.uid,
                updatedAt: Timestamp.now()
            }

            if (editingWarning) {
                await updateDoc(doc(db, 'userWarnings', editingWarning.id), warningData)
                alert('Warning updated successfully!')
            } else {
                await addDoc(collection(db, 'userWarnings'), warningData)
                alert('Warning sent successfully!')
            }

            resetForm()
            fetchWarnings()
        } catch (error) {
            console.error('Error saving warning:', error)
            alert('Error saving warning')
        }
    }

    const handleEdit = (warning) => {
        setEditingWarning(warning)
        setFormData({
            title: warning.title || '',
            message: warning.message || '',
            buttons: warning.buttons || [],
            severity: warning.severity || 'warning'
        })
        setShowForm(true)
    }

    const handleDelete = async (warningId) => {
        if (!window.confirm('Are you sure you want to delete this warning?')) return

        try {
            await deleteDoc(doc(db, 'userWarnings', warningId))
            alert('Warning deleted successfully!')
            fetchWarnings()
        } catch (error) {
            console.error('Error deleting warning:', error)
            alert('Error deleting warning')
        }
    }

    const resetForm = () => {
        setShowForm(false)
        setEditingWarning(null)
        setSelectedTemplate(null)
        setSelectedUser(null)
        setSearchTerm('')
        setFormData({
            title: '',
            message: '',
            buttons: [],
            severity: 'warning'
        })
        setButtonText('')
        setButtonUrl('')
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return <FiAlertCircle className="severity-icon critical" />
            case 'warning': return <FiAlertTriangle className="severity-icon warning" />
            case 'info': return <FiInfo className="severity-icon info" />
            default: return <FiAlertTriangle className="severity-icon warning" />
        }
    }

    const toggleWarningExpand = (warningId) => {
        setExpandedWarnings(prev => ({
            ...prev,
            [warningId]: !prev[warningId]
        }))
    }

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    return (
        <div className="admin-warnings">
            <div className="admin-header">
                <div className="container">
                    <div className="admin-header-content">
                        <div>
                            <button onClick={() => navigate('/admin')} className="btn-back">
                                <FiArrowLeft />
                                Back to Dashboard
                            </button>
                            <h1>User Warnings</h1>
                            <p>Send targeted warnings to individual users</p>
                        </div>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            <FiPlus />
                            Send Warning
                        </button>
                    </div>
                </div>
            </div>

            <div className="admin-content">
                <div className="container">
                    {showForm && (
                        <div className="modal-overlay" onClick={resetForm}>
                            <div className="modal-content warning-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{editingWarning ? 'Edit Warning' : 'Send Warning'}</h2>
                                    <button className="modal-close" onClick={resetForm}>
                                        <FiX />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="warning-form">
                                    {/* User Selection */}
                                    {!editingWarning && (
                                        <div className="form-group">
                                            <label>Select User *</label>
                                            <div className="user-search">
                                                <FiSearch className="search-icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name, email, or roll number..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            {searchTerm && !selectedUser && (
                                                <div className="users-dropdown">
                                                    {filteredUsers.slice(0, 10).map(user => (
                                                        <div
                                                            key={user.id}
                                                            className="user-option"
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setSearchTerm('')
                                                            }}
                                                        >
                                                            <FiUser />
                                                            <div>
                                                                <strong>{user.name}</strong>
                                                                <span>{user.email}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {filteredUsers.length === 0 && (
                                                        <div className="no-users">No users found</div>
                                                    )}
                                                </div>
                                            )}
                                            {selectedUser && (
                                                <div className="selected-user">
                                                    <FiUser />
                                                    <div>
                                                        <strong>{selectedUser.name}</strong>
                                                        <span>{selectedUser.email}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setSelectedUser(null)}>
                                                        <FiX />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {editingWarning && (
                                        <div className="selected-user editing">
                                            <FiUser />
                                            <div>
                                                <strong>{editingWarning.userName}</strong>
                                                <span>{editingWarning.userEmail}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Template Selection */}
                                    <div className="form-group">
                                        <label>Use Template</label>
                                        <div className="template-buttons">
                                            {WARNING_TEMPLATES.map(template => (
                                                <button
                                                    key={template.id}
                                                    type="button"
                                                    className={`template-btn ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                                    onClick={() => handleTemplateSelect(template.id)}
                                                >
                                                    <FiCopy />
                                                    {template.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Severity */}
                                    <div className="form-group">
                                        <label>Severity</label>
                                        <select
                                            name="severity"
                                            value={formData.severity}
                                            onChange={handleInputChange}
                                        >
                                            <option value="info">Info</option>
                                            <option value="warning">Warning</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>

                                    {/* Title */}
                                    <div className="form-group">
                                        <label>Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Warning title"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div className="form-group">
                                        <label>Message *</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required
                                            rows="4"
                                            placeholder="Warning message..."
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="form-group">
                                        <label>Action Buttons (Optional)</label>
                                        <div className="buttons-builder">
                                            <div className="button-input-row">
                                                <input
                                                    type="text"
                                                    placeholder="Button text"
                                                    value={buttonText}
                                                    onChange={(e) => setButtonText(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Button URL (e.g., /member/profile)"
                                                    value={buttonUrl}
                                                    onChange={(e) => setButtonUrl(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddButton}
                                                    className="btn btn-secondary btn-small"
                                                    disabled={!buttonText.trim() || !buttonUrl.trim()}
                                                >
                                                    <FiPlus />
                                                </button>
                                            </div>
                                            {formData.buttons.length > 0 && (
                                                <div className="buttons-list">
                                                    {formData.buttons.map((button, index) => (
                                                        <div key={index} className="button-item">
                                                            <span>{button.text} → {button.url}</span>
                                                            <button type="button" onClick={() => handleRemoveButton(index)}>
                                                                <FiX />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" onClick={resetForm} className="btn btn-secondary">
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            <FiCheck />
                                            {editingWarning ? 'Update Warning' : 'Send Warning'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Warnings List */}
                    {loading ? (
                        <div className="loading">Loading warnings...</div>
                    ) : (
                        <div className="warnings-list">
                            {warnings.map((warning) => {
                                const isExpanded = expandedWarnings[warning.id]
                                // Get current user info to show updated name
                                const currentUserInfo = users.find(u => u.id === warning.userId)
                                const currentName = currentUserInfo?.name || warning.userName
                                const nameChanged = currentName !== warning.userName

                                return (
                                    <div key={warning.id} className={`warning-card ${warning.severity} ${isExpanded ? 'expanded' : ''}`}>
                                        <div
                                            className="warning-header clickable"
                                            onClick={() => toggleWarningExpand(warning.id)}
                                        >
                                            <div className="warning-user">
                                                {getSeverityIcon(warning.severity)}
                                                <div>
                                                    <h3>
                                                        {currentName}
                                                        {nameChanged && (
                                                            <span className="name-changed-badge" title={`Original: ${warning.userName}`}>
                                                                ✓ Name Updated
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <span className="user-email">{warning.userEmail}</span>
                                                    {nameChanged && (
                                                        <span className="original-name">Was: {warning.userName}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="warning-header-right">
                                                <div className="warning-meta">
                                                    <span className={`severity-badge ${warning.severity}`}>
                                                        {warning.severity}
                                                    </span>
                                                    <span className={`ack-badge ${warning.acknowledged ? 'acknowledged' : 'pending'}`}>
                                                        {warning.acknowledged ? 'Acknowledged' : 'Pending'}
                                                    </span>
                                                </div>
                                                <button className="expand-btn">
                                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Preview (always visible) */}
                                        {!isExpanded && (
                                            <div className="warning-preview">
                                                <h4>{warning.title}</h4>
                                                <p>{truncateText(warning.message, 120)}</p>
                                            </div>
                                        )}

                                        {/* Full content (only when expanded) */}
                                        {isExpanded && (
                                            <div className="warning-body">
                                                <h4>{warning.title}</h4>
                                                <p>{warning.message}</p>
                                                {warning.buttons && warning.buttons.length > 0 && (
                                                    <div className="warning-buttons-preview">
                                                        {warning.buttons.map((button, index) => (
                                                            <span key={index} className="button-preview">
                                                                {button.text} → {button.url}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="warning-date">
                                                    Sent: {format(warning.createdAt, 'MMM dd, yyyy HH:mm')}
                                                </p>
                                                <div className="warning-actions">
                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(warning); }} className="btn-icon">
                                                        <FiEdit2 /> Edit
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(warning.id); }} className="btn-icon btn-danger">
                                                        <FiTrash2 /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            {warnings.length === 0 && (
                                <div className="empty-state">
                                    <FiAlertTriangle />
                                    <p>No warnings sent yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminWarnings
