import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiCheckCircle, FiMessageCircle, FiZap, FiAlertCircle } from 'react-icons/fi'
import FeedbackForm from '../components/FeedbackForm'
import './Feedback.css'

const Feedback = () => {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)

    try {
      // Add feedback to Firestore
      await addDoc(collection(db, 'feedback'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      setSubmitted(true)
      setLoading(false)

      // Reset after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError('Failed to submit feedback. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="feedback-page">
      {/* Hero Section */}
      <section className="feedback-hero">
        <div className="container">
          <h1>We Value Your Feedback</h1>
          <p className="hero-description">
            Help us improve! Share your thoughts, report issues, or suggest new features.
            Your input helps make ACM NUML better for everyone.
          </p>
        </div>
      </section>

      {/* Feedback Types Info */}
      <section className="feedback-info-section">
        <div className="container">
          <div className="feedback-types-grid">
            <div className="feedback-type-card">
              <div className="type-icon feedback-icon">
                <FiMessageCircle />
              </div>
              <h3>General Feedback</h3>
              <p>Share your thoughts about our website, events, or community</p>
            </div>
            <div className="feedback-type-card">
              <div className="type-icon feature-icon">
                <FiZap />
              </div>
              <h3>Feature Requests</h3>
              <p>Suggest new features or improvements you'd like to see</p>
            </div>
            <div className="feedback-type-card">
              <div className="type-icon bug-icon">
                <FiAlertCircle />
              </div>
              <h3>Bug Reports</h3>
              <p>Report technical issues or bugs you've encountered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section className="section feedback-form-section">
        <div className="container">
          <div className="feedback-form-container">
            {submitted ? (
              <div className="success-message">
                <FiCheckCircle />
                <h2>Thank You!</h2>
                <p>
                  Your feedback has been submitted successfully. We appreciate you taking
                  the time to help us improve.
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => setSubmitted(false)}
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <>
                <div className="form-header">
                  <h2>Submit Your Feedback</h2>
                  <p>Choose the type of feedback and fill out the form below</p>
                </div>
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}
                <FeedbackForm 
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section feedback-faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How long does it take to get a response?</h3>
              <p>
                We typically respond to feedback within 3-5 business days. Critical bug
                reports are prioritized and addressed as soon as possible.
              </p>
            </div>
            <div className="faq-item">
              <h3>Can I track the status of my feedback?</h3>
              <p>
                If you provide your email address, we'll send you updates about your
                feedback. You can also check back on this page for general updates.
              </p>
            </div>
            <div className="faq-item">
              <h3>Is my feedback anonymous?</h3>
              <p>
                Yes! Providing your email is optional. However, we recommend including it
                if you want follow-up or updates on your submission.
              </p>
            </div>
            <div className="faq-item">
              <h3>What happens after I submit feedback?</h3>
              <p>
                The Developer reviews all submissions. Feature requests are evaluated for
                implementation, bugs are investigated and fixed, and general feedback
                helps guide our improvements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Feedback

