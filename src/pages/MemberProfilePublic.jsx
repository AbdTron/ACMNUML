import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiArrowLeft, FiUser, FiMail, FiGlobe, FiLinkedin, FiGithub, FiTwitter, FiCalendar, FiPhone } from 'react-icons/fi'
import { format } from 'date-fns'
import { getAvatarUrlOrDefault } from '../utils/avatarUtils'
import { formatPhoneForWhatsApp } from '../utils/phoneUtils'
import './MemberProfilePublic.css'

const MemberProfilePublic = () => {
  const { memberId } = useParams()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMemberProfile()
  }, [memberId])

  const fetchMemberProfile = async () => {
    if (!db || !memberId) {
      setLoading(false)
      return
    }

    try {
      const userRef = doc(db, 'users', memberId)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) {
        setError('User profile not found')
        setLoading(false)
        return
      }

      const userData = userSnap.data()
      
      // Check if member opted into directory
      if (!userData.showInDirectory) {
        setError('This user profile is not available in the directory')
        setLoading(false)
        return
      }

      setMember({
        id: userSnap.id,
        ...userData,
        joinDate: userData.joinDate?.toDate ? userData.joinDate.toDate() : (userData.joinDate ? new Date(userData.joinDate) : null)
      })
    } catch (err) {
      console.error('Error fetching member profile:', err)
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="member-profile-public-page">
        <div className="container">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="member-profile-public-page">
        <div className="container">
          <Link to="/members" className="back-link">
            <FiArrowLeft /> Back to Directory
          </Link>
          <div className="error-state">
            <FiUser />
            <h3>{error || 'User profile not found'}</h3>
            <Link to="/members" className="btn btn-primary">
              Browse Directory
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-profile-public-page">
      <div className="container">
        <Link to="/members" className="back-link">
          <FiArrowLeft /> Back to Directory
        </Link>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {(() => {
                const avatarUrl = getAvatarUrlOrDefault(member.avatar || member.photoURL)
                return avatarUrl ? (
                  <img src={avatarUrl} alt={member.name || 'Member'} />
                ) : (
                  <span>{member.name?.charAt(0)?.toUpperCase() || '?'}</span>
                )
              })()}
            </div>
            <div className="profile-info">
              <h1>{member.name || 'Member'}</h1>
              {member.bio && (
                <p className="profile-bio">{member.bio}</p>
              )}
              {member.joinDate && (
                <p className="join-date">
                  <FiCalendar />
                  User since {format(member.joinDate, 'MMMM yyyy')}
                </p>
              )}
            </div>
          </div>

          <div className="profile-details">
            {/* Show email if enabled (new structure) */}
            {member.showEmail && (
              <div className="detail-item">
                <FiMail />
                <div>
                  <label>Email</label>
                  <a href={`mailto:${member.emailType === 'display' && member.displayEmail && member.displayEmailVerified ? member.displayEmail : member.email}`}>
                    {member.emailType === 'display' && member.displayEmail && member.displayEmailVerified ? member.displayEmail : member.email}
                  </a>
                </div>
              </div>
            )}
            
            {/* Show phone if enabled (new structure) */}
            {member.showPhone && member.phone && (
              <div className="detail-item">
                <FiPhone />
                <div>
                  <label>Phone</label>
                  <a 
                    href={`https://wa.me/${formatPhoneForWhatsApp(member.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-link"
                  >
                    {member.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Fallback: Show contact based on old data structure if new structure not used */}
            {!member.showEmail && !member.showPhone && member.showContactOnDirectory && (
              <>
                {member.contactType === 'email' && member.email && (
                  <div className="detail-item">
                    <FiMail />
                    <div>
                      <label>Email</label>
                      <a href={`mailto:${member.email}`}>
                        {member.email}
                      </a>
                    </div>
                  </div>
                )}
                {member.contactType === 'displayEmail' && member.displayEmail && member.displayEmailVerified && (
                  <div className="detail-item">
                    <FiMail />
                    <div>
                      <label>Email</label>
                      <a href={`mailto:${member.displayEmail}`}>
                        {member.displayEmail}
                      </a>
                    </div>
                  </div>
                )}
                {member.contactType === 'phone' && member.phone && (
                  <div className="detail-item">
                    <FiPhone />
                    <div>
                      <label>Phone</label>
                      <a 
                        href={`https://wa.me/${formatPhoneForWhatsApp(member.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-link"
                      >
                        {member.phone}
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}

            {(member.website || member.linkedin || member.github || member.twitter) && (
              <div className="detail-item social-detail-item">
                <label>Social Links</label>
                <div className="social-links">
                  {member.website && (
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Website"
                    >
                      <FiGlobe />
                      <span>Website</span>
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="LinkedIn"
                    >
                      <FiLinkedin />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="GitHub"
                    >
                      <FiGithub />
                      <span>GitHub</span>
                    </a>
                  )}
                  {member.twitter && (
                    <a
                      href={member.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Twitter"
                    >
                      <FiTwitter />
                      <span>Twitter</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberProfilePublic




