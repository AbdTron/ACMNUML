import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'
import { FiCalendar, FiMapPin, FiClock } from 'react-icons/fi'
import './Events.css'

const Events = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'upcoming', 'past'

  useEffect(() => {
    const fetchEvents = async () => {
      if (!db) {
        setLoading(false)
        return
      }
      try {
        const eventsRef = collection(db, 'events')
        let q

        if (filter === 'upcoming') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          q = query(eventsRef, where('date', '>=', today), orderBy('date', 'asc'))
        } else if (filter === 'past') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          q = query(eventsRef, where('date', '<', today), orderBy('date', 'desc'))
        } else {
          q = query(eventsRef, orderBy('date', 'desc'))
        }

        const querySnapshot = await getDocs(q)
        const eventsData = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          eventsData.push({
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : data.date,
          })
        })
        setEvents(eventsData)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [filter])

  const getEventStatus = (eventDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(eventDate)
    date.setHours(0, 0, 0, 0)
    
    if (date < today) return 'past'
    if (date.getTime() === today.getTime()) return 'today'
    return 'upcoming'
  }

  return (
    <div className="events-page">
      <div className="page-header">
        <div className="container">
          <h1>Events</h1>
          <p>Discover our workshops, hackathons, tech talks, and more</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="events-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Events
            </button>
            <button
              className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
              onClick={() => setFilter('past')}
            >
              Past Events
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading events...</div>
          ) : events.length > 0 ? (
            <div className="events-grid">
              {events.map((event) => {
                const status = getEventStatus(event.date)
                return (
                  <Link to={`/events/${event.id}`} key={event.id} className="event-card-link">
                    <div className="event-card">
                      {event.coverUrl && (
                        <div className="event-cover">
                          <img src={event.coverUrl} alt={event.title} />
                        </div>
                      )}
                      <div className="event-header">
                        <div className="event-date-large">
                          <span className="event-day-large">
                            {format(new Date(event.date), 'dd')}
                          </span>
                          <span className="event-month-large">
                            {format(new Date(event.date), 'MMM')}
                          </span>
                        </div>
                        {status === 'upcoming' && (
                          <span className="event-badge upcoming">Upcoming</span>
                        )}
                        {status === 'today' && (
                          <span className="event-badge today">Today</span>
                        )}
                        {status === 'past' && (
                          <span className="event-badge past">Past</span>
                        )}
                      </div>
                    <div className="event-body">
                        <h3 className="event-title">{event.title}</h3>
                        <p className="event-description">{event.description}</p>
                        <div className="event-details">
                          {event.location && (
                            <div className="event-detail">
                              <FiMapPin />
                              <span>{event.location}</span>
                            </div>
                          )}
                          <div className="event-detail">
                            <FiCalendar />
                            <span>{format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}</span>
                          </div>
                          {event.time && (
                            <div className="event-detail">
                              <FiClock />
                              <span>{event.time}</span>
                            </div>
                          )}
                        </div>
                        {event.type && (
                          <div className="event-type">
                            <span className={`type-badge ${event.type.toLowerCase()}`}>
                              {event.type}
                            </span>
                          </div>
                        )}
                        {event.registerLink && (
                          <a
                            href={event.registerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="event-card-register"
                          >
                            RSVP / Register
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="no-events">
              <p>No events found. Check back soon for updates!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Events

