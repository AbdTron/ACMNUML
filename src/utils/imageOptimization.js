/**
 * Optimize image loading by adding query parameters or transformations
 * For Supabase Storage, we can add cache control and other optimizations
 */

/**
 * Get optimized image URL for faster loading
 * @param {string} url - Original image URL
 * @param {object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return ''
  
  const {
    width,
    height,
    quality = 80,
    format = 'auto'
  } = options

  // For Supabase Storage, we can add query parameters
  // Note: Supabase doesn't have built-in image transformation like Cloudinary
  // But we can optimize by:
  // 1. Using proper cache headers (handled by Supabase)
  // 2. Serving WebP when possible (browser handles this)
  // 3. Using CDN (Supabase handles this)
  
  // For now, return the original URL
  // In the future, if you enable Supabase Image Transformation, you can add:
  // return `${url}?width=${width}&height=${height}&quality=${quality}`
  
  return url
}

/**
 * Preload an image to improve perceived performance
 * @param {string} url - Image URL to preload
 * @returns {Promise} - Promise that resolves when image is loaded
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'))
      return
    }
    
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Check if image is already cached/loaded
 * @param {string} url - Image URL
 * @returns {boolean} - True if image is likely cached
 */
export const isImageCached = (url) => {
  if (!url) return false
  try {
    const img = new Image()
    img.src = url
    return img.complete || img.naturalWidth > 0
  } catch {
    return false
  }
}

