import { useState, useEffect } from 'react'
import { 
  FiPlus, 
  FiTrash2, 
  FiMenu,
  FiType,
  FiMail,
  FiList,
  FiCheckSquare,
  FiUpload,
  FiX,
  FiAlignLeft,
  FiCopy
} from 'react-icons/fi'
import './FormBuilder.css'

const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  NUMBER: 'number',
  DATE: 'date'
}

const FormBuilder = ({ formConfig = { fields: [], description: '' }, onChange }) => {
  const [fields, setFields] = useState(formConfig.fields || [])
  const [formDescription, setFormDescription] = useState(formConfig.description || '')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  useEffect(() => {
    setFields(formConfig.fields || [])
    setFormDescription(formConfig.description || '')
  }, [formConfig])

  const handleDescriptionChange = (description) => {
    setFormDescription(description)
    onChange({ ...formConfig, description, fields })
  }

  const handleAddField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      required: false,
      placeholder: '',
      options: (type === 'select' || type === 'radio' || type === 'checkbox') ? ['Option 1'] : []
    }
    const updatedFields = [...fields, newField]
    setFields(updatedFields)
    onChange({ ...formConfig, fields: updatedFields, description: formDescription })
  }

  const handleFieldChange = (fieldId, updates) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    )
    setFields(updatedFields)
    onChange({ ...formConfig, fields: updatedFields, description: formDescription })
  }

  const handleDeleteField = (fieldId) => {
    const updatedFields = fields.filter(field => field.id !== fieldId)
    setFields(updatedFields)
    onChange({ ...formConfig, fields: updatedFields, description: formDescription })
  }

  const handleDuplicateField = (fieldId) => {
    const field = fields.find(f => f.id === fieldId)
    if (field) {
      const duplicatedField = {
        ...field,
        id: `field_${Date.now()}`,
        label: `${field.label} (Copy)`
      }
      const fieldIndex = fields.findIndex(f => f.id === fieldId)
      const updatedFields = [
        ...fields.slice(0, fieldIndex + 1),
        duplicatedField,
        ...fields.slice(fieldIndex + 1)
      ]
      setFields(updatedFields)
      onChange({ ...formConfig, fields: updatedFields, description: formDescription })
    }
  }

  const handleAddOption = (fieldId) => {
    const field = fields.find(f => f.id === fieldId)
    if (field && field.options) {
      const newOptions = [...field.options, `Option ${field.options.length + 1}`]
      handleFieldChange(fieldId, { options: newOptions })
    }
  }

  const handleRemoveOption = (fieldId, optionIndex) => {
    const field = fields.find(f => f.id === fieldId)
    if (field && field.options) {
      const newOptions = field.options.filter((_, idx) => idx !== optionIndex)
      handleFieldChange(fieldId, { options: newOptions })
    }
  }

  const handleOptionChange = (fieldId, optionIndex, newValue) => {
    const field = fields.find(f => f.id === fieldId)
    if (field && field.options) {
      const newOptions = [...field.options]
      newOptions[optionIndex] = newValue
      handleFieldChange(fieldId, { options: newOptions })
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updatedFields = [...fields]
    const [moved] = updatedFields.splice(draggedIndex, 1)
    updatedFields.splice(dropIndex, 0, moved)
    setFields(updatedFields)
    onChange({ ...formConfig, fields: updatedFields, description: formDescription })
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const renderFieldEditor = (field, index) => {
    return (
      <div
        key={field.id}
        className={`form-field-editor ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        onDrop={(e) => handleDrop(e, index)}
      >
        <div className="field-header">
          <div className="field-drag-handle" title="Drag to reorder">
            <FiMenu />
          </div>
          <div className="field-type-badge">
            {field.type}
          </div>
          <div className="field-actions">
            <button
              type="button"
              onClick={() => handleDuplicateField(field.id)}
              className="field-action-btn"
              title="Duplicate field"
            >
              <FiCopy />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteField(field.id)}
              className="field-action-btn field-delete-btn"
              title="Delete field"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        <div className="field-editor-content">
          <div className="form-group">
            <input
              type="text"
              value={field.label}
              onChange={(e) => handleFieldChange(field.id, { label: e.target.value })}
              placeholder="Question"
              className="field-label-input"
            />
          </div>

          {(field.type === 'text' || field.type === 'email' || field.type === 'number' || field.type === 'textarea') && (
            <div className="form-group">
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => handleFieldChange(field.id, { placeholder: e.target.value })}
                placeholder="Placeholder text"
                className="field-placeholder-input"
              />
            </div>
          )}

          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
            <div className="options-editor">
              <div className="options-list">
                {field.options?.map((option, optIndex) => (
                  <div key={optIndex} className="option-item">
                    <div className="option-indicator">
                      {field.type === 'radio' && <span className="radio-dot"></span>}
                      {field.type === 'checkbox' && <span className="checkbox-square"></span>}
                      {field.type === 'select' && <span className="select-arrow">▼</span>}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(field.id, optIndex, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                      className="option-input"
                    />
                    {field.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(field.id, optIndex)}
                        className="option-remove-btn"
                        title="Remove option"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleAddOption(field.id)}
                className="btn-add-option"
              >
                <FiPlus />
                Add option
              </button>
            </div>
          )}

          <div className="field-footer">
            <label className="required-checkbox">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => handleFieldChange(field.id, { required: e.target.checked })}
              />
              <span>Required</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="form-builder">
      <div className="form-description-section">
        <div className="form-group">
          <label>
            <FiAlignLeft />
            Form Description (Optional)
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description or instructions for this form..."
            rows={3}
            className="form-description-input"
          />
        </div>
      </div>

      <div className="form-builder-header">
        <h3>Questions</h3>
        <div className="field-type-buttons">
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.TEXT)}
            className="field-type-btn"
            title="Short answer"
          >
            <FiType />
            <span>Short answer</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.TEXTAREA)}
            className="field-type-btn"
            title="Paragraph"
          >
            <FiAlignLeft />
            <span>Paragraph</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.RADIO)}
            className="field-type-btn"
            title="Multiple choice"
          >
            <FiCheckSquare />
            <span>Multiple choice</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.CHECKBOX)}
            className="field-type-btn"
            title="Checkboxes"
          >
            <FiCheckSquare />
            <span>Checkboxes</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.SELECT)}
            className="field-type-btn"
            title="Dropdown"
          >
            <FiList />
            <span>Dropdown</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.FILE)}
            className="field-type-btn"
            title="File upload"
          >
            <FiUpload />
            <span>File upload</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.EMAIL)}
            className="field-type-btn"
            title="Email"
          >
            <FiMail />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.NUMBER)}
            className="field-type-btn"
            title="Number"
          >
            <FiType />
            <span>Number</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddField(FIELD_TYPES.DATE)}
            className="field-type-btn"
            title="Date"
          >
            <FiType />
            <span>Date</span>
          </button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="form-builder-empty">
          <p>No questions added yet. Click "Add question" to get started.</p>
        </div>
      ) : (
        <div className="form-fields-list">
          {fields.map((field, index) => renderFieldEditor(field, index))}
        </div>
      )}
    </div>
  )
}

export default FormBuilder
