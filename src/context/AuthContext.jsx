import { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Set user immediately (don't wait for Firestore query)
      setCurrentUser(user)
      
      if (user) {
        // Check if user is admin in Firestore (non-blocking)
        // Use cached permissions if available, otherwise fetch
        if (db) {
          try {
            // Try to get from cache first (from useAdminPermission hook)
            // If not cached, fetch from Firestore
            const adminDoc = await getDoc(doc(db, 'admins', user.uid))
            if (adminDoc.exists()) {
              setUserRole(adminDoc.data().role || 'admin')
            } else {
              setUserRole(null)
            }
          } catch (error) {
            console.error('Error checking admin status:', error)
            setUserRole(null)
          }
        }
      } else {
        setCurrentUser(null)
        setUserRole(null)
      }
      
      // Mark as loaded immediately after setting user (don't wait for Firestore)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email, password) => {
    if (!auth) {
      throw new Error('Firebase is not configured. Please update src/config/firebase.js')
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    // Check admin status
    if (db) {
      const userDoc = await getDoc(doc(db, 'admins', userCredential.user.uid))
      if (!userDoc.exists()) {
        await signOut(auth)
        throw new Error('Access denied. You are not authorized to access the admin panel.')
      }
    }
    return userCredential
  }

  const logout = () => {
    if (!auth) return Promise.resolve()
    return signOut(auth)
  }

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    isAdmin: userRole === 'admin' || userRole === 'mainadmin',
    isMainAdmin: userRole === 'mainadmin'
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Don't block rendering - allow app to render immediately */}
      {/* Auth-dependent components can check loading state themselves */}
      {children}
    </AuthContext.Provider>
  )
}

