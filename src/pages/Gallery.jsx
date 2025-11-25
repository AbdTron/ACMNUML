import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiImage, FiFolder, FiArrowRight } from 'react-icons/fi'
import './Gallery.css'

const Gallery = () => {
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGalleries = async () => {
      if (!db) {
        setLoading(false)
        return
      }
      try {
        const galleriesRef = collection(db, 'galleries')
        const q = query(galleriesRef, orderBy('createdAt', 'desc'))
        
        const querySnapshot = await getDocs(q)
        const galleriesList = []
        querySnapshot.forEach((doc) => {
          galleriesList.push({ id: doc.id, ...doc.data() })
        })
        setGalleries(galleriesList)
      } catch (error) {
        console.error('Error fetching galleries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGalleries()
  }, [])

  return (
    <div className="gallery-page">
      <div className="page-header">
        <div className="container">
          <h1>Gallery</h1>
          <p>Browse through our collection of event photos and memories</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading galleries...</div>
          ) : galleries.length > 0 ? (
            <div className="galleries-grid">
              {galleries.map((gallery) => (
                <Link
                  key={gallery.id}
                  to={`/gallery/${gallery.id}`}
                  className="gallery-card"
                >
                  <div className="gallery-thumbnail">
                    {gallery.thumbnailUrl ? (
                      <img 
                        src={gallery.thumbnailUrl} 
                        alt={gallery.name}
                        className="thumbnail-image"
                      />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <FiFolder size={48} />
                      </div>
                    )}
                    <div className="gallery-overlay">
                      <FiArrowRight size={24} />
                    </div>
                  </div>
                  <div className="gallery-info">
                    <h3>{gallery.name}</h3>
                    {gallery.description && (
                      <p className="gallery-description">{gallery.description}</p>
                    )}
                    {gallery.imageCount !== undefined && (
                      <span className="gallery-count">
                        <FiImage size={16} />
                        {gallery.imageCount} {gallery.imageCount === 1 ? 'photo' : 'photos'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-galleries">
              <FiImage size={64} />
              <p>No galleries yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Gallery
