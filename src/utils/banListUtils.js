/**
 * Utility functions for managing banned users
 */

import { doc, getDoc, collection, query, where, getDocs, addDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Check if an email is banned
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email is banned
 */
export const isEmailBanned = async (email) => {
  if (!db || !email) return false
  
  try {
    const bannedRef = collection(db, 'bannedUsers')
    const q = query(bannedRef, where('email', '==', email.toLowerCase().trim()))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error('Error checking banned email:', error)
    return false
  }
}

/**
 * Check if a roll number is banned
 * @param {string} rollNumber - Roll number to check
 * @returns {Promise<boolean>} True if roll number is banned
 */
export const isRollNumberBanned = async (rollNumber) => {
  if (!db || !rollNumber) return false
  
  try {
    const bannedRef = collection(db, 'bannedUsers')
    const q = query(bannedRef, where('rollNumber', '==', rollNumber.toUpperCase().trim()))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error('Error checking banned roll number:', error)
    return false
  }
}

/**
 * Add user to ban list
 * @param {string} email - User's email
 * @param {string} rollNumber - User's roll number (optional)
 * @param {string} reason - Reason for ban (optional)
 * @param {string} bannedBy - Admin UID who banned the user
 * @returns {Promise<void>}
 */
export const addToBanList = async (email, rollNumber = null, reason = '', bannedBy = '') => {
  if (!db || !email) {
    throw new Error('Database not initialized or email missing')
  }
  
  try {
    const banData = {
      email: email.toLowerCase().trim(),
      rollNumber: rollNumber ? rollNumber.toUpperCase().trim() : null,
      reason: reason || '',
      bannedBy: bannedBy || '',
      bannedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    
    await addDoc(collection(db, 'bannedUsers'), banData)
  } catch (error) {
    console.error('Error adding to ban list:', error)
    throw error
  }
}

/**
 * Get all banned users
 * @returns {Promise<Array>} Array of banned user documents
 */
export const getBannedUsers = async () => {
  if (!db) return []
  
  try {
    const bannedRef = collection(db, 'bannedUsers')
    const snapshot = await getDocs(bannedRef)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching banned users:', error)
    return []
  }
}

