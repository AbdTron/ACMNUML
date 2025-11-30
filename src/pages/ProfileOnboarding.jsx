import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { FiUser, FiHash, FiBookOpen, FiUsers, FiClock, FiArrowRight, FiSun, FiMoon, FiAward } from 'react-icons/fi'
import { DEPARTMENTS, DEGREES_BY_DEPARTMENT, SEMESTERS, SECTIONS, getDegreesForDepartment, getShiftsForDegree } from '../utils/universityData'
import './ProfileOnboarding.css'

const ProfileOnboarding = () => {
  const { currentUser, userProfile, refreshProfile } = useMemberAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    department: DEPARTMENTS[0],
    degree: '',
    semester: '1',
    section: 'A',
    shift: ''
  })

  const [availableDegrees, setAvailableDegrees] = useState([])
  const [availableShifts, setAvailableShifts] = useState([])

  useEffect(() => {
    // If user not logged in, redirect to login
    if (!currentUser) {
      navigate('/member/login')
      return
    }

    // If profile is already complete, redirect to dashboard
    if (userProfile?.profileComplete) {
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

  // Update available degrees when department changes
  useEffect(() => {
    const degrees = getDegreesForDepartment(formData.department)
    setAvailableDegrees(degrees)
    
    // Auto-select first degree if current selection is not available
    if (degrees.length > 0 && !degrees.find(d => d.name === formData.degree)) {
      setFormData(prev => ({
        ...prev,
        degree: degrees[0].name,
        shift: degrees[0].shifts.length === 1 ? degrees[0].shifts[0] : ''
      }))
    }
  }, [formData.department])

  // Update available shifts when degree changes
  useEffect(() => {
    const shifts = getShiftsForDegree(formData.department, formData.degree)
    setAvailableShifts(shifts)
    
    // Auto-select shift if only one option
    if (shifts.length === 1 && formData.shift !== shifts[0]) {
      setFormData(prev => ({
        ...prev,
        shift: shifts[0]
      }))
    } else if (shifts.length > 1 && !shifts.includes(formData.shift)) {
      setFormData(prev => ({
        ...prev,
        shift: ''
      }))
    }
  }, [formData.degree, formData.department])

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

    if (!formData.degree) {
      setError('Degree/Program is required')
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

    if (!formData.shift) {
      setError('Shift is required')
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
        degree: formData.degree,
        semester: formData.semester,
        section: formData.section.toUpperCase(),
        shift: formData.shift,
        email: currentUser.email,
        profileComplete: true,
        academicInfoLocked: true, // Lock academic info after first save
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
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Degree/Program */}
          <div className="form-field">
            <label htmlFor="degree">
              <FiAward />
              Degree/Program <span className="required">*</span>
            </label>
            <select
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              required
            >
              <option value="">Select Degree</option>
              {availableDegrees.map(deg => (
                <option key={deg.name} value={deg.name}>{deg.name}</option>
              ))}
            </select>
          </div>

          {/* Shift */}
          <div className="form-field">
            <label htmlFor="shift">
              {formData.shift === 'Morning' ? <FiSun /> : <FiMoon />}
              Shift <span className="required">*</span>
            </label>
            {availableShifts.length === 1 ? (
              <input
                type="text"
                value={availableShifts[0]}
                disabled
                className="disabled-input"
              />
            ) : (
              <select
                id="shift"
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                required
              >
                <option value="">Select Shift</option>
                {availableShifts.map(shift => (
                  <option key={shift} value={shift}>{shift}</option>
                ))}
              </select>
            )}
            {availableShifts.length === 1 && (
              <small className="field-hint">This program is only available in {availableShifts[0]} shift</small>
            )}
            {availableShifts.length > 1 && (
              <small className="field-hint">Please select either Morning or Evening shift</small>
            )}
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
                {SEMESTERS.map(sem => (
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
                {SECTIONS.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="info-box">
            <p><strong>Important:</strong></p>
            <ul>
              <li>Please fill in accurate information</li>
              <li>After saving, you'll need admin approval to change academic details</li>
              <li>This helps us verify NUML students</li>
              <li>Your information is kept private and secure</li>
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
