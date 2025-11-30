import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useMemberAuth } from '../../context/MemberAuthContext'
import { sendDisplayEmailVerification } from '../../utils/emailService'
import { FiArrowLeft, FiUser, FiMail, FiSave, FiAlertCircle, FiPhone, FiCheckCircle } from 'react-icons/fi'
import './MemberProfile.css'

const MemberProfile = () => {
  const { currentUser, userProfile, updateProfile, refreshProfile, sendVerificationEmail } = useMemberAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    displayEmail: '', // Separate email for display on member card
    phone: '',
    bio: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    showInDirectory: false,
    showContactOnDirectory: false,
    contactType: 'email' // 'email' or 'phone'
  })
  const [displayEmailVerificationSent, setDisplayEmailVerificationSent] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      navigate('/member/login')
      return
    }
  }, [currentUser, navigate])

  useEffect(() => {
    // Load user profile data when userProfile changes
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || currentUser?.email || '',
        displayEmail: userProfile.displayEmail || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || '',
        website: userProfile.website || '',
        linkedin: userProfile.linkedin || '',
        github: userProfile.github || '',
        twitter: userProfile.twitter || '',
        showInDirectory: userProfile.showInDirectory || false,
        showContactOnDirectory: userProfile.showContactOnDirectory || false,
        contactType: userProfile.contactType || 'email'
      })
      setDisplayEmailVerificationSent(false)
    } else if (currentUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || ''
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.displayEmailVerified, userProfile?.displayEmail, userProfile?.name, userProfile?.phone, userProfile?.bio, userProfile?.showInDirectory, userProfile?.showContactOnDirectory, userProfile?.contactType, currentUser?.email])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let processedValue = value
    
    // Phone number: only allow numbers
    if (name === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '')
    }
    
    // Don't validate display email during typing - only on verify button click
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }))
    setError(null)
    setSuccess(false)
    
    // Reset display email verification status if display email changes
    if (name === 'displayEmail') {
      setDisplayEmailVerificationSent(false)
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
      // Generate a simple verification token (in production, use a more secure method)
      const verificationToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const verificationUrl = `${window.location.origin}/verify-display-email?token=${verificationToken}&email=${encodeURIComponent(formData.displayEmail)}`
      
      // Save verification token and email to Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        displayEmail: formData.displayEmail,
        displayEmailVerified: false,
        displayEmailVerificationToken: verificationToken,
        displayEmailVerificationSent: true,
        updatedAt: new Date().toISOString()
      })
      
      // Try to send verification email
      try {
        console.log('Attempting to send verification email...')
        await sendDisplayEmailVerification(
          formData.displayEmail,
          verificationUrl,
          formData.name || userProfile?.name || 'User'
        )
        setDisplayEmailVerificationSent(true)
        setSuccess(true)
        setError(null)
        console.log('✅ Email sent successfully!')
      } catch (emailError) {
        // Log the full error for debugging
        console.error('❌ Email sending failed:', emailError)
        setError(`Failed to send email: ${emailError.message}. Check browser console for details.`)
        
        // Show the verification link as fallback
        const useLink = confirm(
          `Email could not be sent automatically.\n\n` +
          `Error: ${emailError.message}\n\n` +
          `Would you like to copy the verification link instead?\n\n` +
          `(Check browser console for more details)`
        )
        
        if (useLink) {
          navigator.clipboard.writeText(verificationUrl).then(() => {
            alert(`Verification link copied to clipboard!\n\n${verificationUrl}\n\nPaste it in your browser to verify.`)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser || !db) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate contact type requirements
      if (formData.showContactOnDirectory) {
        if (formData.contactType === 'displayEmail') {
          // Display email must be verified
          const displayEmailVerified = userProfile?.displayEmailVerified || false
          if (!displayEmailVerified || !formData.displayEmail) {
            setError('Display email must be verified before it can be shown on the members page. Please verify your display email first.')
            setSaving(false)
            return
          }
        }
        if (formData.contactType === 'phone' && !formData.phone.trim()) {
          setError('Phone number is required when showing contact on members page')
          setSaving(false)
          return
        }
        // Account email (contactType === 'email') doesn't need verification
      }

      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid)
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
        showContactOnDirectory: formData.showContactOnDirectory,
        contactType: formData.contactType,
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(userRef, updateData)

      // Update profile in context
      await updateProfile({
        name: formData.name.trim(),
        displayEmail: formData.displayEmail.trim() || null,
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        website: formData.website.trim() || null,
        linkedin: formData.linkedin.trim() || null,
        github: formData.github.trim() || null,
        twitter: formData.twitter.trim() || null,
        showInDirectory: formData.showInDirectory,
        showContactOnDirectory: formData.showContactOnDirectory,
        contactType: formData.contactType
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
                  placeholder="Enter email to show on member card (different from account email)"
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
              <small>Enter a different email address to show on your member card. This email must be verified.</small>
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

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="showContactOnDirectory"
                  checked={formData.showContactOnDirectory}
                  onChange={handleChange}
                  disabled={!formData.showInDirectory}
                />
                <span>Show contact on Users page</span>
              </label>
              <small>When enabled, your selected contact method will be displayed on your member card</small>
            </div>

            {formData.showContactOnDirectory && (
              <div className="form-group radio-group">
                <label>Contact Type</label>
                <div className="radio-options">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="contactType"
                      value="email"
                      checked={formData.contactType === 'email'}
                      onChange={handleChange}
                    />
                    <span>Account Email (no verification needed)</span>
                  </label>
                  {formData.displayEmail && (
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="contactType"
                        value="displayEmail"
                        checked={formData.contactType === 'displayEmail'}
                        onChange={handleChange}
                        disabled={!userProfile?.displayEmailVerified}
                      />
                      <span>Display Email {!userProfile?.displayEmailVerified && '(must be verified)'}</span>
                    </label>
                  )}
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="contactType"
                      value="phone"
                      checked={formData.contactType === 'phone'}
                      onChange={handleChange}
                    />
                    <span>Phone Number</span>
                  </label>
                </div>
                {formData.contactType === 'displayEmail' && !userProfile?.displayEmailVerified && (
                  <small className="error-text">Please verify your display email first to show it on the members page</small>
                )}
                {formData.contactType === 'phone' && !formData.phone && (
                  <small className="error-text">Please enter your phone number first</small>
                )}
              </div>
            )}
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




