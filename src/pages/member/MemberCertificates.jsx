import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useMemberAuth } from '../../context/MemberAuthContext'
import { FiArrowLeft, FiAward, FiDownload, FiCalendar } from 'react-icons/fi'
import { format } from 'date-fns'
import './MemberCertificates.css'

const MemberCertificates = () => {
  const { currentUser } = useMemberAuth()
  const navigate = useNavigate()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      navigate('/member/login')
      return
    }
    fetchCertificates()
  }, [currentUser, navigate])

  const fetchCertificates = async () => {
    if (!db || !currentUser) {
      setLoading(false)
      return
    }

    try {
      // Fetch user's checked-in registrations (these are events they attended)
      const registrationsRef = collection(db, 'eventRegistrations')
      const userRegQuery = query(
        registrationsRef,
        where('userId', '==', currentUser.uid),
        where('checkedIn', '==', true)
      )
      const registrationsSnap = await getDocs(userRegQuery)
      
      const certificatesData = []
      for (const regDoc of registrationsSnap.docs) {
        const data = regDoc.data()
        try {
          // Fetch event details
          const eventRef = doc(db, 'events', data.eventId)
          const eventSnap = await getDoc(eventRef)
          if (eventSnap.exists()) {
            const eventData = eventSnap.data()
            certificatesData.push({
              id: regDoc.id,
              event: {
                id: eventSnap.id,
                ...eventData,
                date: eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date)
              },
              checkInTime: data.checkInTime?.toDate ? data.checkInTime.toDate() : (data.checkInTime ? new Date(data.checkInTime) : null),
              certificateUrl: data.certificateUrl || null
            })
          }
        } catch (error) {
          console.error('Error fetching event:', error)
        }
      }

      // Sort by checkInTime descending (most recent first)
      certificatesData.sort((a, b) => {
        if (!a.checkInTime && !b.checkInTime) return 0
        if (!a.checkInTime) return 1
        if (!b.checkInTime) return -1
        return b.checkInTime.getTime() - a.checkInTime.getTime()
      })

      setCertificates(certificatesData)
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = (certificate) => {
    if (certificate.certificateUrl) {
      window.open(certificate.certificateUrl, '_blank')
    } else {
      // Generate certificate on the fly or show message
      alert('Certificate generation is coming soon!')
    }
  }

  if (loading) {
    return (
      <div className="member-certificates-page">
        <div className="container">
          <div className="loading">Loading certificates...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-certificates-page">
      <div className="container">
        <Link to="/member" className="back-link">
          <FiArrowLeft /> Back to Dashboard
        </Link>

        <div className="page-header">
          <h1>My Certificates</h1>
          <p>View and download certificates for events you've attended</p>
        </div>

        {certificates.length === 0 ? (
          <div className="empty-state">
            <FiAward />
            <h3>No certificates yet</h3>
            <p>Certificates will appear here after you attend and check in to events.</p>
            <Link to="/events" className="btn btn-primary">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="certificates-grid">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="certificate-card">
                <div className="certificate-icon">
                  <FiAward />
                </div>
                <div className="certificate-content">
                  <h3>{certificate.event?.title || 'Event Certificate'}</h3>
                  {certificate.event?.date && (
                    <div className="certificate-date">
                      <FiCalendar />
                      <span>{format(certificate.event.date, 'MMMM dd, yyyy')}</span>
                    </div>
                  )}
                  {certificate.checkInTime && (
                    <p className="attended-date">
                      Attended: {format(certificate.checkInTime, 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDownloadCertificate(certificate)}
                  className="btn-download"
                  title="Download Certificate"
                >
                  <FiDownload />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MemberCertificates

