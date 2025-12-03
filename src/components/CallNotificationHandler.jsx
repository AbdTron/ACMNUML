import { useEffect } from 'react'
import { CometChat } from '@cometchat/chat-sdk-javascript'
import { useCometChat } from '../context/CometChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'

/**
 * Handles call notifications and system notifications for incoming calls
 */
const CallNotificationHandler = () => {
  const { isInitialized, isLoggedIn } = useCometChat()
  const { currentUser } = useMemberAuth()

  useEffect(() => {
    if (!isInitialized || !isLoggedIn || !currentUser) return

    const callListenerID = 'call-notification-handler'
    
    const callListener = new CometChat.CallListener({
      onIncomingCallReceived: async (call) => {
        console.log('[CallNotification] Incoming call received:', call)
        
        // Get caller information
        let callerName = 'Unknown'
        let callerAvatar = ''
        try {
          const caller = call.getCallInitiator()
          if (caller) {
            callerName = caller.getName() || caller.name || 'Unknown'
            callerAvatar = caller.getAvatar() || caller.avatar || ''
          }
        } catch (e) {
          console.warn('Could not get caller info:', e)
        }

        // Show system notification for incoming call
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(`Incoming ${call.getType() === CometChat.CALL_TYPE.VIDEO ? 'Video' : 'Voice'} Call`, {
            body: `${callerName} is calling you`,
            icon: callerAvatar || '/badge.png',
            badge: '/badge.png',
            tag: `call-${call.getSessionId()}`,
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            data: {
              callSessionId: call.getSessionId(),
              callType: call.getType(),
              callerId: call.getCallInitiator()?.getUid(),
            },
          })

          notification.onclick = () => {
            window.focus()
            notification.close()
            // Navigate to chat if not already there
            if (window.location.pathname !== '/chat') {
              window.location.href = '/chat'
            }
          }

          // Auto-close after 30 seconds if not interacted with
          setTimeout(() => {
            notification.close()
          }, 30000)
        }

        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent('cometchat:incoming-call', {
          detail: { call, callerName, callerAvatar }
        }))
      },
      onOutgoingCallAccepted: async (call) => {
        console.log('[CallNotification] Outgoing call accepted:', call)
        window.dispatchEvent(new CustomEvent('cometchat:call-accepted', { detail: { call } }))
        // Close any notifications for this call
        if ('Notification' in window && 'getNotifications' in Notification) {
          try {
            const notifications = await Notification.getNotifications({ tag: `call-${call.getSessionId()}` })
            notifications.forEach(n => n.close())
          } catch (e) {
            // getNotifications might not be supported in all browsers
            console.warn('Could not close notifications:', e)
          }
        }
      },
      onOutgoingCallRejected: async (call) => {
        console.log('[CallNotification] Outgoing call rejected:', call)
        window.dispatchEvent(new CustomEvent('cometchat:call-rejected', { detail: { call } }))
        // Close any notifications for this call
        if ('Notification' in window && 'getNotifications' in Notification) {
          try {
            const notifications = await Notification.getNotifications({ tag: `call-${call.getSessionId()}` })
            notifications.forEach(n => n.close())
          } catch (e) {
            // getNotifications might not be supported in all browsers
            console.warn('Could not close notifications:', e)
          }
        }
      },
      onIncomingCallCancelled: (call) => {
        console.log('[CallNotification] Incoming call cancelled:', call)
        window.dispatchEvent(new CustomEvent('cometchat:call-cancelled', { detail: { call } }))
      },
      onCallEnded: (call) => {
        console.log('[CallNotification] Call ended:', call)
        window.dispatchEvent(new CustomEvent('cometchat:call-ended', { detail: { call } }))
      },
    })

    CometChat.addCallListener(callListenerID, callListener)

    return () => {
      CometChat.removeCallListener(callListenerID)
    }
  }, [isInitialized, isLoggedIn, currentUser])

  return null
}

export default CallNotificationHandler

