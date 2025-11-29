import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { Link } from 'react-router-dom'
import { FiSearch, FiUser, FiMail, FiGlobe, FiLinkedin, FiGithub, FiTwitter, FiShield } from 'react-icons/fi'
import { ROLES } from '../utils/permissions'
import './MemberDirectory.css'

const MemberDirectory = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMembers()
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
          <div className="loading">Loading member directory...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-directory-page">
      <div className="page-header">
        <div className="container">
          <h1>Member Directory</h1>
          <p>Connect with fellow ACM NUML members</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="search-section">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search members by name, bio, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <p className="member-count">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} found
            </p>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="empty-state">
              <FiUser />
              <h3>No members found</h3>
              <p>
                {members.length === 0
                  ? "No members have opted into the directory yet. If you just enabled this setting, try refreshing the page."
                  : "No members match your search criteria."}
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
                const isAdmin = member.role === ROLES.ADMIN || member.role === ROLES.SUPERADMIN
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
                <Link
                  key={member.id}
                  to={`/members/${member.id}`}
                  className={cardClass}
                >
                  <div className="member-avatar">
                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="member-info">
                    <h3>{member.name || 'Member'}</h3>
                    {(member.role === ROLES.ADMIN || member.role === ROLES.SUPERADMIN) && (
                      <span className="admin-badge">
                        <FiShield />
                        Admin
                      </span>
                    )}
                    {member.acmRole && (
                      <p className="member-acm-role">{member.acmRole}</p>
                    )}
                    {member.email && (
                      <p className="member-email">
                        <FiMail />
                        {member.email}
                      </p>
                    )}
                    {member.bio && (
                      <p className="member-bio">{member.bio}</p>
                    )}
                  </div>
                  <div className="member-social">
                    {member.website && (
                      <a
                        href={member.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
                        className="social-link"
                        title="Twitter"
                      >
                        <FiTwitter />
                      </a>
                    )}
                  </div>
                </Link>
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

