import { Link } from 'react-router-dom'
import { FiCalendar, FiUsers, FiImage, FiArrowRight } from 'react-icons/fi'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useEffect, useState } from 'react'
import './Home.css'

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

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

  const features = [
    {
      icon: FiCalendar,
      title: 'Tech Events',
      description: 'Join our workshops, hackathons, and tech talks',
      link: '/events',
    },
    {
      icon: FiUsers,
      title: 'Our Team',
      description: 'Meet the passionate members driving innovation',
      link: '/team',
    },
    {
      icon: FiImage,
      title: 'Gallery',
      description: 'Explore photos from our past events',
      link: '/gallery',
    },
  ]

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="hero-highlight">ACM NUML</span>
          </h1>
          <p className="hero-subtitle">
            Empowering the next generation of computer scientists through
            innovation, collaboration, and community.
          </p>
          <div className="hero-buttons">
            <Link to="/events" className="btn btn-primary">
              Explore Events
            </Link>
            <Link to="/join" className="btn btn-secondary">
              Join Our Society
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-gradient"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>What We Offer</h2>
            <p>Discover what makes ACM NUML special</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Link key={index} to={feature.link} className="feature-card">
                  <div className="feature-icon">
                    <Icon />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <span className="feature-link">
                    Learn more <FiArrowRight />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-title">
            <h2>Upcoming Events</h2>
            <p>Don't miss out on our exciting upcoming events</p>
          </div>
          {loading ? (
            <div className="loading">Loading events...</div>
          ) : upcomingEvents.length > 0 ? (
            <div className="events-preview">
              {upcomingEvents.map((event) => {
                const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
                return (
                <div key={event.id} className="event-card-preview">
                  <div className="event-date-preview">
                    <span className="event-day">
                      {eventDate.getDate()}
                    </span>
                    <span className="event-month">
                      {eventDate.toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className="event-content-preview">
                    <h3 className="event-title-preview">{event.title}</h3>
                    <p className="event-description-preview">{event.description}</p>
                    <Link to="/events" className="event-link-preview">
                      View Details <FiArrowRight />
                    </Link>
                  </div>
                </div>
                )
              })}
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

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Join Us?</h2>
            <p>
              Become part of a community that's shaping the future of technology.
              Join ACM NUML today!
            </p>
            <Link to="/join" className="btn btn-primary btn-large">
              Apply Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

