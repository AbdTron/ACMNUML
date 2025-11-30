import { useState } from 'react'
import { FiMessageCircle, FiZap, FiAlertCircle, FiStar, FiUpload, FiX } from 'react-icons/fi'
import './FeedbackForm.css'

const FEEDBACK_TYPES = {
  FEEDBACK: 'feedback',
  FEATURE: 'feature',
  BUG: 'bug',
  SURVEY: 'survey'
}

const FeedbackForm = ({ 
  onSubmit, 
  loading = false, 
  type = FEEDBACK_TYPES.FEEDBACK,
  eventId = null,
  eventTitle = null 
}) => {
  const [formData, setFormData] = useState({
    type: type,
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    rating: 5,
    email: '',
    name: '',
    rollNumber: '',
    semester: '',
    attachments: []
  })
  const [errors, setErrors] = useState({})
  const [filePreviews, setFilePreviews] = useState([])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const maxSize = 5 * 1024 * 1024 // 5MB
      return file.size <= maxSize
    })

    if (validFiles.length !== files.length) {
      alert('Some files were too large (max 5MB per file)')
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }))

    // Create previews for image files
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreviews(prev => [...prev, {
            name: file.name,
            url: e.target.result
          }])
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreviews(prev => [...prev, {
          name: file.name,
          url: null
        }])
      }
    })
  }

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.type !== FEEDBACK_TYPES.SURVEY && !formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const submitData = {
        ...formData,
        eventId,
        eventTitle,
        timestamp: new Date().toISOString()
      }
      onSubmit(submitData)
    }
  }

  const getCategoryOptions = () => {
    switch (formData.type) {
      case FEEDBACK_TYPES.FEEDBACK:
        return ['General', 'Website', 'Events', 'Content', 'User Experience', 'Other']
      case FEEDBACK_TYPES.FEATURE:
        return ['Events', 'Member Portal', 'UI/UX', 'Notifications', 'Mobile App', 'Other']
      case FEEDBACK_TYPES.BUG:
        return ['Login/Auth', 'Events', 'Registration', 'UI Display', 'Performance', 'Mobile', 'Other']
      default:
        return ['General', 'Other']
    }
  }

  const getTypeIcon = (feedbackType) => {
    switch (feedbackType) {
      case FEEDBACK_TYPES.FEEDBACK:
        return <FiMessageCircle />
      case FEEDBACK_TYPES.FEATURE:
        return <FiZap />
      case FEEDBACK_TYPES.BUG:
        return <FiAlertCircle />
      case FEEDBACK_TYPES.SURVEY:
        return <FiStar />
      default:
        return <FiMessageCircle />
    }
  }

  const getTypeLabel = (feedbackType) => {
    switch (feedbackType) {
      case FEEDBACK_TYPES.FEEDBACK:
        return 'Feedback'
      case FEEDBACK_TYPES.FEATURE:
        return 'Feature Request'
      case FEEDBACK_TYPES.BUG:
        return 'Bug Report'
      case FEEDBACK_TYPES.SURVEY:
        return 'Survey'
      default:
        return 'Feedback'
    }
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      {/* Type Selection */}
      <div className="form-field">
        <label className="field-label">
          {getTypeIcon(formData.type)}
          Type
        </label>
        <div className="feedback-type-buttons">
          <button
            type="button"
            className={`type-btn ${formData.type === FEEDBACK_TYPES.FEEDBACK ? 'active' : ''}`}
            onClick={() => handleInputChange('type', FEEDBACK_TYPES.FEEDBACK)}
          >
            <FiMessageCircle />
            Feedback
          </button>
          <button
            type="button"
            className={`type-btn ${formData.type === FEEDBACK_TYPES.FEATURE ? 'active' : ''}`}
            onClick={() => handleInputChange('type', FEEDBACK_TYPES.FEATURE)}
          >
            <FiZap />
            Feature Request
          </button>
          <button
            type="button"
            className={`type-btn ${formData.type === FEEDBACK_TYPES.BUG ? 'active' : ''}`}
            onClick={() => handleInputChange('type', FEEDBACK_TYPES.BUG)}
          >
            <FiAlertCircle />
            Bug Report
          </button>
          {eventId && (
            <button
              type="button"
              className={`type-btn ${formData.type === FEEDBACK_TYPES.SURVEY ? 'active' : ''}`}
              onClick={() => handleInputChange('type', FEEDBACK_TYPES.SURVEY)}
            >
              <FiStar />
              Event Survey
            </button>
          )}
        </div>
      </div>

      {/* Event Info (if applicable) */}
      {eventId && eventTitle && (
        <div className="event-info-banner">
          <strong>Event:</strong> {eventTitle}
        </div>
      )}

      {/* Title */}
      <div className="form-field">
        <label htmlFor="title">
          Title <span className="required">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder={`Brief ${getTypeLabel(formData.type).toLowerCase()} title`}
          className={errors.title ? 'error' : ''}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      {/* Description */}
      <div className="form-field">
        <label htmlFor="description">
          Description <span className="required">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={`Provide detailed information about your ${getTypeLabel(formData.type).toLowerCase()}`}
          rows={6}
          className={errors.description ? 'error' : ''}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      {/* Category (not for surveys) */}
      {formData.type !== FEEDBACK_TYPES.SURVEY && (
        <div className="form-field">
          <label htmlFor="category">
            Category <span className="required">*</span>
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={errors.category ? 'error' : ''}
          >
            <option value="">Select a category</option>
            {getCategoryOptions().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>
      )}

      {/* Rating (for surveys and feedback) */}
      {(formData.type === FEEDBACK_TYPES.SURVEY || formData.type === FEEDBACK_TYPES.FEEDBACK) && (
        <div className="form-field">
          <label htmlFor="rating">
            <FiStar />
            Rating (1-5 stars)
          </label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star-btn ${formData.rating >= star ? 'active' : ''}`}
                onClick={() => handleInputChange('rating', star)}
                aria-label={`${star} stars`}
              >
                <FiStar />
              </button>
            ))}
            <span className="rating-label">{formData.rating} / 5</span>
          </div>
        </div>
      )}

      {/* Priority (for bugs and feature requests) */}
      {(formData.type === FEEDBACK_TYPES.BUG || formData.type === FEEDBACK_TYPES.FEATURE) && (
        <div className="form-field">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      )}

      {/* Email (optional) */}
      <div className="form-field">
        <label htmlFor="email">
          Email (optional - for follow-up)
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your.email@example.com"
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
        <small className="field-hint">We'll only use this to respond to your {getTypeLabel(formData.type).toLowerCase()}</small>
      </div>

      {/* Name (optional) */}
      <div className="form-field">
        <label htmlFor="name">
          Name (optional)
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Your full name"
        />
        <small className="field-hint">Help us identify you</small>
      </div>

      {/* Roll Number and Semester Row */}
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="rollNumber">
            Roll Number (optional)
          </label>
          <input
            type="text"
            id="rollNumber"
            value={formData.rollNumber}
            onChange={(e) => handleInputChange('rollNumber', e.target.value)}
            placeholder="e.g., BSCS-21F-001"
          />
        </div>
        <div className="form-field">
          <label htmlFor="semester">
            Semester (optional)
          </label>
          <select
            id="semester"
            value={formData.semester}
            onChange={(e) => handleInputChange('semester', e.target.value)}
          >
            <option value="">Select semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>
        </div>
      </div>

      {/* File Attachments */}
      {formData.type === FEEDBACK_TYPES.BUG && (
        <div className="form-field">
          <label htmlFor="attachments">
            <FiUpload />
            Attachments (optional - screenshots, logs)
          </label>
          <div className="file-upload-area">
            <input
              type="file"
              id="attachments"
              multiple
              accept="image/*,.pdf,.txt,.log"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="attachments" className="file-upload-btn">
              <FiUpload />
              Choose Files
            </label>
            <small className="field-hint">Max 5MB per file. Images, PDFs, text files accepted.</small>
          </div>
          {filePreviews.length > 0 && (
            <div className="file-previews">
              {filePreviews.map((preview, index) => (
                <div key={index} className="file-preview-item">
                  {preview.url ? (
                    <img src={preview.url} alt={preview.name} />
                  ) : (
                    <div className="file-icon">{preview.name.split('.').pop()}</div>
                  )}
                  <span className="file-name">{preview.name}</span>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => removeFile(index)}
                    aria-label="Remove file"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button 
        type="submit" 
        className="submit-btn"
        disabled={loading}
      >
        {loading ? 'Submitting...' : `Submit ${getTypeLabel(formData.type)}`}
      </button>
    </form>
  )
}

export default FeedbackForm

