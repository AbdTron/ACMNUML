/**
 * QR Code utility functions
 * Generates QR code data for event registrations
 */

/**
 * Generate QR code data for event registration
 * @param {string} eventId - Event ID
 * @param {string} registrationId - Registration ID
 * @param {string} userId - User ID
 * @returns {string} QR code data string
 */
export const generateRegistrationQR = (eventId, registrationId, userId) => {
  return JSON.stringify({
    type: 'event_registration',
    eventId,
    registrationId,
    userId,
    timestamp: Date.now()
  })
}

/**
 * Parse QR code data
 * @param {string} qrData - QR code data string
 * @returns {object|null} Parsed data or null if invalid
 */
export const parseQRData = (qrData) => {
  try {
    const data = JSON.parse(qrData)
    if (data.type === 'event_registration' && data.eventId && data.registrationId) {
      return data
    }
    return null
  } catch (error) {
    console.error('Error parsing QR code data:', error)
    return null
  }
}

/**
 * Generate QR code data for event check-in
 * @param {string} eventId - Event ID
 * @returns {string} QR code data string
 */
export const generateEventQR = (eventId) => {
  return JSON.stringify({
    type: 'event_checkin',
    eventId,
    timestamp: Date.now()
  })
}








