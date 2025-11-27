import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiX } from 'react-icons/fi'
import './EventDetail.css'

const EventDetail = () => {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [galleryImagesLoading, setGalleryImagesLoading] = useState({})

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
        // Initialize loading states for gallery images
        if (data.additionalImages && Array.isArray(data.additionalImages)) {
          const initialLoading = {}
          data.additionalImages.forEach((_, idx) => {
            initialLoading[idx] = true
          })
          setGalleryImagesLoading(initialLoading)
        }
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
      <div className="event-detail-header">
        <div className="container">
          <Link to="/events" className="back-link">
            <FiArrowLeft /> Back to events
          </Link>
        </div>
      </div>

      <section className="section event-detail-section">
        <div className="container">
          <div className="event-detail-layout">
            <div className="event-detail-content">
              <h1>{event.title}</h1>
              
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

              <div className="event-detail-description">
                <h2>About this event</h2>
                <div className="event-description-text">
                  {event.longDescription || event.description}
                </div>
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

              {event.additionalImages && Array.isArray(event.additionalImages) && event.additionalImages.length > 0 && (
                <div className="event-gallery">
                  <h3>Event Gallery</h3>
                  <div className="event-gallery-grid">
                    {event.additionalImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="event-gallery-item"
                        onClick={() => setLightboxImage(imgUrl)}
                      >
                        {galleryImagesLoading[idx] && (
                          <div className="gallery-image-loading">
                            <div className="loading-spinner"></div>
                          </div>
                        )}
                        <img 
                          src={imgUrl} 
                          alt={`Event image ${idx + 1}`}
                          loading="lazy"
                          decoding="async"
                          style={{ display: galleryImagesLoading[idx] ? 'none' : 'block' }}
                          onLoad={() => setGalleryImagesLoading(prev => ({ ...prev, [idx]: false }))}
                          onError={() => setGalleryImagesLoading(prev => ({ ...prev, [idx]: false }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {event.coverUrl && (
              <div className="event-detail-poster">
                {imageLoading && (
                  <div className="image-loading-placeholder">
                    <div className="loading-spinner"></div>
                  </div>
                )}
                <img 
                  src={typeof event.coverUrl === 'string' ? event.coverUrl : (event.coverUrl?.url || '')} 
                  alt={event.title}
                  loading="eager"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: imageLoading ? 'none' : 'block',
                    objectFit: 'contain'
                  }}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    console.error('EventDetail: Image failed to load:', e.target.src)
                    setImageLoading(false)
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
              <FiX />
            </button>
            <img 
              src={lightboxImage} 
              alt="Event gallery"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetail



