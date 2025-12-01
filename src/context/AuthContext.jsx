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
  const [adminPermissions, setAdminPermissions] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        // Check if user is admin in Firestore
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'admins', user.uid))
            if (userDoc.exists()) {
              const adminData = userDoc.data()
              setUserRole(adminData.role || 'admin')
              setAdminPermissions(adminData.permissions || {})
            } else {
              setUserRole(null)
              setAdminPermissions(null)
            }
          } catch (error) {
            console.error('Error checking admin status:', error)
            setUserRole(null)
            setAdminPermissions(null)
          }
        }
      } else {
        setCurrentUser(null)
        setUserRole(null)
        setAdminPermissions(null)
      }
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
    adminPermissions,
    login,
    logout,
    isAdmin: userRole === 'admin' || userRole === 'mainadmin',
    isMainAdmin: userRole === 'mainadmin'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

