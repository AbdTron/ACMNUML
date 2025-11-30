import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { FiUser, FiHash, FiBookOpen, FiUsers, FiClock, FiArrowRight } from 'react-icons/fi'
import './ProfileOnboarding.css'

const ProfileOnboarding = () => {
  const { currentUser, userProfile, refreshProfile } = useMemberAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    department: 'Computer Science',
    semester: '1',
    section: 'A'
  })

  useEffect(() => {
    // If user not logged in, redirect to login
    if (!currentUser) {
      navigate('/member/login')
      return
    }

    // If profile is already complete, redirect to dashboard
    if (userProfile?.rollNumber && userProfile?.semester && userProfile?.department && userProfile?.section) {
      navigate('/member')
    }

    // Pre-fill name if available
    if (currentUser.displayName && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName
      }))
    }
  }, [currentUser, userProfile, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    if (!formData.rollNumber.trim()) {
      setError('Roll Number is required')
      return
    }

    if (!formData.department) {
      setError('Department is required')
      return
    }

    if (!formData.semester) {
      setError('Semester is required')
      return
    }

    if (!formData.section) {
      setError('Section is required')
      return
    }

    setLoading(true)

    try {
      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await setDoc(userRef, {
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        department: formData.department,
        semester: formData.semester,
        section: formData.section.toUpperCase(),
        email: currentUser.email,
        profileComplete: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true })

      // Refresh profile
      await refreshProfile()

      // Redirect to dashboard
      navigate('/member')
    } catch (err) {
      console.error('Error completing profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const departments = [
    'Computer Science',
    'Software Engineering',
    'Information Technology',
    'Cyber Security',
    'Data Science',
    'Artificial Intelligence'
  ]

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8']
  const sections = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Complete Your Profile</h1>
          <p>Help us personalize your ACM NUML experience</p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {/* Name */}
          <div className="form-field">
            <label htmlFor="name">
              <FiUser />
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Roll Number */}
          <div className="form-field">
            <label htmlFor="rollNumber">
              <FiHash />
              Roll Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="e.g., BSCS-21F-001"
              required
            />
            <small className="field-hint">Your university roll number</small>
          </div>

          {/* Department */}
          <div className="form-field">
            <label htmlFor="department">
              <FiBookOpen />
              Department <span className="required">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Semester and Section Row */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="semester">
                <FiClock />
                Current Semester <span className="required">*</span>
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
              >
                {semesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="section">
                <FiUsers />
                Section <span className="required">*</span>
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                required
              >
                {sections.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="info-box">
            <p><strong>Why do we need this?</strong></p>
            <ul>
              <li>Verify you're a NUML student</li>
              <li>Personalize your experience</li>
              <li>Connect you with classmates</li>
              <li>Manage event registrations</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : (
              <>
                Complete Profile
                <FiArrowRight />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileOnboarding

