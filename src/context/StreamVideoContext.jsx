import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { StreamVideoClient, StreamVideo, StreamCall } from '@stream-io/video-react-sdk'
import STREAM_VIDEO_CONFIG from '../config/streamvideo'
import { useMemberAuth } from './MemberAuthContext'

const StreamVideoContext = createContext({
    videoClient: null,
    isVideoConnected: false,
    activeCall: null,
    incomingCall: null,
    startCall: async () => { },
    joinCall: async () => { },
    endCall: async () => { },
    acceptIncomingCall: async () => { },
    rejectIncomingCall: async () => { },
})

export const useStreamVideo = () => {
    return useContext(StreamVideoContext)
}

export const StreamVideoProvider = ({ children }) => {
    const { currentUser } = useMemberAuth()
    const [videoClient, setVideoClient] = useState(null)
    const [isVideoConnected, setIsVideoConnected] = useState(false)
    const [activeCall, setActiveCall] = useState(null)
    const [incomingCall, setIncomingCall] = useState(null)
    const clientRef = useRef(null)

    // Initialize Stream Video client when user logs in
    useEffect(() => {
        if (!currentUser || !STREAM_VIDEO_CONFIG.API_KEY) {
            return
        }

        const initVideoClient = async () => {
            try {
                const userId = currentUser.uid.toLowerCase()

                // Get user profile for display name and avatar
                const { doc, getDoc } = await import('firebase/firestore')
                const { db } = await import('../config/firebase')
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
                const userProfile = userDoc.exists() ? userDoc.data() : null

                const userName = userProfile?.name || currentUser.displayName || 'Anonymous'
                let avatarUrl = userProfile?.avatar || currentUser.photoURL

                if (Array.isArray(avatarUrl)) {
                    avatarUrl = avatarUrl[0]
                }

                const user = {
                    id: userId,
                    name: userName,
                    image: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff`,
                }

                // Create a temporary client to generate devToken
                const tempClient = new StreamVideoClient({
                    apiKey: STREAM_VIDEO_CONFIG.API_KEY,
                })

                // Generate dev token using Stream's method (same as chat)
                const token = tempClient.devToken(userId)

                // Create the actual video client with the token
                const client = new StreamVideoClient({
                    apiKey: STREAM_VIDEO_CONFIG.API_KEY,
                    user,
                    token,
                })

                clientRef.current = client
                setVideoClient(client)
                setIsVideoConnected(true)
                console.log('[Stream Video] Client connected:', userId)

                // Listen for incoming calls
                client.on('call.ring', (event) => {
                    console.log('[Stream Video] Incoming call:', event.call)
                    setIncomingCall(event.call)
                })

            } catch (error) {
                console.error('[Stream Video] Failed to initialize:', error)
            }
        }

        initVideoClient()

        return () => {
            if (clientRef.current) {
                clientRef.current.disconnectUser()
                clientRef.current = null
                setVideoClient(null)
                setIsVideoConnected(false)
            }
        }
    }, [currentUser])

    // Start a new call with another user
    const startCall = useCallback(async (targetUserId, callType = 'default') => {
        if (!videoClient || !currentUser) return null

        try {
            // Generate a short call ID (max 64 chars)
            // Use first 8 chars of each user ID + timestamp
            const uid1 = currentUser.uid.toLowerCase().slice(0, 10)
            const uid2 = targetUserId.toLowerCase().slice(0, 10)
            const ts = Date.now().toString(36) // Base36 for shorter timestamp
            const callId = `call_${uid1}_${uid2}_${ts}`

            const call = videoClient.call(callType, callId)

            await call.getOrCreate({
                ring: true,
                data: {
                    members: [
                        { user_id: currentUser.uid.toLowerCase() },
                        { user_id: targetUserId.toLowerCase() },
                    ],
                },
            })

            await call.join()
            setActiveCall(call)
            console.log('[Stream Video] Call started:', callId)
            return call
        } catch (error) {
            console.error('[Stream Video] Failed to start call:', error)
            return null
        }
    }, [videoClient, currentUser])

    // Join an existing call
    const joinCall = useCallback(async (callType, callId) => {
        if (!videoClient) return null

        try {
            const call = videoClient.call(callType, callId)
            await call.join({ create: false })
            setActiveCall(call)
            console.log('[Stream Video] Joined call:', callId)
            return call
        } catch (error) {
            console.error('[Stream Video] Failed to join call:', error)
            return null
        }
    }, [videoClient])

    // End the current call
    const endCall = useCallback(async () => {
        if (!activeCall) return

        try {
            await activeCall.leave()
            setActiveCall(null)
            console.log('[Stream Video] Call ended')
        } catch (error) {
            console.error('[Stream Video] Failed to end call:', error)
        }
    }, [activeCall])

    // Accept incoming call
    const acceptIncomingCall = useCallback(async () => {
        if (!incomingCall) return

        try {
            await incomingCall.join()
            setActiveCall(incomingCall)
            setIncomingCall(null)
            console.log('[Stream Video] Accepted incoming call')
        } catch (error) {
            console.error('[Stream Video] Failed to accept call:', error)
        }
    }, [incomingCall])

    // Reject incoming call
    const rejectIncomingCall = useCallback(async () => {
        if (!incomingCall) return

        try {
            await incomingCall.reject()
            setIncomingCall(null)
            console.log('[Stream Video] Rejected incoming call')
        } catch (error) {
            console.error('[Stream Video] Failed to reject call:', error)
        }
    }, [incomingCall])

    const value = {
        videoClient,
        isVideoConnected,
        activeCall,
        incomingCall,
        startCall,
        joinCall,
        endCall,
        acceptIncomingCall,
        rejectIncomingCall,
    }

    return (
        <StreamVideoContext.Provider value={value}>
            {videoClient && activeCall ? (
                <StreamVideo client={videoClient}>
                    <StreamCall call={activeCall}>
                        {children}
                    </StreamCall>
                </StreamVideo>
            ) : videoClient ? (
                <StreamVideo client={videoClient}>
                    {children}
                </StreamVideo>
            ) : (
                children
            )}
        </StreamVideoContext.Provider>
    )
}
