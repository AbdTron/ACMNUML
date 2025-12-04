import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { CometChat } from '@cometchat/chat-sdk-javascript'
import { CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-react'
import COMETCHAT_CONFIG from '../config/cometchat'
import { useMemberAuth } from './MemberAuthContext'

const CometChatContext = createContext({
  cometChatUser: null,
  isInitialized: false,
  isLoggedIn: false,
  login: async () => { },
  logout: async () => { },
  syncUserToCometChat: async () => { },
  getChatSettings: async () => { },
  updateChatSettings: async () => { },
  loading: true,
})

export const useCometChat = () => {
  return useContext(CometChatContext)
}

export const CometChatProvider = ({ children }) => {
  const [cometChatUser, setCometChatUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  // Get current user from auth context (avoid circular dependency by using dynamic import)
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  // Listen to auth state changes
  useEffect(() => {
    const setupAuthListener = async () => {
      const { auth } = await import('../config/firebase')
      const { onAuthStateChanged } = await import('firebase/auth')
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../config/firebase')

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user)
        if (user && db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            if (userDoc.exists()) {
              setUserProfile(userDoc.data())
            } else {
              setUserProfile(null)
            }
          } catch (error) {
            console.error('Error fetching user profile:', error)
            setUserProfile(null)
          }
        } else {
          setUserProfile(null)
        }
      })

      return unsubscribe
    }

    let unsubscribe
    setupAuthListener().then(unsub => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Initialize CometChat SDK and UIKit
  useEffect(() => {
    const initCometChat = async () => {
      if (!COMETCHAT_CONFIG.APP_ID || !COMETCHAT_CONFIG.AUTH_KEY) {
        console.warn('CometChat not configured. Skipping initialization.')
        setLoading(false)
        return
      }

      try {
        console.log('Initializing CometChat SDK and UIKit...')

        // Initialize UIKit (this also initializes the SDK)
        const uiKitSettings = new UIKitSettingsBuilder()
          .setAppId(COMETCHAT_CONFIG.APP_ID)
          .setRegion(COMETCHAT_CONFIG.REGION)
          .setAuthKey(COMETCHAT_CONFIG.AUTH_KEY)
          .subscribePresenceForAllUsers()
          .build()

        await CometChatUIKit.init(uiKitSettings)

        // Setup localization (if available)
        try {
          const { setupLocalization } = await import('../CometChat/src/CometChat/utils/utils')
          if (setupLocalization) {
            setupLocalization()
          }
        } catch (e) {
          console.warn('Could not setup localization:', e)
        }

        setIsInitialized(true)
        console.log('CometChat initialized successfully')
      } catch (error) {
        console.error('CometChat initialization failed:', error)
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    initCometChat()
  }, [])

  // Sync user to CometChat (create or update)
  const syncUserToCometChat = useCallback(async (firebaseUser, profile) => {
    if (!isInitialized || !firebaseUser) return false

    try {
      // First, try to get existing user to preserve settings
      let existingUser = null
      let chatSettings = {
        chatEnabled: true,
        chatAllowList: [],
      }

      try {
        existingUser = await CometChat.getUser(firebaseUser.uid.toLowerCase())
        if (existingUser?.metadata) {
          try {
            const parsed = JSON.parse(existingUser.metadata)
            if (parsed.chatEnabled !== undefined) chatSettings.chatEnabled = parsed.chatEnabled
            if (Array.isArray(parsed.chatAllowList)) chatSettings.chatAllowList = parsed.chatAllowList
          } catch (parseError) {
            console.warn('Failed to parse CometChat user metadata:', parseError)
          }
        }
      } catch (error) {
        console.log('CometChat user not found, will create new user')
      }

      // CometChat normalizes UIDs to lowercase, so we need to use lowercase Firebase UID
      const normalizedUid = firebaseUser.uid.toLowerCase()
      const user = new CometChat.User(normalizedUid)
      user.setName(profile?.name || firebaseUser.displayName || 'Anonymous')

      // Ensure avatar is a valid URL string
      let avatarUrl = profile?.avatar || firebaseUser.photoURL
      if (Array.isArray(avatarUrl)) {
        avatarUrl = avatarUrl[0]
      }

      let finalAvatar = ''
      if (typeof avatarUrl === 'string' && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
        finalAvatar = avatarUrl
      } else {
        // CometChat requires a valid avatar URL - use UI Avatars as default
        const userName = profile?.name || firebaseUser.displayName || 'User'
        finalAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=200`
      }

      console.log('[CometChat] Setting avatar for user:', normalizedUid, 'to:', finalAvatar)
      if (finalAvatar) {
        user.setAvatar(finalAvatar)
      }

      // Set chat settings in metadata
      user.setMetadata(JSON.stringify(chatSettings))

      // Debug: Log which API key is being used
      console.log('[DEBUG] Using REST_API_KEY:', COMETCHAT_CONFIG.REST_API_KEY ? 'Present ✓' : 'Missing ✗')
      console.log('[DEBUG] REST_API_KEY first 10 chars:', COMETCHAT_CONFIG.REST_API_KEY?.substring(0, 10))

      // Try to create or update user
      try {
        if (existingUser) {
          console.log('Updating existing CometChat user with REST_API_KEY')
          await CometChat.updateUser(user, COMETCHAT_CONFIG.REST_API_KEY)
          console.log('CometChat user updated successfully')
        } else {
          console.log('Creating new CometChat user with REST_API_KEY')
          await CometChat.createUser(user, COMETCHAT_CONFIG.REST_API_KEY)
          console.log('CometChat user created successfully')
        }
      } catch (createUpdateError) {
        // If user already exists (but we couldn't retrieve it), try updating instead
        if (createUpdateError.code === 'ERR_UID_ALREADY_EXISTS') {
          console.log('User already exists, attempting to update instead...')
          try {
            await CometChat.updateUser(user, COMETCHAT_CONFIG.REST_API_KEY)
            console.log('CometChat user updated successfully after existence check')
          } catch (updateError) {
            console.error('Failed to update existing user:', updateError)
            throw updateError
          }
        } else {
          // Re-throw other errors
          throw createUpdateError
        }
      }

      setCometChatUser(user)
      return true
    } catch (error) {
      console.error('Failed to sync user to CometChat:', error)
      return false
    }
  }, [isInitialized])

  // Login to CometChat when Firebase user changes
  useEffect(() => {
    const handleLogin = async () => {
      if (!isInitialized || !currentUser) {
        setIsLoggedIn(false)
        setCometChatUser(null)
        return
      }

      if (currentUser && userProfile) {
        // Check if already logged in
        try {
          const loggedInUser = await CometChatUIKit.getLoggedinUser()
          if (loggedInUser && loggedInUser.getUid() === currentUser.uid.toLowerCase()) {
            setIsLoggedIn(true)
            setCometChatUser(loggedInUser)
            console.log('CometChat user already logged in:', currentUser.uid)
            return
          }
        } catch (e) {
          // Not logged in yet
        }

        // Sync user first (create or update)
        const syncSuccess = await syncUserToCometChat(currentUser, userProfile)
        if (!syncSuccess) {
          console.error('Failed to sync user to CometChat')
          setIsLoggedIn(false)
          setCometChatUser(null)
          return
        }

        // Then login (use lowercase UID)
        const loginSuccess = await login(currentUser.uid.toLowerCase())
        if (!loginSuccess) {
          setIsLoggedIn(false)
          setCometChatUser(null)
        }
      } else {
        setIsLoggedIn(false)
        setCometChatUser(null)
      }
    }

    handleLogin()
  }, [currentUser, userProfile, isInitialized, syncUserToCometChat])

  // Login function
  const login = useCallback(async (uid) => {
    if (!isInitialized) {
      console.warn('CometChat SDK not initialized. Cannot log in.')
      return false
    }

    try {
      const user = await CometChat.login(uid, COMETCHAT_CONFIG.AUTH_KEY)
      setCometChatUser(user)
      setIsLoggedIn(true)
      console.log('CometChat login successful')
      return true
    } catch (error) {
      console.error('CometChat login failed:', error)
      return false
    }
  }, [isInitialized])

  // Logout from CometChat
  const logout = useCallback(async () => {
    try {
      await CometChat.logout()
      setCometChatUser(null)
      setIsLoggedIn(false)
      console.log('CometChat logged out successfully')
    } catch (error) {
      console.error('CometChat logout failed:', error)
    }
  }, [])

  // Fetch chat settings from CometChat user metadata
  const getChatSettings = useCallback(async (uid) => {
    if (!isInitialized) return null
    try {
      const user = await CometChat.getUser(uid.toLowerCase())
      if (user && user.metadata) {
        try {
          // Handle case where metadata might not be a string
          const metadataStr = typeof user.metadata === 'string' ? user.metadata : JSON.stringify(user.metadata)
          const metadata = JSON.parse(metadataStr)
          return {
            chatEnabled: metadata.chatEnabled !== undefined ? metadata.chatEnabled : true,
            chatAllowList: Array.isArray(metadata.chatAllowList) ? metadata.chatAllowList : [],
          }
        } catch (parseError) {
          console.warn('Failed to parse chat settings metadata for user', uid, '- using defaults')
          return { chatEnabled: true, chatAllowList: [] }
        }
      }
    } catch (error) {
      // Don't log 404 errors - just means user hasn't been created in CometChat yet
      if (error.code !== 'ERR_UID_NOT_FOUND') {
        console.error('Failed to get chat settings:', error)
      }
    }
    return { chatEnabled: true, chatAllowList: [] }
  }, [isInitialized])

  // Update chat settings in CometChat user metadata
  const updateChatSettings = useCallback(async (uid, settings) => {
    if (!isInitialized) return false
    try {
      const user = await CometChat.getUser(uid.toLowerCase())
      if (user) {
        const currentMetadata = user.metadata ? JSON.parse(user.metadata) : {}
        const newMetadata = { ...currentMetadata, ...settings }
        user.setMetadata(JSON.stringify(newMetadata))
        await CometChat.updateUser(user)
        console.log('Chat settings updated successfully for user:', uid)
        return true
      }
    } catch (error) {
      console.error('Failed to update chat settings:', error)
    }
    return false
  }, [isInitialized])

  const value = {
    cometChatUser,
    isInitialized,
    isLoggedIn,
    login,
    logout,
    syncUserToCometChat,
    getChatSettings,
    updateChatSettings,
    loading,
  }

  return (
    <CometChatContext.Provider value={value}>
      {children}
    </CometChatContext.Provider>
  )
}

