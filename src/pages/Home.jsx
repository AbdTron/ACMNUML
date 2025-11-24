import { Link } from 'react-router-dom'
import {
  FiCalendar,
  FiArrowRight,
  FiZap,
  FiMapPin,
  FiBookOpen,
  FiUserPlus,
  FiCamera,
  FiBell
} from 'react-icons/fi'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useEffect, useState } from 'react'
import './Home.css'

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [cabinetMembers, setCabinetMembers] = useState([])

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

    fetchUpcomingEvents()
  }, [])

  useEffect(() => {
    const fetchCabinet = async () => {
      if (!db) return
      try {
        const teamRef = collection(db, 'team')
        const teamQuery = query(teamRef, orderBy('order', 'asc'), limit(4))
        const snapshot = await getDocs(teamQuery)
        const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setCabinetMembers(members)
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
  const mainLead = displayCabinet[0]
  const supportingLeads = displayCabinet.slice(1)

  const getMemberImage = (member) => {
    if (member?.image) return member.image
    const initials = encodeURIComponent(member?.name || 'ACM')
    return `https://ui-avatars.com/api/?name=${initials}&background=111827&color=fff`
  }

  const highlightCards = [
    {
      title: 'Google Cloud Workshop',
      description: 'Hands-on labs on Vertex AI & Firebase extensions with 120 students.',
      tag: 'Hands-on Lab',
    },
    {
      title: 'Industrial Visit: TAGS Solutions',
      description: 'Senior cohort explored fintech deployments & DevOps pipelines.',
      tag: 'Industry Connect',
    },
    {
      title: 'Programming Competition 2024',
      description: '90+ participants, 3 problem tracks, powered by ACM judges.',
      tag: 'Competition',
    },
  ]

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
    'Recruitment Opens — Feb 12, 2025',
    'Results: Tech Quiz posted on Discord',
    'Workshop certificates uploaded to portal',
    'Event registration deadline extended to Jan 30',
  ]

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="hero-eyebrow">Computer Science Department • NUML Lahore</p>
            <h1 className="hero-title">
              ACM Society – <span className="hero-highlight">NUML Lahore</span> | Computer Science Department
            </h1>
            <p className="hero-subtitle">
              Empowering students through technology, innovation, and community while building lifelong collaborators.
            </p>
            <div className="hero-badges">
              <div className="badge glow">
                <span className="badge-dot"></span>
                Student chapter since 2016
              </div>
              <div className="badge outline">
                <FiZap />
                Workshops • Competitions • Industry Visits
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
                <span>Innovation Lab • NUML Lahore Campus</span>
              </div>
              <div>
                <FiBookOpen />
                <span>Tracks: Cloud, AI, DevOps, Product</span>
              </div>
            </div>
            <div className="hero-ticker">
              <FiCalendar />
              <span>{heroAnnouncement}</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-gradient"></div>
            {upcomingEvents[0] ? (
              <Link to={`/events/${upcomingEvents[0].id}`} className="hero-card hero-card-link">
                <span className="hero-card-label">Next Up</span>
                <h3>{upcomingEvents[0].title}</h3>
                <p>
                  {upcomingEvents[0].description ||
                    'Prototype sprint • limited seats • collaboration focused'}
                </p>
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
            ) : (
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
                return (
                  <Link to={`/events/${event.id}`} key={event.id} className="event-card-link">
                    <div className="event-card-preview">
                      <div className="event-date-preview">
                        <span className="event-day">{eventDate.getDate()}</span>
                        <span className="event-month">
                          {eventDate.toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="event-content-preview">
                        <h3 className="event-title-preview">{event.title}</h3>
                        <p className="event-description-preview">{event.description}</p>
                        <div className="event-meta">
                          <span>{event.venue || 'On Campus'}</span>
                          <span>{event.time || 'TBA'}</span>
                        </div>
                        <span className="event-link-preview">
                          View details <FiArrowRight />
                        </span>
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
            <h2>Current Cabinet</h2>
            <p>Meet the students orchestrating ACM NUML</p>
          </div>
          <div className="team-showcase">
            {mainLead && (
              <div
                className="team-feature"
                style={{ backgroundImage: `url(${getMemberImage(mainLead)})` }}
              >
                <div className="team-feature-overlay" />
                <div className="team-feature-content">
                  <p className="team-label">Chapter Lead</p>
                  <h3>{mainLead.name}</h3>
                  <span>{mainLead.role}</span>
                  <p>{mainLead.detail || mainLead.program}</p>
                </div>
              </div>
            )}
            <div className="team-support-grid">
              {supportingLeads.map((member) => (
                <div key={member.role || member.id} className="team-support-card">
                  <div className="team-support-avatar">
                    <img src={getMemberImage(member)} alt={member.name} />
                  </div>
                  <div>
                    <p className="team-support-role">{member.role}</p>
                    <h4>{member.name}</h4>
                    <span>{member.detail || member.program}</span>
                  </div>
                </div>
              ))}
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
        <div className="container join-grid">
          <div>
            <p className="section-label">Join Us</p>
            <h2>Recruitment for Spring 2025 starts soon.</h2>
            <p>
              If you love building products, telling stories, designing visuals, or running events,
              ACM NUML has a lane for you. Collaborate with peers, meet alumni mentors, and ship
              projects that matter.
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
          </div>
          <div className="join-card">
            <FiUserPlus />
            <h3>Why join?</h3>
            <ul>
              <li>Hands-on mentorship from alumni</li>
              <li>Priority access to closed workshops</li>
              <li>Opportunity to lead flagship events</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="section join-section">
        <div className="container join-grid">
          <div>
            <p className="section-label">Join Us</p>
            <h2>Recruitment for Spring 2025 starts soon.</h2>
            <p>
              If you love building products, telling stories, designing visuals, or running events,
              ACM NUML has a lane for you. Collaborate with peers, meet alumni mentors, and ship
              projects that matter.
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
          </div>
          <div className="join-card">
            <FiUserPlus />
            <h3>Why join?</h3>
            <ul>
              <li>Hands-on mentorship from alumni</li>
              <li>Priority access to closed workshops</li>
              <li>Opportunity to lead flagship events</li>
            </ul>
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
            {highlightCards.map((item) => (
              <Link key={item.title} to="/events" className="highlight-card">
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

