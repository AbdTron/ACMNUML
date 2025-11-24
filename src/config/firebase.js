import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

// Firebase configuration for ACM NUML project
// Obtained from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: 'AIzaSyADJkqr8ATnC-4ZT2CKzhRAvoKsocRXt6Q',
  authDomain: 'acmnuml.firebaseapp.com',
  projectId: 'acmnuml',
  storageBucket: 'acmnuml.firebasestorage.app',
  messagingSenderId: '1097867001966',
  appId: '1:1097867001966:web:083e5e54bd9e433936267f',
  measurementId: 'G-28E0JMMKY8',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Storage
export const storage = getStorage(app)

// Initialize Auth
export const auth = getAuth(app)

export default app

