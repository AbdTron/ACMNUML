import { useEffect, useCallback, useRef } from 'react'
import { useStreamChat } from '../context/StreamChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'

/**
 * Hook to handle Stream Chat notifications without Firebase
 * Uses Web Notifications API for in-app notifications
 * and registers push subscription for background notifications
 */
export const useStreamNotifications = () => {
    const { client, isConnected } = useStreamChat()
    const { currentUser } = useMemberAuth()
    const notificationPermissionRef = useRef(false)

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.log('[Notifications] Not supported in this browser')
            return false
        }

        if (Notification.permission === 'granted') {
            notificationPermissionRef.current = true
            return true
        }

        if (Notification.permission === 'denied') {
            console.log('[Notifications] Permission denied by user')
            return false
        }

        // Request permission
        try {
            const permission = await Notification.requestPermission()
            notificationPermissionRef.current = permission === 'granted'
            return notificationPermissionRef.current
        } catch (error) {
            console.error('[Notifications] Error requesting permission:', error)
            return false
        }
    }, [])

    // Show a notification
    const showNotification = useCallback((title, options = {}) => {
        if (!notificationPermissionRef.current && Notification.permission !== 'granted') {
            console.log('[Notifications] Permission not granted')
            return null
        }

        try {
            const notification = new Notification(title, {
                icon: options.icon || '/icon-192.png',
                badge: '/badge.png',
                tag: options.tag || `notification-${Date.now()}`,
                body: options.body || '',
                data: options.data || {},
                vibrate: options.vibrate || [200, 100, 200],
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
            })

            // Handle click
            notification.onclick = () => {
                window.focus()
                notification.close()
                if (options.onClick) {
                    options.onClick()
                } else if (options.data?.url) {
                    window.location.href = options.data.url
                }
            }

            // Auto close after specified time (default 5 seconds)
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close()
                }, options.autoCloseMs || 5000)
            }

            return notification
        } catch (error) {
            console.error('[Notifications] Error showing notification:', error)
            return null
        }
    }, [])

    // Setup Stream Chat message notifications
    useEffect(() => {
        if (!client || !isConnected || !currentUser) return

        // Request permission on mount
        requestNotificationPermission()

        // Listen for new messages
        const handleNewMessage = (event) => {
            const message = event.message
            const channel = event.channel

            // Don't notify for own messages
            if (message.user?.id === client.userID) return

            // Only notify if app is not focused
            if (!document.hasFocus()) {
                showNotification(`Message from ${message.user?.name || 'Unknown'}`, {
                    body: message.text || 'Sent an attachment',
                    icon: message.user?.image || '/icon-192.png',
                    tag: `message-${message.id}`,
                    data: {
                        url: '/chat',
                        messageId: message.id,
                        channelId: channel?.id,
                    },
                })
            }
        }

        // Listen for call events (if using Stream Video)
        const handleCallIncoming = (event) => {
            const call = event.call
            const caller = event.user || event.caller

            showNotification(`Incoming ${call.type === 'video' ? 'Video' : 'Voice'} Call`, {
                body: `${caller?.name || 'Someone'} is calling you`,
                icon: caller?.image || '/icon-192.png',
                tag: `call-${call.id}`,
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                data: {
                    url: '/chat',
                    callId: call.id,
                },
            })
        }

        // Subscribe to events
        client.on('message.new', handleNewMessage)
        client.on('call.incoming', handleCallIncoming)

        return () => {
            client.off('message.new', handleNewMessage)
            client.off('call.incoming', handleCallIncoming)
        }
    }, [client, isConnected, currentUser, showNotification, requestNotificationPermission])

    // Handle service worker messages (for notification clicks when app is open)
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type === 'NOTIFICATION_CLICK') {
                const url = event.data.url
                if (url && url !== window.location.pathname) {
                    window.location.href = url
                }
            }
        }

        navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
        }
    }, [])

    return {
        requestNotificationPermission,
        showNotification,
        isPermissionGranted: notificationPermissionRef.current || Notification.permission === 'granted',
    }
}

export default useStreamNotifications
