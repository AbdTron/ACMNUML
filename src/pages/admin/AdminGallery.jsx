import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiImage,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiUpload
} from 'react-icons/fi'
import './AdminGallery.css'
import ImageUploader from '../../components/ImageUploader'

const AdminGallery = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGalleryForm, setShowGalleryForm] = useState(false)
  const [showImageForm, setShowImageForm] = useState(false)
  const [selectedGallery, setSelectedGallery] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [editingGallery, setEditingGallery] = useState(null)
  const [editingImage, setEditingImage] = useState(null)
  const [galleryFormData, setGalleryFormData] = useState({
    name: '',
    description: '',
    thumbnailUrl: ''
  })
  const [imageFormData, setImageFormData] = useState({
    url: '',
    caption: ''
  })

  useEffect(() => {
    fetchGalleries()
  }, [])

  const fetchGalleries = async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const galleriesRef = collection(db, 'galleries')
      const q = query(galleriesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const galleriesData = []
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data()
        // Count images in this gallery
        const imagesRef = collection(db, 'galleries', docSnap.id, 'images')
        const imagesSnap = await getDocs(imagesRef)
        
        galleriesData.push({
          id: docSnap.id,
          ...data,
          imageCount: imagesSnap.size
        })
      }
      
      setGalleries(galleriesData)
    } catch (error) {
      console.error('Error fetching galleries:', error)
      alert('Error loading galleries')
    } finally {
      setLoading(false)
    }
  }

  const fetchGalleryImages = async (galleryId) => {
    if (!db || !galleryId) return
    
    try {
      const imagesRef = collection(db, 'galleries', galleryId, 'images')
      const q = query(imagesRef, orderBy('uploadDate', 'desc'))
      const imagesSnap = await getDocs(q)
      const imagesData = []
      imagesSnap.forEach((doc) => {
        imagesData.push({ id: doc.id, ...doc.data() })
      })
      setGalleryImages(imagesData)
    } catch (error) {
      console.error('Error fetching gallery images:', error)
      alert('Error loading images')
    }
  }

  const handleGalleryInputChange = (e) => {
    setGalleryFormData({
      ...galleryFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageInputChange = (e) => {
    setImageFormData({
      ...imageFormData,
      [e.target.name]: e.target.value
    })
  }

  const createGalleryId = (name) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return slug || `gallery-${Date.now()}`
  }

  const handleGallerySubmit = async (e) => {
    e.preventDefault()
    try {
      const galleryData = {
        ...galleryFormData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      if (editingGallery) {
        await updateDoc(doc(db, 'galleries', editingGallery.id), {
          ...galleryData,
          updatedAt: Timestamp.now()
        })
        alert('Gallery updated successfully!')
      } else {
        const galleryId = createGalleryId(galleryFormData.name)
        await setDoc(doc(db, 'galleries', galleryId), galleryData)
        alert('Gallery created successfully!')
      }

      setShowGalleryForm(false)
      setEditingGallery(null)
      setGalleryFormData({
        name: '',
        description: '',
        thumbnailUrl: ''
      })
      fetchGalleries()
    } catch (error) {
      console.error('Error saving gallery:', error)
      alert('Error saving gallery')
    }
  }

  const handleImageSubmit = async (e) => {
    e.preventDefault()
    if (!selectedGallery || !imageFormData.url) {
      alert('Please select a gallery and upload an image')
      return
    }

    try {
      const imageData = {
        url: imageFormData.url,
        caption: imageFormData.caption || '',
        uploadDate: Timestamp.now()
      }

      if (editingImage) {
        await updateDoc(
          doc(db, 'galleries', selectedGallery.id, 'images', editingImage.id),
          imageData
        )
        alert('Image updated successfully!')
      } else {
        const imageId = `img-${Date.now()}`
        await setDoc(
          doc(db, 'galleries', selectedGallery.id, 'images', imageId),
          imageData
        )
        alert('Image added successfully!')
      }

      setShowImageForm(false)
      setEditingImage(null)
      setImageFormData({
        url: '',
        caption: ''
      })
      fetchGalleryImages(selectedGallery.id)
      fetchGalleries() // Update image count
    } catch (error) {
      console.error('Error saving image:', error)
      alert('Error saving image')
    }
  }

  const handleEditGallery = (gallery) => {
    setEditingGallery(gallery)
    setGalleryFormData({
      name: gallery.name || '',
      description: gallery.description || '',
      thumbnailUrl: gallery.thumbnailUrl || ''
    })
    setShowGalleryForm(true)
  }

  const handleEditImage = (image) => {
    setEditingImage(image)
    setImageFormData({
      url: image.url || '',
      caption: image.caption || ''
    })
    setShowImageForm(true)
  }

  const handleDeleteGallery = async (galleryId) => {
    if (!window.confirm('Are you sure you want to delete this gallery? All images will be deleted too.')) return

    try {
      // Delete all images first
      const imagesRef = collection(db, 'galleries', galleryId, 'images')
      const imagesSnap = await getDocs(imagesRef)
      const deletePromises = imagesSnap.docs.map(doc => 
        deleteDoc(doc.ref)
      )
      await Promise.all(deletePromises)
      
      // Delete gallery
      await deleteDoc(doc(db, 'galleries', galleryId))
      alert('Gallery deleted successfully!')
      fetchGalleries()
      if (selectedGallery?.id === galleryId) {
        setSelectedGallery(null)
        setGalleryImages([])
      }
    } catch (error) {
      console.error('Error deleting gallery:', error)
      alert('Error deleting gallery')
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return

    try {
      await deleteDoc(doc(db, 'galleries', selectedGallery.id, 'images', imageId))
      alert('Image deleted successfully!')
      fetchGalleryImages(selectedGallery.id)
      fetchGalleries() // Update image count
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error deleting image')
    }
  }

  const openGallery = (gallery) => {
    setSelectedGallery(gallery)
    fetchGalleryImages(gallery.id)
  }

  const closeGallery = () => {
    setSelectedGallery(null)
    setGalleryImages([])
  }

  return (
    <div className="admin-gallery">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin')} className="btn-back">
                <FiArrowLeft />
                Back to Dashboard
              </button>
              <h1>Manage Galleries</h1>
            </div>
            {!selectedGallery && (
              <button onClick={() => setShowGalleryForm(true)} className="btn btn-primary">
                <FiPlus />
                Create Gallery
              </button>
            )}
            {selectedGallery && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={closeGallery} className="btn btn-secondary">
                  <FiArrowLeft />
                  Back to Galleries
                </button>
                <button onClick={() => setShowImageForm(true)} className="btn btn-primary">
                  <FiUpload />
                  Add Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {/* Gallery Form Modal */}
          {showGalleryForm && (
            <div className="modal-overlay" onClick={() => {
              setShowGalleryForm(false)
              setEditingGallery(null)
              setGalleryFormData({
                name: '',
                description: '',
                thumbnailUrl: ''
              })
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingGallery ? 'Edit Gallery' : 'Create New Gallery'}</h2>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowGalleryForm(false)
                      setEditingGallery(null)
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <form onSubmit={handleGallerySubmit} className="gallery-form">
                  <div className="form-group">
                    <label>Gallery Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={galleryFormData.name}
                      onChange={handleGalleryInputChange}
                      required
                      placeholder="e.g., Spring 2024 Events"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={galleryFormData.description}
                      onChange={handleGalleryInputChange}
                      rows="3"
                      placeholder="Brief description of this gallery"
                    />
                  </div>
                  <ImageUploader
                    label="Thumbnail Image"
                    folder="galleries"
                    value={galleryFormData.thumbnailUrl}
                    onChange={(url) => setGalleryFormData({ ...galleryFormData, thumbnailUrl: url })}
                    aspect={16 / 9}
                  />
                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowGalleryForm(false)
                        setEditingGallery(null)
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <FiCheck />
                      {editingGallery ? 'Update' : 'Create'} Gallery
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Image Form Modal */}
          {showImageForm && (
            <div className="modal-overlay" onClick={() => {
              setShowImageForm(false)
              setEditingImage(null)
              setImageFormData({
                url: '',
                caption: ''
              })
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingImage ? 'Edit Image' : 'Add Image to Gallery'}</h2>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowImageForm(false)
                      setEditingImage(null)
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <form onSubmit={handleImageSubmit} className="image-form">
                  <ImageUploader
                    label="Image"
                    folder="gallery"
                    value={imageFormData.url}
                    onChange={(url) => setImageFormData({ ...imageFormData, url })}
                    aspect={4 / 3}
                  />
                  <div className="form-group">
                    <label>Caption</label>
                    <textarea
                      name="caption"
                      value={imageFormData.caption}
                      onChange={handleImageInputChange}
                      rows="3"
                      placeholder="Add a caption for this image (optional)"
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowImageForm(false)
                        setEditingImage(null)
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <FiCheck />
                      {editingImage ? 'Update' : 'Add'} Image
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading galleries...</div>
          ) : selectedGallery ? (
            <div className="gallery-images-view">
              <div className="gallery-header">
                <div>
                  <h2>{selectedGallery.name}</h2>
                  {selectedGallery.description && (
                    <p>{selectedGallery.description}</p>
                  )}
                </div>
                <div className="gallery-stats">
                  <span>{galleryImages.length} {galleryImages.length === 1 ? 'image' : 'images'}</span>
                </div>
              </div>
              
              {galleryImages.length > 0 ? (
                <div className="images-grid">
                  {galleryImages.map((image) => (
                    <div key={image.id} className="image-card">
                      <img src={image.url} alt={image.caption || 'Gallery image'} />
                      {image.caption && (
                        <div className="image-caption-preview">
                          <p>{image.caption}</p>
                        </div>
                      )}
                      <div className="image-actions">
                        <button
                          onClick={() => handleEditImage(image)}
                          className="btn-icon"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="btn-icon btn-danger"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FiImage size={48} />
                  <p>No images in this gallery yet. Add your first image!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="galleries-list">
              {galleries.length > 0 ? (
                <div className="galleries-grid-admin">
                  {galleries.map((gallery) => (
                    <div key={gallery.id} className="gallery-card-admin">
                      <div className="gallery-thumbnail-admin" onClick={() => openGallery(gallery)}>
                        {gallery.thumbnailUrl ? (
                          <img src={gallery.thumbnailUrl} alt={gallery.name} />
                        ) : (
                          <div className="thumbnail-placeholder-admin">
                            <FiImage size={48} />
                          </div>
                        )}
                      </div>
                      <div className="gallery-info-admin">
                        <h3>{gallery.name}</h3>
                        {gallery.description && (
                          <p className="gallery-desc-admin">{gallery.description}</p>
                        )}
                        <div className="gallery-meta-admin">
                          <span>
                            <FiImage size={16} />
                            {gallery.imageCount || 0} images
                          </span>
                        </div>
                        <div className="gallery-actions-admin">
                          <button
                            onClick={() => openGallery(gallery)}
                            className="btn btn-primary btn-sm"
                          >
                            Manage Images
                          </button>
                          <button
                            onClick={() => handleEditGallery(gallery)}
                            className="btn-icon"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteGallery(gallery.id)}
                            className="btn-icon btn-danger"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FiImage size={48} />
                  <p>No galleries found. Create your first gallery!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminGallery


