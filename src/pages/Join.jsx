import { useState, useEffect } from 'react'
import { FiExternalLink, FiMail, FiUsers, FiArrowRight } from 'react-icons/fi'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import './Join.css'

const Join = () => {
  const [googleFormUrl, setGoogleFormUrl] = useState('https://forms.gle/YOUR_FORM_ID')

  useEffect(() => {
    const fetchSettings = async () => {
      if (!db) return
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'))
        if (settingsDoc.exists() && settingsDoc.data().googleFormUrl) {
          setGoogleFormUrl(settingsDoc.data().googleFormUrl)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const benefits = [
    {
      icon: '🎯',
      title: 'Networking Opportunities',
      description: 'Connect with like-minded individuals and industry professionals',
    },
    {
      icon: '🚀',
      title: 'Skill Development',
      description: 'Participate in workshops and hackathons to enhance your skills',
    },
    {
      icon: '💡',
      title: 'Innovation',
      description: 'Work on exciting projects and bring your ideas to life',
    },
    {
      icon: '🏆',
      title: 'Recognition',
      description: 'Get recognized for your contributions and achievements',
    },
    {
      icon: '🌐',
      title: 'Industry Exposure',
      description: 'Attend industrial visits and tech events',
    },
    {
      icon: '👥',
      title: 'Community',
      description: 'Be part of a supportive and collaborative community',
    },
  ]


  return (
    <div className="join-page">
      <div className="page-header">
        <div className="container">
          <h1>Join ACM NUML</h1>
          <p>Become part of a community that's shaping the future of technology</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="join-content">
            <div className="join-info">
              <h2>Why Join Us?</h2>
              <p className="join-description">
                ACM NUML is more than just a society - it's a community of passionate
                computer science students who come together to learn, innovate, and grow.
                Whether you're interested in web development, AI, cybersecurity, or any
                other tech field, there's a place for you here.
              </p>

              {/* "Ready to Join?" section - shown on mobile/PWA after description, hidden on desktop */}
              <div className="join-form-section join-form-section-mobile">
                <div className="form-card">
                  <div className="apply-header">
                    <h2>Ready to Join?</h2>
                    <p className="form-description">
                      Click the button below to access our application form. We're always looking
                      for enthusiastic members who want to make a difference in the CS community.
                    </p>
                  </div>

                  <a
                    href={googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-google-form"
                  >
                    <span>Apply via Google Form</span>
                    <FiExternalLink />
                  </a>

                  <div className="form-info">
                    <p>
                      <strong>Note:</strong> The application form will open in a new tab. 
                      Please complete all required fields to submit your application.
                    </p>
                  </div>
                </div>
              </div>

              <div className="benefits-grid">
                {benefits.map((benefit, index) => (
                  <div key={index} className="benefit-card">
                    <div className="benefit-icon">{benefit.icon}</div>
                    <h3 className="benefit-title">{benefit.title}</h3>
                    <p className="benefit-description">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* "Ready to Join?" section - shown on desktop in sidebar, hidden on mobile/PWA */}
            <div className="join-form-section join-form-section-desktop">
              <div className="form-card">
                <div className="apply-header">
                  <h2>Ready to Join?</h2>
                  <p className="form-description">
                    Click the button below to access our application form. We're always looking
                    for enthusiastic members who want to make a difference in the CS community.
                  </p>
                </div>

                <a
                  href={googleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-google-form"
                >
                  <span>Apply via Google Form</span>
                  <FiExternalLink />
                </a>

                <div className="form-info">
                  <p>
                    <strong>Note:</strong> The application form will open in a new tab. 
                    Please complete all required fields to submit your application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="contact-info">
            <h2>Have Questions?</h2>
            <p>
              If you have any questions about joining ACM NUML, feel free to reach out to us.
            </p>
            <div className="contact-options">
              <a href="mailto:acm.numl@atrons.net" className="contact-option">
                <FiMail />
                <span>acm.numl@atrons.net</span>
              </a>
              <a href="/contact" className="contact-option">
                <FiUsers />
                <span>Contact Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Join

