import { useState } from 'react'
import { FiUpload, FiImage, FiTrash2 } from 'react-icons/fi'
import { uploadToSupabase } from '../config/supabase'
import './ImageUploader.css'

const ImageUploader = ({ label, value, onChange, folder = 'media' }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const url = await uploadToSupabase(file, folder)
      onChange(url)
    } catch (err) {
      console.error(err)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-uploader">
      {label && <label>{label}</label>}
      <div className="upload-box">
        {value ? (
          <div className="preview">
            <img src={value} alt="Uploaded preview" />
            <button type="button" className="remove-btn" onClick={() => onChange('')}>
              <FiTrash2 /> Remove
            </button>
          </div>
        ) : (
          <label className="upload-trigger">
            <FiImage />
            <p>
              {uploading ? 'Uploading...' : 'Click to upload'}
              <span>PNG, JPG up to 2MB</span>
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              hidden
            />
          </label>
        )}
      </div>
      {error && <p className="upload-error">{error}</p>}
    </div>
  )
}

export default ImageUploader


