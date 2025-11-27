import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft,
  FiSave,
  FiLink,
  FiMail,
  FiGlobe,
  FiMessageSquare
} from 'react-icons/fi'
import './AdminSettings.css'

const AdminSettings = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    googleFormUrl: '',
    contactEmail: '',
    websiteUrl: '',
    showGallery: true,
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      github: ''
    },
    siteDetails: {
      description: '',
      address: '',
      phone: ''
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'))
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setFormData({
          googleFormUrl: data.googleFormUrl || '',
          contactEmail: data.contactEmail || '',
          websiteUrl: data.websiteUrl || '',
          showGallery: data.showGallery !== false,
          socialLinks: data.socialLinks || {
            facebook: '',
            instagram: '',
            linkedin: '',
            twitter: '',
            github: ''
          },
          siteDetails: data.siteDetails || {
            description: '',
            address: '',
            phone: ''
          }
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      alert('Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'showGallery') {
      setFormData({ ...formData, showGallery: e.target.checked })
    } else if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1]
      setFormData({
        ...formData,
        socialLinks: {
          ...formData.socialLinks,
          [socialKey]: value
        }
      })
    } else if (name.startsWith('site.')) {
      const siteKey = name.split('.')[1]
      setFormData({
        ...formData,
        siteDetails: {
          ...formData.siteDetails,
          [siteKey]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      await setDoc(doc(db, 'settings', 'general'), formData, { merge: true })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="loading">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="admin-settings">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <button onClick={() => navigate('/admin')} className="btn-back">
                <FiArrowLeft />
                Back to Dashboard
              </button>
              <h1>Site Settings</h1>
              <p>Update form links, contact information, and site details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="container">
          <form onSubmit={handleSubmit} className="settings-form">
            {/* Form Links Section */}
            <div className="settings-section">
              <h2>
                <FiLink />
                Form Links
              </h2>
              <div className="form-group">
                <label>Google Form URL (Join Page)</label>
                <input
                  type="url"
                  name="googleFormUrl"
                  value={formData.googleFormUrl}
                  onChange={handleInputChange}
                  placeholder="https://forms.gle/..."
                />
                <small>This URL will be used in the Join page</small>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="settings-section">
              <h2>
                <FiMail />
                Contact Information
              </h2>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="acm.numl@atrons.net"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="site.phone"
                  value={formData.siteDetails.phone}
                  onChange={handleInputChange}
                  placeholder="+92 XXX XXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="site.address"
                  value={formData.siteDetails.address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="National University of Modern Languages"
                />
              </div>
            </div>

            {/* Social Media Links Section */}
            <div className="settings-section">
              <h2>
                <FiGlobe />
                Social Media Links
              </h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Facebook</label>
                  <input
                    type="url"
                    name="social.facebook"
                    value={formData.socialLinks.facebook}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/acmnuml"
                  />
                </div>
                <div className="form-group">
                  <label>Instagram</label>
                  <input
                    type="url"
                    name="social.instagram"
                    value={formData.socialLinks.instagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/acmnuml"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input
                    type="url"
                    name="social.linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/company/acmnuml"
                  />
                </div>
                <div className="form-group">
                  <label>Twitter</label>
                  <input
                    type="url"
                    name="social.twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/acmnuml"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>GitHub</label>
                <input
                  type="url"
                  name="social.github"
                  value={formData.socialLinks.github}
                  onChange={handleInputChange}
                  placeholder="https://github.com/acmnuml"
                />
              </div>
            </div>

            {/* Site Details Section */}
            <div className="settings-section">
              <h2>
                <FiMessageSquare />
                Site Details
              </h2>
              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  placeholder="https://acm.atrons.net"
                />
              </div>
              <div className="form-group">
                <label>Site Description</label>
                <textarea
                  name="site.description"
                  value={formData.siteDetails.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Brief description of ACM NUML..."
                />
              </div>

              <div className="form-group toggle-group">
                <label>Show Gallery on Landing Page</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="showGallery"
                    checked={formData.showGallery}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <FiSave />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings

