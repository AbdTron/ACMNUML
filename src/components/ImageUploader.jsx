import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { FiImage, FiTrash2 } from 'react-icons/fi'
import { uploadToSupabase } from '../config/supabase'
import getCroppedImage from '../utils/cropImage'
import './ImageUploader.css'

const ImageUploader = ({ label, value, onChange, folder = 'media', aspect = 1 }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isCropping, setIsCropping] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result)
      setOriginalFile(file)
      setIsCropping(true)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (_, croppedArea) => {
    setCroppedAreaPixels(croppedArea)
  }

  const resetCropper = () => {
    setIsCropping(false)
    setSelectedImage(null)
    setOriginalFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels || !originalFile) return
    try {
      setUploading(true)
      const croppedBlob = await getCroppedImage(selectedImage, croppedAreaPixels, originalFile.type)
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: croppedBlob.type || originalFile.type,
      })
      const url = await uploadToSupabase(croppedFile, folder)
      onChange(url)
      resetCropper()
    } catch (err) {
      console.error('Image upload failed:', err)
      setError(err.message || 'Upload failed. Please try again.')
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

      {isCropping && (
        <div className="cropper-modal">
          <div className="cropper-content">
            <div className="cropper-area">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div className="cropper-controls">
              <label>
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </label>
              <div className="cropper-actions">
                <button type="button" className="btn btn-secondary" onClick={resetCropper} disabled={uploading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCropConfirm} disabled={uploading}>
                  {uploading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploader


