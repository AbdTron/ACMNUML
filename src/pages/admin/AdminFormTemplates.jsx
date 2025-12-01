import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiArrowLeft,
  FiCheck,
  FiX,
  FiCopy,
  FiSave
} from 'react-icons/fi'
import { format } from 'date-fns'
import './AdminFormTemplates.css'
import FormBuilder from '../../components/FormBuilder'

const AdminFormTemplates = () => {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateName, setTemplateName] = useState('')
  const [formConfig, setFormConfig] = useState({ fields: [], description: '' })
  const [showFormBuilder, setShowFormBuilder] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const templatesRef = collection(db, 'formTemplates')
      const q = query(templatesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const templatesData = []
      querySnapshot.forEach((doc) => {
        templatesData.push({
          id: doc.id,
          ...doc.data()
        })
      })
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error fetching templates:', error)
      // If orderBy fails, try without it
      try {
        const templatesRef = collection(db, 'formTemplates')
        const querySnapshot = await getDocs(templatesRef)
        const templatesData = []
        querySnapshot.forEach((doc) => {
          templatesData.push({
            id: doc.id,
            ...doc.data()
          })
        })
        setTemplates(templatesData.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return bDate - aDate
        }))
      } catch (err) {
        console.error('Error fetching templates:', err)
        alert('Error loading templates')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setTemplateName('')
    setFormConfig({ fields: [], description: '' })
    setShowFormBuilder(true)
    setShowForm(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setTemplateName(template.name || '')
    setFormConfig(template.formConfig || { fields: [] })
    setShowFormBuilder(true)
    setShowForm(true)
  }

  const handleDuplicate = async (template) => {
    if (!db) return
    
    try {
      const newTemplate = {
        name: `${template.name} (Copy)`,
        formConfig: template.formConfig || { fields: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await setDoc(doc(db, 'formTemplates', `template_${Date.now()}`), newTemplate)
      alert('Template duplicated successfully!')
      fetchTemplates()
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Error duplicating template')
    }
  }

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      await deleteDoc(doc(db, 'formTemplates', templateId))
      alert('Template deleted successfully!')
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template')
    }
  }

  const handleSave = async () => {
    if (!db) return

    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    if (!formConfig.fields || formConfig.fields.length === 0) {
      alert('Please add at least one field to the form')
      return
    }

    try {
      const templateData = {
        name: templateName.trim(),
        formConfig: formConfig,
        updatedAt: new Date().toISOString()
      }

      if (editingTemplate) {
        // Update existing template
        await updateDoc(doc(db, 'formTemplates', editingTemplate.id), templateData)
        alert('Template updated successfully!')
      } else {
        // Create new template
        templateData.createdAt = new Date().toISOString()
        await setDoc(doc(db, 'formTemplates', `template_${Date.now()}`), templateData)
        alert('Template created successfully!')
      }

      setShowForm(false)
      setEditingTemplate(null)
      setTemplateName('')
      setFormConfig({ fields: [], description: '' })
      setShowFormBuilder(false)
      fetchTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template')
    }
  }

  return (
    <div className="admin-form-templates">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin')} className="btn-back">
                <FiArrowLeft />
                Back to Dashboard
              </button>
              <h1>Form Templates</h1>
              <p>Create and manage reusable form templates for event registrations</p>
            </div>
            <button onClick={handleCreateNew} className="btn btn-primary">
              <FiPlus />
              Create Template
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          {showForm && (
            <div className="modal-overlay" onClick={() => {
              if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
                setShowForm(false)
                setEditingTemplate(null)
                setTemplateName('')
                setFormConfig({ fields: [], description: '' })
                setShowFormBuilder(false)
              }
            }}>
              <div className="modal-content template-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
                        setShowForm(false)
                        setEditingTemplate(null)
                        setTemplateName('')
                        setFormConfig({ fields: [], description: '' })
                        setShowFormBuilder(false)
                      }
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <div className="template-form-content">
                  <div className="form-group">
                    <label>Template Name *</label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Workshop Registration Form"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <button
                        type="button"
                        onClick={() => setShowFormBuilder(!showFormBuilder)}
                        className="btn btn-secondary"
                      >
                        {showFormBuilder ? 'Hide' : 'Show'} Form Builder
                      </button>
                    </label>
                    {showFormBuilder && (
                      <div style={{ marginTop: '1rem' }}>
                        <FormBuilder
                          formConfig={formConfig}
                          onChange={(config) => setFormConfig(config)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
                          setShowForm(false)
                          setEditingTemplate(null)
                          setTemplateName('')
                          setFormConfig({ fields: [], description: '' })
                          setShowFormBuilder(false)
                        }
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="button" onClick={handleSave} className="btn btn-primary">
                      <FiSave />
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <p>No templates created yet.</p>
              <button onClick={handleCreateNew} className="btn btn-primary">
                <FiPlus />
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className="templates-grid">
              {templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-card-header">
                    <h3>{template.name}</h3>
                    <div className="template-actions">
                      <button
                        onClick={() => handleEdit(template)}
                        className="btn-icon"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="btn-icon"
                        title="Duplicate"
                      >
                        <FiCopy />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="btn-icon btn-danger"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <div className="template-card-body">
                    <p className="template-field-count">
                      {template.formConfig?.fields?.length || 0} field(s)
                    </p>
                    {template.createdAt && (
                      <p className="template-date">
                        Created: {format(new Date(template.createdAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                    {template.updatedAt && template.updatedAt !== template.createdAt && (
                      <p className="template-date">
                        Updated: {format(new Date(template.updatedAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminFormTemplates

