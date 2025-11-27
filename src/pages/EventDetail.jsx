import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi'
import './EventDetail.css'

const EventDetail = () => {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!db || !eventId) {
        setLoading(false)
        setError('Event not found')
        return
      }
      try {
        const eventRef = doc(db, 'events', eventId)
        const snapshot = await getDoc(eventRef)
        if (!snapshot.exists()) {
          setError('Event not found')
          return
        }
        const data = snapshot.data()
        setEvent({
          id: snapshot.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        })
      } catch (err) {
        console.error('Error loading event:', err)
        setError('Unable to load this event.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="container">
          <div className="loading">Loading event...</div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="event-detail-page">
        <div className="container">
          <div className="event-detail-error">
            <p>{error || 'Event not found.'}</p>
            <Link to="/events" className="btn btn-primary">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="event-detail-page">
      <div className="event-detail-hero">
        <div className="container">
          <Link to="/events" className="back-link">
            <FiArrowLeft /> Back to events
          </Link>
          <h1>{event.title}</h1>
          {event.longDescription && (
            <p>{event.description}</p>
          )}
          <div className="event-detail-meta">
            <div>
              <FiCalendar />
              <span>{format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            {event.time && (
              <div>
                <FiClock />
                <span>{event.time}</span>
              </div>
            )}
            {event.location && (
              <div>
                <FiMapPin />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          {event.registerLink && (
            <a
              href={event.registerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="event-detail-cta"
            >
              Register for Event
            </a>
          )}
        </div>
      </div>

      {event.coverUrl && (
        <div className="event-detail-cover">
          <img src={event.coverUrl} alt={event.title} />
        </div>
      )}

      <section className="section">
        <div className="container event-detail-body">
          <div>
            <h2>About this event</h2>
            <p>{event.longDescription || event.description}</p>
          </div>
          {event.sessions && (
            <div className="event-sessions">
              <h3>Sessions</h3>
              <div className="sessions-content">
                {event.sessions.split('\n').map((session, idx) => (
                  session.trim() && (
                    <div key={idx} className="session-item">
                      {session.trim()}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
          {event.agenda && Array.isArray(event.agenda) && (
            <div className="event-agenda">
              <h3>Agenda</h3>
              <ul>
                {event.agenda.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default EventDetail



