import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { format } from 'date-fns'
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiAlertCircle } from 'react-icons/fi'
import EventRegistrationForm from '../components/EventRegistrationForm'
import { generateRegistrationQR } from '../utils/qrCode'
import { sendRegistrationConfirmation } from '../utils/emailService'
import './EventRegister.css'

const REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  WAITLIST: 'waitlist',
  CANCELLED: 'cancelled'
}

const EventRegister = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { currentUser, userProfile } = useMemberAuth()
  const [event, setEvent] = useState(null)
  const [formConfig, setFormConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [registrationStatus, setRegistrationStatus] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      navigate('/member/login', { state: { from: `/events/${eventId}/register` } })
      return
    }

    const fetchEventData = async () => {
      if (!db || !eventId) {
        setLoading(false)
        setError('Event not found')
        return
      }

      try {
        // Fetch event
        const eventRef = doc(db, 'events', eventId)
        const eventSnap = await getDoc(eventRef)
        
        if (!eventSnap.exists()) {
          setError('Event not found')
          setLoading(false)
          return
        }

        const eventData = eventSnap.data()
        setEvent({
          id: eventSnap.id,
          ...eventData,
          date: eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date)
        })

        // Check if user already registered
        const registrationsRef = collection(db, 'eventRegistrations')
        const userRegQuery = query(
          registrationsRef,
          where('eventId', '==', eventId),
          where('userId', '==', currentUser.uid)
        )
        const userRegSnap = await getDocs(userRegQuery)
        
        if (!userRegSnap.empty) {
          const existingReg = userRegSnap.docs[0].data()
          setRegistrationStatus(existingReg.status)
        }

        // Fetch form configuration
        if (eventData.registrationEnabled) {
          const formRef = doc(db, 'eventForms', eventId)
          const formSnap = await getDoc(formRef)
          if (formSnap.exists()) {
            setFormConfig(formSnap.data())
          } else {
            // Default form if none configured
            setFormConfig({
              fields: [
                {
                  id: 'name',
                  type: 'text',
                  label: 'Full Name',
                  required: true,
                  placeholder: 'Enter your full name'
                },
                {
                  id: 'email',
                  type: 'email',
                  label: 'Email Address',
                  required: true,
                  placeholder: 'your.email@example.com'
                }
              ]
            })
          }
        }
      } catch (err) {
        console.error('Error loading event:', err)
        setError('Unable to load event registration')
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventId, currentUser, navigate])

  const handleSubmit = async (formData) => {
    if (!db || !event || !currentUser) return

    setSubmitting(true)
    setError(null)

    try {
      // Check capacity
      const registrationsRef = collection(db, 'eventRegistrations')
      const confirmedQuery = query(
        registrationsRef,
        where('eventId', '==', eventId),
        where('status', '==', REGISTRATION_STATUS.CONFIRMED)
      )
      const confirmedSnap = await getDocs(confirmedQuery)
      const confirmedCount = confirmedSnap.size

      let status = REGISTRATION_STATUS.CONFIRMED
      if (event.capacity && confirmedCount >= event.capacity) {
        status = REGISTRATION_STATUS.WAITLIST
      }

      // Create registration
      const registrationId = `reg_${Date.now()}_${currentUser.uid}`
      const registrationData = {
        eventId,
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || formData.name || 'User',
        userEmail: userProfile?.email || currentUser.email || formData.email || '',
        status,
        formData,
        registeredAt: serverTimestamp(),
        createdAt: new Date().toISOString(),
        checkedIn: false
      }

      await setDoc(doc(db, 'eventRegistrations', registrationId), registrationData)

      // Generate QR code data
      const qrData = generateRegistrationQR(eventId, registrationId, currentUser.uid)

      // Send confirmation email (placeholder - needs email service setup)
      await sendRegistrationConfirmation(
        { ...registrationData, id: registrationId, email: registrationData.userEmail },
        event
      )

      // Navigate to success page or show success message
      navigate(`/events/${eventId}`, { 
        state: { 
          registrationSuccess: true, 
          status,
          qrData 
        } 
      })
    } catch (err) {
      console.error('Error submitting registration:', err)
      setError(err.message || 'Failed to submit registration. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="event-register-page">
        <div className="container">
          <div className="loading">Loading registration form...</div>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="event-register-page">
        <div className="container">
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
          <Link to="/events" className="btn btn-primary">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  if (registrationStatus) {
    return (
      <div className="event-register-page">
        <div className="container">
          <Link to={`/events/${eventId}`} className="back-link">
            <FiArrowLeft /> Back to event
          </Link>
          <div className="registration-status-card">
            <h2>Already Registered</h2>
            <p>You have already registered for this event.</p>
            <p>Status: <strong>{registrationStatus}</strong></p>
            <Link to={`/events/${eventId}`} className="btn btn-primary">
              View Event Details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!event.registrationEnabled && !event.registerLink) {
    return (
      <div className="event-register-page">
        <div className="container">
          <Link to={`/events/${eventId}`} className="back-link">
            <FiArrowLeft /> Back to event
          </Link>
          <div className="error-message">
            <FiAlertCircle />
            <span>Registration is not available for this event.</span>
          </div>
          <Link to={`/events/${eventId}`} className="btn btn-primary">
            Back to Event
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="event-register-page">
      <div className="container">
        <Link to={`/events/${eventId}`} className="back-link">
          <FiArrowLeft /> Back to event
        </Link>

        <div className="register-header">
          <h1>Register for {event.title}</h1>
          <div className="event-meta-info">
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
          {event.capacity && (
            <p className="capacity-info">
              Capacity: {event.capacity} attendees
            </p>
          )}
        </div>

        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {formConfig && (
          <div className="registration-form-container">
            <EventRegistrationForm
              formConfig={formConfig}
              onSubmit={handleSubmit}
              loading={submitting}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default EventRegister

