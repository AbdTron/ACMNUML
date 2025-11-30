/**
 * Share utilities for social media platforms
 */

/**
 * Get the current page URL
 */
export const getCurrentUrl = () => {
  return window.location.href
}

/**
 * Get the base URL of the site
 */
export const getBaseUrl = () => {
  return window.location.origin
}

/**
 * Share to Facebook
 * @param {string} url - URL to share
 * @param {string} quote - Optional quote/text to share
 */
export const shareToFacebook = (url, quote = '') => {
  const shareUrl = new URL('https://www.facebook.com/sharer/sharer.php')
  shareUrl.searchParams.set('u', url)
  if (quote) {
    shareUrl.searchParams.set('quote', quote)
  }
  window.open(shareUrl.toString(), '_blank', 'width=600,height=400,noopener,noreferrer')
}

/**
 * Share to Instagram
 * Since Instagram doesn't support direct URL sharing from web,
 * this function copies the link to clipboard with a helpful message
 * @param {string} url - URL to share
 * @param {string} text - Text to share
 */
export const shareToInstagram = async (url, text = '') => {
  const message = text ? `${text}\n\n${url}` : url
  const success = await copyToClipboard(message)
  if (success) {
    // Show a helpful message
    alert('Link copied to clipboard! You can now paste it in your Instagram post or story.')
    // Optionally open Instagram web
    window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer')
  } else {
    alert('Unable to copy link. Please copy manually: ' + url)
  }
}

/**
 * Share to LinkedIn
 * @param {string} url - URL to share
 * @param {string} title - Optional title
 * @param {string} summary - Optional summary/description
 */
export const shareToLinkedIn = (url, title = '', summary = '') => {
  const shareUrl = new URL('https://www.linkedin.com/sharing/share-offsite/')
  shareUrl.searchParams.set('url', url)
  if (title) {
    shareUrl.searchParams.set('title', title)
  }
  if (summary) {
    shareUrl.searchParams.set('summary', summary)
  }
  window.open(shareUrl.toString(), '_blank', 'width=600,height=400,noopener,noreferrer')
}

/**
 * Share to WhatsApp
 * @param {string} url - URL to share
 * @param {string} text - Text to share
 */
export const shareToWhatsApp = (url, text = '') => {
  const message = text ? `${text} ${url}` : url
  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
  window.open(shareUrl, '_blank', 'noopener,noreferrer')
}

/**
 * Share via Web Share API (native sharing on mobile devices)
 * @param {Object} shareData - Share data object
 * @param {string} shareData.title - Title of the content
 * @param {string} shareData.text - Text description
 * @param {string} shareData.url - URL to share
 */
export const shareNative = async (shareData) => {
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
      }
    }
  } else {
    // Fallback: copy to clipboard
    const textToCopy = shareData.url || `${shareData.title} - ${shareData.text}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      // You might want to show a toast notification here
      alert('Link copied to clipboard!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }
}

/**
 * Copy URL to clipboard
 * @param {string} url - URL to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

/**
 * Generate share text for events
 * @param {Object} event - Event object
 * @returns {string} - Formatted share text
 */
export const generateEventShareText = (event) => {
  const date = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''
  
  let text = `Check out this event: ${event.title}`
  if (date) {
    text += ` on ${date}`
  }
  if (event.location) {
    text += ` at ${event.location}`
  }
  return text
}

/**
 * Generate hashtags for events
 * @param {Object} event - Event object
 * @returns {string[]} - Array of hashtags
 */
export const generateEventHashtags = (event) => {
  const hashtags = ['ACMNUM', 'ACMNUMLLahore']
  if (event.type) {
    const typeTag = event.type.replace(/\s+/g, '')
    hashtags.push(typeTag)
  }
  return hashtags
}

