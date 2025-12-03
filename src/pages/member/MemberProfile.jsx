import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { doc, updateDoc, addDoc, collection, query, where, getDocs, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useMemberAuth } from '../../context/MemberAuthContext'
import { sendDisplayEmailVerification } from '../../utils/emailService'
import { FiArrowLeft, FiUser, FiMail, FiSave, FiAlertCircle, FiPhone, FiCheckCircle, FiHash, FiBookOpen, FiClock, FiUsers, FiSun, FiMoon, FiAward, FiLock, FiSend } from 'react-icons/fi'
import { DEPARTMENTS, SEMESTERS, SECTIONS, getDegreesForDepartment, getShiftsForDegree } from '../../utils/universityData'
import AvatarSelector from '../../components/AvatarSelector'
import ChatSettings from '../../components/ChatSettings'
import './MemberProfile.css'

const MemberProfile = () => {
  const { currentUser, userProfile, updateProfile, refreshProfile, sendVerificationEmail, updateUserPassword, hasPasswordProvider } = useMemberAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [pendingRequest, setPendingRequest] = useState(null)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    displayEmail: '',
    phone: '',
    bio: '',
    rollNumber: '',
    department: DEPARTMENTS[0],
    degree: '',
    semester: '',
    section: '',
    shift: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    showInDirectory: false,
    showEmail: false,
    showPhone: false,
    emailType: 'account', // 'account' or 'display'
    avatar: ''
  })
  const [displayEmailVerificationSent, setDisplayEmailVerificationSent] = useState(false)
  const [availableDegrees, setAvailableDegrees] = useState([])
  const [availableShifts, setAvailableShifts] = useState([])
  const [requireApproval, setRequireApproval] = useState(true)

  // Fetch settings to check if approval is required
  useEffect(() => {
    const fetchSettings = async () => {
      if (!db) return
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setRequireApproval(data.requireAcademicChangeApproval !== false)
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
        // Default to requiring approval if error
        setRequireApproval(true)
      }
    }
    fetchSettings()
  }, [])

  // Check if academic info is locked
  // Locked if: approval is required AND user has filled it once AND doesn't have edit permission
  const isAcademicLocked = requireApproval && userProfile?.academicInfoLocked && !userProfile?.canEditAcademic

  useEffect(() => {
    if (!currentUser) {
      navigate('/member/login')
      return
    }
  }, [currentUser, navigate])

  // Check for pending change requests
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!currentUser) return
      
      try {
        const requestsRef = collection(db, 'profileChangeRequests')
        const q = query(
          requestsRef,
          where('userId', '==', currentUser.uid),
          where('status', '==', 'pending')
        )
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          setPendingRequest(snapshot.docs[0].data())
        } else {
          setPendingRequest(null)
        }
      } catch (err) {
        console.error('Error checking pending requests:', err)
      }
    }

    checkPendingRequest()
  }, [currentUser, requestSubmitted])

  useEffect(() => {
    // Load user profile data when userProfile changes
    if (userProfile) {
      const department = userProfile.department || DEPARTMENTS[0]
      const degree = userProfile.degree || ''
      
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || currentUser?.email || '',
        displayEmail: userProfile.displayEmail || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || '',
        rollNumber: userProfile.rollNumber || '',
        department: department,
        degree: degree,
        semester: userProfile.semester || '',
        section: userProfile.section || '',
        shift: userProfile.shift || '',
        website: userProfile.website || '',
        linkedin: userProfile.linkedin || '',
        github: userProfile.github || '',
        twitter: userProfile.twitter || '',
        showInDirectory: userProfile.showInDirectory || false,
        showEmail: userProfile.showEmail !== undefined ? userProfile.showEmail : (userProfile.showContactOnDirectory && (userProfile.contactType === 'email' || userProfile.contactType === 'displayEmail')),
        showPhone: userProfile.showPhone !== undefined ? userProfile.showPhone : (userProfile.showContactOnDirectory && userProfile.contactType === 'phone'),
        emailType: userProfile.emailType || (userProfile.contactType === 'displayEmail' ? 'display' : 'account'),
        avatar: userProfile.avatar || ''
      })
      
      // Initialize available degrees and shifts when profile loads
      const degrees = getDegreesForDepartment(department)
      console.log('Initializing degrees for department:', department, 'Degrees found:', degrees)
      setAvailableDegrees(degrees)
      
      if (degree) {
        const shifts = getShiftsForDegree(department, degree)
        console.log('Initializing shifts for degree:', degree, 'Shifts found:', shifts)
        setAvailableShifts(shifts)
      } else if (degrees.length > 0) {
        // If no degree selected, get shifts for first degree
        const shifts = getShiftsForDegree(department, degrees[0].name)
        setAvailableShifts(shifts)
      } else {
        setAvailableShifts([])
      }
      
      setDisplayEmailVerificationSent(false)
    } else if (currentUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || ''
      }))
    }
  }, [userProfile, currentUser])

  // Update available degrees when department changes
  useEffect(() => {
    if (!formData.department) return
    
    const degrees = getDegreesForDepartment(formData.department)
    setAvailableDegrees(degrees)
    
    // Auto-select first degree if current selection is not available
    if (degrees.length > 0 && !degrees.find(d => d.name === formData.degree)) {
      if (!isAcademicLocked) {
        setFormData(prev => ({
          ...prev,
          degree: degrees[0].name,
          shift: degrees[0].shifts.length === 1 ? degrees[0].shifts[0] : ''
        }))
      }
    }
  }, [formData.department, isAcademicLocked])

  // Update available shifts when degree changes
  useEffect(() => {
    if (!formData.department || !formData.degree) return
    
    const shifts = getShiftsForDegree(formData.department, formData.degree)
    setAvailableShifts(shifts)
    
    // Auto-select shift if only one option
    if (!isAcademicLocked) {
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
    }
  }, [formData.degree, formData.department, isAcademicLocked])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let processedValue = value
    
    // Phone number: only allow numbers
    if (name === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '')
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }))
    setError(null)
    setSuccess(false)
    
    if (name === 'displayEmail') {
      setDisplayEmailVerificationSent(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setChangingPassword(true)

    try {
      await updateUserPassword(newPassword)
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error changing password:', err)
      setError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDisplayEmailVerification = async () => {
    if (!formData.displayEmail || !formData.displayEmail.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const verificationToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const verificationUrl = `${window.location.origin}/verify-display-email?token=${verificationToken}&email=${encodeURIComponent(formData.displayEmail)}`
      
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        displayEmail: formData.displayEmail,
        displayEmailVerified: false,
        displayEmailVerificationToken: verificationToken,
        displayEmailVerificationSent: true,
        updatedAt: new Date().toISOString()
      })
      
      try {
        await sendDisplayEmailVerification(
          formData.displayEmail,
          verificationUrl,
          formData.name || userProfile?.name || 'User'
        )
        setDisplayEmailVerificationSent(true)
        setSuccess(true)
        setError(null)
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        setError(`Failed to send email: ${emailError.message}`)
        
        const useLink = confirm(
          `Email could not be sent automatically.\n\nWould you like to copy the verification link instead?`
        )
        
        if (useLink) {
          navigator.clipboard.writeText(verificationUrl).then(() => {
            alert(`Verification link copied to clipboard!`)
          }).catch(() => {
            alert(`Please use this verification link:\n\n${verificationUrl}`)
          })
        }
      }
    } catch (err) {
      console.error('Error sending verification email:', err)
      setError(err.message || 'Failed to send verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestChange = async () => {
    if (pendingRequest) {
      setError('You already have a pending change request. Please wait for admin approval.')
      return
    }

    if (!currentUser || !userProfile) {
      setError('User information not available. Please refresh the page.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create a change request
      const requestData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userProfile?.name || 'Unknown',
        currentData: {
          rollNumber: userProfile?.rollNumber || '',
          department: userProfile?.department || '',
          degree: userProfile?.degree || '',
          semester: userProfile?.semester || '',
          section: userProfile?.section || '',
          shift: userProfile?.shift || ''
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        reason: 'User requested to update academic information'
      }

      console.log('Submitting change request:', requestData)
      const docRef = await addDoc(collection(db, 'profileChangeRequests'), requestData)
      console.log('Change request submitted successfully with ID:', docRef.id)

      setRequestSubmitted(true)
      setSuccess(true)
      
      // Show success message
      alert(`Your request has been submitted successfully!\n\nRequest ID: ${docRef.id}\n\nAn admin will review your request shortly. You'll be able to edit your academic information once approved.`)
      
      // Refresh pending request check
      setTimeout(() => {
        const checkPending = async () => {
          try {
            const requestsRef = collection(db, 'profileChangeRequests')
            const q = query(
              requestsRef,
              where('userId', '==', currentUser.uid),
              where('status', '==', 'pending')
            )
            const snapshot = await getDocs(q)
            if (!snapshot.empty) {
              setPendingRequest(snapshot.docs[0].data())
            }
          } catch (err) {
            console.error('Error checking pending requests:', err)
          }
        }
        checkPending()
      }, 1000)
    } catch (err) {
      console.error('Error submitting change request:', err)
      setError(`Failed to submit change request: ${err.message}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser || !db) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate email settings
      if (formData.showEmail) {
        if (formData.emailType === 'display') {
          if (!formData.displayEmail.trim()) {
            setError('Display email is required when showing email on members page')
            setSaving(false)
            return
          }
          if (!userProfile?.displayEmailVerified) {
            setError('Display email must be verified before it can be shown on members page')
            setSaving(false)
            return
          }
        }
      }
      
      // Validate phone settings
      if (formData.showPhone && !formData.phone.trim()) {
        setError('Phone number is required when showing phone on members page')
        setSaving(false)
        return
      }
      
      // At least one contact method should be enabled if showing in directory
      if (formData.showInDirectory && !formData.showEmail && !formData.showPhone) {
        setError('Please enable at least one contact method (Email or Phone) to show in directory')
        setSaving(false)
        return
      }

      const userRef = doc(db, 'users', currentUser.uid)
      
      // Base update data (non-academic fields)
      const updateData = {
        name: formData.name.trim(),
        displayEmail: formData.displayEmail.trim() || null,
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        website: formData.website.trim() || null,
        linkedin: formData.linkedin.trim() || null,
        github: formData.github.trim() || null,
        twitter: formData.twitter.trim() || null,
        showInDirectory: formData.showInDirectory,
        showEmail: formData.showEmail,
        showPhone: formData.showPhone,
        emailType: formData.emailType,
        // Keep old fields for backward compatibility
        showContactOnDirectory: formData.showEmail || formData.showPhone,
        contactType: formData.showPhone ? 'phone' : (formData.emailType === 'display' ? 'displayEmail' : 'email'),
        avatar: formData.avatar || null,
        updatedAt: new Date().toISOString()
      }

      // Only update academic fields if not locked or if user has edit permission
      // If approval is not required, always allow editing
      if (!isAcademicLocked) {
        updateData.rollNumber = formData.rollNumber.trim().toUpperCase()
        updateData.department = formData.department
        updateData.degree = formData.degree
        updateData.semester = formData.semester
        updateData.section = formData.section.toUpperCase()
        updateData.shift = formData.shift
        updateData.profileComplete = !!(
          formData.rollNumber && 
          formData.department && 
          formData.degree && 
          formData.semester && 
          formData.section && 
          formData.shift
        )
        
        // Only lock if approval is required
        if (requireApproval) {
          updateData.academicInfoLocked = true // Lock after first save
          updateData.canEditAcademic = false
        } else {
          // If approval not required, don't lock
          updateData.academicInfoLocked = false
          updateData.canEditAcademic = true
        }
      }
      
      await updateDoc(userRef, updateData)
      await updateProfile(updateData)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // Refresh profile to get latest data
      await refreshProfile()
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

        {pendingRequest && (
          <div className="info-banner">
            <FiClock />
            <span>You have a pending request to change your academic information. Please wait for admin approval.</span>
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
                Account Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="disabled-input"
                placeholder="Email address"
              />
              <div className="email-status">
                {currentUser?.emailVerified ? (
                  <span className="verified-badge">
                    <FiCheckCircle />
                    Verified
                  </span>
                ) : (
                  <span className="unverified-badge">
                    <FiAlertCircle />
                    Not verified
                  </span>
                )}
              </div>
              {!currentUser?.emailVerified && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await sendVerificationEmail()
                      setSuccess(true)
                      setTimeout(() => setSuccess(false), 3000)
                    } catch (err) {
                      setError(err.message || 'Failed to send verification email')
                    }
                  }}
                  className="btn btn-secondary btn-small"
                >
                  Send Verification Email
                </button>
              )}
            </div>

            {/* Password Change Section - Show for all users */}
            <div className="form-group">
              <div className="password-change-header">
                <label>
                  <FiLock />
                  Password
                </label>
                {!showPasswordChange && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(true)}
                    className="btn btn-secondary btn-small"
                  >
                    {hasPasswordProvider() ? 'Change Password' : 'Set Password'}
                  </button>
                )}
              </div>
              {showPasswordChange && (
                <div className="password-change-form">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={changingPassword}
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={changingPassword}
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      className="btn btn-primary btn-small"
                      disabled={changingPassword || !newPassword || !confirmPassword}
                    >
                      {changingPassword ? 'Updating...' : (hasPasswordProvider() ? 'Update Password' : 'Set Password')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false)
                        setNewPassword('')
                        setConfirmPassword('')
                        setError(null)
                      }}
                      className="btn btn-secondary btn-small"
                      disabled={changingPassword}
                    >
                      Cancel
                    </button>
                  </div>
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-light)' }}>
                    Password must be at least 6 characters long.
                  </small>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                <FiMail />
                Display Email (Optional)
              </label>
              <div className="email-change-group">
                <input
                  type="email"
                  name="displayEmail"
                  value={formData.displayEmail}
                  onChange={handleChange}
                  placeholder="Enter email to show on member card"
                  disabled={loading}
                />
                {formData.displayEmail && formData.displayEmail !== formData.email && (
                  <button
                    type="button"
                    onClick={handleDisplayEmailVerification}
                    className="btn btn-secondary"
                    disabled={loading || !formData.displayEmail.includes('@') || userProfile?.displayEmailVerified}
                  >
                    {userProfile?.displayEmailVerified ? 'Verified' : 'Verify Email'}
                  </button>
                )}
              </div>
              {displayEmailVerificationSent && !userProfile?.displayEmailVerified && (
                <small className="success-text">
                  Verification email sent! Please check your email and click the verification link.
                </small>
              )}
              {userProfile?.displayEmailVerified && formData.displayEmail && (
                <small className="success-text">
                  <FiCheckCircle /> Display email is verified
                </small>
              )}
              <small>Enter a different email to show on your member card. Must be verified.</small>
            </div>

            <div className="form-group">
              <label>
                <FiPhone />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number (numbers only)"
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <small>Only numbers are allowed</small>
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

            <AvatarSelector
              currentAvatar={formData.avatar}
              acmRole={userProfile?.acmRole}
              isAdmin={userProfile?.role === 'admin' || userProfile?.role === 'mainadmin'}
              onSelect={(avatarPath) => {
                setFormData(prev => ({
                  ...prev,
                  avatar: avatarPath
                }))
              }}
            />
          </div>

          <div className="form-section">
            <div className="section-header-with-action">
              <h2>
                Academic Information
                {isAcademicLocked && <FiLock className="lock-icon" />}
              </h2>
              {isAcademicLocked && !pendingRequest && requireApproval && (
                <button
                  type="button"
                  onClick={handleRequestChange}
                  className="btn btn-outline btn-small"
                  disabled={loading}
                >
                  <FiSend />
                  Request Change
                </button>
              )}
            </div>
            
            {isAcademicLocked && requireApproval && (
              <div className="locked-notice">
                <FiLock />
                <span>Academic information is locked. To make changes, request admin approval.</span>
              </div>
            )}
            
            {!requireApproval && (
              <div className="info-banner" style={{ background: '#dbeafe', borderColor: '#93c5fd', color: '#1e40af' }}>
                <FiCheckCircle />
                <span>Academic information can be edited freely. Admin approval is not required.</span>
              </div>
            )}

            <div className="form-group">
              <label>
                <FiHash />
                Roll Number *
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                required
                placeholder="e.g., BSCS-21F-001"
                disabled={isAcademicLocked}
                className={isAcademicLocked ? 'disabled-input' : ''}
              />
              <small>Your university roll number</small>
            </div>

            <div className="form-group">
              <label>
                <FiBookOpen />
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                disabled={isAcademicLocked}
                className={isAcademicLocked ? 'disabled-input' : ''}
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <FiAward />
                Degree/Program *
              </label>
              <select
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                required
                disabled={isAcademicLocked}
                className={isAcademicLocked ? 'disabled-input' : ''}
              >
                <option value="">Select Degree</option>
                {availableDegrees.length > 0 ? (
                  availableDegrees.map(deg => (
                    <option key={deg.name} value={deg.name}>{deg.name}</option>
                  ))
                ) : formData.degree ? (
                  <option value={formData.degree}>{formData.degree}</option>
                ) : null}
              </select>
              {availableDegrees.length === 0 && formData.department && (
                <small className="error-text">No degrees available for this department. Please select a different department.</small>
              )}
            </div>

            <div className="form-group">
              <label>
                {formData.shift === 'Morning' ? <FiSun /> : <FiMoon />}
                Shift *
              </label>
              {availableShifts.length === 1 ? (
                <>
                  <input
                    type="text"
                    value={availableShifts[0]}
                    disabled
                    className="disabled-input"
                  />
                  <small>This program is only available in {availableShifts[0]} shift</small>
                </>
              ) : (
                <>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleChange}
                    required
                    disabled={isAcademicLocked}
                    className={isAcademicLocked ? 'disabled-input' : ''}
                  >
                    <option value="">Select Shift</option>
                    {availableShifts.map(shift => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>
                  {availableShifts.length > 1 && (
                    <small className="field-hint">Please select either Morning or Evening shift</small>
                  )}
                </>
              )}
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label>
                  <FiClock />
                  Current Semester *
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  disabled={isAcademicLocked}
                  className={isAcademicLocked ? 'disabled-input' : ''}
                >
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FiUsers />
                  Section *
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  disabled={isAcademicLocked}
                  className={isAcademicLocked ? 'disabled-input' : ''}
                >
                  <option value="">Select Section</option>
                  {SECTIONS.map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>
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

            <div className="form-group">
              <label>Contact Information Display</label>
              <small>Choose which contact methods to show on your public profile and member card</small>
              
              <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="showEmail"
                    checked={formData.showEmail}
                    onChange={handleChange}
                    disabled={!formData.showInDirectory}
                  />
                  <span>Show Email</span>
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="showPhone"
                    checked={formData.showPhone}
                    onChange={handleChange}
                    disabled={!formData.showInDirectory}
                  />
                  <span>Show Phone Number</span>
                </label>
              </div>

              {formData.showEmail && (
                <div className="form-group radio-group" style={{ marginTop: '1rem', marginLeft: '1.5rem' }}>
                  <label>Email Type</label>
                  <div className="radio-options">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="emailType"
                        value="account"
                        checked={formData.emailType === 'account'}
                        onChange={handleChange}
                      />
                      <span>Account Email (no verification needed)</span>
                    </label>
                    {formData.displayEmail && (
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="emailType"
                          value="display"
                          checked={formData.emailType === 'display'}
                          onChange={handleChange}
                          disabled={!userProfile?.displayEmailVerified}
                        />
                        <span>Display Email {!userProfile?.displayEmailVerified && '(must be verified)'}</span>
                      </label>
                    )}
                  </div>
                  {formData.emailType === 'display' && !userProfile?.displayEmailVerified && (
                    <small className="error-text">Please verify your display email first</small>
                  )}
                </div>
              )}
              
              {formData.showPhone && !formData.phone && (
                <small className="error-text" style={{ marginLeft: '1.5rem', display: 'block', marginTop: '0.5rem' }}>
                  Please enter your phone number above
                </small>
              )}
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

        <ChatSettings />
      </div>
    </div>
  )
}

export default MemberProfile
