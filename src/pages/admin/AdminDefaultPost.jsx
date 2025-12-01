import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import ImageUploader from '../../components/ImageUploader'
import './AdminDefaultPost.css'

const AdminDefaultPost = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverUrl: '',
    coverFilePath: '',
    coverCrop: null,
    enableButton: false,
    buttonText: '',
    buttonUrl: ''
  })

  useEffect(() => {
    fetchDefaultPost()
  }, [])

  const fetchDefaultPost = async () => {
    if (!db) {
      setLoading(false)
      return
    }

    try {
      const defaultPostRef = doc(db, 'settings', 'defaultPost')
      const defaultPostSnap = await getDoc(defaultPostRef)
      
      if (defaultPostSnap.exists()) {
        const data = defaultPostSnap.data()
        setFormData({
          title: data.title || '',
          description: data.description || '',
          coverUrl: data.coverUrl || '',
          coverFilePath: data.coverFilePath || '',
          coverCrop: data.coverCrop || null,
          enableButton: data.enableButton || false,
          buttonText: data.buttonText || '',
          buttonUrl: data.buttonUrl || ''
        })
      } else {
        // Set default values
        setFormData({
          title: 'New Events Coming Soon',
          description: 'We\'re working on exciting new workshops, competitions, and visits. Keep an eye out for updates!',
          coverUrl: '',
          coverFilePath: '',
          coverCrop: null,
          enableButton: false,
          buttonText: '',
          buttonUrl: ''
        })
      }
    } catch (error) {
      console.error('Error fetching default post:', error)
      alert('Error loading default post')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (payload) => {
    if (!payload || payload === '' || (typeof payload === 'object' && (!payload.url || payload.url === ''))) {
      setFormData({ ...formData, coverUrl: '', coverFilePath: '', coverCrop: null })
      return
    }
    if (typeof payload === 'string') {
      setFormData({ ...formData, coverUrl: payload, coverFilePath: '', coverCrop: null })
      return
    }
    if (typeof payload === 'object' && payload.url) {
      const cropData = payload.crops?.cover || null
      setFormData({ 
        ...formData, 
        coverUrl: payload.url,
        coverFilePath: payload.filePath || payload.path || '',
        coverCrop: cropData
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!db) return

    setSaving(true)
    try {
      const defaultPostData = {
        title: formData.title,
        description: formData.description,
        coverUrl: formData.coverUrl,
        coverFilePath: formData.coverFilePath,
        coverCrop: formData.coverCrop,
        enableButton: formData.enableButton,
        buttonText: formData.buttonText,
        buttonUrl: formData.buttonUrl,
        updatedAt: serverTimestamp()
      }

      await setDoc(doc(db, 'settings', 'defaultPost'), defaultPostData)
      alert('Default post saved successfully!')
    } catch (error) {
      console.error('Error saving default post:', error)
      alert('Error saving default post')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-default-post">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-default-post">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin')} className="btn-back">
                <FiArrowLeft />
                Back to Dashboard
              </button>
              <h1>Default Post</h1>
              <p>This post will be shown on the landing page when there are no upcoming events</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          <form onSubmit={handleSubmit} className="default-post-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., New Events Coming Soon"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="6"
                placeholder="Enter a description that will be shown when there are no upcoming events"
              />
            </div>

            <div className="form-group">
              <ImageUploader
                label="Cover Image (Optional)"
                folder="default-post"
                value={{ url: formData.coverUrl, filePath: formData.coverFilePath, crops: formData.coverCrop ? { cover: formData.coverCrop } : null }}
                onChange={handleImageChange}
                aspect={16 / 9}
              />
              <p className="form-help-text">
                Upload an image to display with the default post. This will appear in the hero section when there are no upcoming events.
              </p>
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enableButton"
                    checked={formData.enableButton}
                    onChange={handleInputChange}
                  />
                  <span>Add a custom button</span>
                </label>
                <p className="form-help-text">
                  Enable this to add a customizable button that will replace the Register button position on event pages.
                </p>
              </div>
            </div>

            {formData.enableButton && (
              <>
                <div className="form-group">
                  <label>Button Text *</label>
                  <input
                    type="text"
                    name="buttonText"
                    value={formData.buttonText}
                    onChange={handleInputChange}
                    required={formData.enableButton}
                    placeholder="e.g., Apply, Register, Visit"
                  />
                  <p className="form-help-text">
                    The text that will appear on the button (e.g., Apply, Register, Visit, etc.)
                  </p>
                </div>

                <div className="form-group">
                  <label>Button URL *</label>
                  <input
                    type="url"
                    name="buttonUrl"
                    value={formData.buttonUrl}
                    onChange={handleInputChange}
                    required={formData.enableButton}
                    placeholder="https://example.com"
                  />
                  <p className="form-help-text">
                    The URL where the button should link to when clicked.
                  </p>
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <FiSave />
                {saving ? 'Saving...' : 'Save Default Post'}
              </button>
              <button type="button" onClick={() => navigate('/admin')} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminDefaultPost

