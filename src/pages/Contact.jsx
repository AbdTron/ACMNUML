import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiMail, FiMapPin, FiPhone, FiSend, FiCheckCircle, FiInstagram, FiLinkedin, FiGithub } from 'react-icons/fi'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!db) {
      alert('Firebase is not configured. Please configure Firebase to use the contact form.')
      return
    }
    setSubmitting(true)

    try {
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        timestamp: new Date(),
      })
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('There was an error submitting your message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: FiMail,
      label: 'Email',
      value: 'acm.numl@atrons.net',
      link: 'mailto:acm.numl@atrons.net',
    },
    {
      icon: FiMapPin,
      label: 'Location',
      value: 'National University of Modern Languages',
      link: null,
    },
    {
      icon: FiPhone,
      label: 'Phone',
      value: '',
      link: 'tel:',
    },
  ]

  return (
    <div className="contact-page">
      <div className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Get in touch with us - we'd love to hear from you!</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info-section">
              <h2>Get in Touch</h2>
              <p className="contact-intro">
                Have a question, suggestion, or want to collaborate? We're here to help!
                Reach out to us through any of the following channels.
              </p>

              <div className="contact-info-cards">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  const content = info.link ? (
                    <a href={info.link} className="contact-info-link">
                      <Icon />
                      <div>
                        <span className="contact-info-label">{info.label}</span>
                        <span className="contact-info-value">{info.value}</span>
                      </div>
                    </a>
                  ) : (
                    <div className="contact-info-item">
                      <Icon />
                      <div>
                        <span className="contact-info-label">{info.label}</span>
                        <span className="contact-info-value">{info.value}</span>
                      </div>
                    </div>
                  )
                  return (
                    <div key={index} className="contact-info-card">
                      {content}
                    </div>
                  )
                })}
              </div>

              <div className="social-section">
                <h3>Follow Us</h3>
                <p>Stay connected with us on social media</p>
                <div className="social-links">
                  <a href="https://www.instagram.com/acm.numllhr/" target="_blank" rel="noopener noreferrer" className="social-link">
                    <FiInstagram />
                    <span>Instagram</span>
                  </a>
                  <a href="https://www.linkedin.com/company/acmnuml" target="_blank" rel="noopener noreferrer" className="social-link">
                    <FiLinkedin />
                    <span>LinkedIn</span>
                  </a>
                  <a href="https://github.com/acmnuml" target="_blank" rel="noopener noreferrer" className="social-link">
                    <FiGithub />
                    <span>GitHub</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-form-section">
              <div className="form-card">
                <h2>Send us a Message</h2>
                {submitted ? (
                  <div className="form-success">
                    <FiCheckCircle size={48} />
                    <h3>Message Sent!</h3>
                    <p>
                      Thank you for contacting us. We'll get back to you as soon as possible.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="btn btn-primary"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="name">Your Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What is this regarding?"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message *</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="6"
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <FiSend />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact

