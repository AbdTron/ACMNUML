import { useState, useEffect } from 'react'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiLinkedin, FiGithub, FiMail, FiTwitter } from 'react-icons/fi'
import './Team.css'

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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
        querySnapshot.forEach((doc) => {
          members.push({ id: doc.id, ...doc.data() })
        })
        setTeamMembers(members)
      } catch (error) {
        console.error('Error fetching team:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [])

  const filteredMembers = filter === 'all' 
    ? teamMembers 
    : teamMembers.filter(member => member.role?.toLowerCase() === filter.toLowerCase())

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
          <div className="team-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Members
            </button>
            {roles.filter(r => r !== 'all').map(role => {
              const membersWithRole = teamMembers.filter(m => 
                m.role?.toLowerCase() === role.toLowerCase()
              )
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
              {filteredMembers.map((member) => (
                <div key={member.id} className="team-card">
                  <div className="team-image-wrapper">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="team-image"
                      />
                    ) : (
                      <div className="team-image-placeholder">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="team-info">
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    {member.bio && (
                      <p className="team-bio">{member.bio}</p>
                    )}
                    <div className="team-social">
                      {member.email && (
                        <a 
                          href={`mailto:${member.email}`}
                          className="social-link"
                          aria-label="Email"
                        >
                          <FiMail />
                        </a>
                      )}
                      {member.linkedin && (
                        <a 
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link"
                          aria-label="LinkedIn"
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
                          aria-label="GitHub"
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
                          aria-label="Twitter"
                        >
                          <FiTwitter />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-members">
              <p>No team members found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Team

