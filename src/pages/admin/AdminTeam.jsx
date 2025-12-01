import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAdminPermission } from '../../hooks/useAdminPermission'
import { FiPlus, FiArrowLeft, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import ImageUploader from '../../components/ImageUploader'
import './AdminTeam.css'

const defaultForm = {
  name: '',
  role: 'Member',
  memberType: 'student', // 'student' or 'head' or 'faculty'
  bio: '',
  email: '',
  linkedin: '',
  github: '',
  twitter: '',
  order: 1,
  image: '',
  filePath: '',
  imageCrops: null,
}

const AdminTeam = () => {
  const { currentUser } = useAuth()
  useAdminPermission() // Check permission for this route
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(defaultForm)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const teamRef = collection(db, 'team')
      const q = query(teamRef, orderBy('order', 'asc'))
      const snapshot = await getDocs(q)
      const list = []
      snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }))
      setMembers(list)
    } catch (error) {
      console.error('Error fetching team', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(defaultForm)
    setEditingMember(null)
  }

  const handleImageChange = (payload) => {
    // Handle empty/removed image
    if (!payload || payload === '' || (typeof payload === 'object' && (!payload.url || payload.url === ''))) {
      setFormData({ ...formData, image: '', filePath: '', imageCrops: null })
      return
    }

    if (typeof payload === 'string') {
      setFormData({ ...formData, image: payload, filePath: '', imageCrops: null })
      return
    }

    if (typeof payload === 'object' && payload.url) {
      setFormData({ 
        ...formData, 
        image: payload.url, 
        filePath: payload.filePath || payload.path || '',
        imageCrops: payload.crops || null 
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!db) return
    try {
      const payload = { ...formData, order: Number(formData.order) || 1 }
      if (editingMember) {
        await updateDoc(doc(db, 'team', editingMember.id), payload)
      } else {
        await setDoc(doc(collection(db, 'team')), payload)
      }
      resetForm()
      setShowForm(false)
      fetchMembers()
    } catch (error) {
      console.error('Error saving member', error)
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      name: member.name || '',
      role: member.role || 'Member',
      memberType: member.memberType || 'student',
      bio: member.bio || '',
      email: member.email || '',
      linkedin: member.linkedin || '',
      github: member.github || '',
      twitter: member.twitter || '',
      order: member.order || 1,
      image: member.image || '',
      filePath: member.filePath || '',
      imageCrops: member.imageCrops || null,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this team member?')) return
    try {
      await deleteDoc(doc(db, 'team', id))
      fetchMembers()
    } catch (error) {
      console.error('Error deleting member', error)
    }
  }

  return (
    <div className="admin-team">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin')} className="btn-back">
                <FiArrowLeft />
                Back to Dashboard
              </button>
              <h1>Manage Team</h1>
              <p>Highlight the people powering ACM NUML</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <FiPlus />
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {showForm && (
            <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm() }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingMember ? 'Edit Member' : 'Add Member'}</h2>
                  <button className="modal-close" onClick={() => { setShowForm(false); resetForm() }}>
                    <FiX />
                  </button>
                </div>
                <form className="team-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Role *</label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g., Director Partnerships"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Member Type *</label>
                      <select
                        value={formData.memberType}
                        onChange={(e) => setFormData({ ...formData, memberType: e.target.value })}
                        required
                      >
                        <option value="student">Student</option>
                        <option value="head">Head / Faculty</option>
                        <option value="faculty">Faculty Advisor</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      rows="3"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Display Order</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>LinkedIn</label>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>GitHub</label>
                      <input
                        type="url"
                        value={formData.github}
                        onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Twitter</label>
                      <input
                        type="url"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      />
                    </div>
                  </div>

                  <ImageUploader
                    label="Profile Image"
                    folder="team"
                    value={{ url: formData.image, filePath: formData.filePath, crops: formData.imageCrops }}
                    onChange={handleImageChange}
                    variants={[
                      { key: 'landing', label: 'Landing card crop', aspect: 4 / 5 },
                      { key: 'profile', label: 'Team directory crop', aspect: 1 },
                    ]}
                  />

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm() }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <FiCheck /> {editingMember ? 'Update' : 'Add'} Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading team...</div>
          ) : (
            <div className="team-admin-grid">
              {members.map((member) => (
                <div key={member.id} className="team-admin-card">
                  <div className="card-header">
                    <div className="avatar">
                      {member.image ? (
                        <img src={member.image} alt={member.name} />
                      ) : (
                        <span>{member.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3>{member.name}</h3>
                      <p>{member.role}</p>
                    </div>
                  </div>
                  <p className="bio">{member.bio}</p>
                  <div className="card-footer">
                    <span>Order #{member.order}</span>
                    <div className="actions">
                      <button onClick={() => handleEdit(member)}>
                        <FiEdit2 />
                      </button>
                      <button className="danger" onClick={() => handleDelete(member.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {members.length === 0 && <p>No team members yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminTeam


