import { useState, useEffect } from 'react'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiLinkedin, FiGithub, FiMail, FiTwitter } from 'react-icons/fi'
import { getCropBackgroundStyle } from '../utils/cropStyles'
import SEOHead from '../components/SEOHead'
import { pageSEOConfig } from '../utils/seoUtils'
import './Team.css'

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [teamHead, setTeamHead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [socialHovered, setSocialHovered] = useState(null)
  const [imagesLoading, setImagesLoading] = useState({})
  const [flippedCards, setFlippedCards] = useState({})

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
          // Priority: memberType field takes precedence
          // Only show in head section if memberType is explicitly 'head' or 'faculty'
          // Do NOT use role name matching for students (e.g., "Social Media Head" is still a student)
          const memberType = member.memberType?.toLowerCase()
          const isHead = memberType === 'head' ||
            memberType === 'faculty' ||
            // Fallback for legacy data without memberType - check role only if memberType is not set
            (!memberType && (
              member.role?.toLowerCase().includes('faculty') ||
              member.role?.toLowerCase().includes('advisor')
            ))

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

  // Filtering logic based on role categories
  const filteredMembers = filter === 'all'
    ? teamMembers
    : teamMembers.filter(member => {
      if (!member.role) return filter === 'members' // No role = member
      const role = member.role.toLowerCase().trim()

      if (filter === 'president') {
        // President filter: includes president and vice president
        return role.includes('president')
      } else if (filter === 'head') {
        // Head filter: anyone with "head" in role (but not president)
        return role.includes('head') && !role.includes('president')
      } else if (filter === 'members') {
        // Members filter: anyone without president or head in role
        return !role.includes('president') && !role.includes('head')
      }
      return false
    })

  const getMemberImage = (member) => {
    if (member.image) return member.image
    const initials = encodeURIComponent(member.name || 'ACM')
    return `https://ui-avatars.com/api/?name=${initials}&background=2563eb&color=fff`
  }

  // Handle card flip on tap for mobile
  const handleCardFlip = (memberId, hasBio, e) => {
    // Don't flip if clicking on social links
    if (e.target.closest('.team-social') || e.target.closest('.social-link')) {
      return
    }
    if (hasBio) {
      setFlippedCards(prev => ({
        ...prev,
        [memberId]: !prev[memberId]
      }))
    }
  }

  // Filter categories: all, president (includes VP), head, members
  const filterCategories = [
    { key: 'all', label: 'All Members' },
    { key: 'president', label: 'Presidents' },
    { key: 'head', label: 'Heads' },
    { key: 'members', label: 'Members' }
  ]

  return (
    <div className="team-page">
      <SEOHead
        title={pageSEOConfig.team.title}
        description={pageSEOConfig.team.description}
      />
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
                      className={`team-card ${teamHead.bio ? 'has-bio' : ''} ${socialHovered === teamHead.id ? 'social-hovered' : ''} ${flippedCards[teamHead.id] ? 'flipped' : ''}`}
                      onMouseLeave={() => setSocialHovered(null)}
                      onClick={(e) => handleCardFlip(teamHead.id, teamHead.bio, e)}
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
                              {teamHead.bio && (
                                <div className="tap-hint">Tap for bio</div>
                              )}
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
              {filterCategories.map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-btn ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
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
                      className={`team-card ${member.bio ? 'has-bio' : ''} ${socialHovered === member.id ? 'social-hovered' : ''} ${flippedCards[member.id] ? 'flipped' : ''}`}
                      onMouseLeave={() => setSocialHovered(null)}
                      onClick={(e) => handleCardFlip(member.id, member.bio, e)}
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
                              {member.bio && (
                                <div className="tap-hint">Tap for bio</div>
                              )}
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
                  )
                })}
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

