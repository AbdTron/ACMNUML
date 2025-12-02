/**
 * Format phone number for WhatsApp link
 * Adds +92 country code and removes leading 0
 * Example: 03361101596 → +923361101596
 * @param {string} phone - Phone number string
 * @returns {string} - Formatted phone number for WhatsApp
 */
export const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/[^0-9]/g, '')
  
  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // Add +92 country code
  return `+92${cleaned}`
}



