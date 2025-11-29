import { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { logActivity, ACTIVITY_TYPES } from '../utils/activityLogger'
import { ROLES } from '../utils/permissions'

const MemberAuthContext = createContext({
  currentUser: null,
  userProfile: null,
  loading: true,
  signup: async () => {},
  login: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  isMember: false,
  isAdmin: false
})

export const useMemberAuth = () => {
  return useContext(MemberAuthContext)
}

export const MemberAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        // Fetch user profile from Firestore
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            if (userDoc.exists()) {
              setUserProfile(userDoc.data())
            } else {
              // User doesn't have a profile yet - create one
              const newProfile = {
                email: user.email,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                role: ROLES.MEMBER,
                showInDirectory: true, // Default to enabled
                joinDate: serverTimestamp(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              try {
                await setDoc(doc(db, 'users', user.uid), newProfile)
                setUserProfile(newProfile)
              } catch (createError) {
                console.error('Error creating user profile:', createError)
                // If creation fails due to permissions, set a basic profile
                setUserProfile({
                  email: user.email,
                  name: user.displayName || user.email?.split('@')[0] || 'User',
                  role: ROLES.MEMBER
                })
              }
            }
          } catch (error) {
            // If it's a permission error and user is not admin, that's expected for new users
            if (error.code === 'permission-denied') {
              console.log('Could not fetch user profile (may not exist yet):', error.message)
              // Set a basic profile structure
              setUserProfile({
                email: user.email,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                role: ROLES.MEMBER
              })
            } else {
              console.error('Error fetching user profile:', error)
              setUserProfile(null)
            }
          }
        }
      } else {
        setCurrentUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email, password, name) => {
    if (!auth || !db) {
      throw new Error('Firebase is not configured')
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create user profile in Firestore
    const userProfile = {
      email: user.email,
      name: name || user.email?.split('@')[0] || 'User',
      role: ROLES.MEMBER,
      showInDirectory: true, // Default to enabled
      joinDate: serverTimestamp(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)
    
    // Log activity
    await logActivity(user.uid, ACTIVITY_TYPES.USER_CREATED, `User account created: ${email}`)
    
    return userCredential
  }

  const login = async (email, password) => {
    if (!auth) {
      throw new Error('Firebase is not configured')
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Log activity
    await logActivity(userCredential.user.uid, ACTIVITY_TYPES.LOGIN, 'User logged in via email', { method: 'email' })
    
    return userCredential
  }

  const signInWithGoogle = async () => {
    if (!auth || !db) {
      throw new Error('Firebase is not configured')
    }
    
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (!userDoc.exists()) {
      // Create user profile for new Google sign-in
      const userProfile = {
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        role: ROLES.MEMBER,
        showInDirectory: true, // Default to enabled
        photoURL: user.photoURL || null,
        joinDate: serverTimestamp(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await setDoc(doc(db, 'users', user.uid), userProfile)
      
      // Log activity
      await logActivity(user.uid, ACTIVITY_TYPES.USER_CREATED, `User account created via Google: ${user.email}`)
    } else {
      // Update last login
      await setDoc(doc(db, 'users', user.uid), {
        updatedAt: new Date().toISOString(),
        photoURL: user.photoURL || userDoc.data().photoURL
      }, { merge: true })
    }
    
    // Log login activity
    await logActivity(user.uid, ACTIVITY_TYPES.LOGIN, 'User logged in via Google', { method: 'google' })
    
    return userCredential
  }

  const logout = async () => {
    if (!auth) return Promise.resolve()
    
    if (currentUser) {
      await logActivity(currentUser.uid, ACTIVITY_TYPES.LOGOUT, 'User logged out')
    }
    
    return signOut(auth)
  }

  const updateProfile = async (updates) => {
    if (!db || !currentUser) {
      throw new Error('User not authenticated')
    }
    
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true })
    
    // Update local state
    setUserProfile(prev => ({ ...prev, ...updatedData }))
    
    // Log activity
    await logActivity(currentUser.uid, ACTIVITY_TYPES.PROFILE_UPDATED, 'User profile updated', { changes: updates })
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    signInWithGoogle,
    logout,
    updateProfile,
    isMember: userProfile?.role === ROLES.MEMBER,
    isAdmin: userProfile?.role === ROLES.ADMIN || userProfile?.role === ROLES.SUPERADMIN
  }

  return (
    <MemberAuthContext.Provider value={value}>
      {!loading && children}
    </MemberAuthContext.Provider>
  )
}

