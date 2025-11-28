import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { FiImage, FiTrash2 } from 'react-icons/fi'
import { uploadToSupabase, deleteFromSupabase } from '../config/supabase'
import './ImageUploader.css'

const normalizeCrop = (croppedArea, dimensions) => {
  if (!croppedArea || !dimensions) return null
  const { width, height } = dimensions
  if (!width || !height) return null
  return {
    x: croppedArea.x / width,
    y: croppedArea.y / height,
    width: croppedArea.width / width,
    height: croppedArea.height / height,
  }
}

const getValueUrl = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value.url || ''
  return ''
}

const ImageUploader = ({
  label,
  value,
  onChange,
  folder = 'media',
  aspect = 1,
  variants = [],
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isCropping, setIsCropping] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [imageDimensions, setImageDimensions] = useState(null)
  const [variantCrops, setVariantCrops] = useState({})
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const hasVariants = Array.isArray(variants) && variants.length > 0
  const cropSteps = hasVariants ? variants : [{ key: 'default', label: label || 'Image', aspect }]
  const activeStep = cropSteps[activeVariantIndex] || cropSteps[0]
  const previewUrl = getValueUrl(value)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // IMPORTANT: Store the original file immediately before any processing
    // This ensures we always have the full original file to upload
    // Create a copy/clone of the file to ensure we don't modify the original
    const originalFileClone = new File([file], file.name, { type: file.type })
    setOriginalFile(originalFileClone)

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result)
      setIsCropping(true)
      setError('')
      setVariantCrops({})
      setActiveVariantIndex(0)
      const img = new Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    // croppedAreaPixels is already in pixels relative to the original image
    // This is what we need for normalization
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const resetCropper = () => {
    setIsCropping(false)
    setSelectedImage(null)
    setOriginalFile(null)
    setImageDimensions(null)
    setVariantCrops({})
    setActiveVariantIndex(0)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels || !originalFile) return
    const currentStep = cropSteps[activeVariantIndex] || cropSteps[0]

    try {
      setUploading(true)

      if (hasVariants) {
        const normalizedCrop = normalizeCrop(croppedAreaPixels, imageDimensions)
        const updatedCrops = {
          ...variantCrops,
          [currentStep.key]: normalizedCrop,
        }

        if (activeVariantIndex < cropSteps.length - 1) {
          setVariantCrops(updatedCrops)
          setActiveVariantIndex((prev) => prev + 1)
          setCrop({ x: 0, y: 0 })
          setZoom(1)
          return
        }

        const uploadResult = await uploadToSupabase(originalFile, folder)
        // Delete old image if it exists
        if (value?.filePath) {
          await deleteFromSupabase(value.filePath)
        } else if (value?.path) {
          await deleteFromSupabase(value.path)
        } else {
          const previousUrl = getValueUrl(value)
          if (previousUrl && previousUrl !== uploadResult.url) {
            await deleteFromSupabase(previousUrl)
          }
        }
        onChange({ url: uploadResult.url, filePath: uploadResult.path, crops: updatedCrops })
        resetCropper()
        return
      }

      // Upload original file (not cropped) and store crop data
      // This allows displaying full image on detail page and cropped version in cards
      const normalizedCrop = normalizeCrop(croppedAreaPixels, imageDimensions)
      
      // IMPORTANT: Verify we're using the original file, not a cropped one
      if (!originalFile) {
        throw new Error('Original file is missing')
      }
      
      // Verify file size is reasonable (not suspiciously small which might indicate cropping)
      if (originalFile.size < 1000) {
        console.warn('Warning: File size is very small, might be an issue')
      }
      
      const uploadResult = await uploadToSupabase(originalFile, folder)
      
      // Delete old image if it exists
      if (value?.filePath) {
        await deleteFromSupabase(value.filePath)
      } else if (value?.path) {
        await deleteFromSupabase(value.path)
      } else {
        const previousUrl = getValueUrl(value)
        if (previousUrl && previousUrl !== uploadResult.url) {
          await deleteFromSupabase(previousUrl)
        }
      }
      
      // Return original image URL with crop data
      const cropPayload = normalizedCrop ? { cover: normalizedCrop } : null
      onChange({ 
        url: uploadResult.url, 
        filePath: uploadResult.path,
        crops: cropPayload
      })
      resetCropper()
    } catch (err) {
      console.error('Image upload failed:', err)
      let errorMessage = err.message || 'Upload failed. Please try again.'
      
      // Provide helpful error message for bucket not found
      if (errorMessage.includes('Bucket not found') || errorMessage.includes('not found')) {
        errorMessage = 'Storage bucket not found. Please create a public bucket named "media" in your Supabase project. See SUPABASE_SETUP.md for instructions.'
      }
      
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    try {
      // Delete from Supabase using filePath if available, otherwise use URL
      if (value?.filePath) {
        await deleteFromSupabase(value.filePath)
      } else if (value?.path) {
        await deleteFromSupabase(value.path)
      } else {
        const currentUrl = getValueUrl(value)
        if (currentUrl) {
          await deleteFromSupabase(currentUrl)
        }
      }
    } catch (err) {
      console.error('Error deleting image:', err)
      // Continue with removal even if delete fails
    }
    // Always call onChange to clear the image from the form
    if (hasVariants) {
      onChange({ url: '', filePath: '', crops: null })
    } else if (typeof value === 'object') {
      onChange({ url: '', filePath: '' })
    } else {
      onChange('')
    }
  }

  return (
    <div className="image-uploader">
      {label && <label>{label}</label>}
      <div className="upload-box">
        {previewUrl ? (
          <div className="preview">
            <img src={previewUrl} alt="Uploaded preview" />
            <button type="button" className="remove-btn" onClick={handleRemove}>
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
            {hasVariants && (
              <div className="cropper-step">
                <span>Step {activeVariantIndex + 1} of {cropSteps.length}</span>
                <strong>{activeStep?.label}</strong>
              </div>
            )}
            <div className="cropper-area">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={activeStep?.aspect || aspect}
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


