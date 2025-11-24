import { useState, useEffect } from 'react'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { FiImage, FiX } from 'react-icons/fi'
import './Gallery.css'

const Gallery = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    const fetchImages = async () => {
      if (!db) {
        setLoading(false)
        return
      }
      try {
        const galleryRef = collection(db, 'gallery')
        const q = query(galleryRef, orderBy('uploadDate', 'desc'))
        
        const querySnapshot = await getDocs(q)
        const galleryImages = []
        querySnapshot.forEach((doc) => {
          galleryImages.push({ id: doc.id, ...doc.data() })
        })
        setImages(galleryImages)
      } catch (error) {
        console.error('Error fetching gallery:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  const openModal = (image) => {
    setSelectedImage(image)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  return (
    <div className="gallery-page">
      <div className="page-header">
        <div className="container">
          <h1>Gallery</h1>
          <p>Memories from our events, workshops, and community gatherings</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading gallery...</div>
          ) : images.length > 0 ? (
            <div className="gallery-grid">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="gallery-item"
                  onClick={() => openModal(image)}
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
                      {image.eventName && (
                        <span className="gallery-event">{image.eventName}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-images">
              <FiImage size={64} />
              <p>No images in the gallery yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FiX />
            </button>
            <img 
              src={selectedImage.url} 
              alt={selectedImage.caption || 'Gallery image'}
              className="modal-image"
            />
            {selectedImage.caption && (
              <div className="modal-caption">
                <p>{selectedImage.caption}</p>
                {selectedImage.eventName && (
                  <span className="modal-event">{selectedImage.eventName}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery

