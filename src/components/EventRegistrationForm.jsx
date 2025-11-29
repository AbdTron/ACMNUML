import { useState } from 'react'
import { FiUpload } from 'react-icons/fi'
import './EventRegistrationForm.css'

const EventRegistrationForm = ({ formConfig, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [filePreviews, setFilePreviews] = useState({})

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const handleFileChange = (fieldId, file) => {
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fieldId]: file
      }))
      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreviews(prev => ({
            ...prev,
            [fieldId]: e.target.result
          }))
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const fields = formConfig?.fields || []

    fields.forEach(field => {
      const value = formData[field.id]
      
      if (field.required) {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = `${field.label || 'This field'} is required`
        }
      }

      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address'
        }
      }

      if (field.type === 'number' && value) {
        if (isNaN(value)) {
          newErrors[field.id] = 'Please enter a valid number'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const renderField = (field) => {
    const value = formData[field.id] || ''
    const error = errors[field.id]

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type={field.type}
              id={field.id}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              required={field.required}
              className={error ? 'error' : ''}
            />
            {error && <span className="field-error">{error}</span>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <textarea
              id={field.id}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              required={field.required}
              rows={4}
              className={error ? 'error' : ''}
            />
            {error && <span className="field-error">{error}</span>}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              className={error ? 'error' : ''}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && <span className="field-error">{error}</span>}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="form-field">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="radio-group">
              {field.options?.map((option, idx) => (
                <label key={idx} className="radio-option">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {error && <span className="field-error">{error}</span>}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="form-field">
            <label className="checkbox-option">
              <input
                type="checkbox"
                id={field.id}
                checked={value || false}
                onChange={(e) => handleInputChange(field.id, e.target.checked)}
                required={field.required}
              />
              <span>
                {field.label}
                {field.required && <span className="required">*</span>}
              </span>
            </label>
            {error && <span className="field-error">{error}</span>}
          </div>
        )

      case 'file':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id={field.id}
                onChange={(e) => handleFileChange(field.id, e.target.files[0])}
                required={field.required}
                className={error ? 'error' : ''}
              />
              <label htmlFor={field.id} className="file-upload-label">
                <FiUpload />
                {value ? value.name : 'Choose file'}
              </label>
              {filePreviews[field.id] && (
                <div className="file-preview">
                  <img src={filePreviews[field.id]} alt="Preview" />
                </div>
              )}
            </div>
            {error && <span className="field-error">{error}</span>}
          </div>
        )

      default:
        return null
    }
  }

  const fields = formConfig?.fields || []
  const description = formConfig?.description || ''

  if (fields.length === 0) {
    return (
      <div className="registration-form-empty">
        <p>No registration form configured for this event.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="event-registration-form">
      {description && (
        <div className="form-description">
          <p>{description}</p>
        </div>
      )}
      {fields.map(field => renderField(field))}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Registration'}
        </button>
      </div>
    </form>
  )
}

export default EventRegistrationForm

