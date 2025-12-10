import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { StreamChat } from 'stream-chat'
import STREAMCHAT_CONFIG from '../config/streamchat'

const StreamChatContext = createContext({
    client: null,
    isConnected: false,
    isLoading: true,
    connectUser: async () => { },
    disconnectUser: async () => { },
    getChatSettings: async () => { },
    updateChatSettings: async () => { },
})

export const useStreamChat = () => {
    return useContext(StreamChatContext)
}

export const StreamChatProvider = ({ children }) => {
    const [client, setClient] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState(null)

    // Initialize Stream Chat client
    useEffect(() => {
        if (!STREAMCHAT_CONFIG.API_KEY) {
            console.warn('Stream Chat not configured. Skipping initialization.')
            setIsLoading(false)
            return
        }

        try {
            console.log('Initializing Stream Chat client...')
            const chatClient = StreamChat.getInstance(STREAMCHAT_CONFIG.API_KEY)
            setClient(chatClient)
            console.log('Stream Chat client initialized successfully')
        } catch (error) {
            console.error('Stream Chat initialization failed:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Listen to Firebase auth state changes and connect/disconnect user
    useEffect(() => {
        const setupAuthListener = async () => {
            const { auth } = await import('../config/firebase')
            const { onAuthStateChanged } = await import('firebase/auth')
            const { doc, getDoc } = await import('firebase/firestore')
            const { db } = await import('../config/firebase')

            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser && db && client) {
                    try {
                        // Get user profile from Firestore
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
                        const userProfile = userDoc.exists() ? userDoc.data() : null

                        // Connect user to Stream Chat
                        await connectUser(firebaseUser, userProfile)
                    } catch (error) {
                        console.error('Error connecting to Stream Chat:', error)
                        setIsConnected(false)
                    }
                } else if (!firebaseUser && currentUserId) {
                    // User logged out - disconnect from Stream Chat
                    await disconnectUser()
                }
            })

            return unsubscribe
        }

        let unsubscribe
        if (client) {
            setupAuthListener().then(unsub => {
                unsubscribe = unsub
            })
        }

        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [client])

    // Connect user to Stream Chat
    const connectUser = useCallback(async (firebaseUser, profile) => {
        if (!client || !firebaseUser) return false

        try {
            // Use lowercase Firebase UID for consistency
            const userId = firebaseUser.uid.toLowerCase()

            // Check if already connected as this user
            if (client.userID === userId) {
                console.log('Stream Chat user already connected:', userId)
                setIsConnected(true)
                setCurrentUserId(userId)
                return true
            }

            // Prepare user data
            const userName = profile?.name || firebaseUser.displayName || 'Anonymous'
            let avatarUrl = profile?.avatar || firebaseUser.photoURL

            // Handle array avatars
            if (Array.isArray(avatarUrl)) {
                avatarUrl = avatarUrl[0]
            }

            // Ensure valid avatar URL or use UI Avatars as fallback
            let finalAvatar = ''
            if (typeof avatarUrl === 'string' && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
                finalAvatar = avatarUrl
            } else {
                finalAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=200`
            }

            // Prepare chat settings metadata (migrate from CometChat pattern)
            const chatSettings = {
                chatEnabled: true,
                chatAllowList: [],
            }

            console.log('[Stream Chat] Connecting user:', userId)

            // Generate user token server-side (in production)
            // For now, using client.connectUser with user data
            // Note: In production, you should generate tokens server-side for security
            await client.connectUser(
                {
                    id: userId,
                    name: userName,
                    image: finalAvatar,
                    // Store chat settings in user metadata
                    chatSettings: chatSettings,
                },
                // Generate token - in production, fetch this from your backend
                client.devToken(userId)
            )

            console.log('Stream Chat user connected successfully:', userId)
            setIsConnected(true)
            setCurrentUserId(userId)
            return true
        } catch (error) {
            console.error('Failed to connect user to Stream Chat:', error)
            setIsConnected(false)
            return false
        }
    }, [client])

    // Disconnect user from Stream Chat
    const disconnectUser = useCallback(async () => {
        if (!client || !currentUserId) return

        try {
            console.log('Disconnecting from Stream Chat...')
            await client.disconnectUser()
            console.log('Stream Chat user disconnected successfully')
            setIsConnected(false)
            setCurrentUserId(null)
        } catch (error) {
            console.error('Stream Chat disconnect failed:', error)
        }
    }, [client, currentUserId])

    // Get chat settings from Stream Chat user metadata
    const getChatSettings = useCallback(async (userId) => {
        if (!client || !isConnected) return null

        try {
            const userIdLower = userId.toLowerCase()
            const { users } = await client.queryUsers({ id: userIdLower })

            if (users && users.length > 0) {
                const user = users[0]
                const settings = user.chatSettings || { chatEnabled: true, chatAllowList: [] }
                return settings
            }
        } catch (error) {
            console.error('Failed to get chat settings:', error)
        }

        return { chatEnabled: true, chatAllowList: [] }
    }, [client, isConnected])

    // Update chat settings in Stream Chat user metadata
    const updateChatSettings = useCallback(async (userId, settings) => {
        if (!client || !isConnected) return false

        try {
            const userIdLower = userId.toLowerCase()

            // Update user with new chat settings
            await client.partialUpdateUser({
                id: userIdLower,
                set: {
                    chatSettings: settings,
                },
            })

            console.log('Chat settings updated successfully for user:', userId)
            return true
        } catch (error) {
            console.error('Failed to update chat settings:', error)
            return false
        }
    }, [client, isConnected])

    const value = {
        client,
        isConnected,
        isLoading,
        connectUser,
        disconnectUser,
        getChatSettings,
        updateChatSettings,
    }

    return (
        <StreamChatContext.Provider value={value}>
            {children}
        </StreamChatContext.Provider>
    )
}
