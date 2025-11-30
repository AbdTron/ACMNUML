import { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  updateEmail,
  verifyBeforeUpdateEmail
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { logActivity, ACTIVITY_TYPES } from '../utils/activityLogger'
import { ROLES } from '../utils/permissions'
import { computeFlairsForStorage } from '../utils/flairUtils.js'

const MemberAuthContext = createContext({
  currentUser: null,
  userProfile: null,
  loading: true,
  signup: async () => {},
  login: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  updateUserEmail: async () => {},
  resetPassword: async () => {},
  sendVerificationEmail: async () => {},
  verifyEmail: async () => {},
  refreshProfile: async () => {},
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
            // Check if user is admin
            let isAdmin = false
            try {
              const adminDoc = await getDoc(doc(db, 'admins', user.uid))
              isAdmin = adminDoc.exists()
            } catch (err) {
              // Ignore errors checking admin status
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid))
            if (userDoc.exists()) {
              const profileData = userDoc.data()
              
              // Compute and update flairs if profile data changed
              const flairs = computeFlairsForStorage(profileData, isAdmin)
              
              // Update emailVerified status from auth and flairs
              const updatedProfile = {
                ...profileData,
                emailVerified: user.emailVerified,
                email: user.email, // Sync email from auth
                flairs: flairs // Store computed flairs
              }
              
              // Only update flairs in Firestore if they changed
              if (JSON.stringify(profileData.flairs) !== JSON.stringify(flairs)) {
                try {
                  await setDoc(doc(db, 'users', user.uid), { flairs }, { merge: true })
                } catch (err) {
                  console.error('Error updating flairs:', err)
                }
              }
              
              setUserProfile(updatedProfile)
            } else {
              // Check if user is admin
              let isAdmin = false
              try {
                const adminDoc = await getDoc(doc(db, 'admins', user.uid))
                isAdmin = adminDoc.exists()
              } catch (err) {
                // Ignore errors checking admin status
              }

              // User doesn't have a profile yet - create one
              const newProfile = {
                email: user.email,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                role: ROLES.USER,
                showInDirectory: true, // Default to enabled
                flairs: [], // Empty flairs initially (will be computed after onboarding)
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
                  role: ROLES.USER
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
                  role: ROLES.USER
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

    // Send email verification
    try {
      await sendEmailVerification(user)
    } catch (error) {
      console.error('Error sending verification email:', error)
      // Don't throw - allow signup to continue even if verification email fails
    }

    // Create user profile in Firestore
    const userProfile = {
      email: user.email,
      name: name || user.email?.split('@')[0] || 'User',
      role: ROLES.USER,
      showInDirectory: true, // Default to enabled
      emailVerified: user.emailVerified,
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
        role: ROLES.USER,
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

  const resetPassword = async (email) => {
    if (!auth) {
      throw new Error('Firebase is not configured')
    }
    
    // Configure action code settings for password reset
    // Using handleCodeInApp: false to use email link instead of in-app handling
    // This helps prevent emails from going to spam
    const actionCodeSettings = {
      url: `${window.location.origin}/member/login?mode=resetPassword`,
      handleCodeInApp: false,
      // Dynamic link domain (if using Firebase Dynamic Links)
      // dynamicLinkDomain: 'your-app.page.link' // Uncomment if using Dynamic Links
    }
    
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
    } catch (error) {
      // Provide more helpful error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.')
      }
      throw error
    }
  }

  const sendVerificationEmail = async () => {
    if (!auth || !currentUser) {
      throw new Error('User not authenticated')
    }
    
    await sendEmailVerification(currentUser)
  }

  const verifyEmail = async (actionCode) => {
    if (!auth) {
      throw new Error('Firebase is not configured')
    }
    
    await applyActionCode(auth, actionCode)
    
    // Wait a moment for auth state to update
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get updated user from auth
    const user = auth.currentUser
    
    // Update user profile if authenticated
    if (user && db) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        emailVerified: user.emailVerified,
        updatedAt: new Date().toISOString()
      }, { merge: true })
    }
  }

  const updateUserEmail = async (newEmail) => {
    if (!auth || !currentUser) {
      throw new Error('User not authenticated')
    }
    
    // Validate email format
    if (!newEmail.includes('@')) {
      throw new Error('Invalid email address. Email must contain @ symbol.')
    }
    
    // Send verification email to new address
    await verifyBeforeUpdateEmail(currentUser, newEmail)
    
    // Note: Email won't be updated until user clicks verification link
    // The email will be updated automatically after verification
  }

  const updateProfile = async (updates) => {
    if (!db || !currentUser) {
      throw new Error('User not authenticated')
    }
    
    // Check if user is admin
    let isAdmin = false
    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid))
      isAdmin = adminDoc.exists()
    } catch (err) {
      // Ignore errors checking admin status
    }
    
    // Merge updates with current profile to compute flairs
    const mergedProfile = { ...userProfile, ...updates }
    
    // Recompute flairs based on updated profile
    const flairs = computeFlairsForStorage(mergedProfile, isAdmin)
    
    const updatedData = {
      ...updates,
      flairs: flairs, // Store computed flairs
      updatedAt: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true })
    
    // Update local state
    setUserProfile(prev => ({ ...prev, ...updatedData }))
    
    // Log activity
    await logActivity(currentUser.uid, ACTIVITY_TYPES.PROFILE_UPDATED, 'User profile updated', { changes: updates })
  }

  const refreshProfile = async () => {
    if (!currentUser || !db) {
      return
    }
    
    try {
      // Check if user is admin
      let isAdmin = false
      try {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid))
        isAdmin = adminDoc.exists()
      } catch (err) {
        // Ignore errors checking admin status
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (userDoc.exists()) {
        const profileData = userDoc.data()
        
        // Recompute flairs
        const flairs = computeFlairsForStorage(profileData, isAdmin)
        
        // Update flairs in Firestore if they changed
        if (JSON.stringify(profileData.flairs) !== JSON.stringify(flairs)) {
          try {
            await setDoc(doc(db, 'users', currentUser.uid), { flairs }, { merge: true })
          } catch (err) {
            console.error('Error updating flairs:', err)
          }
        }
        
        setUserProfile({
          ...profileData,
          emailVerified: currentUser.emailVerified,
          email: currentUser.email,
          flairs: flairs
        })
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
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
    updateUserEmail,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    refreshProfile,
    isMember: userProfile?.role === ROLES.USER || userProfile?.role === 'member', // Backward compatibility
    isAdmin: userProfile?.role === ROLES.ADMIN || userProfile?.role === ROLES.SUPERADMIN
  }

  return (
    <MemberAuthContext.Provider value={value}>
      {!loading && children}
    </MemberAuthContext.Provider>
  )
}

