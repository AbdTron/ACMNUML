import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiImage, FiX, FiArrowLeft, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './Gallery.css'

const GalleryDetail = () => {
  const { galleryId } = useParams()
  const [gallery, setGallery] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const fetchGalleryData = async () => {
      if (!db || !galleryId) {
        setLoading(false)
        return
      }
      try {
        // Fetch gallery info
        const galleryRef = doc(db, 'galleries', galleryId)
        const gallerySnap = await getDoc(galleryRef)
        
        if (!gallerySnap.exists()) {
          setLoading(false)
          return
        }

        const galleryData = { id: gallerySnap.id, ...gallerySnap.data() }
        setGallery(galleryData)

        // Fetch images in this gallery
        const imagesRef = collection(db, 'galleries', galleryId, 'images')
        const q = query(imagesRef, orderBy('uploadDate', 'desc'))
        const imagesSnap = await getDocs(q)
        
        const imagesList = []
        imagesSnap.forEach((doc) => {
          imagesList.push({ id: doc.id, ...doc.data() })
        })
        setImages(imagesList)
      } catch (error) {
        console.error('Error fetching gallery data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGalleryData()
  }, [galleryId])

  const openModal = (image, index) => {
    setSelectedImage(image)
    setSelectedIndex(index)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction) => {
    if (images.length === 0) return
    
    let newIndex = selectedIndex
    if (direction === 'next') {
      newIndex = (selectedIndex + 1) % images.length
    } else {
      newIndex = (selectedIndex - 1 + images.length) % images.length
    }
    
    setSelectedIndex(newIndex)
    setSelectedImage(images[newIndex])
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedImage) return
      
      if (e.key === 'ArrowRight') {
        navigateImage('next')
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev')
      } else if (e.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, selectedIndex, images])

  if (loading) {
    return (
      <div className="gallery-page">
        <div className="container">
          <div className="loading">Loading gallery...</div>
        </div>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="gallery-page">
        <div className="container">
          <div className="no-galleries">
            <p>Gallery not found</p>
            <Link to="/gallery" className="btn btn-primary">
              Back to Galleries
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gallery-detail-page">
      <div className="page-header">
        <div className="container">
          <Link to="/gallery" className="back-link">
            <FiArrowLeft /> Back to Galleries
          </Link>
          <h1>{gallery.name}</h1>
          {gallery.description && <p>{gallery.description}</p>}
        </div>
      </div>

      <section className="section">
        <div className="container">
          {images.length > 0 ? (
            <div className="gallery-grid">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="gallery-item"
                  onClick={() => openModal(image, index)}
                >
                  {image.url ? (
                    <img 
                      src={image.url} 
                      alt={image.caption || 'Gallery image'}
                      className="gallery-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="gallery-placeholder">
                      <FiImage />
                    </div>
                  )}
                  {image.caption && (
                    <div className="gallery-caption">
                      <p>{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-images">
              <FiImage size={64} />
              <p>No images in this gallery yet.</p>
            </div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <button className="modal-close" onClick={closeModal}>
            <FiX />
          </button>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {images.length > 1 && (
              <>
                <button 
                  className="modal-nav modal-nav-prev" 
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage('prev')
                  }}
                  aria-label="Previous image"
                >
                  <FiChevronLeft />
                </button>
                <button 
                  className="modal-nav modal-nav-next" 
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage('next')
                  }}
                  aria-label="Next image"
                >
                  <FiChevronRight />
                </button>
              </>
            )}
            <img 
              src={selectedImage.url} 
              alt={selectedImage.caption || 'Gallery image'}
              className="modal-image"
            />
            {selectedImage.caption && (
              <div className="modal-caption">
                <p>{selectedImage.caption}</p>
                {images.length > 1 && (
                  <span className="modal-counter">
                    {selectedIndex + 1} / {images.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GalleryDetail


