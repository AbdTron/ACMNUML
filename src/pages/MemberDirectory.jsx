import { useState, useEffect, useRef } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { Link } from 'react-router-dom'
import { FiSearch, FiUser, FiMail, FiGlobe, FiLinkedin, FiGithub, FiTwitter, FiShield, FiPhone } from 'react-icons/fi'
import { ROLES } from '../utils/permissions'
import { getAvatarUrlOrDefault } from '../utils/avatarUtils'
import { formatPhoneForWhatsApp } from '../utils/phoneUtils'
import StreamChatButton from '../components/StreamChatButton'
import './MemberDirectory.css'

const MemberDirectory = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    // Prevent duplicate fetches on re-mounts (React Strict Mode, context updates)
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchMembers()
    }
  }, [])

  const fetchMembers = async () => {
    if (!db) {
      console.warn('Firebase db not initialized')
      setLoading(false)
      return
    }

    try {
      // Fetch users who opted into the directory
      const usersRef = collection(db, 'users')
      const directoryQuery = query(
        usersRef,
        where('showInDirectory', '==', true)
        // Removed orderBy to avoid composite index requirement
      )
      const usersSnap = await getDocs(directoryQuery)

      const membersData = []
      usersSnap.forEach((doc) => {
        const data = doc.data()
        // Only include members with valid data
        if (data && (data.name || data.email)) {
          membersData.push({
            id: doc.id,
            ...data
          })
        }
      })

      // Sort in JavaScript after fetching
      membersData.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })

      console.log(`[MemberDirectory] Loaded ${membersData.length} members`)
      console.log('[MemberDirectory] Members data:', membersData.map(m => ({ id: m.id, name: m.name, showInDirectory: m.showInDirectory })))
      console.log('[MemberDirectory] Setting members state...')
      setMembers(membersData)
      console.log('[MemberDirectory] Members state set, filteredMembers will be:', membersData.length)
    } catch (error) {
      console.error('[MemberDirectory] Error fetching members:', error)
      // Set empty array on error to show empty state instead of infinite loading
      setMembers([])
      // Show user-friendly error message
      if (error.code === 'permission-denied') {
        console.error('[MemberDirectory] Permission denied - check Firestore rules')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      member.name?.toLowerCase().includes(search) ||
      member.bio?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search)
    )
  })

  // Debug logging for mobile
  useEffect(() => {
    console.log('[MemberDirectory] Render - members:', members.length, 'filtered:', filteredMembers.length, 'searchTerm:', searchTerm)
  }, [members, filteredMembers, searchTerm])

  if (loading) {
    return (
      <div className="member-directory-page">
        <div className="container">
          <div className="loading">Loading user directory...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-directory-page">
      <div className="page-header">
        <div className="container">
          <h1>User Directory</h1>
          <p>Connect with fellow ACM NUML Users</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="search-section">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search users by name, bio, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <p className="member-count">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'user' : 'users'} found
            </p>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="empty-state">
              <FiUser />
              <h3>No users found</h3>
              <p>
                {members.length === 0
                  ? "No users have opted into the directory yet. If you just enabled this setting, try refreshing the page."
                  : "No users match your search criteria."}
              </p>
              {members.length === 0 && (
                <button
                  onClick={() => {
                    window.location.reload()
                  }}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Refresh Page
                </button>
              )}
            </div>
          ) : (
            <div className="members-grid">
              {filteredMembers.map((member) => {
                const isAdmin = member.role === ROLES.ADMIN || member.role === ROLES.MAIN_ADMIN
                const isAcmMember = member.acmRole && member.acmRole.trim() !== ''

                // Determine card class based on role and ACM membership
                let cardClass = 'member-card'
                if (isAdmin && isAcmMember) {
                  cardClass = 'member-card member-card-admin-acm'
                } else if (isAdmin) {
                  cardClass = 'member-card member-card-admin'
                } else if (isAcmMember) {
                  cardClass = 'member-card member-card-acm'
                }

                return (
                  <div
                    key={member.id}
                    className={cardClass}
                  >
                    <Link
                      to={`/members/${member.id}`}
                      className="member-card-link"
                    >
                      <div className="member-avatar">
                        {(() => {
                          const avatarUrl = getAvatarUrlOrDefault(member.avatar || member.photoURL)
                          return avatarUrl ? (
                            <img src={avatarUrl} alt={member.name} />
                          ) : (
                            <span>{member.name?.charAt(0)?.toUpperCase() || '?'}</span>
                          )
                        })()}
                      </div>
                      <div className="member-info">
                        <h3>{member.name || 'User'}</h3>
                        {/* Display flairs from stored user profile */}
                        {member.flairs && member.flairs.length > 0 && (
                          <div className="member-flairs">
                            {member.flairs.map((flair, index) => (
                              <span key={index} className={`flair ${flair.class || ''}`}>
                                {flair.text}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Fallback: Show ACM role if no flairs stored (backward compatibility) */}
                        {(!member.flairs || member.flairs.length === 0) && member.acmRole && (
                          <p className="member-acm-role">{member.acmRole}</p>
                        )}
                        {/* Show contact based on user preferences - prioritize phone number */}
                        <div className="member-contact">
                          {/* Priority 1: Show phone if enabled */}
                          {member.showPhone && member.phone ? (
                            <a
                              href={`https://wa.me/${formatPhoneForWhatsApp(member.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="member-phone whatsapp-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FiPhone />
                              {member.phone}
                            </a>
                          ) : member.showEmail ? (
                            /* Priority 2: Show email if phone not available */
                            <p className="member-email">
                              <FiMail />
                              {member.emailType === 'display' && member.displayEmail && member.displayEmailVerified
                                ? member.displayEmail
                                : member.email}
                            </p>
                          ) : null}

                          {/* Fallback: if old data structure, show based on contactType */}
                          {!member.showEmail && !member.showPhone && member.showContactOnDirectory && (
                            <>
                              {member.contactType === 'phone' && member.phone ? (
                                <a
                                  href={`https://wa.me/${formatPhoneForWhatsApp(member.phone)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="member-phone whatsapp-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FiPhone />
                                  {member.phone}
                                </a>
                              ) : member.contactType === 'email' && member.email ? (
                                <p className="member-email">
                                  <FiMail />
                                  {member.email}
                                </p>
                              ) : member.contactType === 'displayEmail' && member.displayEmail && member.displayEmailVerified ? (
                                <p className="member-email">
                                  <FiMail />
                                  {member.displayEmail}
                                </p>
                              ) : null}
                            </>
                          )}
                        </div>
                        {member.bio && (
                          <p className="member-bio">{member.bio}</p>
                        )}
                      </div>
                    </Link>
                    <div className="member-social">
                      <StreamChatButton
                        userId={member.id}
                        userEmail={member.emailType === 'display' && member.displayEmail && member.displayEmailVerified
                          ? member.displayEmail
                          : member.email}
                        className="member-chat-button"
                      />
                      {member.website && (
                        <a
                          href={member.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link"
                          title="Website"
                        >
                          <FiGlobe />
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
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default MemberDirectory

