import { Link } from 'react-router-dom'
import {
  FiCalendar,
  FiArrowRight,
  FiZap,
  FiMapPin,
  FiBookOpen,
  FiUserPlus,
  FiCamera,
  FiBell,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useEffect, useState, useRef } from 'react'
import { getCropBackgroundStyle } from '../utils/cropStyles'
import { truncateText } from '../utils/text'
import './Home.css'

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [pastEvents, setPastEvents] = useState([])
  const [showGallery, setShowGallery] = useState(true)
  const [cabinetMembers, setCabinetMembers] = useState([])
  const [teamHead, setTeamHead] = useState(null)
  const [teamImagesLoading, setTeamImagesLoading] = useState({})
  const [teamScrollIndex, setTeamScrollIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('next')
  const scrollTimeoutRef = useRef(null)

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      if (!db) {
        setLoading(false)
        return
      }
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const eventsRef = collection(db, 'events')
        const q = query(
          eventsRef,
          where('date', '>=', today),
          orderBy('date', 'asc'),
          limit(3)
        )
        
        const querySnapshot = await getDocs(q)
        const events = []
        querySnapshot.forEach((doc) => {
          events.push({ id: doc.id, ...doc.data() })
        })
        setUpcomingEvents(events)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchPastEvents = async () => {
      if (!db) return
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const eventsRef = collection(db, 'events')
        const pastQuery = query(
          eventsRef,
          where('date', '<', today),
          orderBy('date', 'desc'),
          limit(3)
        )

        const snap = await getDocs(pastQuery)
        const events = []
        snap.forEach((doc) => {
          events.push({ id: doc.id, ...doc.data() })
        })
        setPastEvents(events)
      } catch (error) {
        console.error('Error fetching past events:', error)
      }
    }

    fetchUpcomingEvents()
    fetchPastEvents()
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      if (!db) return
      try {
        const settingsRef = doc(db, 'settings', 'general')
        const snap = await getDoc(settingsRef)
        if (snap.exists()) {
          const data = snap.data()
          setShowGallery(data.showGallery !== false)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchCabinet = async () => {
      if (!db) return
      try {
        const teamRef = collection(db, 'team')
        const teamQuery = query(teamRef, orderBy('order', 'asc'))
        const snapshot = await getDocs(teamQuery)
        const allMembers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        
        // Separate head/faculty from students
        const head = allMembers.find(m => 
          m.memberType === 'head' || 
          m.memberType === 'faculty' ||
          m.role?.toLowerCase().includes('head') ||
          m.role?.toLowerCase().includes('faculty') ||
          m.role?.toLowerCase().includes('advisor')
        )
        
        const students = allMembers.filter(m => 
          !m.memberType || 
          (m.memberType !== 'head' && m.memberType !== 'faculty') ||
          (!m.role?.toLowerCase().includes('head') && 
           !m.role?.toLowerCase().includes('faculty') && 
           !m.role?.toLowerCase().includes('advisor'))
        ) // Get all students for scrollable view
        
        setTeamHead(head || null)
        setCabinetMembers(students)
        
        // Preload team member images (head + students)
        const loadingStates = {}
        const membersToPreload = head ? [head, ...students] : students
        membersToPreload.forEach((member) => {
          if (member.image) {
            loadingStates[member.id] = true
            const img = new Image()
            img.onload = () => {
              setTeamImagesLoading(prev => ({ ...prev, [member.id]: false }))
            }
            img.onerror = () => {
              setTeamImagesLoading(prev => ({ ...prev, [member.id]: false }))
            }
            img.src = member.image
          }
        })
        setTeamImagesLoading(loadingStates)
      } catch (error) {
        console.error('Error fetching cabinet:', error)
      }
    }

    fetchCabinet()
  }, [])

  const heroAnnouncement = upcomingEvents.length
    ? `${upcomingEvents[0].title} — ${new Date(
        upcomingEvents[0].date?.toDate ? upcomingEvents[0].date.toDate() : upcomingEvents[0].date
      ).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : 'Next Event: Google Cloud Workshop — 10 Feb 2025'

  const fallbackCabinet = [
    {
      name: 'Ammar Javed',
      role: 'President',
      detail: 'BSCS • 7th Semester',
      image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Areeba Khan',
      role: 'Vice President',
      detail: 'BSSE • 7th Semester',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Muhammad Talha',
      role: 'General Secretary',
      detail: 'BSCS • 5th Semester',
      image: 'https://images.unsplash.com/photo-1544723795-432537f5a84e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Team Leads',
      role: 'Events • Tech • PR • Media',
      detail: 'Coordinators & Executives',
      image: '',
    },
  ]

  const displayCabinet = cabinetMembers.length ? cabinetMembers : fallbackCabinet

  const getMemberImage = (member) => {
    if (member?.image) return member.image
    const initials = encodeURIComponent(member?.name || 'ACM')
    return `https://ui-avatars.com/api/?name=${initials}&background=111827&color=fff`
  }

  // Team scroll functions
  const handleTeamNext = () => {
    if (displayCabinet.length <= 4) return
    
    // Clear any existing timeout to allow rapid clicks
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // Update immediately - don't block on isScrolling
    setScrollDirection('next')
    setTeamScrollIndex((prev) => (prev + 1) % displayCabinet.length)
    
    // Set scrolling state for animation
    setIsScrolling(true)
    
    // Clear scrolling state after animation (500ms matches CSS animation duration)
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 500)
  }

  const handleTeamPrev = () => {
    if (displayCabinet.length <= 4) return
    
    // Clear any existing timeout to allow rapid clicks
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // Update immediately - don't block on isScrolling
    setScrollDirection('prev')
    setTeamScrollIndex((prev) => (prev - 1 + displayCabinet.length) % displayCabinet.length)
    
    // Set scrolling state for animation
    setIsScrolling(true)
    
    // Clear scrolling state after animation (500ms matches CSS animation duration)
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 500)
  }

  // Get visible team members (4 at a time, wrapping around)
  const getVisibleTeamMembers = () => {
    if (displayCabinet.length <= 4) return displayCabinet
    const visible = []
    for (let i = 0; i < 4; i++) {
      const index = (teamScrollIndex + i) % displayCabinet.length
      visible.push(displayCabinet[index])
    }
    return visible
  }

  const highlightCards = [
    {
      title: 'Google Cloud Workshop',
      description: 'Hands-on labs on Vertex AI & Firebase extensions with 120 students.',
      tag: 'Hands-on Lab',
      link: '/events',
    },
    {
      title: 'Industrial Visit: TAGS Solutions',
      description: 'Senior cohort explored fintech deployments & DevOps pipelines.',
      tag: 'Industry Connect',
      link: '/events',
    },
    {
      title: 'Programming Competition 2024',
      description: '90+ participants, 3 problem tracks, powered by ACM judges.',
      tag: 'Competition',
      link: '/events',
    },
  ]

  const highlightData = pastEvents.length
    ? pastEvents.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        tag: event.type || 'Event',
        link: `/events/${event.id}`,
      }))
    : highlightCards

  const departments = ['Events', 'Technical', 'Dev Labs', 'Public Relations', 'Media & Graphics', 'Content', 'Community']

  const galleryPreview = [
    { title: 'AI Hack Night', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80' },
    { title: 'Industrial Visit', url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80' },
    { title: 'Career Clinic', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=600&q=80' },
    { title: 'Founder Talks', url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80' },
    { title: 'Design Sprint', url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80' },
    { title: 'Showcase Day', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=600&q=80' },
  ]

  const notifications = [
    'Recruitment Opens — 1 - Dec, 2025',

  ]

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="hero-eyebrow">Computer Science Department • NUML Lahore</p>
            <h1 className="hero-title">
              ACM Chapter – <span className="hero-highlight">NUML Lahore</span> | Computer Science Department
            </h1>
            <p className="hero-subtitle">
              NUML CS Society — Code. Collaborate. Conquer.
            </p>
            <div className="hero-badges">
              <div className="badge glow">
                <span className="badge-dot"></span>
                Student chapter since 2023
              </div>
              <div className="badge outline">
                <FiZap />
                Workshops • Events • Industry Visits
              </div>
            </div>
            <div className="hero-buttons">
              <Link to="/events" className="btn btn-primary">
                View Events
              </Link>
              <Link to="/join" className="btn btn-secondary">
                Join the Team
              </Link>
            </div>
            <div className="hero-meta">
              <div>
                <FiMapPin />
                <span>Uni Lab • NUML Lahore Campus</span>
              </div>
              <div>
                <FiBookOpen />
                <span></span>
              </div>
            </div>
            <div className="hero-ticker">
              <FiCalendar />
              <span>{heroAnnouncement}</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-gradient"></div>
                {upcomingEvents[0] ? (() => {
                  const event = upcomingEvents[0]
                  let imageUrl = typeof event.coverUrl === 'string' ? event.coverUrl : (event.coverUrl?.url || '')
                  // Only use Supabase URLs, filter out Unsplash or other external URLs
                  if (imageUrl && (imageUrl.includes('unsplash.com') || imageUrl.includes('ui-avatars.com'))) {
                    imageUrl = ''
                  }
                  let cropData = event.coverCrop
                  if (cropData && typeof cropData === 'object' && cropData.cover) {
                    cropData = cropData.cover
                  }
                  const titleBgStyle = imageUrl ? getCropBackgroundStyle(imageUrl, cropData) : {}
                  const hasValidImage = imageUrl && titleBgStyle.backgroundImage
                  return (
                    <Link to={`/events/${event.id}`} className="hero-card hero-card-link">
                      <div className={`hero-card-header ${hasValidImage ? 'hero-card-header-with-bg' : ''}`} style={hasValidImage ? titleBgStyle : {}}>
                        <span className="hero-card-label">Next Up</span>
                        <h3>
                          <span className="hero-card-title-text">{event.title}</span>
                        </h3>
                      </div>
                      <div className="hero-card-content">
                        <p>
                          {truncateText(
                            upcomingEvents[0].description ||
                              'Prototype sprint • limited seats • collaboration focused',
                            120
                          )}
                        </p>
                        {upcomingEvents[0]?.registerLink && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.open(upcomingEvents[0].registerLink, '_blank', 'noopener,noreferrer')
                            }}
                            className="btn hero-register-btn"
                          >
                            Register
                          </button>
                        )}
                      </div>
                <div className="hero-card-footer">
                  <span>
                    {new Date(
                      upcomingEvents[0].date?.toDate
                        ? upcomingEvents[0].date.toDate()
                        : upcomingEvents[0].date
                    ).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                    })}
                    {' • '}
                    {upcomingEvents[0]?.venue || 'Innovation Lab'}
                  </span>
                  <FiArrowRight />
                </div>
              </Link>
                  )
                })() : (
              <div className="hero-card">
                <span className="hero-card-label">Next Up</span>
                <h3>Founders Bootcamp</h3>
                <p>Prototype sprint • limited seats • collaboration focused</p>
                <div className="hero-card-footer">
                  <span>Feb 10 • Innovation Lab</span>
                  <FiArrowRight />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="section section-alt events-section">
        <div className="container">
          <div className="section-title">
            <h2>Upcoming Events</h2>
            <p>Workshops, competitions, and visits happening next</p>
          </div>
          {loading ? (
            <div className="loading">Loading events...</div>
          ) : upcomingEvents.length > 0 ? (
            <div className="events-preview">
              <div className="events-grid">
                {upcomingEvents.map((event) => {
                  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
                  let imageUrl = typeof event.coverUrl === 'string' ? event.coverUrl : (event.coverUrl?.url || '')
                  // Only use Supabase URLs, filter out Unsplash or other external URLs
                  if (imageUrl && (imageUrl.includes('unsplash.com') || imageUrl.includes('ui-avatars.com'))) {
                    imageUrl = ''
                  }
                  let cropData = event.coverCrop
                  if (cropData && typeof cropData === 'object' && cropData.cover) {
                    cropData = cropData.cover
                  }
                  const titleBgStyle = imageUrl ? getCropBackgroundStyle(imageUrl, cropData) : {}
                  const hasValidImage = imageUrl && titleBgStyle.backgroundImage
                  const cardBgStyle = hasValidImage ? titleBgStyle : {}
                return (
                  <Link to={`/events/${event.id}`} key={event.id} className="event-card-link">
                    <div className="event-card-preview">
                      <div className={`event-header-preview ${hasValidImage ? 'event-header-with-bg' : ''}`} style={cardBgStyle}>
                        <div className="event-date-preview">
                          <span className="event-day">{eventDate.getDate()}</span>
                          <span className="event-month">
                            {eventDate.toLocaleString('default', { month: 'short' })}
                          </span>
                        </div>
                        <h3 className="event-title-preview">
                          <span className="event-title-text">{event.title}</span>
                        </h3>
                      </div>
                      <div className="event-content-preview">
                        <p className="event-description-preview">
                          {truncateText(event.description, 140)}
                        </p>
                        <div className="event-meta">
                          <span>{event.venue || 'On Campus'}</span>
                          <span>{event.time || 'TBA'}</span>
                        </div>
                        <div className="event-card-preview-actions">
                          {event.registerLink && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.open(event.registerLink, '_blank', 'noopener,noreferrer')
                              }}
                              className="btn btn-primary event-preview-register-btn"
                            >
                              Registration
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              window.location.href = `/events/${event.id}`
                            }}
                            className="btn btn-secondary event-preview-view-btn"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
                })}
              </div>
              <div className="events-view-all">
                <Link to="/events" className="btn btn-outline">
                  View All Events
                </Link>
              </div>
            </div>
          ) : (
            <div className="no-events">
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section className="section team-section">
        <div className="container">
          <div className="section-title">
            <h2>Our Team</h2>
            <p>Meet the students orchestrating ACM NUML</p>
          </div>
          
          {/* Head Section */}
          {teamHead && (
            <div className="team-head-section">
              <div className="team-grid-landing team-head-grid">
                {(() => {
                  const avatarUrl = teamHead.image || getMemberImage(teamHead)
                  const cropStyle = getCropBackgroundStyle(avatarUrl, teamHead.imageCrops?.landing)
                  const isPlaceholder = !teamHead.image || avatarUrl.includes('ui-avatars.com')
                  const isLoading = teamImagesLoading[teamHead.id] && !isPlaceholder
                  return (
                    <div className="team-card-landing">
                      <div className="team-avatar-wrapper-landing">
                        {isLoading && (
                          <div className="team-avatar-loading">
                            <div className="loading-spinner"></div>
                          </div>
                        )}
                        <div 
                          className={`team-avatar-landing ${isLoading ? 'loading' : ''}`} 
                          style={cropStyle} 
                        />
                      </div>
                      <div className="team-info-landing">
                        <h3>{teamHead.name}</h3>
                        <p className="team-role-landing">{teamHead.role}</p>
                        {teamHead.detail || teamHead.program ? (
                          <span className="team-detail-landing">{teamHead.detail || teamHead.program}</span>
                        ) : null}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Student Members Section */}
          <div className="team-members-section">
            <div className="team-scroll-container">
              {displayCabinet.length > 4 && (
                <button 
                  className="team-scroll-btn team-scroll-btn-prev" 
                  onClick={handleTeamPrev}
                  aria-label="Previous team member"
                >
                  <FiChevronLeft />
                </button>
              )}
              <div className={`team-grid-landing team-grid-scrollable ${isScrolling ? `scrolling scrolling-${scrollDirection}` : ''}`}>
                {getVisibleTeamMembers().map((member, index) => {
                  const avatarUrl = member.image || getMemberImage(member)
                  const cropStyle = getCropBackgroundStyle(avatarUrl, member.imageCrops?.landing)
                  const isPlaceholder = !member.image || avatarUrl.includes('ui-avatars.com')
                  const isLoading = teamImagesLoading[member.id] && !isPlaceholder
                  return (
                    <div key={member.id || `member-${member.name}-${index}`} className="team-card-landing">
                      <div className="team-avatar-wrapper-landing">
                        {isLoading && (
                          <div className="team-avatar-loading">
                            <div className="loading-spinner"></div>
                          </div>
                        )}
                        <div 
                          className={`team-avatar-landing ${isLoading ? 'loading' : ''}`} 
                          style={cropStyle} 
                        />
                      </div>
                      <div className="team-info-landing">
                        <h3>{member.name}</h3>
                        <p className="team-role-landing">{member.role}</p>
                        {member.detail || member.program ? (
                          <span className="team-detail-landing">{member.detail || member.program}</span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
              {displayCabinet.length > 4 && (
                <button 
                  className="team-scroll-btn team-scroll-btn-next" 
                  onClick={handleTeamNext}
                  aria-label="Next team member"
                >
                  <FiChevronRight />
                </button>
              )}
            </div>
          </div>
          
          <div className="team-cta">
            <Link to="/team" className="btn btn-outline">
              View full team
            </Link>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="section join-section">
        <div className="container">
          <div className="join-hero">
            <div className="join-content">
              <p className="section-label">Join Us</p>
              <h2>Recruiting for Spring 2025.</h2>
              <p className="join-description">
                Join our core organizing team and take charge of shaping the CS community at NUML. From planning hackathons and workshops to managing projects and events, you’ll collaborate with motivated peers, work closely with alumni mentors, and make a real impact on campus. This is your chance to develop leadership skills, execute large-scale initiatives, and create experiences that leave a lasting mark on the NUML CS community.
              </p>

              <div className="chip-row">
                {departments.map((dept) => (
                  <span key={dept} className="chip">
                    {dept}
                  </span>
                ))}
              </div>

              <Link to="/join" className="btn btn-primary">
                Apply Now
              </Link>
              <h4>Lead. Build. Inspire. Be the force behind ACM NUML.</h4>
            </div>
            <div className="join-benefits">
              <div className="benefit-card">
                <FiUserPlus />
                <h3>Why join?</h3><ul>
                <li>Take ownership of planning and executing ACM NUML events</li>
                <li>Collaborate closely with a motivated team of peers and alumni mentors</li>
                <li>Develop leadership, project management, and organizational skills</li>
                <li>Shape the NUML CS community and leave a lasting impact</li>
                <li>Gain real-world experience managing hackathons, workshops, and tech projects</li>
              </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-content">
            <p className="section-label">About Us</p>
            <h2>We build a culture of learning, leadership, and impact.</h2>
            <p>
              The ACM Society under the Computer Science Department fosters technical growth,
              innovation, and collaboration among NUML students. We organize workshops, industry
              visits, coding competitions, and community projects designed to turn curiosity into
              real-world impact.
            </p>
            <Link to="/about" className="link-inline">
              Learn more about the chapter <FiArrowRight />
            </Link>
          </div>
          <div className="about-cards">
            <div className="about-card">
              <h3>Vision</h3>
              <p>Enable every NUML student to lead with technology and empathy.</p>
            </div>
            <div className="about-card secondary">
              <h3>Mission</h3>
              <p>Create high-energy programs that blend skills, mentorship, and community service.</p>
            </div>
            <div className="about-card">
              <h3>What we do</h3>
              <ul>
                <li>Workshops & hackathons</li>
                <li>Industrial visits & tech tours</li>
                <li>Competitions & project showcases</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Past Highlights */}
      <section className="section highlights-section">
        <div className="container">
          <div className="section-title">
            <h2>Past Highlights</h2>
            <p>Proof of impact from the last academic year</p>
          </div>
          <div className="highlights-grid">
            {highlightData.map((item) => (
              <Link key={item.id || item.title} to={item.link || '/events'} className="highlight-card">
                <span className="highlight-tag">{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="feature-link">
                  Explore recap <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      {showGallery && (
        <section className="section gallery-section">
          <div className="container">
            <div className="section-title">
              <h2>Gallery Preview</h2>
              <p>Moments from recent events and community meetups</p>
            </div>
            <div className="gallery-grid">
              {galleryPreview.map((item) => (
                <div key={item.title} className="gallery-card" style={{ backgroundImage: `url(${item.url})` }}>
                  <div className="gallery-overlay">
                    <FiCamera />
                    <span>{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="gallery-cta">
              <Link to="/gallery" className="btn btn-secondary">
                View Full Gallery
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Notifications */}
      <section className="section notifications-section">
        <div className="container notifications-grid">
          <div>
            <p className="section-label">Announcements</p>
            <h2>Stay in the loop</h2>
            <p>Deadlines, results, and opportunities—updated regularly.</p>
          </div>
          <div className="notifications-list">
            {notifications.map((note) => (
              <div key={note} className="notification-card">
                <FiBell />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

