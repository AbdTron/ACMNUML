import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import ShareButtons from '../components/ShareButtons'
import SEOHead from '../components/SEOHead'
import './EventDetail.css'

const DefaultPostDetail = () => {
  const [defaultPost, setDefaultPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    const fetchDefaultPost = async () => {
      if (!db) {
        setLoading(false)
        setError('Unable to load post')
        return
      }
      try {
        const defaultPostRef = doc(db, 'settings', 'defaultPost')
        const defaultPostSnap = await getDoc(defaultPostRef)
        
        if (!defaultPostSnap.exists()) {
          setError('Post not found')
          return
        }
        const data = defaultPostSnap.data()
        setDefaultPost(data)
      } catch (err) {
        console.error('Error loading default post:', err)
        setError('Unable to load this post.')
      } finally {
        setLoading(false)
      }
    }

    fetchDefaultPost()
  }, [])

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="container">
          <div className="loading">Loading post...</div>
        </div>
      </div>
    )
  }

  if (error || !defaultPost) {
    return (
      <div className="event-detail-page">
        <div className="container">
          <div className="event-detail-error">
            <p>{error || 'Post not found.'}</p>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Generate share URL
  const shareUrl = `${window.location.origin}/default-post`
  const shareImage = typeof defaultPost.coverUrl === 'string' ? defaultPost.coverUrl : (defaultPost.coverUrl?.url || '')
  const shareDescription = defaultPost.description || 'Check out this announcement from ACM NUML'
  const hasCoverImage = shareImage && shareImage.trim() !== ''

  return (
    <>
      <SEOHead
        title={`${defaultPost.title || 'Default Post'} - ACM NUML`}
        description={shareDescription}
        image={shareImage}
        url={shareUrl}
        type="article"
      />
      <div className="event-detail-page">
        <div className="event-detail-header">
          <div className="container">
            <Link to="/" className="back-link">
              <FiArrowLeft /> Back to home
            </Link>
          </div>
        </div>

        <section className="section event-detail-section">
          <div className="container">
            <div className={`event-detail-layout ${!hasCoverImage ? 'no-poster' : ''}`}>
              <div className="event-detail-content">
                <h1>{defaultPost.title || 'New Events Coming Soon'}</h1>
                
                {/* Share Buttons */}
                <div style={{
                  width: '100%',
                  padding: '1.5rem 0',
                  margin: '1rem 0',
                  borderTop: '1px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <ShareButtons
                    url={shareUrl}
                    title={defaultPost.title || 'Default Post'}
                    text={shareDescription}
                    image={shareImage}
                    variant="horizontal"
                    showLabels={false}
                    showNativeShare={true}
                  />
                </div>

                {defaultPost.enableButton && defaultPost.buttonText && defaultPost.buttonUrl && (
                  <a
                    href={defaultPost.buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-detail-cta"
                  >
                    {defaultPost.buttonText}
                  </a>
                )}

                <div className="event-detail-description">
                  <h2>About</h2>
                  <div className="event-description-text">
                    {defaultPost.description || 'We\'re working on exciting new workshops, competitions, and visits. Keep an eye out for updates!'}
                  </div>
                </div>
              </div>

              {hasCoverImage && (
                <div className="event-detail-poster">
                  {imageLoading && (
                    <div className="image-loading-placeholder">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
                  <img 
                    src={typeof defaultPost.coverUrl === 'string' ? defaultPost.coverUrl : (defaultPost.coverUrl?.url || '')} 
                    alt={defaultPost.title || 'Default Post'}
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
                      console.error('DefaultPostDetail: Image failed to load:', e.target.src)
                      setImageLoading(false)
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default DefaultPostDetail

