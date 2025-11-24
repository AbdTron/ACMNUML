import { useState, useEffect } from 'react'
import { FiExternalLink, FiMail, FiUsers } from 'react-icons/fi'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import './Join.css'

const Join = () => {
  const [formSubmitted, setFormSubmitted] = useState(false)
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

  const handleFormSubmit = (e) => {
    e.preventDefault()
    // You can add custom form submission logic here
    // For now, redirecting to Google Form
    window.open(googleFormUrl, '_blank')
    setFormSubmitted(true)
  }

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

            <div className="join-form-section">
              <div className="form-card">
                <h2>Apply Now</h2>
                <p className="form-description">
                  Fill out our application form to join ACM NUML. We're always looking
                  for enthusiastic members who want to make a difference.
                </p>

                {formSubmitted ? (
                  <div className="form-success">
                    <FiMail size={48} />
                    <h3>Application Submitted!</h3>
                    <p>
                      Thank you for your interest in joining ACM NUML. We'll review
                      your application and get back to you soon.
                    </p>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleFormSubmit} className="join-form">
                      <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          placeholder="Enter your email"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="studentId">Student ID *</label>
                        <input
                          type="text"
                          id="studentId"
                          name="studentId"
                          required
                          placeholder="Enter your student ID"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="year">Year of Study *</label>
                        <select id="year" name="year" required>
                          <option value="">Select year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="interests">Areas of Interest</label>
                        <textarea
                          id="interests"
                          name="interests"
                          rows="4"
                          placeholder="Tell us about your interests in computer science..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="whyJoin">Why do you want to join ACM NUML? *</label>
                        <textarea
                          id="whyJoin"
                          name="whyJoin"
                          rows="4"
                          required
                          placeholder="Share your motivation for joining..."
                        />
                      </div>

                      <button type="submit" className="btn btn-primary btn-full">
                        Submit Application
                      </button>
                    </form>

                    <div className="form-divider">
                      <span>OR</span>
                    </div>

                    <a
                      href={googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-full"
                    >
                      <FiExternalLink />
                      Open Google Form
                    </a>
                  </>
                )}
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
              <a href="mailto:acm@numl.edu.pk" className="contact-option">
                <FiMail />
                <span>acm@numl.edu.pk</span>
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

