import { useState, useEffect } from 'react'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiLinkedin, FiGithub, FiMail, FiTwitter } from 'react-icons/fi'
import { getCropBackgroundStyle } from '../utils/cropStyles'
import './Team.css'

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [teamHead, setTeamHead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [socialHovered, setSocialHovered] = useState(null)
  const [imagesLoading, setImagesLoading] = useState({})

  useEffect(() => {
    const fetchTeam = async () => {
      if (!db) {
        setLoading(false)
        return
      }
      try {
        const teamRef = collection(db, 'team')
        const q = query(teamRef, orderBy('order', 'asc'))
        
        const querySnapshot = await getDocs(q)
        const members = []
        const loadingStates = {}
        let headMember = null
        
        querySnapshot.forEach((doc) => {
          const member = { id: doc.id, ...doc.data() }
          
          // Check if this is the head/faculty
          const isHead = member.memberType === 'head' || 
                        member.memberType === 'faculty' ||
                        member.role?.toLowerCase().includes('head') ||
                        member.role?.toLowerCase().includes('faculty') ||
                        member.role?.toLowerCase().includes('advisor')
          
          if (isHead) {
            headMember = member
          } else {
            members.push(member)
          }
          
          // Initialize loading state for each member with an image
          if (member.image) {
            loadingStates[member.id] = true
            // Preload image
            const img = new Image()
            img.onload = () => {
              setImagesLoading(prev => ({ ...prev, [member.id]: false }))
            }
            img.onerror = () => {
              setImagesLoading(prev => ({ ...prev, [member.id]: false }))
            }
            img.src = member.image
          }
        })
        console.log(`[Team] Loaded ${members.length} team members${headMember ? ' and 1 head' : ''}`)
        setTeamMembers(members)
        setTeamHead(headMember)
        setImagesLoading(loadingStates)
      } catch (error) {
        console.error('[Team] Error fetching team:', error)
        // Set empty arrays on error to show empty state
        setTeamMembers([])
        setTeamHead(null)
        if (error.code === 'permission-denied') {
          console.error('[Team] Permission denied - check Firestore rules')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [])

  // Improved filtering logic to handle role variations
  const filteredMembers = filter === 'all' 
    ? teamMembers 
    : teamMembers.filter(member => {
        if (!member.role) return false
        const memberRole = member.role.toLowerCase().trim()
        const filterRole = filter.toLowerCase().trim()
        
        // Exact match
        if (memberRole === filterRole) return true
        
        // Handle variations like "vice president" vs "vice-president"
        const normalizedMemberRole = memberRole.replace(/[-\s]+/g, ' ')
        const normalizedFilterRole = filterRole.replace(/[-\s]+/g, ' ')
        if (normalizedMemberRole === normalizedFilterRole) return true
        
        // Partial match for roles like "Vice President" matching "vice president"
        if (memberRole.includes(filterRole) || filterRole.includes(memberRole)) return true
        
        return false
      })

  const getMemberImage = (member) => {
    if (member.image) return member.image
    const initials = encodeURIComponent(member.name || 'ACM')
    return `https://ui-avatars.com/api/?name=${initials}&background=2563eb&color=fff`
  }

  const roles = ['all', 'president', 'vice president', 'secretary', 'treasurer', 'member']

  return (
    <div className="team-page">
      <div className="page-header">
        <div className="container">
          <h1>Our Team</h1>
          <p>Meet the passionate individuals driving innovation at ACM NUML</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Head Section */}
          {teamHead && (
            <div className="team-head-section">
              <div className="team-grid team-head-grid">
                {(() => {
                  const imageUrl = getMemberImage(teamHead)
                  const cropStyle = getCropBackgroundStyle(imageUrl, teamHead.imageCrops?.profile)
                  const isLoading = imagesLoading[teamHead.id]
                  return (
                    <div 
                      key={teamHead.id} 
                      className={`team-card ${teamHead.bio ? 'has-bio' : ''} ${socialHovered === teamHead.id ? 'social-hovered' : ''}`}
                      onMouseLeave={() => setSocialHovered(null)}
                    >
                      <div className="team-card-inner">
                        <div className="team-card-front">
                          <div className="team-flip-trigger">
                            <div className="team-image-wrapper">
                              {imageUrl && imageUrl !== `https://ui-avatars.com/api/?name=${encodeURIComponent(teamHead.name || 'ACM')}&background=2563eb&color=fff` ? (
                                <>
                                  {isLoading && (
                                    <div className="team-image-loading">
                                      <div className="loading-spinner"></div>
                                    </div>
                                  )}
                                  <div 
                                    className={`team-image ${isLoading ? 'loading' : ''}`} 
                                    style={cropStyle} 
                                  />
                                </>
                              ) : (
                                <div className="team-image-placeholder">{teamHead.name?.charAt(0)}</div>
                              )}
                            </div>
                            <div className="team-info">
                              <h3 className="team-name">{teamHead.name}</h3>
                              <p className="team-role">{teamHead.role}</p>
                              <ul className="team-meta">
                                {teamHead.email && <li>{teamHead.email}</li>}
                              </ul>
                              <div 
                                className="team-social"
                                onMouseEnter={() => setSocialHovered(teamHead.id)}
                              >
                              {teamHead.linkedin && (
                                <a
                                  className="social-link"
                                  href={teamHead.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="LinkedIn"
                                >
                                  <FiLinkedin />
                                </a>
                              )}
                              {teamHead.github && (
                                <a
                                  className="social-link"
                                  href={teamHead.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="GitHub"
                                >
                                  <FiGithub />
                                </a>
                              )}
                              {teamHead.twitter && (
                                <a
                                  className="social-link"
                                  href={teamHead.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Twitter"
                                >
                                  <FiTwitter />
                                </a>
                              )}
                              {teamHead.email && (
                                <a className="social-link" href={`mailto:${teamHead.email}`} aria-label="Email">
                                  <FiMail />
                                </a>
                              )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {teamHead.bio && (
                          <div className="team-card-back">
                            <div className="team-bio-content">
                              <h3 className="team-name">{teamHead.name}</h3>
                              <p className="team-role">{teamHead.role}</p>
                              <p className="team-bio">{teamHead.bio}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Team Members Section */}
          <div className="team-members-section">
            <div className="team-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Members
            </button>
            {roles.filter(r => r !== 'all').map(role => {
              // Improved role matching for filter buttons
              const membersWithRole = teamMembers.filter(m => {
                if (!m.role) return false
                const memberRole = m.role.toLowerCase().trim()
                const filterRole = role.toLowerCase().trim()
                
                // Exact match
                if (memberRole === filterRole) return true
                
                // Handle variations
                const normalizedMemberRole = memberRole.replace(/[-\s]+/g, ' ')
                const normalizedFilterRole = filterRole.replace(/[-\s]+/g, ' ')
                if (normalizedMemberRole === normalizedFilterRole) return true
                
                // Partial match
                if (memberRole.includes(filterRole) || filterRole.includes(memberRole)) return true
                
                return false
              })
              if (membersWithRole.length === 0) return null
              return (
                <button
                  key={role}
                  className={`filter-btn ${filter === role ? 'active' : ''}`}
                  onClick={() => setFilter(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}s
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="loading">Loading team members...</div>
          ) : filteredMembers.length > 0 ? (
            <div className="team-grid">
              {filteredMembers.map((member) => {
                const imageUrl = getMemberImage(member)
                const cropStyle = getCropBackgroundStyle(imageUrl, member.imageCrops?.profile)
                return (
                <div 
                  key={member.id} 
                  className={`team-card ${member.bio ? 'has-bio' : ''} ${socialHovered === member.id ? 'social-hovered' : ''}`}
                  onMouseLeave={() => setSocialHovered(null)}
                >
                  <div className="team-card-inner">
                    <div className="team-card-front">
                      <div className="team-flip-trigger">
                        <div className="team-image-wrapper">
                          {imageUrl && imageUrl !== `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'ACM')}&background=2563eb&color=fff` ? (
                            <>
                              {imagesLoading[member.id] && (
                                <div className="team-image-loading">
                                  <div className="loading-spinner"></div>
                                </div>
                              )}
                              <div 
                                className={`team-image ${imagesLoading[member.id] ? 'loading' : ''}`} 
                                style={cropStyle} 
                              />
                            </>
                          ) : (
                            <div className="team-image-placeholder">{member.name?.charAt(0)}</div>
                          )}
                        </div>
                        <div className="team-info">
                          <h3 className="team-name">{member.name}</h3>
                          <p className="team-role">{member.role}</p>
                          <ul className="team-meta">
                            {member.email && <li>{member.email}</li>}
                          </ul>
                          <div 
                            className="team-social"
                            onMouseEnter={() => setSocialHovered(member.id)}
                          >
                          {member.linkedin && (
                            <a
                              className="social-link"
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="LinkedIn"
                            >
                              <FiLinkedin />
                            </a>
                          )}
                          {member.github && (
                            <a
                              className="social-link"
                              href={member.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="GitHub"
                            >
                              <FiGithub />
                            </a>
                          )}
                          {member.twitter && (
                            <a
                              className="social-link"
                              href={member.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Twitter"
                            >
                              <FiTwitter />
                            </a>
                          )}
                          {member.email && (
                            <a className="social-link" href={`mailto:${member.email}`} aria-label="Email">
                              <FiMail />
                            </a>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {member.bio && (
                      <div className="team-card-back">
                        <div className="team-bio-content">
                          <h3 className="team-name">{member.name}</h3>
                          <p className="team-role">{member.role}</p>
                          <p className="team-bio">{member.bio}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="no-members">
              <p>
                {filter === 'all' 
                  ? 'No team members found. If you just added members, try refreshing the page.'
                  : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)}s found.`}
              </p>
              {filter === 'all' && (
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
          )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Team

