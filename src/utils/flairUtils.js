/**
 * Utility functions for generating user flairs in forum posts
 */

/**
 * Convert degree name to short acronym
 * @param {string} degreeName - Full degree name
 * @returns {string} Short acronym (e.g., "BSCS", "BSSE", "BSP")
 */
export const getDegreeAcronym = (degreeName) => {
  if (!degreeName) return null

  const degree = degreeName.trim()
  
  // Direct matches
  if (degree === 'BSCS') return 'BSCS'
  if (degree === 'BS Software Engineering' || degree === 'BS Software Engineering (Morning)') return 'BSSE'
  if (degree === 'BS Psychology (Clinical)') return 'BSP'
  if (degree === 'BS Mathematics') return 'BSM'
  if (degree === 'BS English') return 'BSE'
  if (degree === 'BS English (Bridging)') return 'BSE-B'
  if (degree === 'BS Mass Communication') return 'BSMC'
  if (degree === 'BS Mass Communication (Bridging)') return 'BSMC-B'
  if (degree === 'BS Islamic Studies') return 'BSIS'
  if (degree === 'BBA (Hons)') return 'BBA'
  if (degree === 'BS Accounting & Finance') return 'BSAF'
  
  // Associate Degrees
  if (degree.includes('Associate Degree in Computing')) return 'ADC'
  if (degree.includes('Associate Degree in Business Administration')) return 'ADBA'
  if (degree.includes('Associate Degree in English')) return 'ADE'
  
  // Pattern matching for BS degrees
  if (degree.startsWith('BS ')) {
    // Extract words after "BS "
    const words = degree.replace('BS ', '').split(' ')
    if (words.length >= 1) {
      // Take first letter of each word
      const acronym = 'BS' + words.map(w => w[0]?.toUpperCase() || '').join('')
      return acronym.length > 5 ? acronym.substring(0, 5) : acronym
    }
  }
  
  // If it's already short, return as is
  if (degree.length <= 6) return degree.toUpperCase()
  
  // Default: take first 4-5 characters
  return degree.substring(0, 5).toUpperCase()
}

/**
 * Generate flairs for a user (max 3)
 * Priority: 1. ACM Role, 2. Admin, 3. Degree+Semester
 * @param {Object} userData - User data object
 * @param {string} userData.acmRole - ACM role (President, Vice President, etc.)
 * @param {string} userData.role - User role (admin, user, etc.)
 * @param {string} userData.degree - Degree name
 * @param {string} userData.semester - Semester number
 * @param {boolean} isAdmin - Whether user is admin (from admins collection)
 * @returns {Array} Array of flair objects with { text, class }
 */
export const generateFlairs = (userData, isAdmin = false) => {
  const flairs = []
  
  // 1. ACM Role (if exists)
  if (userData?.acmRole) {
    const roleLower = userData.acmRole.toLowerCase()
    if (roleLower.includes('president')) {
      flairs.push({ text: 'President', class: 'flair-president' })
    } else if (roleLower.includes('vice president')) {
      flairs.push({ text: 'Vice President', class: 'flair-vp' })
    } else if (roleLower.includes('secretary')) {
      flairs.push({ text: 'Secretary', class: 'flair-secretary' })
    } else if (roleLower.includes('moderator')) {
      flairs.push({ text: 'Moderator', class: 'flair-moderator' })
    } else if (roleLower.includes('member')) {
      flairs.push({ text: 'Member', class: 'flair-member' })
    }
  }
  
  // 2. Admin (if admin and not already shown as ACM role)
  if (isAdmin || userData?.role === 'admin' || userData?.role === 'superadmin') {
    // Only add if we don't already have 2 flairs (to leave room for degree+sem)
    if (flairs.length < 2) {
      flairs.push({ text: 'Admin', class: 'flair-admin' })
    }
  }
  
  // 3. Degree + Semester (if both exist)
  if (userData?.degree && userData?.semester) {
    const degreeAcronym = getDegreeAcronym(userData.degree)
    if (degreeAcronym) {
      flairs.push({ 
        text: `${degreeAcronym}-${userData.semester}`, 
        class: 'flair-degree-sem' 
      })
    }
  }
  
  // Return max 3 flairs
  return flairs.slice(0, 3)
}

/**
 * Compute and return flairs array for storage in user profile
 * This function checks admin status from Firestore
 * @param {Object} userData - User profile data
 * @param {boolean} isAdminFromFirestore - Whether user exists in admins collection
 * @returns {Array} Array of flair objects ready to store
 */
export const computeFlairsForStorage = (userData, isAdminFromFirestore = false) => {
  return generateFlairs(userData, isAdminFromFirestore)
}






