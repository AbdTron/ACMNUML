import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useMemberAuth } from '../../context/MemberAuthContext'
import { FiArrowLeft, FiUser, FiMail, FiSave, FiAlertCircle } from 'react-icons/fi'
import './MemberProfile.css'

const MemberProfile = () => {
  const { currentUser, userProfile, updateProfile } = useMemberAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    showInDirectory: false
  })

  useEffect(() => {
    if (!currentUser) {
      navigate('/member/login')
      return
    }

    // Load user profile data
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || currentUser.email || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || '',
        website: userProfile.website || '',
        linkedin: userProfile.linkedin || '',
        github: userProfile.github || '',
        twitter: userProfile.twitter || '',
        showInDirectory: userProfile.showInDirectory || false
      })
    } else {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || ''
      }))
    }
  }, [currentUser, userProfile, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser || !db) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        website: formData.website.trim() || null,
        linkedin: formData.linkedin.trim() || null,
        github: formData.github.trim() || null,
        twitter: formData.twitter.trim() || null,
        showInDirectory: formData.showInDirectory,
        updatedAt: new Date().toISOString()
      })

      // Update profile in context
      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        website: formData.website.trim() || null,
        linkedin: formData.linkedin.trim() || null,
        github: formData.github.trim() || null,
        twitter: formData.twitter.trim() || null,
        showInDirectory: formData.showInDirectory
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="member-profile-page">
      <div className="container">
        <Link to="/member" className="back-link">
          <FiArrowLeft /> Back to Dashboard
        </Link>

        <div className="profile-header">
          <h1>Edit Profile</h1>
          <p>Update your personal information and preferences</p>
        </div>

        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <FiSave />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label>
                <FiUser />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label>
                <FiMail />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="disabled-input"
                placeholder="Email address"
              />
              <small>Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Social Links</h2>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="form-group">
              <label>GitHub</label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div className="form-group">
              <label>Twitter</label>
              <input
                type="url"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/yourusername"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Privacy Settings</h2>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="showInDirectory"
                  checked={formData.showInDirectory}
                  onChange={handleChange}
                />
                <span>Show my profile in the member directory</span>
              </label>
              <small>When enabled, other members can find and view your public profile</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving || loading}>
              <FiSave />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link to="/member" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MemberProfile



